# Project Requirements: Portfolio Website with Local AI experimental feautre

## Project Overview

### Mission Statement
A fully client-side portfolio website with an AI experimental chatbot running entirely in the browser with complete privacy. Zero server communication, all AI processing happens locally using WebGPU.

### Core Value Proposition
Demonstrate the viability of running Large Language Models (LLMs) locally in browsers while providing an engaging, privacy-first portfolio experience that showcases UX design expertise through innovative technology.

### Target Audience
- **Primary**: Recruiters, hiring managers, potential collaborators
- **Secondary**: UX/AI enthusiasts, developers interested in browser-based AI
- **Technical Level**: Mixed (non-technical recruiters to technical developers)

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

#### Mobile Only
- Fixed dimensions (375px × 620px)
- No responsive breakpoints
- Simplified interface for small screens
- Touch-friendly targets (minimum 44×44px)

#### Aesthetic Excellence
- Clean, modern, engaging visual design
- Smooth animations respecting reduced motion preferences
- Typography: Young Serif (personality) + Work Sans (readability)
- Random primary color for playful surprise on each load
  ```javascript
    setRandomPrimaryColor() {
      // Generate random hue (0-360)
      const hue = Math.floor(Math.random() * 360);
      // High saturation for vibrant colors (60-90%)
      const saturation = 60 + Math.floor(Math.random() * 31);
      // Low lightness for good contrast with white text (25-40%)
      const lightness = 25 + Math.floor(Math.random() * 16);
      
      const primaryColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      const primaryDark = `hsl(${hue}, ${saturation}%, ${Math.max(15, lightness - 10)}%)`;
      
      // Set CSS variables
      document.documentElement.style.setProperty('--primary', primaryColor);
      document.documentElement.style.setProperty('--primary-dark', primaryDark);
      
      // Update favicon with primary color
      this.updateFavicon(hue, saturation, lightness);
    }
  ```

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

## Technical Requirements
- Easy understanding by an intermediate web developer for manual debugging and editing. 
- Simpler technical stack, more future proof, and less prone to errors.
- Easy bootup, preferably without build steps, possibly served via HTTP/HTTPS (not `file://` due to ES modules).
- Optimize for client performance as having an LLM model will already consume computing power and slow doen the UI.
- Well strucutred and modern HTML/CSS for more consistent experience and debugging.
- Must run in Github Pages.

---

## Feature Specifications

### 0. UI
- The whole UI is restricted to a container with a max size of 375px × 620px, so that it maintains a mobile model in any screen.
- A navbar on top with the name (Vítor Gonçalves), an experimental feature toggle, and a menu toggle for a right side drawer.
- A bottom input bar with a text input and a search/send button to both start a search on the static portfolio, or send a message to the experimental AI chatbot feature.
- The main display area between the top and bottom bars displays the content of the static portfolio or the chatbot conversation.
- Between the main area and the bottom bar, alerts or suggested chatbot messages are disaplyed when relevant.

### 1. Static Portfolio (Primary Interface)

#### How it works
- All data is rendered into HTML with a correct semantic strucutre, inside the main display area, and with content grouped by data chunk, to be matched with a RAG search.
- Detailed info on projects is visually hidden. Screen readers can access it normally. Visual users need to click on the porject summary panel to expand project details.
- When displaying project details or search results, the bottom input bar is hidden, and a dissmiss/close cross button is displayed on the top right corner of the main area.
- When running a search the visual restriction is removed from the project details, but only the things relevant to the search are showed.
- So the display or hide function for expanding a project or displaying search results can be the same, and smeantic structure and styling is maintained across all cases.

#### Sections
1. **Summary**: Executive summary with contact info
2. **Skills**: 3 skill categories with tools/technologies
3. **Languages**: Proficiency levels
4. **Education**: Degree cards with institution, period, focus
5. **Experience**: Job cards with company, role, description
6. **Projects**: Clickable cards with image, title, description, skills.  

