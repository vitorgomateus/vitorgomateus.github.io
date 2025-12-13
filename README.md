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
