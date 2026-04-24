# Project Requirements: Portfolio Website with Local AI Experimental Feature

## Project Overview

### Mission Statement
A fully client-side portfolio website with an AI experimental chatbot running entirely in the browser with complete privacy. Zero server communication, all AI processing happens locally using WebGPU.

### Core Value Proposition
Showcase UX design expertise and project work through a professional portfolio website, while demonstrating innovative use of browser-based AI technology as an experimental conversational interface.

### Project Priorities
1. **Portfolio Content** - Primary focus: professional presentation of work and skills
2. **User Experience** - Clean, accessible, performant interface across all modes
3. **AI Experimentation** - Secondary feature: demonstrate local LLM viability

### Target Audience
- **Primary**: Recruiters, hiring managers, potential collaborators seeking UX expertise
- **Secondary**: UX/AI enthusiasts, developers interested in browser-based AI
- **Technical Level**: Mixed (non-technical recruiters to technical developers)

---

## Technical Requirements
- Easy understanding by an intermediate web developer for manual debugging and editing. 
- Simpler technical stack, more future proof, and less prone to errors.
- Easy bootup, preferably without build steps.
- Optimize for client performance as having an LLM model will already consume computing power and slow down the UI.
- Well structured and modern HTML/CSS for more consistent experience and debugging.
- Must run in Github Pages.
- The static portofolio feature with vector search and project expansion is unconventional so it needs to be planned carefully.

### Deployment Requirements
- No environment variables needed
- No server-side processing
- No API keys or secrets
- All configuration in code (model selection, tuning variables)

### Proposed architecture (v2)

#### Architectural goals
- Keep GitHub Pages compatibility by shipping only static files
- Make the static portfolio the default and most resilient experience
- Keep the DOM, content model, and retrieval model aligned
- Reduce frontend overhead so the local model remains the main performance cost
- Make the site simultaneously accessible, responsive, and easy for machines to parse

#### Core architectural principle
Use **content-first progressive enhancement**:
1. deliver meaningful semantic HTML for the profile and portfolio
2. enhance that HTML with filtering, expansion, and theme changes
3. load the experimental chatbot only after explicit user action

#### Accessibility and machine-readability
- A structure that is easy for an LLM agent to parse can also help screen readers when it uses:
  - clear landmark regions
  - one logical heading hierarchy
  - stable ids and anchor targets
  - explicit labels, captions, and relationships
  - predictable reading order
  - structured metadata tied to visible content
- This only helps when the accessibility tree stays clean. Avoid duplicate hidden copies of content, decorative noise in the reading order, and custom widgets that replace native semantics without matching keyboard and ARIA behavior.

#### Proposed stack
- **Frontend**: Vanilla HTML5, modern CSS, ES modules
- **Styling**: CSS custom properties, semantic class names, mobile-first layout
- **Content**: Structured JSON as the canonical source of truth
- **Search**: Pre-generated embeddings plus lightweight client-side retrieval
- **AI runtime**: Local browser model runtime loaded on demand
- **Storage**: Local browser storage only for cache and user preferences
- **Deployment**: GitHub Pages with optional GitHub Actions preprocessing for generated artifacts

#### Proposed content pipeline
- **Canonical content source**: one structured portfolio data model for profile, projects, contact, and assistant configuration
- **Derived static output**: semantic HTML rendered from the content model
- **Derived search index**: vector chunks with stable chunk ids, source ids, labels, and human-readable summaries
- **Derived assistant context**: short machine-friendly facts and prompt-safe summaries generated from the same content source

#### Proposed runtime separation
- **Document shell**: HTML landmarks, metadata, skip links, main navigation, footer
- **Content renderer**: renders profile, project summaries, project details, and machine-readable metadata
- **Search controller**: handles query input, vector matching, chunk filtering, result announcements, and focus routing
- **Chat controller**: handles model boot, prompt assembly, response rendering, and consent states
- **Memory controller**: stores compact user facts, rolling conversation summary, and retrieval references
- **Preferences controller**: active theme, accessibility mode, and experimental feature consent
- **UI primitives**: drawer, alerts, modal, lightbox, and status regions built on accessible patterns