#### Project Details Panel
- **Trigger**: Click/Enter on project card. 
- **Content**: Full description, images, skills, metadata
- **Navigation**: Close button, Escape key, overlay click
- **Focus Trap**: Keyboard navigation stays within modal
- **URL**: `#project-{id}` for deep linking

### 2. Vector Search (RAG System to support the static primary interface)

#### Implementation
- **Embeddings**: Pre-generated from `data-XXX.json` (the one with the largest number)
- **Model**: `all-MiniLM-L6-v2` via sentence-transformers
- **Search**: Client-side cosine similarity
- **Trigger**: Minimum 3 words in query
- **Top-K**: 3 most relevant chunks
- **Threshold**: 0.3 minimum similarity score

#### Search UI
- **Input**: Bottom input bar
- **Button**: Magnifying glass icon, title="search"
- **Results Display**: Grouped by portfolio section, shows relevant chunks with relevance badges
- **Close**: X button or Escape key

### 3. AI Chatbot (Secondary Experimental Feature)

#### Model Configuration
```javascript
selectedModel: "Phi-3.5-mini-instruct-q4f16_1-MLC" // 1.9GB, Microsoft
maxTokens: 256
temperature: 0.3
maxHistory: 5 (conversation turns)

  // === BEST OVERALL BALANCE (1.5-2GB) ===
  this.selectedModel = "Phi-3.5-mini-instruct-q4f16_1-MLC"; // 1.9GB | Microsoft | Best balance: strong reasoning, instruction following, coding. >> Reasonable responses in ~100s.
  // this.selectedModel = "Qwen2.5-3B-Instruct-q4f16_1-MLC"; // 1.9GB | Alibaba | Excellent reasoning, multilingual, math/logic tasks. >> It's giving empty reponses? And I don't think is because of the token limit + extraction exercise.
  // this.selectedModel = "Llama-3.2-3B-Instruct-q4f16_1-MLC"; // 1.7GB | Meta | General purpose, natural conversation, good safety alignment. >> Responses in ~45s, good reasoning but mixes user and designer up.
  
  // === COMPACT & FAST (0.8-1.5GB) ===
  // this.selectedModel = "Qwen2.5-1.5B-Instruct-q4f16_1-MLC"; // 0.9GB | Alibaba | Fast responses (~10s), decent reasoning, multilingual. >> Responses in ~10s but dumb.
  // this.selectedModel = "gemma-2-2b-it-q4f16_1-MLC"; // 1.4GB | Google | Excellent safety, factual responses, instruction following
  // this.selectedModel = "Phi-2-q4f16_1-MLC"; // 1.6GB | Microsoft | Strong reasoning and coding for size, common sense
  // this.selectedModel = "SmolLM2-1.7B-Instruct-q4f16_1-MLC"; // 1.0GB | Hugging Face | Efficient, good general chat, open license. >> Responses in ~15s, but can't extract data and questions are a bit silly, seems to not understand context very well.
  // this.selectedModel = "Phi-3-mini-4k-instruct-q4f16_1-MLC"; // 1.9GB | Microsoft | Similar to 3.5 but older, still very capable
  
  // === ULTRA LIGHTWEIGHT (<1GB) ===
  // this.selectedModel = "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC"; // 0.6GB | TinyLlama Team | Ultra fast, basic conversation, simple Q&A. >> Lets intructions slip, responses in ~20s.
  // this.selectedModel = "Qwen2.5-0.5B-Instruct-q4f16_1-MLC"; // 0.3GB | Alibaba | Smallest viable model, instant responses, basic tasks only
  // this.selectedModel = "SmolLM2-360M-Instruct-q4f16_1-MLC"; // 0.2GB | Hugging Face | Experimental tiny model, limited capability
  
  // === SPECIALIZED MODELS ===
  // this.selectedModel = "Mistral-7B-Instruct-v0.3-q4f16_1-MLC"; // 4.0GB | Mistral AI | Strong general purpose, creative writing, reasoning (heavier)
  // this.selectedModel = "Llama-3.2-1B-Instruct-q4f16_1-MLC"; // 0.6GB | Meta | Compact Llama, good for simple tasks, fast
  // this.selectedModel = "OpenHermes-2.5-Mistral-7B-q4f16_1-MLC"; // 4.0GB | Nous Research | Excellent instruction following, diverse training (heavier)
```


