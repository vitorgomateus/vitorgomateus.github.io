# Vítor Gonçalves - Local LLM Chatbot

## Status
**🚧 Proof of Concept - Active Development**

A fully client-side chatbot running WebLLM (Phi-3.5-mini) entirely in the browser using WebGPU.

## Goal
Demonstrate the viability of running LLMs locally in the browser with complete privacy - zero server communication, all processing happens client-side.

## Requirements

### Technical
- **Browser:** Chrome 113+ or Edge 113+ (WebGPU required)
- **Server:** Must be served via HTTP (not `file://` due to ES modules)
- **Resources:** ~2-4GB RAM, 1.9GB storage for cached model

### Design Constraints
- Mobile-only interface (375px × 620px)
- No external API calls
- No conversation persistence

## Quick Start
```bash
python -m http.server 8000
# Open http://localhost:8000
```

First load will download the model (~1.9GB). Subsequent loads are instant.

## Technology
- **LLM:** Phi-3.5-mini via WebLLM (MLC AI)
- **Acceleration:** WebGPU
- **Fonts:** Young Serif, Work Sans

## How It Works

### Query Flow
1. **User Input** → User sends a message through the chat interface
2. **Context Extraction** → Previous conversation messages are limited to last 10 turns to manage memory
3. **User Info Injection** → Extracted user details (name, email, company, context) from earlier messages are added to system prompt for persistent context
4. **RAG Augmentation** _(Future)_ → Semantic search against `embeddings.json` to find relevant portfolio data chunks
5. **Model Query** → Conversation history + system instructions sent to local LLM via WebLLM
6. **Streaming Response** → Model generates response with streaming enabled for better UX
7. **Metadata Extraction** → Model appends `[EXTRACT]{...}[/EXTRACT]` JSON with user info (stripped before display)
8. **Response Display** → Clean response shown to user, extracted info stored for future context

### Context Management
- **System Instructions**: Define model personality (Goma), behavior guidelines, and extraction format
- **Conversation History**: Rolling window of last 10 messages to prevent memory bloat
- **User Context**: Name, email, company, position, and interests persist across entire session
- **Extraction Format**: Model embeds structured JSON in every response for zero-overhead data capture

### RAG System _(In Development)_
- **Embeddings**: 19 pre-generated chunks (summary, skills, education, experience, projects) with 384-dim vectors
- **Model**: `all-MiniLM-L6-v2` via sentence-transformers
- **Search**: Client-side cosine similarity to find top-k relevant chunks
- **Injection**: Relevant context prepended to system prompt before model query

Generate embeddings:
```bash
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install sentence-transformers
python generate_embeddings.py
```

## Features
- 100% local AI processing
- Performance monitoring with warnings
- AI on/off toggle
- Accessibility mode
- Cache management

## Limitations
- WebGPU support limited (Chrome/Edge only)
- Large initial download (1.9GB)
- No conversation history persistence

## Development
See `logs/` folder for detailed development notes, abandoned ideas, and changelog.

## Credits
- **Built by:** Vítor Gonçalves
- **AI Assistant:** Claude (Anthropic) - Architecture & implementation support
- **WebLLM:** MLC AI Project
- **Model:** Phi-3.5-mini (Microsoft)
- **Fonts:** Google Fonts
