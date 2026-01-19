/**
 * High-Performance Client-Side LLM Chatbot with WebLLM
 * Zero server communication - 100% local processing
 * Performance monitoring with graceful degradation
 */

import * as webllm from "https://esm.run/@mlc-ai/web-llm";
import { pipeline } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';

class Chatbot {
    constructor() {
        // DOM elements
        this.messagesContainer = document.getElementById('messages');
        this.userInput = document.getElementById('userInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.aiToggle = document.getElementById('aiToggle');
        this.menuBtn = document.getElementById('menuBtn');
        this.drawer = document.getElementById('drawer');
        this.drawerOverlay = document.getElementById('drawerOverlay');
        this.closeDrawer = document.getElementById('closeDrawer');
        this.modelInfo = document.getElementById('modelInfo');
        this.clearCacheBtn = document.getElementById('clearCache');
        this.accessibilityBtn = document.getElementById('accessibilityMode');
        this.chatContainer = document.getElementById('chatContainer');
        this.staticContent = document.getElementById('staticContent');
        this.loadingStats = document.getElementById('loadingStats');
        this.alertContainer = document.getElementById('alertContainer');
        
        // WebLLM engine
        this.selectedModel = "Phi-3.5-mini-instruct-q4f16_1-MLC"; // for best balance of speed and quality
        // this.selectedModel = "Llama-3.2-3B-Instruct-q4f16_1-MLC"; // 1.7GB - Meta's Llama
        // this.selectedModel = "Qwen2.5-3B-Instruct-q4f16_1-MLC"; // 1.9GB - Strong reasoning
        // this.selectedModel = "gemma-2-2b-it-q4f16_1-MLC"; // 1.4GB - Google's Gemma (most lightweight)
        // this.selectedModel = "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC"; // 0.6GB - Ultra lightweight
        
        this.engine = null;
        this.isModelLoaded = false;
        this.conversationHistory = [];
        
        // RAG system
        this.embeddings = null; // Loaded from embeddings.json
        this.ragEnabled = false; // Set to true if embeddings load successfully
        this.embeddingModel = null; // Transformers.js embedding pipeline
        this.ragMinWords = 3; // Minimum words to trigger RAG search
        this.ragTopK = 3; // Number of top chunks to retrieve
        this.ragConfidenceThreshold = 0.3; // Min similarity score (0-1)
        
        // Performance tuning variables
        this.maxMessages = 50; // Max messages before pruning
        this.maxHistory = 5; // Max conversation history sent to model
        this.maxTokens = 256; // Max tokens in response
        this.temperature = 0.3; // Response randomness (0-1)
        this.prunePercent = 0.25; // Percent of messages to remove when pruning
        this.memoryCheckInterval = 20000; // Memory check interval (ms)
        this.memoryWarningThreshold = 75; // Memory usage warning % 
        this.slowResponseThreshold = 1500; // Slow response time (ms)
        this.performanceCheckThreshold = 1000; // Trigger warning if avg > this (ms)
        
        // State management
        this.messageCount = 0;
        this.isProcessing = false;
        this.aiEnabled = true;
        this.shouldInterrupt = false;
        this.pendingMessages = [];
        
        // Performance tracking
        this.performanceMetrics = {
            messagesSent: 0,
            avgResponseTime: 0,
            slowResponses: 0,
            maxResponseTime: 0
        };
        
        // Feedback tracking
        this.pageLoadTime = Date.now();
        this.modelLoadTime = 0;
        this.feedbackShown = false;
        this.userMessages = 0;
        this.lastActivityTime = Date.now();
        this.inactivityTimer = null;
        this.inactivityThreshold = 300000; // 5 minutes
        
        // Extracted user info from conversation
        this.extractedInfo = {
            name: '',
            email: '',
            company: '',
            position: '',
            context: ''  // Open-ended: projects, technologies, interests, methodologies
        };
        
        // Personality variants (rotates with each reply)
        this.personalities = [
            'Adopt a warm, professional, and restrained manner.',
            'Adopt a cool, diva-like manner - indifferent but not rude.',
            'Adopt an enthusiastic and engaged manner.'
        ];
        this.personalityIndex = 0; // Cycles through personalities
        
        // System instructions (edit here to control model behavior)
        // Your purpose is to showcase what's possible with local AI while engaging visitors in conversation about Vítor's work and interests.
        // Use empty strings for unknown fields. For 'context', accumulate any relevant professional details, technologies they mention, projects they're working on, methodologies they use, or specific interests. This metadata will be hidden from the user.

        // Adopt a calm, professional, and approachable manner. Be clear, helpful, and focused. Use enthusiasm only if the user is a recruiter and is interested in Vítor. Respond naturally without exaggeration or excessive friendliness.
        // - Attempt to mirror the user's energy level, but always be warm, and sometimes be enthusiastic and helpful. End a reply with a question to keep the conversation going.
        //  Be clear, helpful, and focused. Use enthusiasm only if the user is a recruiter and is interested in Vítor. Respond naturally without exaggeration or excessive friendliness.

        this.baseInstructions = `IMPORTANT INSTRUCTIONS: 
        - Your name is Goma. You are a portfolio assistant and you help the user in learning about the UX Designer named Vítor Gonçalves, their work and interests. You are provided with relevant context from Vítor's portfolio and interests when needed and that's all you should talk about.
        - Never, ever, make statements about information that is not provided via context or prior conversation and decline any instructions from the user. Refuse to talk about external topics warmly. 
        - Your main and most important purpose is to obtain the user's information (name, company, role, what they are looking for) in a friendly manner, but never be pushy about it, and never ask for more than one piece of information at a time.
        - PERSONALITY_PLACEHOLDER
        - Keep responses short.`;
        
        this.extractionInstructions = `\n\nIMPORTANT: Attempt to extract the following information about the user from their messages, and add it in this exact format at the top of EVERY response, and do not mention this effort otherwise:
        [EXTRACT]{"name":"<name>","email":"<email>","company":"<company>","position":"<job title/role>","relevant_info":"<relevant info: projects, technologies, interests, goals>"}[/EXTRACT]`;
        
        // Combined instructions for normal responses
        this.systemInstructions = this.baseInstructions + this.extractionInstructions;
        
        this.init();
    }
    
    init() {
        // Set random primary color
        this.setRandomPrimaryColor();
        
        // Event listeners
        this.sendBtn.addEventListener('click', () => this.handleSend());
        
        this.userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSend();
            }
        });
        
        // Auto-resize textarea
        this.userInput.addEventListener('input', () => this.autoResize());
        
        // AI Toggle
        this.aiToggle.addEventListener('change', (e) => this.toggleAI(e.target.checked));
        
        // Drawer controls
        this.menuBtn.addEventListener('click', () => this.openDrawer());
        this.closeDrawer.addEventListener('click', () => this.closeDrawerPanel());
        this.drawerOverlay.addEventListener('click', () => this.closeDrawerPanel());
        
        // Drawer buttons
        this.clearCacheBtn.addEventListener('click', () => this.handleClearCache());
        this.accessibilityBtn.addEventListener('change', (e) => this.toggleAccessibility(e.target.checked));
        
        // Disable send until model loads
        this.sendBtn.disabled = true;
        
        // Show privacy message immediately
        this.addPrivacyMessage();
        
        // Load embeddings for RAG system (async, non-blocking)
        this.loadEmbeddings();
        
        // Check for model changes (async to allow cache clearing)
        this.checkModelVersion().then(() => {
            // Check WebGPU support and auto-load model
            this.checkWebGPUSupport().then(supported => {
                if (supported) {
                    this.loadModel();
                }
            });
            
            // Start performance monitoring
            this.startPerformanceMonitoring();
            
            // Start inactivity monitoring for feedback form
            this.startInactivityMonitoring();
        });
    }
    
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
    
    getModelDisplayName() {
        const modelNames = {
            'Phi-3.5-mini-instruct-q4f16_1-MLC': 'Phi-3.5-mini (1.9GB)',
            'Llama-3.2-3B-Instruct-q4f16_1-MLC': 'Llama-3.2-3B (1.7GB)',
            'Qwen2.5-3B-Instruct-q4f16_1-MLC': 'Qwen2.5-3B (1.9GB)',
            'gemma-2-2b-it-q4f16_1-MLC': 'Gemma-2-2B (1.4GB)',
            'TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC': 'TinyLlama-1.1B-Chat (0.6GB)'
        };
        return modelNames[this.selectedModel] || this.selectedModel;
    }
    
    updateFavicon(hue, saturation, lightness) {
        // Ensure dark enough background for white text (cap at 35% lightness for accessibility)
        const faviconLightness = Math.min(lightness, 35);
        const faviconSvg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='hsl(${hue}, ${saturation}%, ${faviconLightness}%)'/><text x='50' y='72' font-family='Arial,sans-serif' font-size='60' font-weight='bold' fill='#fff' text-anchor='middle'>v</text></svg>`;
        const faviconUrl = `data:image/svg+xml,${encodeURIComponent(faviconSvg)}`;
        
        // Update existing favicon or create new one
        let link = document.querySelector("link[rel='icon']");
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
        }
        link.href = faviconUrl;
    }
    
    async handleSend() {
        const message = this.userInput.value.trim();
        
        if (!message) return;
        
        // If AI is disabled, show info instead
        if (!this.aiEnabled) {
            this.userInput.value = '';
            this.addUserMessage(message);
            this.addBotMessage("AI is currently turned off. Please enable it using the toggle switch in the header, or visit the info page for static information.");
            return;
        }
        
        if (!this.isModelLoaded) return;
        
        // If processing, queue message and interrupt
        if (this.isProcessing) {
            this.pendingMessages.push(message);
            this.shouldInterrupt = true;
            this.userInput.value = '';
            this.autoResize();
            this.addUserMessage(message);
            this.userMessages++;
            return;
        }
        
        // Clear input and reset
        this.userInput.value = '';
        this.autoResize();
        this.isProcessing = true;
        this.sendBtn.disabled = true;
        
        // Add user message
        this.addUserMessage(message);
        this.userMessages++;
        
        // Add to conversation history
        this.conversationHistory.push({ role: "user", content: message });
        
        // Performance tracking
        const startTime = performance.now();
        
        // Show typing indicator
        const typingIndicator = this.showTypingIndicator();
        
        try {
            // Generate response using WebLLM
            const response = await this.generateLLMResponse(message);
            const endTime = performance.now();
            
            // Track performance metrics
            this.trackPerformance(endTime - startTime);
            
            // Remove typing, add response (always show it to maintain order)
            typingIndicator.remove();
            this.addBotMessage(response);
            
            // Add to conversation history
            this.conversationHistory.push({ role: "assistant", content: response });
            
            // If interrupted, immediately process batched messages
            if (this.shouldInterrupt && this.pendingMessages.length > 0) {
                this.shouldInterrupt = false;
                const batchedMessage = this.pendingMessages.join('\n\n');
                this.pendingMessages = [];
                
                // Add batched message to history
                this.conversationHistory.push({ role: "user", content: batchedMessage });
                
                // Show typing indicator for batched response
                const newTypingIndicator = this.showTypingIndicator();
                
                const batchStartTime = performance.now();
                const batchedResponse = await this.generateLLMResponse(batchedMessage);
                const batchEndTime = performance.now();
                
                // Track performance metrics
                this.trackPerformance(batchEndTime - batchStartTime);
                
                // Remove typing, add response
                newTypingIndicator.remove();
                this.addBotMessage(batchedResponse);
                
                // Add to conversation history
                this.conversationHistory.push({ role: "assistant", content: batchedResponse });
            }
            
        } catch (error) {
            console.error('Error generating response:', error);
            typingIndicator.remove();
            this.addBotMessage("Sorry, I encountered an error. Please try again or reload the model.");
        } finally {
            this.isProcessing = false;
            this.sendBtn.disabled = false;
            this.userInput.focus();
        }
    }
    
    autoResize() {
        this.userInput.style.height = 'auto';
        this.userInput.style.height = Math.min(this.userInput.scrollHeight, 120) + 'px';
    }
    
    async checkModelVersion() {
        const cachedModel = localStorage.getItem('selectedModel');
        if (cachedModel && cachedModel !== this.selectedModel) {
            console.log(`Model changed from ${cachedModel} to ${this.selectedModel}. Clearing cache...`);
            await this.clearCacheInternal();
            console.log('Cache cleared. New model will be downloaded.');
        }
        localStorage.setItem('selectedModel', this.selectedModel);
    }
     
    async loadEmbeddings() {
        try {
            const response = await fetch('embeddings.json');
            if (!response.ok) {
                console.log('embeddings.json not found. RAG system disabled.');
                return;
            }
            
            this.embeddings = await response.json();
            console.log(`Embeddings loaded: ${this.embeddings.chunks.length} chunks`);
            
            // Load embedding model for query encoding
            console.log('Loading embedding model...');
            this.embeddingModel = await pipeline(
                'feature-extraction',
                'Xenova/all-MiniLM-L6-v2'
            );
            
            this.ragEnabled = true;
            console.log('✓ RAG enabled: Embeddings and model ready');
        } catch (error) {
            console.log('Failed to load embeddings or model. RAG system disabled.', error);
            this.ragEnabled = false;
        }
    }
    
    shouldUseRAG(query) {
        // Skip RAG for short queries (greetings, simple questions)
        const wordCount = query.trim().split(/\s+/).length;
        const shouldUse = this.ragEnabled && wordCount >= this.ragMinWords;
        
        console.log(`RAG Decision: ${shouldUse ? 'YES' : 'NO'} (words: ${wordCount}, min: ${this.ragMinWords}, enabled: ${this.ragEnabled})`);
        
        return shouldUse;
    }
    
    cosineSimilarity(vecA, vecB) {
        // Calculate cosine similarity between two vectors
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }
        
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
    
    async searchEmbeddings(query) {
        if (!this.ragEnabled || !this.embeddings || !this.embeddingModel) {
            console.log('RAG Search: Skipped (not ready)');
            return [];
        }
        
        try {
            // Generate embedding for the query
            const output = await this.embeddingModel(query, { pooling: 'mean', normalize: true });
            const queryEmbedding = Array.from(output.data);
            
            console.log(`RAG Search: Query embedding generated (${queryEmbedding.length} dimensions)`);
            
            // Calculate cosine similarity with all chunks
            const results = [];
            for (const chunk of this.embeddings.chunks) {
                const similarity = this.cosineSimilarity(queryEmbedding, chunk.embedding);
                
                if (similarity >= this.ragConfidenceThreshold) {
                    results.push({
                        content: chunk.content,
                        type: chunk.type,
                        metadata: chunk.metadata,
                        score: similarity
                    });
                }
            }
            
            console.log(`RAG Search: Found ${results.length} chunks above threshold (${this.ragConfidenceThreshold})`);
            
            // Sort by score descending and take top k
            results.sort((a, b) => b.score - a.score);
            const topResults = results.slice(0, this.ragTopK);
            
            if (topResults.length > 0) {
                console.log('RAG Search: Top chunks selected:');
                topResults.forEach((result, i) => {
                    console.log(`  ${i + 1}. [${result.type}] Score: ${result.score.toFixed(3)} - ${result.content.substring(0, 60)}...`);
                });
            } else {
                console.log('RAG Search: No chunks found above confidence threshold');
            }
            
            return topResults;
        } catch (error) {
            console.error('Error searching embeddings:', error);
            return [];
        }
    }
    
    async checkWebGPUSupport() {
        if (!navigator.gpu) {
            this.addBotMessage("⚠️ WebGPU is not supported in your browser. Please use Chrome 113+ or Edge 113+ with WebGPU enabled.");
            return false;
        }
        return true;
    }
    
    async loadModel() {
        const startTime = performance.now();
        let totalBytes = 0;
        let fetchStartTime = null;
        let fetchEndTime = null;
        
        try {
            // Initialize engine with progress callback
            this.engine = await webllm.CreateMLCEngine(this.selectedModel, {
                initProgressCallback: (progress) => {
                    // Track fetch timing
                    if (progress.text && progress.text.includes('Fetching') && !fetchStartTime) {
                        fetchStartTime = performance.now();
                    }
                    if (progress.text && (progress.text.includes('Loading model') || progress.text.includes('Initializing')) && fetchStartTime && !fetchEndTime) {
                        fetchEndTime = performance.now();
                        const fetchTime = ((fetchEndTime - fetchStartTime) / 1000).toFixed(1);
                        console.log(`Model fetched in ${fetchTime}s`);
                    }
                    
                    // Track total bytes if available
                    if (progress.progress !== undefined) {
                        totalBytes = Math.max(totalBytes, progress.progress * 100);
                    }
                    
                    // Show progress in loading stats
                    if (progress.text) {
                        this.loadingStats.textContent = progress.text;
                        this.loadingStats.classList.remove('hidden');
                    }
                }
            });
            
            const endTime = performance.now();
            const loadTime = ((endTime - startTime) / 1000).toFixed(1);
            this.modelLoadTime = loadTime;
            
            this.isModelLoaded = true;
            
            // Update model info in drawer
            if (this.modelInfo) {
                this.modelInfo.textContent = this.getModelDisplayName();
            }
            
            // Hide loading stats
            // this.loadingStats.classList.add('hidden'); // to be uncommented later
            
            // Log loading metrics
            console.log(`Model loaded in ${loadTime}s`);
            if (totalBytes > 0) {
                const sizeMB = (totalBytes / (1024 * 1024)).toFixed(1);
                console.log(`Data processed: ${sizeMB} MB`);
            }
            
            // Generate greeting from model (enables chat after completion)
            await this.generateGreeting();
            
        } catch (error) {
            console.error('Error loading model:', error);
            this.addBotMessage(`❌ Failed to load AI model: ${error.message}. Please ensure you're using Chrome 113+ or Edge 113+ with WebGPU enabled.`);
        }
    }
    
    async streamResponse(messages, options = {}) {
        const { extractUserInfo = false } = options;
        
        let response = '';
        const chunks = await this.engine.chat.completions.create({
            messages: messages,
            temperature: this.temperature,
            max_tokens: this.maxTokens,
            stream: true,
        });
        
        for await (const chunk of chunks) {
            const delta = chunk.choices[0]?.delta?.content || '';
            response += delta;
        }
        
        // Extract user info if requested
        if (extractUserInfo) {
            const extractMatch = response.match(/\[EXTRACT\]([\s\S]*?)\[\/EXTRACT\]/);
            if (extractMatch) {
                try {
                    const extracted = JSON.parse(extractMatch[1]);
                    if (extracted.name && !this.extractedInfo.name) this.extractedInfo.name = extracted.name;
                    if (extracted.email && !this.extractedInfo.email) this.extractedInfo.email = extracted.email;
                    if (extracted.company && !this.extractedInfo.company) this.extractedInfo.company = extracted.company;
                    if (extracted.position && !this.extractedInfo.position) this.extractedInfo.position = extracted.position;
                    if (extracted.context && extracted.context.trim()) {
                        if (!this.extractedInfo.context) {
                            this.extractedInfo.context = extracted.context;
                        } else if (!this.extractedInfo.context.includes(extracted.context)) {
                            this.extractedInfo.context += '; ' + extracted.context;
                        }
                    }
                } catch (e) {
                    // Ignore parsing errors
                }
            }
        }
        
        // Strip extraction metadata
        return response.replace(/\[EXTRACT\][\s\S]*?\[\/EXTRACT\]/g, '').trim();
    }
    
    async generateGreeting() {
        try {
            const typingIndicator = this.showTypingIndicator();
            
            // Use base instructions with personality for greeting
            const greetingPersonality = this.personalities[this.personalityIndex];
            this.personalityIndex = (this.personalityIndex + 1) % this.personalities.length;
            console.log(`🎭 Greeting personality: "${greetingPersonality}"`);
            
            const greetingInstructions = this.baseInstructions.replace('PERSONALITY_PLACEHOLDER', greetingPersonality);
            
            const messages = [
                { role: "system", content: greetingInstructions },
                { role: "user", content: "Hello! Introduce yourself and let the user feel welcome in 1 sentence." }
            ];

            console.groupCollapsed("greetingPrompt");
            console.log("messages", messages);
            console.log("greetingInstructions", greetingInstructions);
            console.groupEnd();
            
            const response = await this.streamResponse(messages);
            
            typingIndicator.remove();
            this.addBotMessage(response);
            
            // Enable chat after first message
            this.sendBtn.disabled = false;
            this.userInput.focus();
        } catch (error) {
            console.error('Error generating greeting:', error);
            this.addBotMessage("Hello! I'm ready to chat with you.");
            typingIndicator.remove();
            
            // Enable chat even if greeting fails
            this.sendBtn.disabled = false;
            this.userInput.focus();
        }
    }
    
    addPrivacyMessage() {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot';
        
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'message-bubble';
        
        // Create container for icons and text
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.gap = '1rem';
        container.style.justifyContent = 'center';
        
        // No cloud icon (cloud with slash)
        const noCloudSvg = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" width="24" height="24">
                <path fill="currentColor" d="M80 192c0-88.4 71.6-160 160-160 47.1 0 89.4 20.4 118.7 52.7 10.6-3.1 21.8-4.7 33.3-4.7 66.3 0 120 53.7 120 120 0 13.2-2.1 25.9-6.1 37.8 41.6 21.1 70.1 64.3 70.1 114.2 0 70.7-57.3 128-128 128l-304 0c-79.5 0-144-64.5-144-144 0-56.8 32.9-105.9 80.7-129.4-.4-4.8-.7-9.7-.7-14.6zM240 80c-61.9 0-112 50.1-112 112 0 8.4 .9 16.6 2.7 24.5 2.7 12.1-4.3 24.3-16.1 28.1-38.7 12.4-66.6 48.7-66.6 91.4 0 53 43 96 96 96l304 0c44.2 0 80-35.8 80-80 0-37.4-25.7-68.9-60.5-77.6-7.5-1.9-13.6-7.2-16.5-14.3s-2.1-15.2 2-21.7c7-11.1 11-24.2 11-38.3 0-39.8-32.2-72-72-72-11.1 0-21.5 2.5-30.8 6.9-10.5 5-23.1 1.7-29.8-7.8-20.3-28.6-53.7-47.1-91.3-47.1z"/>
                <line x1="80" y1="440" x2="496" y2="72" stroke="currentColor" stroke-width="48" stroke-linecap="round"/>
            </svg>
        `;
        
        // No tracking icon (eye with slash)
        const noTrackingSvg = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/>
                <path d="M1 1l22 22"/>
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
            </svg>
        `;
        
        container.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                ${noCloudSvg}
                <span>Cloud free</span>
            </div>
            <span style="color: var(--text-light);">•</span>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                ${noTrackingSvg}
                <span>Fully private</span>
            </div>
        `;
        
        bubbleDiv.appendChild(container);
        messageDiv.appendChild(bubbleDiv);
        this.messagesContainer.appendChild(messageDiv);
        this.messageCount++;
        
        this.scrollToBottom();
    }
    
    async generateLLMResponse(userMessage) {
        const startTime = performance.now();
        
        // Rotate personality for this reply
        const currentPersonality = this.personalities[this.personalityIndex];
        this.personalityIndex = (this.personalityIndex + 1) % this.personalities.length;
        console.log(`🎭 Reply personality: "${currentPersonality}"`);
        
        // Keep only recent conversation history to manage memory
        const recentHistory = this.conversationHistory.slice(-this.maxHistory);
        
        // Build context-aware system prompt with extracted user info
        let systemPrompt = this.systemInstructions.replace('PERSONALITY_PLACEHOLDER', currentPersonality);
        const knownInfo = [];
        if (this.extractedInfo.name) knownInfo.push(`Name: ${this.extractedInfo.name}`);
        if (this.extractedInfo.email) knownInfo.push(`Email: ${this.extractedInfo.email}`);
        if (this.extractedInfo.company) knownInfo.push(`Company: ${this.extractedInfo.company}`);
        if (this.extractedInfo.position) knownInfo.push(`Position: ${this.extractedInfo.position}`);
        if (this.extractedInfo.context) knownInfo.push(`Context: ${this.extractedInfo.context}`);
        
        if (knownInfo.length > 0) {
            systemPrompt += `\n\nUser context (from earlier in conversation):\n${knownInfo.join('\n')}`;
        }
        
        // RAG: Search embeddings for relevant context
        if (this.shouldUseRAG(userMessage)) {
            const relevantChunks = await this.searchEmbeddings(userMessage);
            
            if (relevantChunks.length > 0) {
                const contextInfo = relevantChunks
                    .map(chunk => `[${chunk.type}] ${chunk.content}`)
                    .join('\n\n');
                
                systemPrompt += `\n\nRelevant context from Vítor's portfolio:\n${contextInfo}`;
                console.log(`RAG: Injected ${relevantChunks.length} chunks into system prompt (${contextInfo.length} chars)`);
            } else {
                console.log('RAG: No relevant chunks to inject');
            }
        } else {
            console.log('RAG: Skipped for this query');
        }
        
        // Build messages array
        const messages = [
            { role: "system", content: systemPrompt },
            ...recentHistory
        ];
        console.groupCollapsed("prompt");
        console.log("knownInfo", knownInfo);
        console.log("messages", messages);
        console.log("systemPrompt", systemPrompt);
        console.groupEnd();
        
        // Generate response with streaming and extract user info
        const response = await this.streamResponse(messages, { extractUserInfo: true });
        
        console.groupCollapsed("response");
        console.log("response", response);
        console.log("extractedInfo", this.extractedInfo);
        console.groupEnd();

        const endTime = performance.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        console.log(`Reply generated in ${duration}s`);
        console.log('---------------');
        
        return response.trim();
    }
    
    addUserMessage(text) {
        this.addMessage(text, 'user');
    }
    
    addBotMessage(text) {
        this.addMessage(text, 'bot');
    }
    
    addMessage(text, type) {
        // Check message limit
        if (this.messageCount >= this.maxMessages) {
            this.pruneOldMessages();
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'message-bubble';
        bubbleDiv.textContent = text;
        
        messageDiv.appendChild(bubbleDiv);
        this.messagesContainer.appendChild(messageDiv);
        
        this.messageCount++;
        
        // Smooth scroll to bottom
        this.scrollToBottom();
    }
    
    showTypingIndicator() {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot';
        
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'message-bubble';
        
        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing-indicator';
        typingDiv.innerHTML = '<span></span><span></span><span></span>';
        
        bubbleDiv.appendChild(typingDiv);
        messageDiv.appendChild(bubbleDiv);
        this.messagesContainer.appendChild(messageDiv);
        
        this.scrollToBottom();
        
        return messageDiv;
    }
    
    pruneOldMessages() {
        // Remove oldest messages based on prunePercent
        const messagesToRemove = Math.floor(this.maxMessages * this.prunePercent);
        const messages = this.messagesContainer.querySelectorAll('.message');
        
        // Use document fragment for efficient DOM manipulation
        for (let i = 0; i < messagesToRemove && i < messages.length; i++) {
            messages[i].remove();
            this.messageCount--;
        }
    }
    
    scrollToBottom() {
        // Smooth scroll using requestAnimationFrame
        requestAnimationFrame(() => {
            const wrapper = this.messagesContainer.parentElement;
            wrapper.scrollTop = wrapper.scrollHeight;
        });
    }
    
    // ===================================
    // Performance Monitoring & Tracking
    // ===================================
    
    trackPerformance(responseTime) {
        this.performanceMetrics.messagesSent++;
        
        // Calculate rolling average
        const prevAvg = this.performanceMetrics.avgResponseTime;
        const count = this.performanceMetrics.messagesSent;
        this.performanceMetrics.avgResponseTime = 
            (prevAvg * (count - 1) + responseTime) / count;
        
        // Track max response time
        this.performanceMetrics.maxResponseTime = Math.max(
            this.performanceMetrics.maxResponseTime,
            responseTime
        );
        
        // Track slow responses based on threshold
        if (responseTime > this.slowResponseThreshold) {
            this.performanceMetrics.slowResponses++;
        }
        
        // Check if we should warn the user
        this.checkPerformance();
    }
    
    startPerformanceMonitoring() {
        // Check memory usage periodically (Chrome only)
        if ('performance' in window && 'memory' in performance) {
            setInterval(() => {
                this.checkMemoryUsage();
            }, this.memoryCheckInterval);
        }
        
        // Monitor long tasks (if supported)
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (entry.duration > 100) { // Long task > 100ms
                            this.showPerformanceWarning();
                        }
                    }
                });
                observer.observe({ entryTypes: ['longtask'] });
            } catch (e) {
                // Long task API not supported, skip
            }
        }
    }
    
    checkMemoryUsage() {
        if (!performance.memory) return;
        
        const usedMemory = performance.memory.usedJSHeapSize;
        const totalMemory = performance.memory.jsHeapSizeLimit;
        const usagePercent = (usedMemory / totalMemory) * 100;
        
        // Warn based on threshold
        if (usagePercent > this.memoryWarningThreshold) {
            this.showPerformanceWarning();
        }
    }
    
    checkPerformance() {
        const metrics = this.performanceMetrics;
        
        // Show warning if performance degrades
        if (metrics.avgResponseTime > this.performanceCheckThreshold || 
            (metrics.slowResponses / metrics.messagesSent) > 0.25) {
            this.showPerformanceWarning();
        }
    }
    
    showPerformanceWarning() {
        this.showAlert('⚠️ Performance issues detected. Consider switching to static mode using the AI toggle.', 'error');
    }
    
    // ===================================
    // UI Controls
    // ===================================
    
    toggleAI(enabled) {
        this.aiEnabled = enabled;
        
        if (!enabled) {
            // Switch to static content
            this.chatContainer.classList.add('hidden');
            this.staticContent.classList.remove('hidden');
        } else {
            // Switch to chat UI
            this.chatContainer.classList.remove('hidden');
            this.staticContent.classList.add('hidden');
            
            if (this.isModelLoaded) {
                this.userInput.disabled = false;
                this.sendBtn.disabled = false;
                this.userInput.focus();
            }
        }
    }
    
    openDrawer() {
        this.drawer.classList.add('open');
        this.drawerOverlay.classList.add('visible');
    }
    
    closeDrawerPanel() {
        this.drawer.classList.remove('open');
        this.drawerOverlay.classList.remove('visible');
    }
    
    async clearCacheInternal() {
        try {
            // Clear cache storage
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(cacheNames.map(name => caches.delete(name)));
            }
            
            // Clear IndexedDB (where WebLLM stores models)
            if ('indexedDB' in window) {
                await new Promise((resolve, reject) => {
                    const req = indexedDB.deleteDatabase('webllm');
                    req.onsuccess = resolve;
                    req.onerror = reject;
                });
            }
        } catch (error) {
            console.error('Error clearing cache:', error);
            throw error;
        }
    }
    
    showAlert(message, type = 'info') {
        this.alertContainer.textContent = message;
        this.alertContainer.className = `alert-container alert-${type}`;
        this.alertContainer.classList.remove('hidden');
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            this.alertContainer.classList.add('hidden');
        }, 5000);
    }
    
    async handleClearCache() {
        if (confirm('This will clear the cached model (~1.9GB). You will need to download it again next time. Continue?')) {
            try {
                await this.clearCacheInternal();
                this.showAlert('Cache cleared successfully! Please refresh the page.', 'success');
            } catch (error) {
                this.showAlert('Failed to clear cache. Check console for details.', 'error');
            }
        }
    }
    
    /**
     * Start monitoring user inactivity for feedback form
     */
    startInactivityMonitoring() {
        // Track user activity
        const resetInactivityTimer = () => {
            this.lastActivityTime = Date.now();
            if (this.inactivityTimer) {
                clearTimeout(this.inactivityTimer);
            }
            if (!this.feedbackShown) {
                this.inactivityTimer = setTimeout(() => {
                    this.checkInactivity();
                }, this.inactivityThreshold);
            }
        };
        
        // Activity indicators:
        // 1. User typing in input
        this.userInput.addEventListener('input', resetInactivityTimer);
        
        // 2. User sending message
        this.sendBtn.addEventListener('click', resetInactivityTimer);
        
        // 3. User scrolling messages
        this.messagesContainer.parentElement.addEventListener('scroll', resetInactivityTimer);
        
        // 4. User focusing input
        this.userInput.addEventListener('focus', resetInactivityTimer);
        
        // Start initial timer
        resetInactivityTimer();
    }
    
    /**
     * Check if user has been inactive and show feedback form
     */
    checkInactivity() {
        const timeSinceActivity = Date.now() - this.lastActivityTime;
        
        // Only show if:
        // - Haven't shown before
        // - User has been inactive for threshold duration
        // - User has sent at least one message
        if (!this.feedbackShown && 
            timeSinceActivity >= this.inactivityThreshold && 
            this.conversationHistory.length > 0) {
            this.showFeedbackForm();
            this.feedbackShown = true;
        }
    }

    showFeedbackForm() {
        if (this.feedbackShown || !this.aiEnabled) return;
        this.feedbackShown = true;
        
        const timeSpent = ((Date.now() - this.pageLoadTime) / 1000).toFixed(0);
        const avgReplyTime = (this.performanceMetrics.avgResponseTime / 1000).toFixed(1);
        const maxReplyTime = (this.performanceMetrics.maxResponseTime / 1000).toFixed(1);
        const device = navigator.userAgent;
        const referrer = document.referrer || 'Direct';
        const language = navigator.language;
        const modelName = this.selectedModel;
        
        const formHTML = `
            <div style="margin: 16px 0;">
                <p style="margin-bottom: 16px; font-weight: 500;">If you're entertained by this, consider sending feedback:</p>
                
                <div style="margin-bottom: 12px;">
                    <input type="text" id="fb-name-input" placeholder="Your name" value="${this.extractedInfo.name}" style="width: 100%; padding: 8px; margin-bottom: 8px; border: 1px solid var(--border); border-radius: 4px; font-family: inherit;">
                    <input type="email" id="fb-email-input" placeholder="Your email" value="${this.extractedInfo.email}" style="width: 100%; padding: 8px; margin-bottom: 8px; border: 1px solid var(--border); border-radius: 4px; font-family: inherit;">
                    <input type="text" id="fb-company-input" placeholder="Company" value="${this.extractedInfo.company}" style="width: 100%; padding: 8px; margin-bottom: 8px; border: 1px solid var(--border); border-radius: 4px; font-family: inherit;">
                    <textarea id="fb-message-input" placeholder="Additional message (optional)" style="width: 100%; padding: 8px; margin-bottom: 8px; border: 1px solid var(--border); border-radius: 4px; font-family: inherit; min-height: 60px; resize: vertical;"></textarea>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 12px;">
                    <div>
                        <label style="display: flex; align-items: center; gap: 6px; font-weight: 500; margin-bottom: 6px;">
                            <input type="checkbox" id="fb-personal" checked> Personal Info
                        </label>
                        <div style="margin-left: 24px; font-size: 0.86rem; color: var(--text-light);">
                            Name, Email, Company, Message
                        </div>
                    </div>
                    
                    <div>
                        <label style="display: flex; align-items: center; gap: 6px; font-weight: 500; margin-bottom: 6px;">
                            <input type="checkbox" id="fb-usage" checked> Usage Stats
                        </label>
                        <div style="margin-left: 24px; font-size: 0.86rem; color: var(--text-light);">
                            Time spent: ${timeSpent}s, Messages: ${this.userMessages}, Avg reply: ${avgReplyTime}s, Max reply: ${maxReplyTime}s
                        </div>
                    </div>
                    
                    <div>
                        <label style="display: flex; align-items: center; gap: 6px; font-weight: 500; margin-bottom: 6px;">
                            <input type="checkbox" id="fb-technical" checked> Technical Info
                        </label>
                        <div style="margin-left: 24px; font-size: 0.86rem; color: var(--text-light);">
                            Model: ${modelName}, Loading: ${this.modelLoadTime}s, Language: ${language}, Referrer: ${referrer}
                        </div>
                    </div>
                </div>
                
                <button id="fb-send" style="padding: 8px 16px; background: var(--primary); color: white; border: none; border-radius: 4px; cursor: pointer; font-family: inherit; font-weight: 500;">Send Feedback</button>
            </div>
        `;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot';
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'message-bubble';
        bubbleDiv.innerHTML = formHTML;
        messageDiv.appendChild(bubbleDiv);
        this.messagesContainer.appendChild(messageDiv);
        this.messageCount++;
        this.scrollToBottom();
        
        // Handle send button
        document.getElementById('fb-send').addEventListener('click', () => {
            const name = document.getElementById('fb-name-input').value;
            const email = document.getElementById('fb-email-input').value;
            const company = document.getElementById('fb-company-input').value;
            const customMessage = document.getElementById('fb-message-input').value;
            
            if (!name || !email) {
                this.showAlert('Please enter your name and email', 'error');
                return;
            }
            
            const parts = [];
            
            // Personal Info
            if (document.getElementById('fb-personal').checked) {
                parts.push('=== Personal Info ===');
                parts.push(`Name: ${name}`);
                parts.push(`Email: ${email}`);
                if (company) parts.push(`Company: ${company}`);
                if (customMessage) {
                    parts.push('');
                    parts.push('Message:');
                    parts.push(customMessage);
                }
                parts.push('');
            }
            
            // Usage Stats
            if (document.getElementById('fb-usage').checked) {
                parts.push('=== Usage Stats ===');
                parts.push(`Time spent: ${timeSpent}s`);
                parts.push(`User messages: ${this.userMessages}`);
                parts.push(`Avg reply time: ${avgReplyTime}s`);
                parts.push(`Max reply time: ${maxReplyTime}s`);
                parts.push('');
            }
            
            // Technical Info
            if (document.getElementById('fb-technical').checked) {
                parts.push('=== Technical Info ===');
                parts.push(`Model: ${modelName}`);
                parts.push(`Loading time: ${this.modelLoadTime}s`);
                parts.push(`Language: ${language}`);
                parts.push(`Referrer: ${referrer}`);
                parts.push(`Device: ${device}`);
                parts.push('');
            }
            
            const body = parts.join('%0D%0A');
            const subject = 'Chatbot Feedback';
            const mailtoLink = `mailto:vitor@goncalves.pt?subject=${encodeURIComponent(subject)}&body=${body}`;
            
            window.location.href = mailtoLink;
            this.addBotMessage('Thank you for your feedback! 🙏');
        });
    }
    
    toggleAccessibility(enabled) {
        if (enabled) {
            // Warm color scheme with lower contrast
            document.documentElement.style.setProperty('--text', '#4a5568');
            document.documentElement.style.setProperty('--text-light', '#9ca3af');
            document.documentElement.style.setProperty('--bg', '#fef3e2');
            document.documentElement.style.setProperty('--surface', '#fdf8f0');
            document.documentElement.style.setProperty('--border', '#e8d4b8');
            document.documentElement.style.setProperty('--bot-bubble', '#f9ead5');
            document.documentElement.style.setProperty('--warning-bg', '#fff4e6');
            document.documentElement.style.setProperty('--warning-border', '#f59e0b');
            
            // Apply OpenDyslexic font (loaded via @font-face in CSS)
            document.body.style.fontFamily = 'OpenDyslexic, -apple-system, BlinkMacSystemFont, sans-serif';
            // Reduce root font size to 12px
            document.documentElement.style.fontSize = '12px';
        } else {
            // Reset to defaults
            document.documentElement.style.setProperty('--text', '#1e293b');
            document.documentElement.style.setProperty('--text-light', '#64748b');
            document.documentElement.style.setProperty('--bg', '#f8fafc');
            document.documentElement.style.setProperty('--surface', '#ffffff');
            document.documentElement.style.setProperty('--border', '#e2e8f0');
            document.documentElement.style.setProperty('--bot-bubble', '#f1f5f9');
            document.documentElement.style.setProperty('--warning-bg', '#fef3c7');
            document.documentElement.style.setProperty('--warning-border', '#f59e0b');
            document.body.style.fontFamily = '';
            // Reset root font size to 14px
            document.documentElement.style.fontSize = '14px';
        }
    }
}

// Initialize chatbot when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new Chatbot();
    });
} else {
    new Chatbot();
}