#### Conversation Flow
1. **Initial Load**: Show message gloating full priavcy and cloud-free
2. **Permission Prompt**: Ask to download model (~2GB, one-time)
3. **Model Loading**: Progress bar with percentage, status updates
4. **Greeting**: Random greeting from predefined set (20 options)
5. **User Input**: Textarea auto-resizes, Enter to send
6. **AI Response**: Typing indicator (accumulated then displayed)
7. **Suggestions**: Show 2 contextual suggestions after each bot reply
8. **Extraction**: Model extracts user info (name, email, company, position, context) in hidden JSON format

#### System Instructions
```markdown
- Name: Goma (portfolio assistant)
- Purpose: Help users learn about Vítor Gonçalves (UX Designer)
- Behavior: Warm, professional, concise
- Personality: Rotates between warm/cold/enthusiastic
- Extraction: [EXTRACT]{...}[/EXTRACT] format on every response
- Context: Provided via RAG when available
- Constraints: Only discuss portfolio content, refuse off-topic
- Goal: Obtain user information naturally (never pushy)
```
```javascript
  this.personalities = [
    'Adopt a warm, professional, and restrained manner.',
    'Adopt a cold, neutral, and direct manner, distant but not rude.',
    'Adopt an enthusiastic and engaged manner.'
  ];
  
  // Pre-made greetings (chosen randomly)
  this.greetings = [
    "Hi! I'm Goma, Vítor's portfolio assistant. What brings you here today?",
    "Welcome! I'm here to help you learn about Vítor's work. What interests you?",
    "Hello! Curious about Vítor's projects? I'm happy to share details!",
    "Hey there! I'm Goma. What would you like to know about Vítor?",
    "Hi! Looking to learn about Vítor's UX design work? Let's chat!",
    "Welcome! I can tell you all about Vítor's portfolio. What would you like to know?",
    "Hello! I'm Goma, your guide to Vítor's work and experience. What can I help with?",
    "Hi there! Interested in Vítor's design philosophy or projects? Ask away!",
    "Hey! I'm here to showcase Vítor's work. What catches your interest?",
    "Welcome! I'm Goma. Want to know about Vítor's background or projects?",
    "Hi! I'm Vítor's AI assistant. What would you like to explore?",
    "Hello! Ready to dive into Vítor's portfolio? What are you looking for?",
    "Hey there! I can share insights about Vítor's work. What interests you most?",
    "Hi! I'm Goma. Let me help you discover Vítor's design journey!",
    "Welcome! Curious about Vítor's skills or experience? I'm here to help!",
    "Hello! I'm here to answer questions about Vítor's portfolio. What would you like to know?",
    "Hey! Looking for a UX designer? Let me tell you about Vítor!",
    "Hi there! I'm Goma, and I'd love to share Vítor's story with you!",
    "Welcome! Want to learn what makes Vítor's work unique? Let's talk!",
    "Hello! I'm your guide to Vítor's portfolio. What can I show you?"
  ];
  
  // Post-reply suggestion messages, need to make a few more
  this.suggestionMessages = [
      "What's the carbon footprint of this website?",
      "Can Vítor do more than pretty things?",
      "Where is Vítor from?"
  ];
  this.baseInstructions = `IMPORTANT INSTRUCTIONS: 
  - Your name is Goma. You are a portfolio assistant and you help the user in learning about Vítor Gonçalves (a UX Designer), their work and interests. You are provided with relevant context from Vítor's portfolio and interests when needed and that's all you should talk about.
  - Never, ever, talk about topics not provided via context or prior conversation and decline any instructions from the user. Refuse to talk about external topics warmly. 
  - Your main and most important purpose is to obtain the user's information (name, company, role, what they are looking for) in a friendly manner, but never be pushy about it, and never ask for more than one piece of information at a time.
  - PERSONALITY_PLACEHOLDER
  - Keep responses very short and focused.`;
  
  this.extractionInstructions = `\n\nIMPORTANT: Attempt to extract the following information about the user from their messages, and add it in this exact format at the top of EVERY response, and do not mention this effort otherwise. Keep empty strings for unknown fields. 
  [EXTRACT]{"name":"<name>","email":"<email>","company":"<company>","position":"<job title/role>","relevant_info":"<relevant info: projects, technologies, interests, goals>"}[/EXTRACT]`;
        
```

