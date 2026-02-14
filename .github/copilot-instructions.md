# AI Agent Instructions

## Project Context
Portfolio website with experimental local AI chatbot feature. Primary focus: showcase UX design work. Secondary: demonstrate browser-based LLM viability.

**Documentation Structure:**
- [README.md](../README.md) - User-facing overview, setup instructions
- [REQUIREMENTS.md](../REQUIREMENTS.md) - Complete technical specifications (authoritative source)
- This file - Critical instructions for AI agents working with the codebase

**Critical instructions:** (See REQUIREMENTS.md for full details)
- **Portfolio First:** Static portfolio is the primary interface, chatbot is experimental
- **Privacy First:** No server communication, 100% client-side processing
- **Performance Critical:** Aggressive control to prevent browser slowdown
- **Mobile Only:** no responsive breakpoints
- **Accessibility:** Correct aria roles, HTML semantics, focus management, focus trap in modals
- **Semantic styling**: for easier debugging
- **Documentation:** Avoid adding extra documentation besides short simple comments next to code blocks. Notify if you think documentation is needed, but do not add it yourself. The README and REQUIREMENTS files are the source of truth for all documentation.