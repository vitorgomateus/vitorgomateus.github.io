# AI Agent Instructions

## Project Context
100% client-side AI chatbot using WebLLM. See [logs/DEV_NOTES.md](../logs/DEV_NOTES.md) for architecture and [README.md](../README.md) for setup.

## Code Standards

**Keep it clean:**
- Follow existing ES6 class patterns in chatbot.js
- Use CSS variables, rem units only for fonts (14px root, 12px in accessibility mode)
- Maintain vanilla JS/HTML/CSS—no build tools
- GPU-accelerated animations only (`transform`, `opacity`)

**Performance first:**
- Track metrics without impacting render path
- Use `requestAnimationFrame` for DOM updates
- Maintain lightweight operations (Date.now(), simple math)

**Key patterns:**
- Font sizes: Always rem, never px
- State: Class properties only, no persistence
- Model cache: Auto-clears on version change via `checkModelVersion()`

## Documentation Standards

**Keep it updated:**
- Update logs/DEV_NOTES.md for architectural changes
- Document performance tuning variable changes
- Keep README.md current with features/requirements
- Log major decisions in logs/ directory

**Keep it simple:**
- Concise code comments for non-obvious logic
- Clear variable names (avoid abbreviations)
- Document "why" not "what" in comments

## Common Pitfalls
- Don't add device detection (removed for reliability)
- Don't use px for fonts (rem only)
- Don't add responsive breakpoints (fixed 768×1024px)
- Model changes need cache clear (automated via `checkModelVersion()`)

## Quick Reference
- Core logic: [chatbot.js](../chatbot.js) (~721 lines)
- Styling: [styles.css](../styles.css) 
- Structure: [index.html](../index.html)
- Feedback form: `showFeedbackForm()` line ~555