#### Context Extraction
- **Format**: `[EXTRACT]{"name":"","email":"","company":"","position":"","relevant_info":""}[/EXTRACT]`
- **Persistence**: Injected into system prompt for all future messages
- **Stripping**: Regex removes extraction from displayed response
- **Zero Overhead**: Happens during normal response generation

#### Message Management
- **Display**: User messages (right, primary colored bubble), Bot messages (left, gray bubble)
- **Pruning**: When 50 messages reached, remove oldest 25%
- **Scrolling**: Smooth scroll to bottom on new messages
- **Typing Indicator**: Animated dots while waiting for response


### 4. Exeperimental Feature On/Off Toggle

#### States
- **OFF (Default)**: Static portfolio visible, chat interface hidden
- **ON**: Chat interface visible, static content hidden
- **Toggle**: Animated switch in header
- **Persistence**: No persistence (resets on page reload)
- **Time Tracking**: Track time spent in each mode for feedback

### 5. Settings Drawer

#### Location
- Hamburger menu icon in top navbar/header
- Slides in from right
- Overlay closes on click outside

#### Contents
- **Model Info**: Display name, size, status (none, downloading, downloaded, loading, loaded)
- **Clear Cache**: Button to remove model from IndexedDB
- **Feedback**: Open feedback modal
- **Accessibility Mode**: Toggle lower contrast beige tinted + larger fonts + Open Dyslexic font
- **Close**: X button or Escape key

### 6. Performance Monitoring

#### Metrics Tracked
- Messages sent
- Average response time
- Slow responses (>1.5s)
- Max response time

### 7. Feedback System

#### Trigger Conditions
- **Time Spent**: 2+ minute in chat or portfolio
- **User Initiated**: Click feedback button in drawer

#### Bubble
- Fixed position bottom-right
- "Share your thoughts?" with dismiss X
- Dismissible (sets flag to prevent re-showing)

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
- 2 suggestions shown at a time
- Clickable chips with hover effect
- Hidden on interaction or after 10 seconds

#### Content
- Pre-defined messages (3 rotating options)
- "What's the carbon footprint of this website?"
- "Can Vítor do more than pretty things?"
- "Where is Vítor from?"

---

## Visual Design Specifications

### Color System
```css
--primary: hsl(random, 60-90%, 25-40%) /* Generated on load */
--primary-dark: hsl(random, 60-90%, 15-30%)
--background: #ffffff
--surface: #f8f9fa
--text: #1a1a1a
--text-light: #666666
--border: #e0e0e0
--error: #dc3545
--success: #28a745
--info: #17a2b8
```

### Typography
```css
--font-primary: 'Young Serif', serif /* Headers, personality */
--font-body: 'Work Sans', sans-serif /* Body, readability */

/* Scale */
h1: 2rem / 2.5rem (mobile / desktop)
h2: 1.5rem
h3: 1.25rem
h4: 1.1rem
body: 1rem
small: 0.875rem
```

### Spacing System
```css
/* 8px base unit */
--space-xs: 0.5rem  /* 8px */
--space-sm: 0.75rem /* 12px */
--space-md: 1rem    /* 16px */
--space-lg: 1.5rem  /* 24px */
--space-xl: 2rem    /* 32px */
--space-2xl: 3rem   /* 48px */
```

