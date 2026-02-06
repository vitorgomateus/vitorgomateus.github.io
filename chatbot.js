/**
 * AI Chatbot - Experimental Feature
 * Powered by WebLLM (Phi-3.5-mini) running locally in browser
 * CRITICAL: Maintains [EXTRACT]{...}[/EXTRACT] directive for context persistence
 */

import * as webllm from "https://esm.run/@mlc-ai/web-llm";

class ChatbotApp {
    constructor() {
        this.engine = null;
        this.modelLoaded = false;
        this.selectedModel = "Phi-3.5-mini-instruct-q4f16_1-MLC"; // 1.9GB, Microsoft
        this.messages = [];
        this.conversationHistory = [];
        this.maxHistory = 5;
        this.maxTokens = 256;
        this.temperature = 0.3;
        
        // Context extraction
        this.extractedInfo = {
            name: "",
            email: "",
            company: "",
            position: "",
            context: "" // Maps to 'relevant_info' in extraction
        };
        
        // Performance tracking
        this.performanceMetrics = {
            messagesSent: 0,
            responseTimes: [],
            slowResponses: 0,
            maxResponseTime: 0
        };
        
        // Personalities
        this.personalities = [
            { tone: "warm", greeting: "Hello! I'm Goma, Vítor's portfolio assistant. I'm here to help you learn about his work and experience." },
            { tone: "professional", greeting: "Greetings. I'm Goma, and I can provide detailed information about Vítor's professional background and projects." },
            { tone: "enthusiastic", greeting: "Hi there! 😊 I'm Goma! I'd love to tell you all about Vítor's amazing UX design work and projects!" },
            { tone: "friendly", greeting: "Hey! I'm Goma, your friendly guide to Vítor's portfolio. What would you like to know?" },
            { tone: "casual", greeting: "What's up? I'm Goma. Here to chat about Vítor's work. Fire away with any questions!" }
        ];
        
        this.currentPersonality = this.personalities[Math.floor(Math.random() * this.personalities.length)];
        
        this.init();
    }
    
    async init() {
        try {
            this.setupEventListeners();
            this.setupAIToggle();
            this.showWelcomeMessage();
            console.log('[chatbot.js] Initialized');
        } catch (error) {
            console.error('[chatbot.js] Initialization error:', error);
        }
    }
    
    /**
     * Setup AI toggle functionality
     */
    setupAIToggle() {
        const toggle = document.getElementById('aiToggle');
        const staticContent = document.getElementById('staticContent');
        const chatContainer = document.getElementById('chatContainer');
        const searchBar = document.getElementById('search-bar-container');
        
        toggle?.addEventListener('change', (e) => {
            if (e.target.checked) {
                // Switch to chat
                staticContent?.classList.add('hidden');
                searchBar?.style.setProperty('display', 'none');
                chatContainer?.classList.remove('hidden');
                
                // Check WebGPU support
                if (!this.checkWebGPUSupport()) {
                    this.showSystemMessage('WebGPU not supported. Please use Chrome 113+ or Edge 113+.');
                    e.target.checked = false;
                    staticContent?.classList.remove('hidden');
                    searchBar?.style.removeProperty('display');
                    chatContainer?.classList.add('hidden');
                }
            } else {
                // Switch to portfolio
                chatContainer?.classList.add('hidden');
                staticContent?.classList.remove('hidden');
                searchBar?.style.removeProperty('display');
            }
        });
    }
    
    /**
     * Check WebGPU support
     */
    checkWebGPUSupport() {
        if (!navigator.gpu) {
            console.warn('[chatbot.js] WebGPU not supported');
            return false;
        }
        return true;
    }
    
