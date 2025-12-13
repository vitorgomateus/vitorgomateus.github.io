# Development Notes

Key architectural decisions and patterns for AI assistants working on this project.

---

## Core Principles

- **Privacy First:** No server communication, 100% client-side
- **Performance Critical:** Aggressive monitoring to prevent browser slowdown
- **Mobile Only:** 375px × 620px, no responsive breakpoints
- **No Build Tools:** Direct ES modules, vanilla JS/CSS

---

## Architecture

### JavaScript
- ES6 class-based (`Chatbot`)
- Async/await for all operations
- Cache DOM elements in constructor
- Use `requestAnimationFrame` for DOM updates
- Arrow functions for event listeners

### CSS
- CSS variables for theming
- Flexbox layout (no Grid)
- GPU-accelerated animations only (`transform`, `opacity`)
- Support `prefers-reduced-motion`

### State Management
- In-memory only (no persistence)
- All state in class properties
- Model cached by WebLLM automatically

---

## Performance Tuning

Configurable thresholds in constructor:
```javascript
maxMessages = 50              // Message limit
maxHistory = 10               // Conversation turns to LLM  
maxTokens = 512               // Response length
temperature = 0.7             // LLM creativity
memoryWarningThreshold = 75   // Memory % warning
slowResponseThreshold = 1500  // Slow response (ms)
```

---

## WebLLM Integration

- **Model:** Phi-3.5-mini-instruct-q4f16_1-MLC (1.9GB)
- **Auto-load:** On page load, no user selection
- **Alternatives:** Commented in code (Llama, Qwen, Gemma, TinyLlama)
- **Streaming:** Enabled but accumulated before display

---

## What to Preserve

- Performance monitoring system
- Privacy-first architecture  
- Mobile-only simplicity
- Tunable performance variables

## What to Avoid

- Server-side processing
- External API calls
- Responsive breakpoints
- Build tools/bundlers

---

## Common Issues

**CORS:** Must use HTTP server (not `file://`)  
**Performance:** Prune messages aggressively  
**Memory:** Clear old conversation history  
**WebGPU:** Check support before initializing