#### Proposed target structure
```
/
├── index.html
├── data/
│   ├── portfolio.json          # canonical content
│   ├── assistant-config.json   # allowed bot behaviors and model metadata
│   ├── search-index.json       # embeddings + retrieval metadata
│   └── structured-data.json    # JSON-LD source fragments
├── src/
│   ├── core/
│   │   ├── bootstrap.js
│   │   ├── store.js
│   │   ├── dom.js
│   │   └── preferences.js
│   ├── content/
│   │   ├── loader.js
│   │   ├── render-profile.js
│   │   ├── render-portfolio.js
│   │   └── outline.js
│   ├── search/
│   │   ├── controller.js
│   │   ├── retrieval.js
│   │   └── announce.js
│   ├── chat/
│   │   ├── controller.js
│   │   ├── prompt-assembly.js
│   │   ├── memory.js
│   │   └── safety.js
│   ├── ui/
│   │   ├── header.js
│   │   ├── drawer.js
│   │   ├── dialog.js
│   │   ├── alerts.js
│   │   └── theme.js
│   └── styles/
│       ├── tokens.css
│       ├── base.css
│       ├── layout.css
│       ├── components.css
│       └── utilities.css
└── generate_embeddings.py
```

#### Page model
- **Header**: identity, mode toggle, theme switcher, settings access
- **Main**: profile summary, portfolio sections, semantic search status, chatbot region when enabled
- **Footer**: contact and machine-readable profile references
- **Enhancement order**:
  1. load content
  2. render static portfolio
  3. enable search
  4. enable preferences
  5. offer chatbot opt-in

---

## Feature Specifications

- The website has two main features:
  1. a static portfolio
  2. an experimental chatbot assistant
- Both must read from the same canonical professional portfolio data, each through a different interaction model.
- The static portfolio is the source experience; search and chat are enhancements over the same content model rather than separate products.
- The rendered HTML, search chunks, and chatbot retrieval units must share stable ids so the system can move cleanly between visible content, vector results, and prompt context.

### 0. UI main sections
- **Container** - The UI is mobile-first and must support two viewport tiers: mobile baseline and one desktop breakpoint. At mobile sizes, keep the 460px × 720px model as the baseline constraint. At desktop sizes, allow the container to expand while preserving spacing rhythm, readability, and containment of fixed/absolute layers. Container values should be established as variables to be reused where necessary, namely on elements with position fixed or absolute, to ensure they follow the same constrain. Everything happens inside this container; fixed or absolute containers need to be positioned so that they stay inside.
- **Navbar Header** - A navbar on top with the name (Vítor Gonçalves), an experimental feature toggle, and a menu toggle for a right side drawer. This uses the primary color as background and the decorative font for the name.
- **Input bar** - A bottom input bar with a text input and a search/send button to both start a search on the static portfolio, or send a message to the experimental AI chatbot feature.
- **Main area** - The main display area between the top and bottom bars displays the content of the static portfolio or the chatbot conversation, depending on which feature is active. 
- **Alerts** - Between the main area and the bottom bar, displayed as required.
- **Suggestions** - Between the main area and the bottom bar, below the alerts, suggestions of messages to send to the chat.

### 1. Static Portfolio (Primary Feature)

#### How it works
- All core portfolio content is rendered as semantic HTML on page load.
- Project summaries and project details should preserve a single logical DOM order; prefer native patterns such as `<details>` / `<summary>` or equivalent accessible disclosure behavior.
- Searching filters or jumps within the existing portfolio structure instead of opening a separate experience.
- When search or project-focus states change what is visible, announce the change through accessible status messaging and move focus predictably.
- The same chunk ids should drive project expansion, search filtering, deep links, and chatbot retrieval references.
- Situations that change the data displayed in the static portfolio:
  1. At page load the main profile and portfolio summaries are fully available.
  2. When focusing a project, the user can expand details without losing orientation in the page structure.
  3. Searching highlights, filters, or jumps to matching chunks using the same retrieval layer that can also feed chatbot context.

### 2. Vector Search via embeddings (part of the static primary feature)

