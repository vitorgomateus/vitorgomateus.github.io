# AI Agent Instructions

## Project Context
Portfolio website with experimental local AI chatbot feature. Primary focus: showcase UX design work. Secondary: demonstrate browser-based LLM viability.

**Documentation Structure:**
- [README.md](../README.md) - User-facing overview, setup instructions
- [REQUIREMENTS.md](../REQUIREMENTS.md) - Complete technical specifications (authoritative source)
- This file - Quick reference for AI agents working with the codebase

**Core Principles:** (See REQUIREMENTS.md for full details)
- **Portfolio First:** Static portfolio is the primary interface, chatbot is experimental
- **Privacy First:** No server communication, 100% client-side processing
- **Performance Critical:** Aggressive monitoring to prevent browser slowdown
- **Mobile Only:** no responsive breakpoints
- **Accessibility:** Correct aria roles, HTML semantics, focus management

---

## System Instructions & Extraction (CRITICAL)

**⚠️ WARNING**: When modifying chatbot system instructions in [chatbot.js](../chatbot.js):
- **DO NOT REMOVE** the `[EXTRACT]{...}[/EXTRACT]` directive at the end
- If removed, context persistence and feedback form pre-filling will break
- See REQUIREMENTS.md §3. AI Chatbot → Context Extraction for full implementation details

**Quick Reference**:
- Extraction format: `[EXTRACT]{"name":"","email":"","company":"","position":"","relevant_info":""}[/EXTRACT]`
- Stored internally as: `this.extractedInfo.context` (note: `relevant_info` → `context`)
- Config: `maxHistory: 5`, `maxTokens: 256`, `temperature: 0.3`

---

## File Structure

**Key Implementation Files**:
- `chatbot.js` - Core AI logic, extraction at lines ~890-905, config at line 82
- `index.html` - UI structure, chat/portfolio toggle
- `data-002.json` - Portfolio content source
- `generate_embeddings.py` - Creates embeddings.json from data-002.json

See REQUIREMENTS.md §Data Schema for complete data structures.

---

## Code Standards

**Architecture:**
- Vanilla JS/HTML/CSS only - no build tools
- ES6 class patterns (see chatbot.js)
- type="module" for ES6 imports
- Async/await for async operations

**Styling:**
- CSS variables for theming (`:root`)
- rem units only for fonts (no px)
- GPU-accelerated animations (`transform`, `opacity` only)
- BEM naming convention for CSS classes

**Performance:**
- Message pruning (remove oldest 25% when 50 messages reached)
- Lazy loading for images (`loading="lazy"`)
- requestAnimationFrame for animations

**Accessibility:**
- Semantic HTML (`<header>`, `<main>`, `<article>`, `<nav>`)
- ARIA labels where appropriate
- Focus trap in modals
- Keyboard shortcuts (Enter, Escape)