    /**
     * Show welcome message
     */
    showWelcomeMessage() {
        const welcomeMsg = `🎉 Welcome! This chatbot runs 100% locally in your browser using WebLLM and WebGPU.

✅ Zero server calls - complete privacy
✅ No tracking or data collection  
✅ All processing happens on your device

The AI model (~2GB) will be downloaded once and cached for future visits.`;
        
        this.addMessage('system', welcomeMsg);
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        const sendBtn = document.getElementById('sendBtn');
        const userInput = document.getElementById('userInput');
        const clearModelBtn = document.getElementById('clearModelBtn');
        
        // Send message
        sendBtn?.addEventListener('click', () => this.handleSendMessage());
        
        // Enter to send
        userInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSendMessage();
            }
        });
        
        // Auto-resize textarea
        userInput?.addEventListener('input', (e) => {
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
        });
        
        // Clear model cache
        clearModelBtn?.addEventListener('click', () => this.clearModelCache());
    }
    
    /**
     * Handle send message
     */
    async handleSendMessage() {
        const input = document.getElementById('userInput');
        const message = input?.value.trim();
        
        if (!message) return;
        
        // Clear input
        input.value = '';
        input.style.height = 'auto';
        
        // Add user message
        this.addMessage('user', message);
        
        // Clear suggestions
        this.clearSuggestions();
        
        // Load model if not loaded
        if (!this.modelLoaded) {
            const permissionGranted = await this.requestModelPermission();
            if (!permissionGranted) {
                this.addMessage('bot', "No problem! Feel free to explore the portfolio, and let me know if you'd like to chat later.");
                return;
            }
            
            await this.loadModel();
        }
        
        // Generate response
        await this.generateResponse(message);
    }
    
    /**
     * Request permission to download model
     */
    async requestModelPermission() {
        return new Promise((resolve) => {
            const msg = `To chat with me, I need to download an AI model (~2GB) to your device. This is a one-time download and will be cached locally.

Would you like to proceed?`;
            
            this.addMessage('system', msg);
            
            // Add permission buttons as suggestions
            this.showSuggestions([
                { text: 'Yes, download model', action: () => resolve(true) },
                { text: 'No thanks', action: () => resolve(false) }
            ]);
        });
    }
    
    /**
     * Load AI model
     */
    async loadModel() {
        try {
            this.showSystemMessage('Downloading model... This may take a few minutes.');
            this.updateModelStatus('Downloading...');
            
            // Initialize engine with progress callback
            this.engine = await webllm.CreateMLCEngine(
                this.selectedModel,
                {
                    initProgressCallback: (progress) => {
                        console.log('[chatbot.js] Loading progress:', progress);
                        this.updateLoadingProgress(progress);
                    }
                }
            );
            
            this.modelLoaded = true;
            this.updateModelStatus(`Loaded: ${this.selectedModel}`);
            document.getElementById('clearModelBtn')?.classList.remove('hidden');
            
            this.showSystemMessage('Model loaded! Ready to chat.');
            
            // Send greeting
            const greeting = this.currentPersonality.greeting;
            this.addMessage('bot', greeting);
            
            this.showSuggestions([
                { text: "Tell me about Vítor's experience", action: null },
                { text: "What projects has he worked on?", action: null }
            ]);
            
        } catch (error) {
            console.error('[chatbot.js] Model loading error:', error);
            this.showSystemMessage('Failed to load model. Please refresh and try again.');
            this.modelLoaded = false;
        }
    }
    
    /**
     * Update loading progress
     */
    updateLoadingProgress(progress) {
        if (progress.progress !== undefined) {
            const percent = Math.round(progress.progress * 100);
            const text = progress.text || 'Loading...';
            this.showSystemMessage(`${text} ${percent}%`);
        }
    }
    
    /**
     * Update model status in drawer
     */
    updateModelStatus(status) {
        const modelName = document.getElementById('modelName');
        if (modelName) {
            modelName.textContent = status;
        }
    }
    
    /**
     * Clear model cache
     */
    async clearModelCache() {
        if (confirm('This will delete the cached model (~2GB) from your device. You\'ll need to download it again to use the chat feature. Continue?')) {
            try {
                if (this.engine) {
                    await this.engine.unload();
                    this.engine = null;
                }
                
                // Clear IndexedDB cache
                const databases = await indexedDB.databases();
                for (const db of databases) {
                    if (db.name?.includes('webllm') || db.name?.includes('mlc')) {
                        indexedDB.deleteDatabase(db.name);
                    }
                }
                
                this.modelLoaded = false;
                this.updateModelStatus('No model loaded');
                document.getElementById('clearModelBtn')?.classList.add('hidden');
                
                window.portfolioApp?.showAlert('Model cache cleared successfully', 'success');
                window.portfolioApp?.closeDrawer();
            } catch (error) {
                console.error('[chatbot.js] Failed to clear cache:', error);
                window.portfolioApp?.showAlert('Failed to clear cache', 'error');
            }
        }
    }
    
    /**
     * Generate AI response
     */
    async generateResponse(userMessage) {
        const startTime = Date.now();
        
        try {
            // Show typing indicator
            this.showTypingIndicator();
            
            // Build conversation history with extracted context
            const systemPrompt = this.buildSystemPrompt();
            const messages = [
                { role: "system", content: systemPrompt },
                ...this.conversationHistory,
                { role: "user", content: userMessage }
            ];
            
            // Generate response
            const response = await this.engine.chat.completions.create({
                messages: messages,
                temperature: this.temperature,
                max_tokens: this.maxTokens,
                stream: false
            });
            
            const botMessage = response.choices[0]?.message?.content || "I'm having trouble responding right now.";
            
            // Extract info and strip extraction tags
            const cleanMessage = this.extractAndStripInfo(botMessage);
            
            // Hide typing indicator
            this.hideTypingIndicator();
            
            // Add bot message
            this.addMessage('bot', cleanMessage);
            
            // Update conversation history
            this.conversationHistory.push({ role: "user", content: userMessage });
            this.conversationHistory.push({ role: "assistant", content: cleanMessage });
            
            // Limit history to maxHistory turns (2 messages per turn)
            if (this.conversationHistory.length > this.maxHistory * 2) {
                this.conversationHistory = this.conversationHistory.slice(-this.maxHistory * 2);
            }
            
            // Show contextual suggestions
            this.showContextualSuggestions();
            
            // Track performance
            const responseTime = Date.now() - startTime;
            this.trackPerformance(responseTime);
            
            // Message pruning
            this.pruneMessagesIfNeeded();
            
        } catch (error) {
            console.error('[chatbot.js] Response generation error:', error);
            this.hideTypingIndicator();
            this.addMessage('bot', "I apologize, but I encountered an error. Please try again.");
        }
    }
    
    /**
     * Build system prompt with personality and extracted context
     * CRITICAL: Must include [EXTRACT] directive at the end
     */
    buildSystemPrompt() {
        const contextInfo = Object.entries(this.extractedInfo)
            .filter(([key, value]) => value)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
        
        const contextSection = contextInfo ? 
            `\n\nKnown information about the user: ${contextInfo}` : '';
        
        return `You are Goma, a warm and helpful portfolio assistant for Vítor Gonçalves, a UX Designer with 8+ years of experience.

Your purpose:
- Help visitors learn about Vítor's work, projects, skills, and experience
- Be conversational, friendly, and professional
- Keep responses concise (under 100 words)
- Naturally gather user information (name, email, company, role, interests)
- Never be pushy about collecting information
- Only discuss topics related to Vítor's portfolio

Personality: ${this.currentPersonality.tone} and engaging

Available information:
- Vítor is a User-Centered Designer specializing in end-to-end projects
- Master's in HCI, 8+ years experience in UX design, research, and development
- Skills: User research, wireframing, prototyping, usability testing, accessibility
- Recent work: UC Chicago Library (2023-present), various UX projects
- Projects include: Winegrid platform, TimeBank prototype, virtual conference platforms
- Technologies: Figma, Adobe XD, HTML/CSS/JS, Python, Git, GA4, Maze
- Languages: English (fluent), Portuguese (native), Spanish (basic)
- Contact: hello@vitordesign.pt, (224) 933-4283, Chicago IL${contextSection}

CRITICAL: End every response with extraction tags to persist user information:
[EXTRACT]{"name":"<name or empty>","email":"<email or empty>","company":"<company or empty>","position":"<job title or empty>","relevant_info":"<interests, projects, technologies, methodologies mentioned>"}[/EXTRACT]

The extraction should accumulate information across conversation. If you don't have information for a field, leave it empty.`;
    }
    
    /**
     * Extract info from response and strip tags
     * Maps 'relevant_info' to 'context' internally
     */
    extractAndStripInfo(message) {
        const extractRegex = /\[EXTRACT\]([\s\S]*?)\[\/EXTRACT\]/g;
        const match = extractRegex.exec(message);
        
        if (match && match[1]) {
            try {
                const extracted = JSON.parse(match[1].trim());
                
                // Update extracted info (only if new values provided)
                if (extracted.name) this.extractedInfo.name = extracted.name;
                if (extracted.email) this.extractedInfo.email = extracted.email;
                if (extracted.company) this.extractedInfo.company = extracted.company;
                if (extracted.position) this.extractedInfo.position = extracted.position;
                
                // Accumulate context (relevant_info maps to context)
                if (extracted.relevant_info) {
                    if (this.extractedInfo.context) {
                        this.extractedInfo.context += '; ' + extracted.relevant_info;
                    } else {
                        this.extractedInfo.context = extracted.relevant_info;
                    }
                }
                
                console.log('[chatbot.js] Extracted info:', this.extractedInfo);
            } catch (error) {
                console.warn('[chatbot.js] Failed to parse extraction:', error);
            }
        }
        
        // Strip extraction tags
        return message.replace(extractRegex, '').trim();
    }
    
    /**
     * Show contextual suggestions
     */
    showContextualSuggestions() {
        const suggestions = [
            "What are Vítor's key skills?",
            "Tell me about a specific project",
            "How can I contact Vítor?",
            "What's his educational background?",
            "What technologies does he use?"
        ];
        
        // Pick 2 random suggestions
        const shuffled = suggestions.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 2);
        
        this.showSuggestions(selected.map(text => ({ text, action: null })));
    }
    
    /**
     * Show suggestions
     */
    showSuggestions(suggestions) {
        const container = document.getElementById('suggestionsContainer');
        if (!container) return;
        
        container.innerHTML = suggestions.map(({ text, action }) => {
            return `<button class="suggestion-chip" data-suggestion="${text}">${text}</button>`;
        }).join('');
        
        // Add click handlers
        container.querySelectorAll('.suggestion-chip').forEach((chip, index) => {
            chip.addEventListener('click', () => {
                const suggestion = suggestions[index];
                if (suggestion.action) {
                    suggestion.action();
                } else {
                    // Simulate user typing the suggestion
                    document.getElementById('userInput').value = suggestion.text;
                    this.handleSendMessage();
                }
                this.clearSuggestions();
            });
        });
    }
    
    /**
     * Clear suggestions
     */
    clearSuggestions() {
        const container = document.getElementById('suggestionsContainer');
        if (container) {
            container.innerHTML = '';
        }
    }
    
    /**
     * Add message to chat
     */
    addMessage(type, content) {
        const messagesContainer = document.getElementById('messages');
        if (!messagesContainer) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = content;
        
        messageDiv.appendChild(contentDiv);
        messagesContainer.appendChild(messageDiv);
        
        this.messages.push({ type, content, timestamp: Date.now() });
        
        // Smooth scroll to bottom
        this.scrollToBottom();
    }
    
    /**
     * Show system message
     */
    showSystemMessage(content) {
        this.addMessage('system', content);
    }
    
    /**
     * Show typing indicator
     */
    showTypingIndicator() {
        const messagesContainer = document.getElementById('messages');
        if (!messagesContainer) return;
        
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot typing-message';
        typingDiv.innerHTML = `
            <div class="message-content typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        
        messagesContainer.appendChild(typingDiv);
        this.scrollToBottom();
    }
    
    /**
     * Hide typing indicator
     */
    hideTypingIndicator() {
        const typingMessage = document.querySelector('.typing-message');
        typingMessage?.remove();
    }
    
    /**
     * Scroll to bottom smoothly
     */
    scrollToBottom() {
        const wrapper = document.querySelector('.messages-wrapper');
        if (wrapper) {
            setTimeout(() => {
                wrapper.scrollTo({
                    top: wrapper.scrollHeight,
                    behavior: 'smooth'
                });
            }, 100);
        }
    }
    
    /**
     * Track performance metrics
     */
    trackPerformance(responseTime) {
        this.performanceMetrics.messagesSent++;
        this.performanceMetrics.responseTimes.push(responseTime);
        
        if (responseTime > 1500) {
            this.performanceMetrics.slowResponses++;
        }
        
        if (responseTime > this.performanceMetrics.maxResponseTime) {
            this.performanceMetrics.maxResponseTime = responseTime;
        }
        
        // Calculate average
        const avg = this.performanceMetrics.responseTimes.reduce((a, b) => a + b, 0) / 
                    this.performanceMetrics.responseTimes.length;
        
        console.log('[chatbot.js] Performance:', {
            messages: this.performanceMetrics.messagesSent,
            avgResponseTime: Math.round(avg),
            maxResponseTime: this.performanceMetrics.maxResponseTime,
            slowResponses: this.performanceMetrics.slowResponses
        });
        
        // Warn if performance is degrading
        if (avg > 3000) {
            window.portfolioApp?.showAlert('Response times are slow. Consider refreshing the page.', 'warning');
        }
    }
    
    /**
     * Prune messages if over limit
     */
    pruneMessagesIfNeeded() {
        if (this.messages.length >= 50) {
            const messagesToRemove = Math.floor(this.messages.length * 0.25);
            
            // Remove from DOM (keep system messages)
            const messagesContainer = document.getElementById('messages');
            const messageElements = messagesContainer?.querySelectorAll('.message:not(.system)');
            
            for (let i = 0; i < messagesToRemove && i < messageElements.length; i++) {
                messageElements[i].remove();
            }
            
            // Remove from array
            this.messages = this.messages.slice(messagesToRemove);
            
            console.log(`[chatbot.js] Pruned ${messagesToRemove} messages`);
            window.portfolioApp?.showAlert(`Cleared ${messagesToRemove} old messages to maintain performance`, 'info');
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.chatbotApp = new ChatbotApp();
    });
} else {
    window.chatbotApp = new ChatbotApp();
}