#### Implementation
- **Embeddings**: Pre-generated from `data-002.json`
- **Model**: `all-MiniLM-L6-v2` via sentence-transformers
- **Search**: Client-side cosine similarity
- **Trigger**: Minimum 3 chars in query, otherwise "search" button is disabled.
- **Top-K**: 3 most relevant chunks
- **Threshold**: 0.3 minimum similarity score

#### Search UI
- **Input**: Bottom input bar
- **Button**: Magnifying glass icon, title="search"
- **Close**: X button or Escape key
- **Announcements**: Results count and active filters exposed through an ARIA live region
- **Navigation**: Results map to stable anchors in the static portfolio

### 3. AI Chatbot (Secondary Experimental Feature)

#### Model Configuration
- The chatbot uses a **single fixed model** chosen by the developer. Users cannot select or switch models.
- The user's only runtime controls over the model are:
  - **Download** – explicitly consent to and start the one-time download before any model code runs
  - **Delete** – remove the cached model from IndexedDB at any time via the settings drawer
- The model status must always be visible and accurate. Status uses hyphenated string values:
  - `not-downloaded` – nothing stored locally
  - `downloading` – transfer in progress; show downloaded size / total size and a percentage progress indicator
  - `cached` – downloaded and stored in IndexedDB, not yet in memory
  - `loading` – being transferred from IndexedDB to GPU/CPU memory
  - `ready` – in memory and available for inference
- The default model should favor small prompt budgets and predictable instruction following over raw capability.
- Prompt assembly must stay bounded and deterministic.


#### Conversation Flow
1. **Disclaimer**: Show message gloating full privacy and cloud-free, using large icons when relevant. Hard coded message.
2. **Permission Request**: Ask to download model (~2.0GB, one-time). Hard coded message.
3. **Model Loading**: Progress bar with percentage, status updates. Dynamic WebLLM message.
4. **Greeting**: Random greeting from predefined, hardcoded set (20 options). 
6. **AI Response**: Typing indicator (accumulated then displayed).

#### Functionalities
- **User Input**: Textarea auto-resizes, Enter to send
- **Suggestions**: Show two suggestions from a pre-generate, hardcoded set of 20 questions to ask the bot. Suggestions change after each bot reply. Only shown after the bot outputs its greeting. When the system asks the user for permission to download the model, the option "Yes!" is made available. Suggestions' buttons have a similar styling to the user messages, but slightly smaller font-size and padding.
- **Behavior presets** - The bot behavior must be customizable through a small, explicit set of allowed presets (for example warm, neutral, enthusiastic) stored in configuration, not free-form prompt editing.
- **Behavior selection UI** - The active preset is selected in the settings drawer and only changes future prompt assembly, never the underlying portfolio data.
- **Preset validation** - Allowed preset ids and instruction text are defined in `assistant-config.json`, and the UI must only allow selection from that list.
- **Preset schema** - `assistant-config.json` should define a list of preset objects with `id`, `label`, `systemInstruction`, and optional `description`.
- **Preset example** -
  ```json
  {
    "presets": [
      { "id": "warm", "label": "Warm", "systemInstruction": "Adopt a warm, professional, and restrained manner.", "description": "Approachable and friendly — good default for most visitors." },
      { "id": "neutral", "label": "Neutral", "systemInstruction": "Adopt a neutral, direct, and efficient manner." },
      { "id": "enthusiastic", "label": "Enthusiastic", "systemInstruction": "Adopt an enthusiastic and engaged manner." }
    ]
  }
  ```
- **Portfolio RAG** - Each request to the model gets context from the same structured portfolio data shown on the page.
- **User-controlled runtime** - Users can download or delete the model and enable or disable the experimental feature without affecting the static portfolio.

#### System Instructions
- Name: Goma (portfolio assistant)
- Purpose: help users learn about Vítor Gonçalves and the visible portfolio content
- Tone: selected from allowed behavior presets
- Retrieval: only use portfolio and session-memory context
- Constraints: refuse off-topic requests and avoid inventing unsupported facts
- Output style: concise, scannable, low-token replies
- Memory format: structured extraction plus tiny rolling summary

#### User details extraction

