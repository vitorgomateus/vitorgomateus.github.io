// Vector search using cosine similarity on embeddings

import state from '../../core/state.js';

const DEFAULT_MIN_WORDS = 3;

// Load embeddings from JSON
export async function loadEmbeddings() {
  try {
    const response = await fetch('embeddings.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.embeddings = await response.json();
    return state.embeddings;
  } catch (error) {
    console.error('[search] Failed to load embeddings:', error);
    return [];
  }
}

// Search embeddings with a query string
// Returns top-k matching chunks above threshold
export async function searchEmbeddings(query, options = {}) {
  const start = performance.now();
  const minWords = options.minWords ?? DEFAULT_MIN_WORDS;
  const queryWords = normalizeQueryWords(query);

  if (!query || queryWords.length < minWords) {
    return [];
  }

  if (!state.embeddings.length) {
    console.warn('[search] No embeddings loaded');
    return [];
  }

  const queryEmbedding = await getQueryEmbedding(query);
  if (!queryEmbedding && !state.retrievalConfig.useHybridScoring) return [];

  const { threshold, topK } = getDynamicRetrievalConfig(queryWords, state.embeddings.length);
  const canUseVectorScore = Array.isArray(queryEmbedding);

  // Compute score for each chunk using vector and lexical signals.
  const scored = state.embeddings.map((chunk, index) => ({
    ...chunk,
    index,
    score: computeHybridScore({
      chunk,
      query,
      queryWords,
      queryEmbedding,
      canUseVectorScore
    })
  }));

  // Filter by threshold, sort by score, take top-k
  const results = scored
    .filter(r => r.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  const queryMs = performance.now() - start;
  const avgScore = results.length
    ? results.reduce((sum, item) => sum + item.score, 0) / results.length
    : 0;
  const topScore = results.length ? results[0].score : 0;

  state.retrievalDiagnostics.queryMs = queryMs;
  state.retrievalDiagnostics.resultCount = results.length;
  state.retrievalDiagnostics.avgScore = avgScore;
  state.retrievalDiagnostics.topScore = topScore;
  state.retrievalDiagnostics.threshold = threshold;
  state.retrievalDiagnostics.topK = topK;
  state.retrievalDiagnostics.hasRun = true;

  return results;
}

function getDynamicRetrievalConfig(queryWords, corpusSize) {
  const cfg = state.retrievalConfig;

  let threshold = cfg.baseThreshold;
  if (queryWords.length <= 2) threshold -= 0.08;
  else if (queryWords.length >= 8) threshold += 0.05;

  let topK = cfg.baseTopK;
  if (queryWords.length >= 6) topK += 1;
  if (corpusSize >= 250) topK += 1;

  threshold = Math.max(cfg.minThreshold, Math.min(cfg.maxThreshold, threshold));
  topK = Math.max(2, Math.min(cfg.maxTopK, topK));

  return { threshold, topK };
}

function computeHybridScore({ chunk, query, queryWords, queryEmbedding, canUseVectorScore }) {
  const cfg = state.retrievalConfig;
  const text = String(chunk.searchable_text || chunk.text || '').toLowerCase();

  const lexical = lexicalScore(queryWords, query, text);

  if (!cfg.useHybridScoring) {
    return canUseVectorScore ? cosineSimilarity(queryEmbedding, chunk.embedding) : lexical;
  }

  const vector = canUseVectorScore ? cosineSimilarity(queryEmbedding, chunk.embedding) : 0;
  return (vector * cfg.vectorWeight) + (lexical * cfg.lexicalWeight);
}

function lexicalScore(queryWords, rawQuery, text) {
  if (!queryWords.length || !text) return 0;

  const uniqueWords = Array.from(new Set(queryWords));
  const matched = uniqueWords.filter(word => text.includes(word)).length;
  const wordRatio = matched / uniqueWords.length;

  const normalizedQuery = String(rawQuery || '').trim().toLowerCase();
  const exactPhraseBonus = normalizedQuery && text.includes(normalizedQuery) ? 0.15 : 0;

  return Math.min(1, wordRatio + exactPhraseBonus);
}

function normalizeQueryWords(query) {
  return String(query || '')
    .toLowerCase()
    .split(/\s+/)
    .map(w => w.trim())
    .filter(Boolean);
}

// Compute cosine similarity between two vectors
function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

// Get embedding for a query string
// Uses a simple bag-of-words approach by averaging matching chunk embeddings
async function getQueryEmbedding(query) {
  // Simple client-side approach: find chunks whose text contains query words
  // and average their embeddings to create a pseudo query embedding
  const queryWords = query.toLowerCase().split(/\s+/).map(w => w.trim()).filter(Boolean);

  if (queryWords.length === 0) return null;

  const matchingEmbeddings = [];

  for (const chunk of state.embeddings) {
    const textLower = chunk.searchable_text.toLowerCase();
    const matchCount = queryWords.filter(w => textLower.includes(w)).length;

    if (matchCount > 0) {
      matchingEmbeddings.push({
        embedding: chunk.embedding,
        weight: matchCount / queryWords.length
      });
    }
  }

  if (matchingEmbeddings.length === 0) {
    // No lexical overlap across chunks, rely on lexical-only scoring fallback.
    return null;
  }

  // Weighted average of matching embeddings
  const dim = matchingEmbeddings[0].embedding.length;
  const avg = new Array(dim).fill(0);
  let totalWeight = 0;

  for (const { embedding, weight } of matchingEmbeddings) {
    for (let i = 0; i < dim; i++) {
      avg[i] += embedding[i] * weight;
    }
    totalWeight += weight;
  }

  for (let i = 0; i < dim; i++) {
    avg[i] /= totalWeight;
  }

  return avg;
}

// Map search results to chunk IDs for the portfolio visibility filter
export function resultsToChunkIds(results) {
  const chunkIds = new Set();

  const toId = (value) => String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  for (const result of results) {
    if (result.anchor) {
      // Use anchor as chunk identifier (content block anchors are "project-{id}-{block}")
      chunkIds.add(result.anchor.replace('-container', ''));
    }
    if (result.project_id) {
      // Always include the parent project article chunk so it's not hidden
      chunkIds.add(`project-${result.project_id}`);
      // Mark overview-level match (no block_id) so render can distinguish from block-only matches
      if (!result.block_id) {
        chunkIds.add(`project-overview-${result.project_id}`);
      }
    } else if (result.project) {
      // Fallback: derive project chunk id from title
      chunkIds.add(`project-${result.project.toLowerCase().replace(/\s+/g, '-')}`);
    }
    // Note: section h2 visibility is driven by the accordion loop in setVisibleChunks
    // based on whether any data-chunk inside the body is visible — no extra ID needed.
  }

  return Array.from(chunkIds);
}
