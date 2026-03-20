// Vector search using cosine similarity on embeddings

import state from '../../core/state.js';

const SIMILARITY_THRESHOLD = 0.3;
const TOP_K = 3;
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
  const minWords = options.minWords ?? DEFAULT_MIN_WORDS;

  if (!query || query.trim().split(/\s+/).length < minWords) {
    return [];
  }

  if (!state.embeddings.length) {
    console.warn('[search] No embeddings loaded');
    return [];
  }

  const queryEmbedding = await getQueryEmbedding(query);
  if (!queryEmbedding) return [];

  // Compute cosine similarity for each chunk
  const scored = state.embeddings.map((chunk, index) => ({
    ...chunk,
    index,
    score: cosineSimilarity(queryEmbedding, chunk.embedding)
  }));

  // Filter by threshold, sort by score, take top-k
  const results = scored
    .filter(r => r.score >= SIMILARITY_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_K);

  return results;
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
    // Fallback: use first embedding dimensions as a zero vector
    if (state.embeddings.length > 0) {
      return new Array(state.embeddings[0].embedding.length).fill(0);
    }
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
