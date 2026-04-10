# Roadmap (Grouped by Urgency)

## P0 - Critical (Fix now)
### Infrastructure & Automation
- [x] Embedding generation moved to GitHub Actions (`.github/workflows/update-embeddings.yml`).

### Responsive Layout
- [ ] The side drawer gets squished on smaller screens.
- [ ] The side drawer moves the website to the left when it opens, which looks bad.
- [ ] The input bar needs bottom spacing on smaller screens.
### Accessibility
- [ ] Test with a screen reader simulator.

## P1 - High (Core quality and product behavior)
### Navigation
- [ ] Allow navigation behavior, like go back after opening a project and maybe from the experimental feature.
- [ ] Do we have image lightboxes?
### Chatbot Model Quality & Behavior
- [ ] Need better console logs to test and compare models.
- [ ] Need to test and compare Gemma 2 and Qwen3.
- [ ] Need to review chatbot instructions. Qwen3 seems to generate very long incomplete answers and Gemma 2 seems to generate too dry and useless replies, even an empty reply. Qwen also seems to expose `<thinking>` strings.

### Chatbot UX (Suggestions & Media)
- [ ] Need to review message suggestions.
- [ ] Need to make the suggestions look more different from sent messages.

### Architecture, Performance & Diagnostics
- [ ] Can we detect the memory or CPU capacity of the browser and tell users if their system will withstand the model?
- [ ] Should I review the embedding or RAG method?

## P2 - Medium (UX polish and design direction)
### Chat Runtime UX
- [ ] Would be better to separate model interaction and user data extraction.
- [ ] Distinction of loaded vs downloaded is still not ideal.
- [ ] Should the bot say something after a long time inactive? Should there be a notification dot/bubble as if the bot is trying to talk to the user when chat is not active?

### Visual Design Direction
- [ ] Website is still looking quite dry and boring.
    - [ ] Contemporary Minimalist with a Trust-Driven Approach, or functional minimalism. The aesthetic leans into subtle sophistication, using restrained color schemes (with occasional accents for calls-to-action), open space, and a focus on content to create an environment that feels modern and reliable, avoiding unnecessary ornamentation in favor of purposeful design. The visual tone is calm and reassuring; it avoids coldness by incorporating subtle warmth in typography and micro-interactions, making the experience feel supportive rather than transactional.
    - [ ] Make the design in glassmorphism style, but keep the current design so I can change one line in code and switch them.
- [ ] Header can be a gradient to a very slightly darker version of the primary color.
- [ ] Better loading animation. AI nowadays uses a floating ethereal bubble, can I parody that? Maybe something that looks like a minimalistic jackpot machine randomizing words. Or just a tired ghost.

### Copy & Brand Details
- [ ] Need something like "If you want to talk about any of these, do reach out!", and also a more interesting console greeting (ASCII art).
- [ ] Can I make my name and the experimental toggle into one?

## P3 - Low (Research and experiments)

### Product Experiments (Placement & Interaction)
- [ ] It would be nice if the user typed "images" and all images showed up.
- [ ] Maybe the chatbot could be at the bottom of the page so after the user finishes scrolling, they come to it. But then we need to change input bar behavior and that might get confusing.
- [ ] Give Goma UI commands like "toggle accessibility".
- [ ] Allow Goma to customize the interface according to conversation or mood.

### Content & Personality
- [ ] Make the bot manner more enthusiastic when the user shares details more interesting to me, and not otherwise.
- [ ] The bot can have this in its toolbelt: "MY pronouns are they/them because I don't have legs, jk. If I was a 'she' you'd perceive me as more efficient, and a 'he' as effective, and I aim to be neither!"
- [ ] Include a body of facts in the data file about the history of language, Portuguese food, and maybe some trivia I hold in my head (not accessible via HTML, only via chatbot).
- [ ] Study creativity methods and make the bot generate creative ideas.

### Metrics, Privacy & Sustainability
- [ ] Should I consider collecting data without explicit user consent? At least performance data.
    - [ ] You can log website interaction to a Google Sheet for free using only JS and Google Apps Script, suitable for simple/low-volume use cases. On Apps Script, check the Referer HTTP header to see if the request originated from your domain. Maybe get your own domain first, but there are likely security concerns. This could be better than mailto.
- [ ] How many AI requests to make this project? How much data center power and emissions?