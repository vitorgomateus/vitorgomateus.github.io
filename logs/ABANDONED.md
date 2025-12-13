# Abandoned Ideas & Rationale

This document tracks features and approaches that were considered but ultimately rejected, along with the reasoning. This helps prevent revisiting dead ends and provides context for future AI assistants.

---

## API-Based LLM Integration
**Rejected:** December 12, 2025  
**Reason:** Violated core privacy requirement. Even with user-provided API keys, this would send data to external servers. Chose WebLLM for 100% local processing instead.

**Context:** Initially considered OpenAI/Anthropic API integration for faster, more powerful responses with no downloads. However, the primary goal is complete privacy, making server-based solutions unacceptable.

---

## Transformers.js (Lighter Models)
**Rejected:** December 12, 2025  
**Reason:** While smaller (100-500MB), the models were significantly slower and lower quality than WebLLM with WebGPU acceleration. Performance testing showed unacceptable response times.

**Context:** Attempted to reduce initial download burden, but user experience suffered. Phi-3.5-mini via WebLLM provides much better quality-to-size ratio with GPU acceleration.

---

## User Model Selection Interface
**Rejected:** December 12, 2025  
**Reason:** Added unnecessary complexity for a proof of concept. Auto-loading a single optimal model (Phi-3.5-mini) provides simpler UX. Alternative models left as comments for easy testing.

**Context:** Initial design had dropdown menu and load button. Simplified to automatic loading with hardcoded optimal choice. Can revisit if project expands beyond POC phase.

---

## Responsive Multi-Breakpoint Design
**Rejected:** December 13, 2025  
**Reason:** Project scope focused on mobile-only interface (375px × 620px). Responsive design adds complexity without value for this POC. Single layout is sufficient.

**Context:** All CSS breakpoints removed. Interface fixed to mobile dimensions regardless of viewport size. Simplifies development and testing.

---

## Server-Side Processing
**Rejected:** December 12, 2025  
**Reason:** Antithetical to privacy goal. All processing must remain client-side.

**Context:** Never seriously considered but worth documenting to prevent future suggestions.

---

## Persistent Conversation Storage
**Deferred:** December 13, 2025  
**Reason:** Requires decision on storage mechanism (localStorage, IndexedDB). Currently not needed for POC. Memory-only conversations are sufficient and avoid complexity.

**Context:** Could be added later if project expands. Would need to handle serialization/deserialization and storage limits.

---

## Streaming Response Display
**Deferred:** December 13, 2025  
**Reason:** WebLLM supports streaming, but displaying tokens as they arrive adds complexity. Current implementation accumulates response then displays complete text. Works well for current token limits (512).

**Context:** Streaming enabled in API call for performance but not reflected in UI. Could improve perceived latency for longer responses if token limit increases.

---

## Multiple Concurrent Conversations
**Out of Scope:** December 13, 2025  
**Reason:** Single conversation thread is sufficient for POC. Managing multiple threads would require significant UI/UX changes and state management complexity.

---

## Pattern-Matching Fallback Without LLM
**Implemented Then Removed:** December 12, 2025  
**Reason:** Original implementation had regex-based responses for when LLM wasn't loaded. Removed because AI toggle + info page provide better fallback UX. Pattern matching responses felt inconsistent with LLM responses.

**Context:** Code removed during WebLLM integration. AI toggle now provides clear on/off state instead of degraded pattern-matching mode.

---

## Desktop-First Layout
**Rejected:** December 13, 2025  
**Reason:** Mobile-first approach better aligns with modern usage patterns and simplifies development. 375px width chosen as iPhone SE baseline.

**Context:** Original CSS had max-width of 900px. Reduced to 375px × 620px to force mobile-only experience.

---

## External CSS Frameworks (Bootstrap, Tailwind)
**Rejected:** December 12, 2025  
**Reason:** Unnecessary overhead for such a simple interface. Custom CSS provides full control and minimal payload (~8KB).

**Context:** Found existing Bootstrap files in `/res` folder but chose not to use them. Custom CSS is sufficient and more performant.

---

## Backend Analytics/Telemetry
**Rejected:** December 12, 2025  
**Reason:** Violates privacy principle. No tracking or data collection of any kind.

**Context:** Worth documenting explicitly to prevent future feature creep.

---

## Notes for Future Development

- If adding features, prioritize those that enhance privacy/performance
- Avoid any features requiring external server communication
- Keep mobile-first mentality
- Performance monitoring is critical - don't remove or weaken it
- Test on resource-constrained devices, not just developer machines
