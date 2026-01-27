# AI Agent Instructions

## Project Context
100% client-side AI chatbot using WebLLM (Phi-3.5-mini). Zero server communication. See [README.md](../README.md) for user-facing overview.

---

## Core Principles

- **Privacy First:** No server communication, 100% client-side
- **Performance Critical:** Aggressive monitoring to prevent browser slowdown
- **Mobile Only:** 375px × 620px, no responsive breakpoints
- **No Build Tools:** Direct ES modules, vanilla JS/CSS
- **Aesthetic:** Clean, modern, engaging UI/UX
- **Accessibility:** correct aria roles, HTML semantics and focus management

---

## Aesthetic Guidelines

**Design Philosophy:** Clean, modern, engaging

**Visual Language:**
- **Minimalist:** Remove unnecessary elements, let content breathe
- **Typography:** Young Serif (headers, warm personality) + Work Sans (body, clean readability)
- **Color:** Random primary on load (playful surprise), neutral grays for UI
- **Contrast:** Strong text contrast for readability, subtle borders for structure
- **Spacing:** Generous padding/margins, clear visual hierarchy

**Interaction:**
- **Smooth:** All animations GPU-accelerated, respect `prefers-reduced-motion`
- **Responsive feedback:** Immediate visual response to user actions
- **Subtle motion:** Gentle transitions, avoid jarring changes
- **Delightful details:** Typing indicators, smooth scrolling, fade-ins

**When designing new UI:**
- Match existing spacing rhythm (6px base unit)
- Use CSS variables for colors (maintain consistency)
- Keep buttons simple with clear labels
- Maintain the chat bubble aesthetic (rounded, soft shadows)
- Prioritize function over decoration

---

## System Instructions & Extraction

**Behavioral guidelines:**
- **Warmth over formality:** Match the "clean, modern, engaging" aesthetic
- **Brevity over completeness:** Small model, limited tokens - prioritize key info
- **Honesty over invention:** Should say "I don't know" rather than hallucinate
- **Context-aware:** Should reference extracted user info naturally when relevant
- **Brand-aligned:** Should mention local processing/privacy when appropriate

**Extraction requirements (CRITICAL):**
- **Must keep:** The `[EXTRACT]{...}[/EXTRACT]` directive at the end
- **Format:** JSON with 5 fields: name, email, company, position, context
- **Stripping:** Handled automatically by regex `/\[EXTRACT\][\s\S]*?\[\/EXTRACT\]/g`
- **If removed:** Context persistence breaks, feedback form won't pre-fill
- **Testing:** Check that extraction still works after instruction changes

**Context extraction (zero overhead):**
- Model appends `[EXTRACT]{"name":"...","email":"...","company":"...","position":"...","context":"..."}[/EXTRACT]` to every response
- Extraction happens during normal response (no extra API calls), then stripped before display
- Extracted info stored in `this.extractedInfo` object
- Extracted info injected into system prompt for persistent context (survives limited `maxHistory`)
- Context field is cumulative/open-ended (projects, technologies, methodologies, interests)

---

## File Map

**chatbot.js** (~763 lines):
- Core logic with WebLLM integration
- Context extraction & persistence
- Feedback system (`showFeedbackForm()` at ~555)
- Performance monitoring
- Alert system (`showAlert()`)

**styles.css** (~633 lines):
- CSS variables for theming
- rem-based typography
- GPU-accelerated animations
- Alert variants (info, success, error)

**index.html** (~108 lines):
- Chat/static mode structure
- Alert container between messages and input
- Feedback form in bot message bubble

---

## Code Standards

**Keep it clean:**
- Follow existing ES6 class patterns in chatbot.js
- Use CSS variables, rem units only for fonts
- Maintain vanilla JS/HTML/CSS—no build tools
- GPU-accelerated animations only (`transform`, `opacity`)

**Keep it simple:**
- Concise code comments for non-obvious logic
- Clear variable names (avoid abbreviations)
- Document "why" not "what" in comments

---

## Common Pitfalls & Issues

**Don't add:**
- Device detection (removed for reliability)
- px units for fonts (rem only)
- Responsive breakpoints (fixed dimensions)
- Server-side processing
- External API calls
- Build tools/bundlers

**Common issues:**
- **CORS:** Must use HTTP server (not `file://`)
- **Performance:** Prune messages aggressively
- **Memory:** Clear old conversation history
- **WebGPU:** Check support before initializing
- **Model changes:** Cache clears automatically

---

## What to Preserve

- Performance monitoring system
- Privacy-first architecture  
- Mobile-only simplicity
- Tunable performance variables
- Extraction & context persistence patterns