**Purpose**: Maintain user context across the limited conversation window (5 turns) by extracting user information (name, email, company, position, interests) naturally during conversation. This enables context persistence and feedback form pre-filling, with all data stored locally in the browser.

**How It Works**: The system should avoid replaying full transcript history. Instead it should keep:
1. structured user slots
2. a very short rolling session summary
3. the latest few turns
4. a few relevant retrieved portfolio chunks

This compact memory is parsed before display and re-injected into future prompts to maintain awareness without overwhelming the context window.

**Implementation Details**:
- **Format**: `[EXTRACT]{"name":"","email":"","company":"","position":"","keywords":""}[/EXTRACT]`
- **Model instructions** need to be VERY clear as they are prone to failing, but not so long as to overwhelm the context window.
- **Location**: Model appends to every response; stripped before display
- **Internal Storage**: All data stored in-memory as an object
- **Persistence**: Extracted info and summary injected into future prompts in bounded form
- **Stripping Regex**: `/\[EXTRACT\][\s\S]*?\[\/EXTRACT\]/g` removes extraction from displayed response
- **Privacy**: Zero server calls; data never leaves the user's device
- **Lifecycle**: Data persists only during session; cleared on page refresh
- **Context Survival**: Survives short prompt windows via re-injection of compressed memory
- **Cumulative**: `keywords` or equivalent memory field accumulates user details in compact form

**Failure Handling**:
- If JSON is malformed: Log error, continue without extraction
- If extraction missing: Treat as incomplete data, use partial fields
- If regex fails: Display response as-is (no extraction removal)

**Testing Checklist**:
- [ ] Extract valid JSON: Verify regex strips it and data persists in next message
- [ ] Extract malformed JSON: Confirm error handling doesn't crash conversation
- [ ] Missing extraction: Confirm response displays without error
- [ ] Page refresh: Verify extracted data is cleared (in-memory storage)
- [ ] Multiple sessions: Confirm no data persists across browser instances

#### Message Management
- **Display**: User messages (right, primary colored bubble), Bot messages (left, gray bubble)
- **Pruning**: When 50 messages reached, remove oldest 25%
- **Scrolling**: Smooth scroll to bottom on new messages
- **Typing Indicator**: Animated dots while waiting for response


### 4. Experimental Feature On/Off Toggle

#### States
- **OFF (Default)**: Static portfolio visible, chat interface hidden
- **ON**: Chat interface visible, static content hidden
- **Toggle**: Animated switch in header, with an icon, an no words.
- **Persistence**: No persistence (resets on page reload)
- **Time Tracking**: Track time spent in each mode for feedback

### 5. Settings Drawer

#### Location
- Hamburger menu icon in top navbar/header
- Slides in from right
- Overlay closes on click outside

#### Contents
- **Model Info**: Name, size, device suitability, and current status. Status uses hyphenated string values: `not-downloaded`, `downloading`, `cached`, `loading`, `ready`
- **Download model**: Button that initiates the one-time model download; only shown when status is `not-downloaded`
- **Delete model**: Button that removes the cached model from IndexedDB; only shown when status is `cached` or `ready`
- **Theme Switcher**: Two named themes — Notebook and Vaporwave/Glass (see Visual Design Specifications)
- **Bot Behavior**: Let the user choose among approved behavior presets
- **Feedback**: Open feedback modal
- **Accessibility Mode**: Toggle lower contrast beige tinted + larger fonts + Open Dyslexic font
- **Close**: X button or Escape key

### 6. Performance Monitoring

#### Metrics Tracked
- Initial content render time
- Search latency
- Model download time
- Model ready time
- Messages sent
- Average response time
- Slow responses (>1.5s)
- Max response time

### 7. Feedback System

#### Trigger Conditions
- **Time Spent**: 2+ minute in chat or portfolio, prompts a message in chat, ask the user provide feedback.
- **User Initiated**: Click feedback button in drawer

#### Modal Form
- **Categories**: Categories of analytics and feedback for the user to checkbox select whih to share.
- **Fields**: (pre-filled if extracted) Name , Email, Company, Message
- **Submit**: Opens mailto with pre-filled content
- **Close**: X button, overlay click, Escape key