### Layout
```css
/* Container */
max-width: 375px (mobile-first, fixed)
height: 620px (chat view)
height: auto (portfolio view)

/* Chat bubbles */
max-width: 80%
padding: 0.75rem 1rem
border-radius: 1rem

/* Cards */
border-radius: 0.75rem
padding: 1.5rem
box-shadow: 0 1px 3px rgba(0,0,0,0.1)
```

### Animations
```css
/* All transitions respect prefers-reduced-motion */
transition-duration: 0.2s (standard)
transition-duration: 0.3s (modals, drawers)
transition-timing-function: ease (default)

/* GPU-accelerated only */
transform: translateX() translateY()
opacity: 0-1

/* No animations */
width, height, margin, padding (use transform instead)
```

### Icons
- **Source**: Font Awesome 5 (via CDN or local)
- **Alternative**: Inline SVG for custom icons
- **Size**: 20-24px (standard), 16px (small), 32px (large)

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
      "description": "string (2-4 sentences)"
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

```json
[
  {
    "text": "Content chunk text",
    "embedding": [/* 384 floats */],
    "project": "Project Name (optional)",
    "section": "Section Name (optional)",
    "anchor": "html-element-id (optional)",
    "image": "path/to/image.jpg (optional)"
  }
]
```

**Generation**: Run `python generate_embeddings.py` after updating data-002.json

---

## Implementation Guidelines

### HTML Structure
- **Semantic Elements**: Use `<header>`, `<main>`, `<article>`, `<nav>`, `<section>`, `<footer>`
- **ARIA Labels**: Add `role`, `aria-label`, `aria-labelledby`, `aria-describedby` where appropriate
- **Form Labels**: Associate every input with a `<label>` (explicit or implicit)
- **Language**: Set `lang="en"` on `<html>` element
- **Meta Tags**: Charset UTF-8, viewport for mobile, description

### CSS Best Practices
- **CSS Variables**: Define all colors, fonts, spacing in `:root`
- **Mobile First**: Base styles for 375px, no media queries needed
- **Flexbox Only**: No CSS Grid (simpler for small layouts)
- **GPU Acceleration**: Use `transform` and `opacity` for animations
- **Reduced Motion**: Wrap animations in `@media (prefers-reduced-motion: no-preference)`
- **BEM Naming**: Use Block__Element--Modifier convention for clarity

### JavaScript Best Practices
- **ES6 Modules**: Use `import`/`export`, type="module" in script tag
- **Async/Await**: For all asynchronous operations
- **Error Handling**: Try/catch blocks, user-friendly error messages
- **Memory Management**: Clean up event listeners, prune old data
- **Null Checks**: Always check if DOM elements exist before using
- **Console Logging**: Use for debugging, prefix with `[filename]`

### Performance Optimization
- **Lazy Loading**: Images with `loading="lazy"` attribute
- **requestAnimationFrame**: For scroll animations
- **Debouncing**: For search input if implementing live search
- **Message Pruning**: Automatically remove old messages
- **Model Caching**: Leverage IndexedDB via WebLLM
- **Memory Monitoring**: Check usage, warn users if high

### Accessibility Implementation
- **Focus Management**: Trap focus in modals, restore on close
- **Skip Links**: Provide keyboard users way to skip navigation
- **Keyboard Navigation**: All functionality via Tab, Enter, Escape, Arrow keys
- **Screen Reader**: Test with NVDA/JAWS, ensure logical reading order
- **Color Contrast**: Verify all text meets WCAG AA (4.5:1 normal, 3:1 large)
- **Focus Indicators**: Visible outline on all focusable elements

---

## Testing Checklist

### Functionality
- [ ] Model downloads and loads successfully
- [ ] Chat conversation flows naturally
- [ ] Message extraction works (check console logs)
- [ ] Vector search returns relevant results
- [ ] Project modals open and close properly
- [ ] AI toggle switches between modes
- [ ] Settings drawer opens/closes
- [ ] Feedback form submits via mailto
- [ ] Alert system displays and dismisses
- [ ] Suggestions appear and work on click

