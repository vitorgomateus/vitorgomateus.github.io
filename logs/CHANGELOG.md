# Changelog

High-level changes to the project. Commit-title style entries.

---

## [Unreleased] - 2025-12-13

### Added
- Side drawer with burger menu button
- Clear model cache functionality
- Accessibility mode (lower contrast + OpenDyslexic font)
- AI on/off toggle switch in header
- Drawer overlay with click-to-close
- Burger menu button in input area

### Changed
- Replaced info page link with AI toggle
- Updated header layout for new controls
- Improved drawer animation and styling

---

## [0.2.0] - 2025-12-13

### Added
- Mobile-only layout (375px × 620px max)
- Random primary color generation on page load (min 50% saturation)
- Custom fonts: Young Serif (titles), Work Sans (body)
- SVG favicon with white 'v' on black circle
- Tunable performance variables in constructor
- Alternative model options (commented for easy testing)

### Changed
- Page title changed to "Vítor Gonçalves"
- Standardized horizontal padding to 12px on all edge components
- Updated header styling for mobile size
- Removed all responsive breakpoints

### Removed
- Desktop/tablet responsive layouts
- Model selection dropdown interface
- Old 900px container width

---

## [0.1.0] - 2025-12-12

### Added
- WebLLM integration with Phi-3.5-mini model
- Automatic model loading on page load
- Progress updates during model download
- Conversation history management (max 10 turns)
- Performance monitoring system
  - Memory usage tracking
  - Response time tracking
  - Long task detection
  - Performance warning banner
- Message auto-pruning (50 message limit)
- Typing indicator animation
- Smooth scrolling to new messages
- Auto-resizing textarea input
- GPU-accelerated animations
- Info page as lightweight fallback

### Changed
- Migrated from pattern-matching to real LLM responses
- Updated to ES module format for WebLLM import
- Changed to async/await pattern for message handling

### Removed
- Pattern-matching response system
- Manual model selection UI
- requestIdleCallback scheduling (kept in WebLLM flow)

---

## [0.0.1] - 2025-12-12 (Initial POC)

### Added
- Basic HTML structure with chat interface
- CSS styling with CSS custom properties
- Pattern-matching chatbot (pre-LLM)
- Message bubble UI
- User input with Enter key support
- Basic message history
- Performance warning system (skeleton)
- Info page fallback

### Technical Setup
- Project initialized as GitHub Pages site
- Local development with Python HTTP server
- Module-based JavaScript architecture
- Mobile-first CSS approach

---

## Version Numbering

Following semantic versioning loosely:
- **Major (X.0.0):** Significant architectural changes
- **Minor (0.X.0):** New features, UI changes
- **Patch (0.0.X):** Bug fixes, small improvements

Current version considered pre-1.0 (proof of concept phase).

---

## Future Milestones

### [0.3.0] - Planned
- [ ] Improve error handling and user feedback
- [ ] Add loading states for long operations
- [ ] Optimize drawer animations
- [ ] Test on various mobile devices
- [ ] Performance profiling and optimization

### [0.4.0] - Under Consideration  
- [ ] Optional conversation persistence (localStorage)
- [ ] Export conversation as text/markdown
- [ ] Streaming response display in UI
- [ ] Multiple model support with easy switching
- [ ] Dark mode / theme variants

### [1.0.0] - Production Ready
- [ ] Comprehensive testing across target browsers
- [ ] Performance optimization complete
- [ ] Accessibility audit and fixes
- [ ] Documentation complete
- [ ] Deployment to GitHub Pages
- [ ] Public announcement

---

## Breaking Changes Log

### 2025-12-13
- **Layout:** Fixed to 375px × 620px, removed responsive behavior
- **Reason:** Simplification, mobile-only focus

### 2025-12-12
- **Import:** Changed to ES module with WebLLM import
- **Reason:** Required for WebLLM integration
- **Migration:** Must serve via HTTP server, update script tag to type="module"

---

## Performance Improvements

### 2025-12-13
- Reduced container padding from 16-24px to 12px (memory savings)
- Optimized drawer with GPU acceleration
- Added will-change properties for animations

### 2025-12-12
- Implemented requestAnimationFrame for scrolling
- Added message pruning system
- Memory monitoring with configurable thresholds
- Lazy loading of accessibility fonts

---

## Known Issues

### Current
- [ ] First model load takes 1-2 minutes (unavoidable, large download)
- [ ] Performance warning may trigger on slower devices (tuning needed)
- [ ] Accessibility mode font loading not optimized

### Resolved
- [x] CORS errors with file:// protocol → Fixed: Use HTTP server
- [x] Model selection UI complexity → Fixed: Auto-load single model
- [x] Responsive breakpoints maintenance → Fixed: Removed, mobile-only

---

## Credits & Attribution

- **WebLLM:** MLC AI Project (MIT License)
- **Phi-3.5-mini:** Microsoft (MIT License)
- **Young Serif Font:** Google Fonts (OFL)
- **Work Sans Font:** Google Fonts (OFL)
- **OpenDyslexic Font:** (Bitstream Vera License)