#### Mailto Format
```
To: hello@vitordesign.pt
Subject: Portfolio Feedback from [Name]
Body: Extracted context + form fields
```

### 8. Alert System

#### Types
- **Info**: Blue background, info icon
- **Success**: Green background, checkmark icon
- **Error**: Red background, X icon

#### Display
- Container between messages and input
- Auto-dismiss after 5 seconds
- Manual dismiss with X button
- Multiple alerts stack vertically

### 9. Suggestions System

#### Display
- Below messages container, above input, but bellow alerts.
- 2 suggestions shown at most at a time
- Clickable buttons identical but smaller than sent messages.
- Also where the reply to the permission request is offered.

---

## Visual Design Specifications

### Themes

The site ships with two named themes, selectable in the settings drawer:

#### Theme 1: Notebook
Clean, typographic, and calm. Inspired by a printed notebook or editorial layout.
```
--background:      #fafaf7
--surface:         #f0efe9
--text:            #1a1a16
--text-light:      #5a5a4d
--border:          #d6d4c8
--primary:         hsl(random, 45-65%, 30-45%) /* warm, readable */
--primary-dark:    hsl(same, same, 20-35%)
--font-primary:    'Young Serif', serif
--font-body:       'Work Sans', sans-serif
--radius-base:     0.25rem   /* tight corners, page-like */
--shadow-base:     0 1px 3px rgba(0,0,0,0.08)
```
Character notes:
- Warm off-white background, not pure white
- Subtle paper-texture feel through low-contrast tones
- Typography is the main personality carrier
- Primary accent: earthy or ink-like hues (greens, ambers, navys)
- Generous line-height; content breathes like a printed page

#### Theme 2: Vaporwave/Glass
Edgy, atmospheric, and high-contrast. Inspired by glassmorphism and vaporwave aesthetics.
```
--background:      hsl(260, 30%, 8%)   /* near-black purple */
--surface:         rgba(255,255,255,0.07) /* frosted glass panel */
--text:            #e8e0ff
--text-light:      #a89ec7
--border:          rgba(180,140,255,0.2)
--primary:         hsl(random, 70-90%, 60-75%) /* neon: violet, cyan, pink */
--primary-dark:    hsl(same, same, 45-60%)
--font-primary:    'Young Serif', serif
--font-body:       'Work Sans', sans-serif
--radius-base:     1rem                /* rounded, soft-glassy */
--shadow-base:     0 4px 30px rgba(120,80,255,0.15)
--glass-blur:      blur(12px)          /* backdrop-filter on surfaces */
```
Character notes:
- Dark purple-black base with frosted-glass surfaces
- Neon accents cycle across violet, cyan, and pink ranges
- Translucent panels use `backdrop-filter: blur` and soft borders
- Subtle glow effects on primary actions (box-shadow with primary color)
- Reduce or eliminate motion unless user explicitly opts in

### Shared tokens (both themes)
```css
--error:   #dc3545
--success: #28a745
--info:    #17a2b8
```

### Typography
```css
--font-primary: 'Young Serif', serif /* Header's title */
--font-body:    'Work Sans', sans-serif /* Body */
```
- `rem` units for fonts-sizes.

### Icons
- Feather Icons

### Buttons
```css
/* Primary */
background: var(--primary)
color: white
padding: 0.75rem 1.5rem
border-radius: 2rem
font-weight: 600

/* Secondary */
background: transparent
border: 2px solid var(--border)
color: var(--text)

/* Hover */
transform: scale(0.98)
filter: brightness(1.1)
```

### Header
The header should use the primary color as background. It should contain the only h1 in the website with the more decorative font and in white. 

### Animations
- GPU-accelerated animations (`transform`, `opacity` only)

---

## Data Schema

### data-002.json Structure

