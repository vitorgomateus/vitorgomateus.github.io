# Vítor Gonçalves - Portfolio

## Status
**🚧 Active Development**

A professional UX portfolio with two ways to explore the same content:
- a static, accessible, responsive portfolio
- an experimental local chatbot that runs in the browser with no server communication

## Goals
- **Primary**: Professional portfolio showcasing UX design expertise and projects
- **Experimental**: Demonstrate viability of browser-based LLMs with local processing
- **Innovation**: Conversational interface as alternative way to explore portfolio content

## Requirements

### Technical
- Website must run from GitHub Pages
- The static portfolio must remain the primary experience
- The architecture must stay lightweight because any local model already adds heavy runtime cost

### Design Constraints
- Mobile-first interface with desktop breakpoint support
- No external API calls
- Strong semantic HTML and structured data for both accessibility and machine parsing

## Proposed Architecture Direction

- **Static-first:** ship meaningful HTML for the profile and portfolio before any JavaScript enhancement
- **Progressive enhancement:** layer search, chatbot, theme switching, and settings on top of the static document
- **Single source of truth:** keep profile, portfolio, chatbot context, and search chunks derived from the same structured content
- **Machine-friendly by design:** use stable ids and persistent anchors reused by search, chat, and deep links
- **Semantic and structured:** keep explicit headings, landmarks, labels, captions, and structured metadata so agents and bots can parse the site reliably
- **Accessibility-aligned parsing:** the same clear structure that helps LLM agents usually helps screen readers too, as long as the accessibility tree stays clean (only meaningful content and controls appear in the reading order) and content is not duplicated or hidden incorrectly
- **Opt-in AI:** load the local model only after explicit user consent; the active model is a developer-level configuration, not a user-facing choice; the user controls the tone/preset from a constrained settings UI
- **Short-context memory:** store user details in compact structured fields plus a tiny rolling session summary instead of replaying long chat history
- **Performance-first:** lazy-load experimental code paths, keep the portfolio usable without the model, and avoid JS architecture that adds extra work on top of model inference

## Technology Direction
- **Frontend:** semantic HTML, modern CSS, ES modules, no framework requirement
- **Hosting:** GitHub Pages
- **Content:** structured JSON as the canonical portfolio source
- **Search:** pre-generated vector index used client-side
- **AI:** local browser runtime with explicit user-controlled model loading
- **Theming:** Two named themes — Notebook (clean, editorial) and Vaporwave/Glass (edgy, atmospheric) — with CSS custom property tokens

## How It Works

### Static Portfolio
The page should deliver a complete profile and portfolio as readable HTML first, with semantic sections that are easy for people, screen readers, search engines, and LLM agents to interpret.

### Semantic Search
Semantic search should use a pre-built vector index generated from the same canonical content source, so search results, static rendering, and chatbot retrieval stay aligned.

### Local Chatbot
The AI assistant (Goma) should remain a secondary, opt-in feature:
1. **Consent first:** explain privacy, browser requirements, and model size before loading anything heavy
2. **Download and delete control:** let the user download or delete the fixed local model from their device; model selection is a developer decision, not a user-facing option
3. **Short-memory strategy:** preserve useful user details as compact structured memory instead of sending long transcripts
4. **Shared knowledge base:** retrieve from the same profile and portfolio data shown on the page

### Privacy & Performance
- **Zero Server Calls**: All processing happens in your browser
- **Static-first fallback**: The portfolio remains fully usable even if AI features are disabled or unsupported
- **Lazy Enhancement**: Experimental assets should load only after explicit intent
- **Memory Management**: Keep prompts small, structured, and bounded
- **Browser Support**: Degrade gracefully when local AI features are unavailable

For technical details, see [REQUIREMENTS.md](REQUIREMENTS.md).

## Features
- Accessible static portfolio
- Semantic vector search
- 100% local AI processing
- Model download and delete controls
- Two named themes (Notebook, Vaporwave/Glass)
- Experimental feature on/off toggle
- Compact session memory for chatbot personalization
- Cache management

## Limitations
- Local AI remains device-dependent
- Large initial model download is still expected for capable models
- Two layout tiers (mobile baseline + desktop breakpoint)
- Short context windows require aggressive memory curation
- The static portfolio must always outperform the experimental layer

## For Developers

### Generating Embeddings
The project uses vector embeddings for semantic search.

After updating `data-002.json`:
```bash
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install sentence-transformers
npm run generate:embeddings
```

To keep `embeddings.json` synced automatically while you edit `data-002.json` locally:
```bash
npm run watch:embeddings
```

`embeddings.json` is not tracked in git. GitHub Pages deployment generates embeddings during the workflow run and publishes them as part of the deployed artifact.

The deploy workflow is in `.github/workflows/update-embeddings.yml` and does not create git commits.

See [REQUIREMENTS.md](REQUIREMENTS.md#embeddings-json-structure) for schema details.

### Local Development
```bash
npm install
npm run dev
```

This starts both:
- a local static server at `http://localhost:8000`
- the SCSS compiler in watch mode
- the embeddings watcher (regenerates `embeddings.json` when `data-002.json` changes)

Note: `npm run dev` requires Python plus `sentence-transformers` available in your environment.
If you only want frontend development (no embeddings watch), use:
```bash
npm run dev:web
```

If you only want the server:
```bash
npm run serve
```

### SCSS Workflow
```bash
npm install
npm run build:css
```

For continuous compilation while editing styles:
```bash
npm run watch:css
```

## Credits
- **Built by:** Vítor Gonçalves
- **AI Assistant:** Claude (Anthropic) - Architecture & implementation support
- **Fonts:** Google Fonts
