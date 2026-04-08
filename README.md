# Vítor Gonçalves - Portfolio

## Status
**🚧 Active Development**

A portfolio website showcasing UX design work, with an experimental AI chatbot feature that runs entirely in the client's browser. The chatbot (Goma) uses Transformers.js (Gemma 4 E2B-it) and WebGPU for 100% client-side processing - zero server communication, complete privacy.

## Goals
- **Primary**: Professional portfolio showcasing UX design expertise and projects
- **Experimental**: Demonstrate viability of browser-based LLMs with local processing
- **Innovation**: Conversational interface as alternative way to explore portfolio content

## Requirements

### Technical
- Website must run from Github Pages

### Design Constraints
- Mobile-first interface with desktop breakpoint support
- No external API calls

First load will download the model (~1.5GB). Subsequent loads are instant.

## Technology
- **LLM:** Gemma 4 E2B-it via Transformers.js (Hugging Face)
- **Acceleration:** WebGPU
- **Fonts:** Young Serif, Work Sans

## How It Works

### The Chatbot
The AI assistant (named Goma) runs entirely in your browser using Transformers.js and WebGPU:
1. **First Visit**: Downloads the Gemma 4 E2B-it model (~1.5GB, one-time, cached locally)
2. **Chat**: Your messages stay on your device - no server communication
3. **Context**: The bot remembers the last 5 conversation turns and user details you share
4. **Responses**: Generated locally, typically taking a few seconds

### Portfolio Search _(Coming Soon)_
Semantic search will let you query portfolio content using natural language. Currently in development - data file needs updating before implementation.

### Privacy & Performance
- **Zero Server Calls**: All processing happens in your browser
- **Local Storage**: Model cached in IndexedDB for instant future loads
- **Memory Management**: Old messages automatically pruned to prevent slowdown
- **Browser Support**: Requires WebGPU (Chrome/Edge on desktop)

For technical details, see [REQUIREMENTS.md](REQUIREMENTS.md).

## Features
- 100% local AI processing
- Performance monitoring
- Experimental feature on/off toggle
- Accessibility mode
- Cache management

## Limitations
- WebGPU support limited (Chrome/Edge only)
- Large initial download (~1.5GB)
- Two layout tiers (mobile baseline + desktop breakpoint)
- Single model
- Limited context window (256 tokens)
- No streaming display (accumulated then shown)

## For Developers

### Generating Embeddings
The project uses vector embeddings for semantic search (not yet implemented).

After updating `data-002.json`:
```bash
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install sentence-transformers
python generate_embeddings.py
```

See [REQUIREMENTS.md](REQUIREMENTS.md#embeddings-json-structure) for schema details.

### Local Development
```bash
npm install
npm run dev
```

This starts both:
- a local static server at `http://localhost:8000`
- the SCSS compiler in watch mode

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
- **Transformers.js:** Hugging Face
- **Model:** Gemma 4 E2B-it (Google)
- **Fonts:** Google Fonts