```json
{
  "personal": {
    "name": "string",
    "title": "string",
    "location": "string",
    "phone": "string",
    "email": "string",
    "linkedin": "url",
    "summary": "string (2-3 sentences)",
    "skills": [
      {
        "category": "string",
        "description": "string",
        "tools": ["string"]
      }
    ],
    "languages": {
      "languageName": "proficiency level"
    }
  },
  "education": [
    {
      "degree": "string",
      "institution": "string",
      "institutionUrl": "url (optional)",
      "location": "city, country",
      "period": "Month Year - Month Year",
      "focus": "comma-separated topics"
    }
  ],
  "experience": [
    {
      "title": "string",
      "company": "string",
      "companyUrl": "url (optional)",
      "location": "city, state/country",
      "period": "Month Year - Present/Month Year",
      "description": "string[] (array of bullet point strings) or a single string (2-4 sentences)"
    }
  ],
  "projects": [
    {
      "id": "slug",
      "active": boolean,
      "title": "string",
      "subtitle": "string",
      "year": "string",
      "company": "string",
      "role": "string",
      "shortDescription": "string (1-2 sentences)",
      "skills": ["string"],
      "contentBlocks": [
        {
          "id": "slug",
          "heading": "string | null",
          "text": "string (paragraph or more)",
          "image": {
            "src": "path/to/image.jpg",
            "bigSrc": "path/to/large.jpg (optional)",
            "alt": "string",
            "caption": "string",
            "class": "css classes (optional)",
            "link": {
              "type": "yt | axd | external",
              "href": "url",
              "icon": "fa icon class"
            }
          } | null
        }
      ]
    }
  ],
  "aboutGoma": {
    "summary": "string",
    "purpose": "string",
    "instructions": "string"
  },
  "aboutWebsite": {
    "summary": "string",
    "goals": ["string"],
    "restrictions": ["string"],
    "technicalDetails": ["string"],
    "learned": ["string"],
    "carbonFootprint": "string"
  },
  "footer": {
    "contact": {
      "email": "string",
      "phone": "string",
      "linkedin": "url",
      "github": "url"
    },
    "copyright": "string"
  }
}
```

### embeddings.json Structure

The `embeddings.json` file serves three purposes:
1. **Portfolio Generation**: Powers DOM generation for static portfolio display
2. **Vector Search**: Enables semantic similarity search across portfolio content
3. **LLM Context**: Provides relevant information to chatbot (RAG system)

**Schema**:
```json
[
  {
    "text": "Content chunk text (1-3 sentences, focused and self-contained)",
    "embedding": [/* 384 floats from all-MiniLM-L6-v2 */],
    "project": "Project Name (optional)",
    "section": "Section Name (optional)",
    "anchor": "html-element-id (optional)",
    "image": "path/to/image.jpg (optional)"
  }
]
```

**Field Specifications**:
- **text** (required): Actual content chunk for semantic matching and display
- **embedding** (required): 384-dimensional vector generated by `generate_embeddings.py`
- **project** (optional): Groups results by project in search UI
- **section** (optional): Groups results by portfolio section (Skills, Experience, Education)
- **anchor** (optional): HTML element ID for smooth scrolling from search results
- **image** (optional): Associated image path for visual display

**Chunking Strategy**:
- **Profile/Summary**: 1-2 chunks covering identity and core value proposition
- **Skills**: 1 chunk per skill category (UX Expertise, Track Record, Collaboration)
- **Experience**: 1-2 chunks per role highlighting key achievements
- **Education**: 1 chunk per degree/certification with focus areas
- **Projects**: 2-4 chunks per project:
  - Overview (problem statement, role)
  - Key features or methodologies
  - Technologies and tools used
  - Results and impact metrics

**Example**:
```json
{
  "text": "Designed and implemented a mobile-first UX system for a fintech startup, resulting in 40% increase in user engagement and 25% reduction in support tickets.",
  "embedding": [0.023, -0.156, 0.089, ...],
  "project": "Fintech Mobile App",
  "anchor": "project-fintech",
  "image": "res/img/fintech-dashboard.png"
}
```

**Generation**: Run `python generate_embeddings.py` after updating data-002.json to regenerate vectors

---

## Implementation Guidelines