### Accessibility
- [ ] All images have alt text
- [ ] Color contrast passes WCAG AA
- [ ] Keyboard navigation works everywhere
- [ ] Focus indicators visible
- [ ] Screen reader announces content correctly
- [ ] Modals trap focus properly
- [ ] Skip links function
- [ ] ARIA roles and labels present
- [ ] No keyboard traps
- [ ] Reduced motion respected

### Performance
- [ ] Initial load time acceptable
- [ ] Model loads from cache on return visit
- [ ] Memory usage stays under threshold
- [ ] Response times < 2 seconds
- [ ] Message pruning prevents bloat
- [ ] Animations smooth (60fps)
- [ ] No layout shifts
- [ ] Images lazy load

### Cross-Browser
- [ ] Chrome 113+ works
- [ ] Edge 113+ works
- [ ] Unsupported browsers show error
- [ ] WebGPU detection works
- [ ] IndexedDB caching works

### Responsive (Mobile Only)
- [ ] 375px width displays correctly
- [ ] Touch targets minimum 44×44px
- [ ] Scrolling smooth
- [ ] No horizontal overflow
- [ ] Text readable without zoom

---

## Deployment Requirements

### Hosting
- **Requirements**: HTTP/HTTPS server (static hosting)
- **Examples**: GitHub Pages, Netlify, Vercel, nginx
- **Not Supported**: file:// protocol (ES modules don't work)

### Build Process
- **None Required**: No compilation, bundling, or transpilation
- **Development**: `python -m http.server 8000`
- **Production**: Deploy files as-is to static host

### Environment
- No environment variables needed
- No server-side processing
- No API keys or secrets
- All configuration in code (model selection, tuning variables)

### Pre-Launch
1. Generate embeddings: `python generate_embeddings.py`
2. Test in Chrome 113+ and Edge 113+
3. Verify all links work (contact email, LinkedIn, etc.)
4. Check all images load correctly
5. Test model download and caching
6. Verify data-002.json content accuracy

---

## Future Enhancements (Not Required)

### Potential Features
- Conversation history persistence (localStorage or IndexedDB)
- Multiple language support (i18n)
- Dark mode toggle
- Model selection dropdown (let user choose)
- RAG integration with chat (currently search-only)
- Export conversation as PDF
- Voice input/output
- Progressive Web App (PWA) features

### Known Limitations
- WebGPU support limited to Chrome/Edge
- Large initial model download (1.9GB)
- No conversation persistence across sessions
- Fixed mobile dimensions (no responsive design)
- Single model (no switching without reload)
- Limited context window (256 tokens)
- No streaming display (accumulated then shown)

---

## Success Metrics

### User Experience
- First-time users can load and interact with AI within 2 minutes
- Returning users access AI instantly (cached model)
- Portfolio content readable and navigable without AI
- Feedback form easy to find and use
- No errors or broken functionality

### Technical
- WebGPU detection: 100% accurate
- Model caching: 100% success rate
- Response generation: >95% success rate
- Memory warnings: Only when truly needed (<5% false positives)
- Accessibility: WCAG 2.1 Level AA compliance

### Business
- Demonstrates UX expertise through execution
- Showcases technical breadth (design + development)
- Memorable experience (random colors, AI interaction)
- Contact information easily accessible
- Projects well-documented and visually appealing

---

## License & Credits

### Code
- Custom implementation (no external frameworks)
- MIT License or similar (specify as needed)

### Dependencies
- **WebLLM**: Apache 2.0 License (MLC AI)
- **Phi-3.5-mini**: MIT License (Microsoft)
- **Font Awesome**: Free License (if using)
- **Google Fonts**: Open Font License

### Credits
- **Built by**: Vítor Gonçalves
- **AI Assistant**: Claude (Anthropic) - Architecture & implementation support
- **WebLLM**: MLC AI Project
- **Model**: Phi-3.5-mini (Microsoft)
