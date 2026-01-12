# AI Agent Instructions

## Task Type Decision Tree (Read This FIRST!)

**Before starting any task:**
1. Read user request
2. Identify task type(s) from list below
3. Read ONLY the file sections listed for that type
4. Make changes
5. **Update line ranges below if code shifts >20 lines**

**Line ranges are approximate guides (±5-10 lines drift is normal). They're for navigation efficiency, not exact targeting.**

---

**Identify task type before reading files:**

### 1. Styling/Visual Changes
*Examples: "Change colors", "Adjust spacing", "Modify button style", "Update fonts"*
- **Read:** styles.css (relevant section only)
- **Also read:** index.html if adding/removing HTML structure
- **Skip:** chatbot.js (unless inline styles need removal)

### 2. Model Personality/Behavior
*Examples: "Make it friendlier", "Change tone", "Add greeting variation", "Handle off-topic better"*
- **Read:** chatbot.js lines 71-88 only (`this.systemInstructions`)
- **Skip:** Everything else unless testing requires it

### 3. User Data Extraction
*Examples: "Extract phone numbers", "Capture more context", "Add new extraction field"*
- **Read:** chatbot.js lines 71-88 (extraction directive in system instructions)
- **Read:** chatbot.js lines 355-380 (`generateLLMResponse` - parsing logic)
- **Read:** chatbot.js lines 596-730 if feedback form needs updating

### 4. Feedback System
*Examples: "Change feedback timing", "Modify form fields", "Update mailto format"*
- **Read:** chatbot.js lines 596-730 (`showFeedbackForm`)
- **Skip:** Rest of chatbot.js

### 5. Performance Tuning
*Examples: "Speed up responses", "Reduce memory usage", "Adjust message limits"*
- **Read:** chatbot.js lines 32-41 (threshold variables)
- **Read:** chatbot.js lines 476-574 (monitoring logic)
- **Skip:** UI and model behavior sections

### 6. Alert/Notification System
*Examples: "Change alert styling", "Modify warning messages", "Adjust auto-dismiss timing"*
- **Read:** chatbot.js lines 553-562 (`showAlert` method)
- **Read:** styles.css lines 580-633 (alert styling)
- **Read:** index.html for alert container structure

### 7. Model Selection/Configuration
*Examples: "Switch to different model", "Change temperature", "Adjust max tokens"*
- **Read:** chatbot.js lines 23-28 (model selection)
- **Read:** chatbot.js lines 32-41 (performance variables including temperature, maxTokens)

### 8. DOM Structure/Layout
*Examples: "Add new section", "Rearrange elements", "Remove footer"*
- **Read:** index.html (entire file - it's short)
- **Read:** styles.css (relevant layout sections)

### 9. Privacy Message/Icons
*Examples: "Change privacy icons", "Modify first message", "Update SVG styling"*
- **Read:** chatbot.js lines 360-410 (`addPrivacyMessage` method)
- **Read:** styles.css if icon styling needed

### 10. Complex/Multi-Part Requests
*Examples: "Redesign feedback flow", "Add new feature with UI and behavior"*
- **Break down into subtasks first**
- **Identify type for each subtask**
- **Read only relevant sections for each subtask**
- **Use manage_todo_list to track progress**

---

## Project Context
100% client-side AI chatbot using WebLLM (Phi-3.5-mini). Zero server communication. See [README.md](../README.md) for user-facing overview.

---

## Core Principles

- **Privacy First:** No server communication, 100% client-side
- **Performance Critical:** Aggressive monitoring to prevent browser slowdown
- **Mobile Only:** 375px × 620px, no responsive breakpoints
- **No Build Tools:** Direct ES modules, vanilla JS/CSS

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
- Match existing spacing rhythm (8px base unit)
- Use CSS variables for colors (maintain consistency)
- Keep buttons simple with clear labels
- Maintain the chat bubble aesthetic (rounded, soft shadows)
- Prioritize function over decoration

---

## Architecture

### JavaScript (chatbot.js)
- **Lines 1-90:** Constructor & initialization
  - DOM element caching
  - Model selection (lines 23-28)
  - Performance tuning variables (lines 32-41)
  - State management
  - System instructions & extraction config (lines 71-88)
- **Lines 91-165:** Setup & model loading
  - Random color generation
  - WebGPU support check
  - Model loading with progress tracking
- **Lines 166-255:** Message handling
  - `handleSend()` - User input processing
  - `generateGreeting()` - Initial model message
- **Lines 256-385:** LLM integration
  - `generateLLMResponse()` - Core AI logic (lines 355-380)
  - Context extraction & persistence (lines 355-380)
  - Streaming response handling
- **Lines 386-475:** Message display
  - `addMessage()`, `addUserMessage()`, `addBotMessage()`
  - Typing indicators
  - Message pruning
- **Lines 476-574:** Performance monitoring
  - `trackPerformance()` - Metrics tracking
  - `checkMemoryUsage()` - Chrome memory API
  - `showPerformanceWarning()` - Alert system integration
- **Lines 575-730:** UI controls
  - `toggleAI()` - Chat/static mode switching
  - Drawer controls
  - `showAlert()` - Inline alert system (lines 553-562)
  - `handleClearCache()` - Cache management
  - `showFeedbackForm()` - Form generation & mailto (lines 596-730)
  - `toggleAccessibility()` - Font/color switching

**Patterns:**
- ES6 class-based, async/await throughout
- DOM elements cached in constructor
- `requestAnimationFrame` for scrolling
- Arrow functions for event listeners

### CSS (styles.css)
- **Lines 1-30:** CSS variables (colors, spacing)
- **Lines 31-80:** Base styles & typography (rem-based)
- **Lines 81-150:** Layout (container, header, messages)
- **Lines 151-350:** Message bubbles & animations
- **Lines 351-450:** Input area & buttons
- **Lines 451-520:** Drawer & settings
- **Lines 521-579:** Static content mode
- **Lines 580-633:** Alert system (info, success, error variants)

**Patterns:**
- CSS variables for all theming
- Flexbox only (no Grid)
- GPU animations (`transform`, `opacity`)
- `prefers-reduced-motion` support

### HTML (index.html ~108 lines)
- Chat container structure
- Static content fallback
- Alert container (between messages and input)
- Drawer with settings

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

## System Instructions & Extraction

**Where to edit:**
- Location: `this.systemInstructions` in constructor (chatbot.js lines 71-88)
- Current persona: "Goma" - Vítor's AI portfolio chatbot

**Writing effective system instructions:**
- **Be concise:** Limited context window (maxTokens: 512), every word counts
- **Structure clearly:** Identity → Purpose → Guidelines → Technical directives
- **Personality first:** Define WHO the model is (name, role, voice) at the top
- **Specific behaviors:** "Keep responses concise" not "Be helpful"
- **Handle edge cases:** What to do when uncertain, how to handle off-topic
- **Test after changes:** Send varied messages, check tone/length/accuracy

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