### HTML Structure
- **Semantic Elements**: Use `<header>`, `<main>`, `<article>`, `<nav>`, `<section>`, `<footer>`
- **ARIA Labels**: Add `role`, `aria-label`, `aria-labelledby`, `aria-describedby` where appropriate
- **Form Labels**: Associate every input with a `<label>` (explicit or implicit)
- **Language**: Set `lang="en"` on `<html>` element
- **Meta Tags**: Charset UTF-8, viewport for mobile, description
- **Stable Anchors**: Give each meaningful content chunk a stable id that can be reused by search, chat, and deep links
- **Anchor Naming**: Use predictable kebab-case ids with singular semantic prefixes such as `profile-`, `section-`, `project-`, and `project-block-`
- **Structured Data**: Add machine-readable metadata only when it matches the visible content and document structure

### CSS Best Practices
- **CSS Variables**: Define all colors, fonts, spacing in `:root`
- **Mobile First**: Base styles for a restrained container, no media queries needed
- **Flexbox Only**: No CSS Grid (simpler for small layouts)
- **GPU Acceleration**: Use `transform` and `opacity` for animations
- **Reduced Motion**: Wrap animations in `@media (prefers-reduced-motion: no-preference)`
- **BEM Naming**: Use Block__Element--Modifier convention for clarity
- **Theme Tokens**: Drive theme switching from semantic design tokens rather than per-component overrides

### JavaScript Best Practices
- **ES6 Modules**: Use `import`/`export`, type="module" in script tag
- **Async/Await**: For all asynchronous operations
- **Error Handling**: Try/catch blocks, user-friendly error messages
- **Memory Management**: Clean up event listeners, prune old data
- **Null Checks**: Always check if DOM elements exist before using
- **Console Logging**: Use for debugging, prefix with `[filename]`
- **Progressive Enhancement**: Do not require JavaScript for users to read the core profile and portfolio
- **Lazy Loading**: Load chatbot-only code paths only after explicit opt-in

### Performance Optimization
- **Lazy Loading**: Images with `loading="lazy"` attribute
- **requestAnimationFrame**: For scroll animations
- **Debouncing**: For search input if implementing live search
- **Message Pruning**: Automatically remove old messages
- **Model Caching**: Cache local model artifacts where the runtime allows it
- **Memory Monitoring**: Check usage, warn users if high
- **Prompt Budgeting**: Cap memory, retrieval chunks, and instruction size aggressively
- **Static First**: Do not block first content render on chatbot initialization

### Accessibility Implementation
- **Focus Management**: Trap focus in modals, restore on close
- **Skip Links**: Provide keyboard users way to skip navigation
- **Keyboard Navigation**: All functionality via Tab, Enter, Escape, Arrow keys
- **Screen Reader**: Test with NVDA/JAWS, ensure logical reading order
- **Color Contrast**: Verify all text meets WCAG AA (4.5:1 normal, 3:1 large)
- **Focus Indicators**: Visible outline on all focusable elements
- **Native Controls First**: Prefer native disclosure, button, dialog, and form semantics before custom ARIA patterns
- **Status Messaging**: Search, theme, and model-loading changes must be announced without stealing focus unnecessarily

---

## Design Principles

### Main Design Principles

#### Privacy First
- No analytics, tracking, or external API calls
- All data processing happens locally
- No conversation persistence beyond session
- Clear communication about privacy benefits

#### Performance Critical
- Aggressive message pruning to prevent memory bloat
- Performance monitoring with warnings
- Graceful degradation on slower devices
- GPU-accelerated animations only

#### Responsive Scope
- Mobile-first baseline (max 460px × 720px)
- One desktop breakpoint for expanded layout
- Keep interface semantics and interaction model consistent across tiers
- Touch-friendly targets (minimum 44×44px)

#### Machine-Friendly Content
- Keep visible text and machine-readable metadata aligned
- Prefer short, well-labelled content blocks over visually clever but structurally ambiguous layouts
- Expose project, role, year, skills, and links through explicit fields and stable ids
- Make every retrieval chunk traceable back to a visible page region

#### Aesthetic Playfulness 
- Clean, modern, engaging visual design
- Smooth animations respecting reduced motion preferences
- Typography: Young Serif (personality) + Work Sans (readability)
- Primary accent color is randomized within each theme's hue range on page load, keeping the palette coherent per theme.
- A favicon of a white "i" inside a primary-color circle is generated at each load.

