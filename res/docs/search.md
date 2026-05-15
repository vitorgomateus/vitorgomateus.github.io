# Search System Overview

This project uses a lightweight client-side search approach designed for a small portfolio dataset.

## Why this is simple (and enough)

- The content set is small and curated.
- Queries are usually short and related to known portfolio topics.
- Everything runs in the browser, with no server and no external API calls.

So the goal is not a complex search engine. The goal is stable and useful context retrieval for UI filtering and chatbot RAG.

## How search works today

The search flow is implemented in [src/features/portfolio/search.js](../../src/features/portfolio/search.js).

1. Query normalization
- Lowercase and split query into words.
- Ignore empty tokens.

2. Query embedding (pseudo-vector)
- The system builds a query vector by averaging embeddings from chunks that contain query words.
- This is a practical fallback approach for client-side usage.

3. Per-chunk scoring
- For each chunk, the system computes:
	- Vector score: cosine similarity between query vector and chunk embedding.
	- Lexical score: word overlap ratio (+ small bonus for exact phrase match).

4. Hybrid score
- Final score blends vector and lexical signals:

$$
	ext{hybrid} = w_v \cdot \text{vector} + w_l \cdot \text{lexical}
$$

- Current default weights are read from state config:
	- vectorWeight = 0.7
	- lexicalWeight = 0.3

5. Adaptive filtering
- Threshold and top-k are adjusted with simple rules based on query length and corpus size.
- Then results are filtered, sorted, and truncated.

6. Diagnostics
- The app stores query timing and score summary for sidebar visibility.

## Why hybrid scoring helps

Vector similarity alone can miss direct term intent.
Lexical overlap alone can miss semantic similarity.

Combining both gives a robust middle ground for small datasets:
- Better handling of exact names/terms (lexical).
- Better handling of semantically similar phrasing (vector).

## About "adaptive policy constants"

This just means small numbers used by the rules, for example:
- baseThreshold
- minThreshold / maxThreshold
- baseTopK / maxTopK
- vectorWeight / lexicalWeight

"Tuning" means adjusting those numbers if retrieval feels too strict (low recall) or too loose (low precision).

For your project size, you can keep this very simple:
- Start with current defaults.
- Only tweak if obvious bad behavior appears.
- Make small changes one at a time.

## Recommended simple policy for this portfolio

- Keep hybrid scoring enabled.
- Keep adaptive logic bounded (safe min/max values).
- Avoid adding heavy ranking features unless you see repeated failure cases.

This keeps the system maintainable, fast, and aligned with the project scope.

