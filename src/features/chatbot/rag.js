// RAG context retrieval for chatbot

import { searchEmbeddings } from '../portfolio/search.js';

// Get relevant context chunks for a user message
export async function getRelevantContext(query) {
  try {
    if (!query || query.trim().split(/\s+/).length < 3) {
      return '';
    }

    const results = await searchEmbeddings(query, { minWords: 3 });

    if (!results || results.length === 0) {
      return '';
    }

    // Format context for the model
    const contextParts = results.map(r => {
      let label = '';
      if (r.project) label = `[Project: ${r.project}] `;
      else if (r.section) label = `[${r.section}] `;
      return `${label}${r.text}`;
    });

    const context = contextParts.join('\n\n');
    return context;
  } catch (error) {
    console.error('[rag] Error retrieving context:', error);
    return '';
  }
}