---

### Usability Heuristics (Nielsen's 10)

1. **Visibility of System Status**
   - Always show model loading progress with percentage and visual indicators
   - Display typing indicators during AI response generation
   - Show clear status messages for all actions (cache clearing, search, etc.)
   - Provide real-time feedback for button clicks and interactions

2. **Match Between System and Real World**
   - Use familiar chat interface patterns
   - Natural language conversation flow
   - Portfolio sections follow standard conventions (Experience, Education, Projects)
   - Clear, jargon-free language in UI labels

3. **User Control and Freedom**
   - AI on/off toggle to switch between chat and static portfolio
   - Clear close buttons on all modals and panels
   - Escape key to close overlays
   - Browser back/forward buttons work correctly
   - Ability to clear model cache and start fresh

4. **Consistency and Standards**
   - Consistent button styles and interactions
   - Uniform card layouts across all portfolio sections
   - Standardized color scheme with CSS variables
   - Consistent spacing rhythm (8px base unit)

5. **Error Prevention**
   - Permission prompts before model download
   - Confirmation dialogs for destructive actions (cache clearing)
   - Disable input during processing to prevent duplicate submissions
   - WebGPU support check before attempting model load

6. **Recognition Rather Than Recall**
   - Suggestion chips after bot responses
   - Pre-written example queries visible
   - Search results show relevant context
   - Persistent extracted user information across conversation

7. **Flexibility and Efficiency of Use**
   - Keyboard shortcuts (Enter to send, Escape to close)
   - Textarea auto-resize as user types
   - Search functionality with vector similarity
   - Quick access drawer for settings

8. **Aesthetic and Minimalist Design**
   - Clean, modern interface with generous white space
   - Random primary color on load (playful but not overwhelming)
   - Remove unnecessary elements
   - Focus on content over decoration

9. **Help Users Recognize, Diagnose, and Recover from Errors**
   - Clear error messages in natural language
   - Specific guidance on how to resolve issues
   - Graceful degradation when features unavailable
   - Alert system with different types (info, success, error)

10. **Help and Documentation**
    - Privacy message explains how the system works
    - Feedback form for questions/issues
    - Model information in settings drawer
    - Inline explanations for technical concepts

### Accessibility Standards (WCAG 2.1 Level AA)

#### Perceivable
- **Text Alternatives**: All images have descriptive alt text
- **Color Contrast**: Minimum 4.5:1 for normal text, 3:1 for large text
- **Adaptable Layout**: Semantic HTML (header, main, article, nav, etc.)
- **Distinguishable**: Text is resizable, no information conveyed by color alone
- **Accessibility Mode**: Optional high-contrast mode with larger fonts

#### Operable
- **Keyboard Accessible**: All functionality available via keyboard
- **Focus Visible**: Clear focus indicators on all interactive elements
- **Skip Links**: Allow bypassing repeated content blocks
- **Timing**: No time limits on interactions
- **Seizures**: No flashing content, respect `prefers-reduced-motion`

#### Understandable
- **Readable**: Language attribute set on HTML element
- **Predictable**: Consistent navigation and component behavior
- **Input Assistance**: Clear labels, error identification, and suggestions
- **Form Labels**: All inputs have associated labels

#### Robust
- **Compatible**: Valid HTML5, ARIA roles and attributes where appropriate
- **Name, Role, Value**: All custom controls have proper ARIA
- **Status Messages**: ARIA live regions for dynamic content updates

---


---

## License & Credits

### Code
- Custom implementation (no external frameworks)
- MIT License or similar (specify as needed)

### Dependencies
- **WebLLM**: Apache 2.0 License (MLC AI)
- **Qwen3-1.7B**: Apache 2.0 License (Alibaba)
- **Google Fonts**: Open Font License
- **Feather Icons**

### Credits
- **Built by**: Vítor Gonçalves
- **AI Assistant**: Claude (Anthropic) - Architecture & implementation support
- **WebLLM**: MLC AI Project
- **Model**: Qwen3-1.7B (Alibaba)
