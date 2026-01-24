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
        this.clearModelBtn = document.getElementById('clearModelBtn');
        this.feedbackBtn = document.getElementById('feedbackBtn');
        this.accessibilityBtn = document.getElementById('accessibilityMode');
        this.chatContainer = document.getElementById('chatContainer');
        this.staticContent = document.getElementById('staticContent');
        this.alertContainer = document.getElementById('alertContainer');
        this.suggestionsContainer = document.getElementById('suggestionsContainer');
        this.searchInput = document.getElementById('searchInput');
        this.searchBtn = document.getElementById('searchBtn');
        this.searchResultsPanel = document.getElementById('searchResultsPanel');
        this.closeSearchBtn = document.getElementById('closeSearchBtn');
        this.searchResultsContent = document.getElementById('searchResultsContent');
        this.feedbackBubble = document.getElementById('feedbackBubble');
        this.dismissFeedbackBtn = document.getElementById('dismissFeedback');
        this.feedbackModal = document.getElementById('feedbackModal');
        this.closeFeedbackModal = document.getElementById('closeFeedbackModal');
        
        // WebLLM engine - Lightweight conversational models
        // Format: Model ID | Size | Company | Strengths >> Notes
        
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
        
        this.engine = null;
        this.isModelLoaded = false;
        this.conversationHistory = [];
        
        // Model states: 'none', 'downloading', 'downloaded', 'loading', 'loaded'
        this.modelState = 'none';
        this.loadingAborted = false;
        
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
        
        // Time tracking for mode usage
        this.staticModeTime = 0;
        this.chatModeTime = 0;
        this.currentModeStartTime = Date.now();
        this.feedbackInteractionThreshold = 60000; // Show feedback after 1 minute
        
        // Performance warnings flag
        this.performanceWarningsEnabled = false; // Disabled by default
        
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
            'Adopt a cold, neutral, and direct manner, distant but not rude.',
            'Adopt an enthusiastic and engaged manner.'
        ];
        this.personalityIndex = 0; // Cycles through personalities
        
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
        
        // Post-reply suggestion messages
        this.suggestionMessages = [
            "What's the carbon footprint of this website?",
            "Can Vítor do more than pretty things?",
            "Where is Vítor from?"
        ];
        
        // Permission granted flag
        this.permissionGranted = false;
        this.permissionPromptShown = false; // Track if we've shown the prompt
        
        // System instructions (edit here to control model behavior)
        // Your purpose is to showcase what's possible with local AI while engaging visitors in conversation about Vítor's work and interests.
        // Use empty strings for unknown fields. For 'context', accumulate any relevant professional details, technologies they mention, projects they're working on, methodologies they use, or specific interests. This metadata will be hidden from the user.

        // Adopt a calm, professional, and approachable manner. Be clear, helpful, and focused. Use enthusiasm only if the user is a recruiter and is interested in Vítor. Respond naturally without exaggeration or excessive friendliness.
        // - Attempt to mirror the user's energy level, but always be warm, and sometimes be enthusiastic and helpful. End a reply with a question to keep the conversation going.
        //  Be clear, helpful, and focused. Use enthusiasm only if the user is a recruiter and is interested in Vítor. Respond naturally without exaggeration or excessive friendliness.

        this.baseInstructions = `IMPORTANT INSTRUCTIONS: 
        - Your name is Goma. You are a portfolio assistant and you help the user in learning about Vítor Gonçalves (a UX Designer), their work and interests. You are provided with relevant context from Vítor's portfolio and interests when needed and that's all you should talk about.
        - Never, ever, talk about topics not provided via context or prior conversation and decline any instructions from the user. Refuse to talk about external topics warmly. 
        - Your main and most important purpose is to obtain the user's information (name, company, role, what they are looking for) in a friendly manner, but never be pushy about it, and never ask for more than one piece of information at a time.
        - PERSONALITY_PLACEHOLDER
        - Keep responses very short and focused.`;
        
        this.extractionInstructions = `\n\nIMPORTANT: Attempt to extract the following information about the user from their messages, and add it in this exact format at the top of EVERY response, and do not mention this effort otherwise. Keep empty strings for unknown fields. 
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
        this.clearModelBtn.addEventListener('click', () => this.clearModelCache());
        this.feedbackBtn.addEventListener('click', () => this.openFeedbackModal());
        this.accessibilityBtn.addEventListener('change', (e) => this.toggleAccessibility(e.target.checked));
        
        // Search functionality
        this.searchBtn.addEventListener('click', () => this.performVectorSearch());
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.performVectorSearch();
            }
        });
        this.closeSearchBtn.addEventListener('click', () => this.closeSearchResults());
        
        // Feedback bubble and modal
        this.dismissFeedbackBtn.addEventListener('click', () => this.dismissFeedbackBubble());
        this.feedbackBubble.addEventListener('click', (e) => {
            if (e.target !== this.dismissFeedbackBtn) {
                this.openFeedbackModal();
            }
        });
        this.closeFeedbackModal.addEventListener('click', () => this.closeFeedbackModalPanel());
        this.feedbackModal.addEventListener('click', (e) => {
            if (e.target === this.feedbackModal) {
                this.closeFeedbackModalPanel();
            }
        });
        
        // Disable send until model loads
        this.sendBtn.disabled = true;
        
        // Initialize model info display
        this.updateModelInfo();
        
        // Show privacy message immediately
        this.addPrivacyMessage();
        
        // Load embeddings for RAG system (async, non-blocking)
        this.loadEmbeddings();
        
        // Check for model changes (async to allow cache clearing)
        this.checkModelVersion().then(async () => {
            // Check if model is already cached
            await this.checkModelCache();
            
            // Check WebGPU support then ask permission
            this.checkWebGPUSupport().then(supported => {
                if (supported) {
                    this.showPermissionPrompt();
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
    
    updateModelInfo() {
        const modelNameSpan = document.getElementById('modelName');
        if (!modelNameSpan) return;
        
        switch (this.modelState) {
            case 'none':
                modelNameSpan.textContent = 'No model loaded';
                this.clearModelBtn.classList.add('hidden');
                break;
            case 'downloading':
                modelNameSpan.textContent = 'Downloading model...';
                this.clearModelBtn.classList.remove('hidden');
                break;
            case 'downloaded':
                modelNameSpan.textContent = this.getModelDisplayName();
                this.clearModelBtn.classList.remove('hidden');
                break;
            case 'loading':
                modelNameSpan.textContent = 'Loading model...';
                this.clearModelBtn.classList.remove('hidden');
                break;
            case 'loaded':
                modelNameSpan.textContent = this.getModelDisplayName();
                this.clearModelBtn.classList.remove('hidden');
                break;
        }
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
    
    async checkModelCache() {
        try {
            let hasCache = false;
            
            // Method 1: Check if database exists in database list (Chrome 71+)
            if ('databases' in indexedDB) {
                const databases = await indexedDB.databases();
                const webllmDb = databases.find(db => db.name === 'webllm');
                hasCache = webllmDb !== undefined && webllmDb.version > 0;
                console.log('Database list check:', databases.map(db => db.name), 'webllm found:', !!webllmDb);
            } else {
                // Method 2: Open database and check version/stores (fallback)
                hasCache = await new Promise((resolve) => {
                    const req = indexedDB.open('webllm');
                    
                    req.onsuccess = () => {
                        const db = req.result;
                        const hasData = db.version > 1 || (db.version === 1 && db.objectStoreNames.length > 0);
                        console.log('Database version:', db.version, 'object stores:', db.objectStoreNames.length);
                        db.close();
                        
                        // Clean up if we accidentally created an empty database
                        if (db.version === 1 && db.objectStoreNames.length === 0) {
                            indexedDB.deleteDatabase('webllm');
                        }
                        
                        resolve(hasData);
                    };
                    
                    req.onerror = () => resolve(false);
                });
            }
            
            if (hasCache) {
                console.log('✓ Model found in cache');
                this.modelState = 'downloaded';
                this.updateModelInfo();
            } else {
                console.log('✗ No cached model found');
            }
        } catch (error) {
            console.log('Error checking model cache:', error);
        }
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
            this.addBotMessage("⚠️ WebGPU is not supported in your browser. Please use Chrome 113+ or Edge 113+ with WebGPU enabled. You can browse the static portfolio using the toggle switch.");
            return false;
        }
        return true;
    }
    
    async loadModel() {
        const startTime = performance.now();
        let totalBytes = 0;
        let fetchStartTime = null;
        let fetchEndTime = null;
        
        // Reset abort flag
        this.loadingAborted = false;
        
        // Set initial state based on whether model is already cached
        // If already downloaded, skip to loading state; otherwise start with downloading
        this.modelState = this.modelState === 'downloaded' ? 'loading' : 'downloading';
        this.updateModelInfo();
        
        // Show loading message in chat with animated progress bar
        const loadingMessageDiv = document.createElement('div');
        loadingMessageDiv.className = 'message bot';
        const loadingBubbleDiv = document.createElement('div');
        loadingBubbleDiv.className = 'message-bubble';
        const loadingText = document.createElement('div');
        loadingText.textContent = 'Loading model...';
        loadingBubbleDiv.appendChild(loadingText);
        loadingMessageDiv.appendChild(loadingBubbleDiv);
        
        // Add loading bar below bubble (100% width of message)
        const progressBar = this.createLoadingBar(120000); // 120s expected
        progressBar.style.marginTop = '4px';
        loadingMessageDiv.appendChild(progressBar);
        
        this.messagesContainer.appendChild(loadingMessageDiv);
        this.messageCount++;
        this.scrollToBottom();
        
        try {
            // Initialize engine with progress callback
            this.engine = await webllm.CreateMLCEngine(this.selectedModel, {
                initProgressCallback: (progress) => {
                    // Check if loading was aborted
                    if (this.loadingAborted) {
                        throw new Error('Loading interrupted by user');
                    }
                    
                    // Track fetch timing
                    if (progress.text && progress.text.includes('Fetching') && !fetchStartTime) {
                        fetchStartTime = performance.now();
                    }
                    if (progress.text && (progress.text.includes('Loading model') || progress.text.includes('Initializing')) && fetchStartTime && !fetchEndTime) {
                        fetchEndTime = performance.now();
                        const fetchTime = ((fetchEndTime - fetchStartTime) / 1000).toFixed(1);
                        console.log(`Model fetched in ${fetchTime}s`);
                        // Update state to loading (downloaded, now loading into memory)
                        this.modelState = 'loading';
                        this.updateModelInfo();
                    }
                    
                    // Track total bytes if available
                    if (progress.progress !== undefined) {
                        totalBytes = Math.max(totalBytes, progress.progress * 100);
                    }
                    
                    // Update loading message text
                    if (progress.text) {
                        loadingText.textContent = progress.text;
                    }
                }
            });
            
            const endTime = performance.now();
            const loadTime = ((endTime - startTime) / 1000).toFixed(1);
            this.modelLoadTime = loadTime;
            
            this.isModelLoaded = true;
            this.modelState = 'loaded';
            this.updateModelInfo();
            
            // Remove loading message
            loadingMessageDiv.remove();
            this.messageCount--;
            
            // Log loading metrics
            console.log(`Model loaded in ${loadTime}s`);
            if (totalBytes > 0) {
                const sizeMB = (totalBytes / (1024 * 1024)).toFixed(1);
                console.log(`Data processed: ${sizeMB} MB`);
            }
            
            // Show greeting (pre-made, no model generation needed)
            await this.generateGreeting();
            
        } catch (error) {
            console.error('Error loading model:', error);
            loadingMessageDiv.remove();
            this.messageCount--;
            
            // Check if it was interrupted
            if (this.loadingAborted) {
                this.modelState = 'none';
                this.updateModelInfo();
                this.addBotMessage('Model loading interrupted.', false);
            } else {
                // Check if model is in cache (downloaded state)
                // If download completed but loading failed, set to 'downloaded'
                // Otherwise set to 'none'
                this.modelState = 'none';
                this.updateModelInfo();
                this.addBotMessage(`❌ Failed to load AI model: ${error.message}. Please ensure you're using Chrome 113+ or Edge 113+ with WebGPU enabled.`, false);
            }
        }
    }
    
    async generateGreeting() {        
        // Pick random greeting from pre-made list
        const randomIndex = Math.floor(Math.random() * this.greetings.length);
        const greeting = this.greetings[randomIndex];
        
        this.addBotMessage(greeting);
        
        // Enable chat after greeting
        this.sendBtn.disabled = false;
        this.userInput.focus();
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
        container.style.flexWrap = 'wrap';
        
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
        
        // Accessible icon
        const accessibleSvg = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="5" r="2"/>
                <path d="M12 7v6"/>
                <path d="M8 11h8"/>
                <path d="M9 13l-2 8"/>
                <path d="M15 13l2 8"/>
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
            <span style="color: var(--text-light);">•</span>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                ${accessibleSvg}
                <span>Accessible</span>
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
        
        // Generate response with streaming
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
        
        // Extract user info from model's metadata and strip it from response
        const extractMatch = response.match(/\[EXTRACT\]([\s\S]*?)\[\/EXTRACT\]/);
        if (extractMatch) {
            try {
                const extracted = JSON.parse(extractMatch[1]);
                if (extracted.name && !this.extractedInfo.name) this.extractedInfo.name = extracted.name;
                if (extracted.email && !this.extractedInfo.email) this.extractedInfo.email = extracted.email;
                if (extracted.company && !this.extractedInfo.company) this.extractedInfo.company = extracted.company;
                if (extracted.position && !this.extractedInfo.position) this.extractedInfo.position = extracted.position;
                // Context is cumulative - append new info if it adds value
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
        
        console.groupCollapsed("response");
        console.log(response);
        console.log(extractMatch);
        console.log(this.extractedInfo);
        console.groupEnd();
        
        // Remove all extraction metadata from response (handles multiple occurrences and newlines)
        response = response.replace(/\[EXTRACT\][\s\S]*?\[\/EXTRACT\]/g, '').trim();

        const endTime = performance.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        console.log(`Reply generated in ${duration}s`);
        console.log('---------------');
        
        return response.trim();
    }
    
    addUserMessage(text) {
        this.addMessage(text, 'user');
    }
    
    addBotMessage(text, showSuggestions = true) {
        this.addMessage(text, 'bot');
        
        // Show suggestions after bot message (if enabled and model is loaded)
        if (showSuggestions && this.isModelLoaded && this.permissionGranted) {
            this.showSuggestions();
        }
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
        
        // Add loading bar below bubble (100% width of message)
        const loadingBar = this.createLoadingBar(50000);
        loadingBar.style.marginTop = '4px';
        messageDiv.appendChild(loadingBar);
        
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
        // Only show if enabled (disabled by default to avoid user friction)
        if (this.performanceWarningsEnabled) {
            this.showAlert('⚠️ Performance issues detected. Consider switching to static mode using the AI toggle.', 'error');
        }
    }
    
    // ===================================
    // UI Controls
    // ===================================
    
    toggleAI(enabled) {
        // Track time in previous mode
        const currentTime = Date.now();
        const timeInMode = currentTime - this.currentModeStartTime;
        
        if (this.aiEnabled) {
            this.chatModeTime += timeInMode;
        } else {
            this.staticModeTime += timeInMode;
        }
        
        this.currentModeStartTime = currentTime;
        this.aiEnabled = enabled;
        
        // Check if feedback should be shown (after 1 minute total interaction)
        if (!this.feedbackShown && (this.staticModeTime + this.chatModeTime) >= this.feedbackInteractionThreshold) {
            this.showFeedbackBubble();
        }
        
        if (!enabled) {
            // Switch to static content
            this.chatContainer.classList.add('hidden');
            this.staticContent.classList.remove('hidden');
        } else {
            // Switch to chat UI
            this.closeSearchResults();
            this.chatContainer.classList.remove('hidden');
            this.staticContent.classList.add('hidden');
            
            if (this.isModelLoaded) {
                this.userInput.disabled = false;
                this.sendBtn.disabled = false;
                this.userInput.focus();
            } else if (!this.permissionGranted) {
                // Show permission prompt again if it was declined before
                this.showPermissionPrompt();
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
    
    async clearModelCache() {
        const stateMessage = this.modelState === 'downloading' || this.modelState === 'loading' 
            ? 'This will interrupt the current operation and clear the model cache (~1.9GB). Continue?'
            : 'This will clear the loaded model (~1.9GB) and reset the interface. You will need to reload it to use AI chat again. Continue?';
            
        if (confirm(stateMessage)) {
            try {
                // If currently loading, abort it
                if (this.modelState === 'downloading' || this.modelState === 'loading') {
                    this.loadingAborted = true;
                    this.showAlert('Interrupting model loading...', 'info');
                    // Give it a moment to abort
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
                
                await this.clearCacheInternal();
                
                // Update UI to show no model loaded
                this.isModelLoaded = false;
                this.permissionGranted = false;
                this.modelState = 'none';
                this.updateModelInfo();
                
                // Reset model state
                this.engine = null;
                this.conversationHistory = [];
                
                this.showAlert('Model cache cleared! Refresh to load again.', 'success');
            } catch (error) {
                this.showAlert('Failed to clear model cache. Check console for details.', 'error');
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
    
    showSuggestions() {
        // Clear existing suggestions
        this.suggestionsContainer.innerHTML = '';
        
        // Pick 2 random suggestions
        const shuffled = [...this.suggestionMessages].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, 2);
        
        selected.forEach(suggestion => {
            const button = document.createElement('button');
            button.textContent = suggestion;
            button.className = 'suggestion-btn';
            
            button.addEventListener('click', () => {
                this.userInput.value = suggestion;
                this.handleSend();
                this.hideSuggestions();
            });
            
            this.suggestionsContainer.appendChild(button);
        });
    }
    
    hideSuggestions() {
        this.suggestionsContainer.innerHTML = '';
    }
    
    showPermissionPrompt() {
        // Don't show if already shown
        if (this.permissionPromptShown) {
            return;
        }
        
        this.permissionPromptShown = true;
        
        // Add permission message
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot';
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'message-bubble';
        bubbleDiv.textContent = 'Experiment using a local model to interact with this portfolio! Need to load ~1.9GB and it will take ~120s. Shall we continue?';
        messageDiv.appendChild(bubbleDiv);
        this.messagesContainer.appendChild(messageDiv);
        this.messageCount++;
        this.scrollToBottom();
        
        // Show permission buttons in suggestions area
        this.suggestionsContainer.innerHTML = '';
        
        const yesButton = document.createElement('button');
        yesButton.textContent = 'Yes!';
        yesButton.className = 'suggestion-btn primary';
        
        const noButton = document.createElement('button');
        noButton.textContent = 'Switch off GenAI';
        noButton.className = 'suggestion-btn';
        
        yesButton.addEventListener('click', () => {
            // Add user's "yes" to chat
            this.addUserMessage('Yes!');
            this.permissionGranted = true;
            this.hideSuggestions();
            this.loadModel();
        });
        
        noButton.addEventListener('click', () => {
            // Add user's "no" to chat
            this.addUserMessage('Switch off GenAI');
            this.hideSuggestions();
            // Turn off AI and show static content
            this.aiToggle.checked = false;
            this.toggleAI(false);
            this.addBotMessage('AI disabled. Browse the static portfolio instead!', false);
        });
        
        this.suggestionsContainer.appendChild(yesButton);
        this.suggestionsContainer.appendChild(noButton);
    }
    
    createLoadingBar(duration) {
        // Create animated loading bar
        const container = document.createElement('div');
        container.style.width = '75%';
        container.style.height = '3px';
        container.style.backgroundColor = 'var(--border)';
        container.style.borderRadius = '2px';
        container.style.overflow = 'hidden';
        container.style.position = 'relative';
        
        const bar = document.createElement('div');
        bar.style.height = '100%';
        bar.style.width = '0%';
        bar.style.backgroundColor = 'var(--primary)';
        bar.style.borderRadius = '2px';
        bar.style.transition = `width ${duration}ms linear`;
        bar.style.boxShadow = '0 0 10px var(--primary)';
        
        container.appendChild(bar);
        
        // Animate bar
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                bar.style.width = '100%';
            });
        });
        
        return container;
    }
    
    // ===================================
    // Vector Search
    // ===================================
    
    async performVectorSearch() {
        const query = this.searchInput.value.trim();
        
        if (!query || query.length < 3) {
            this.showAlert('Please enter at least 3 characters to search', 'info');
            return;
        }
        
        // Disable search button during search
        this.searchBtn.disabled = true;
        const originalHTML = this.searchBtn.innerHTML;
        this.searchBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
        
        try {
            // Check if embeddings are loaded
            if (!this.embeddings || !this.embeddings.chunks || this.embeddings.chunks.length === 0) {
                this.showAlert('Search data not yet loaded. Please wait a moment and try again.', 'info');
                return;
            }
            
            // Generate query embedding
            if (!this.embeddingModel) {
                this.showAlert('Search model not loaded. Please wait a moment and try again.', 'info');
                return;
            }
            
            const queryEmbedding = await this.embeddingModel(query, { pooling: 'mean', normalize: true });
            const queryVector = Array.from(queryEmbedding.data);
            
            // Calculate cosine similarity for each chunk
            const results = this.embeddings.chunks.map(item => {
                const similarity = this.cosineSimilarity(queryVector, item.embedding);
                return {
                    text: item.content || item.text,
                    project: item.metadata?.project || item.project,
                    section: item.metadata?.section || item.section,
                    anchor: item.metadata?.anchor || item.anchor,
                    embedding: item.embedding,
                    similarity
                };
            });
            
            // Filter by threshold and sort by similarity
            const filteredResults = results
                .filter(item => item.similarity >= this.ragConfidenceThreshold)
                .sort((a, b) => b.similarity - a.similarity);
            
            // Display results
            this.displaySearchResults(filteredResults, query);
            
        } catch (error) {
            console.error('Search error:', error);
            this.showAlert('Search failed. Please try again.', 'error');
        } finally {
            this.searchBtn.disabled = false;
            this.searchBtn.innerHTML = originalHTML;
        }
    }
    
    displaySearchResults(results, query) {
        // Show results panel
        this.searchResultsPanel.classList.remove('hidden');
        
        // Clear previous results
        this.searchResultsContent.innerHTML = '';
        
        if (results.length === 0) {
            this.searchResultsContent.innerHTML = `
                <div class="search-no-results">
                    <p>No results found for "${query}"</p>
                    <p>Try different keywords or browse the portfolio above.</p>
                </div>
            `;
            return;
        }
        
        console.log(`Displaying ${results.length} search results for "${query}"`);
        
        // Group results by project/section
        const grouped = {};
        results.forEach(result => {
            const group = result.project || result.section || 'General';
            if (!grouped[group]) {
                grouped[group] = [];
            }
            grouped[group].push(result);
        });
        
        console.log('Grouped results:', Object.keys(grouped));
        
        // Display grouped results
        Object.entries(grouped).forEach(([groupName, items]) => {
            const groupDiv = document.createElement('div');
            groupDiv.className = 'search-result-group';
            
            const heading = document.createElement('h3');
            heading.textContent = groupName;
            groupDiv.appendChild(heading);
            
            items.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'search-result-item';
                
                const content = document.createElement('div');
                // Decode HTML entities and render as HTML
                let htmlContent = item.text || 'No content';
                
                // Decode HTML entities to proper HTML
                htmlContent = htmlContent
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&amp;/g, '&')
                    .replace(/&quot;/g, '"')
                    .replace(/&#039;/g, "'")
                    .replace(/&nbsp;/g, ' ');
                
                // Fix heading hierarchy: h6 -> h4
                htmlContent = htmlContent.replace(/<h6>/gi, '<h4>').replace(/<\/h6>/gi, '</h4>');
                
                // Render HTML with structure preserved
                content.innerHTML = htmlContent;
                itemDiv.appendChild(content);
                
                const score = document.createElement('div');
                score.style.fontSize = '0.75rem';
                score.style.color = 'var(--text-light)';
                score.style.marginTop = '0.5rem';
                score.style.paddingTop = '0.5rem';
                score.style.borderTop = '1px solid var(--border)';
                score.textContent = `Relevance: ${(item.similarity * 100).toFixed(1)}%`;
                itemDiv.appendChild(score);
                
                // Add click handler to scroll to section if available
                if (item.anchor) {
                    itemDiv.style.cursor = 'pointer';
                    itemDiv.addEventListener('click', () => {
                        this.closeSearchResults();
                        const element = document.getElementById(item.anchor);
                        if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    });
                }
                
                groupDiv.appendChild(itemDiv);
            });
            
            this.searchResultsContent.appendChild(groupDiv);
        });
    }
    
    closeSearchResults() {
        this.searchResultsPanel.classList.add('hidden');
        this.searchInput.value = '';
    }
    
    // ===================================
    // Feedback System
    // ===================================
    
    showFeedbackBubble() {
        if (this.feedbackShown) return;
        
        this.feedbackBubble.classList.remove('hidden');
        this.feedbackShown = true;
    }
    
    dismissFeedbackBubble() {
        this.feedbackBubble.classList.add('hidden');
    }
    
    openFeedbackModal() {
        this.feedbackModal.classList.remove('hidden');
        this.feedbackBubble.classList.add('hidden');
        
        // Populate feedback form in modal
        const formContainer = document.getElementById('feedbackFormContainer');
        if (!formContainer) return;
        
        const timeSpent = ((Date.now() - this.pageLoadTime) / 1000).toFixed(0);
        const avgReplyTime = (this.performanceMetrics.avgResponseTime / 1000).toFixed(1);
        const maxReplyTime = (this.performanceMetrics.maxResponseTime / 1000).toFixed(1);
        const language = navigator.language;
        const modelName = this.selectedModel;
        const referrer = document.referrer || 'Direct';
        
        formContainer.innerHTML = `
            <h3>Send Feedback</h3>
            <p>Your feedback helps improve this portfolio!</p>
            
            <form id="feedbackForm">
                <label for="fb-name">Name</label>
                <input type="text" id="fb-name" value="${this.extractedInfo.name}" required>
                
                <label for="fb-email">Email</label>
                <input type="email" id="fb-email" value="${this.extractedInfo.email}" required>
                
                <label for="fb-company">Company (optional)</label>
                <input type="text" id="fb-company" value="${this.extractedInfo.company}">
                
                <label for="fb-message">Message (optional)</label>
                <textarea id="fb-message" rows="3" placeholder="Share your thoughts..."></textarea>
                
                <div style="margin-top: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Include in feedback:</label>
                    
                    <label style="display: block; margin-bottom: 0.75rem; cursor: pointer;">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <input type="checkbox" id="fb-personal" checked>
                            <span style="font-weight: 500;">Personal Info</span>
                        </div>
                        <div style="font-size: 0.75rem; color: var(--text-light); margin-left: 1.75rem; margin-top: 0.25rem;">Name, Email, Company, Message</div>
                    </label>
                    
                    <label style="display: block; margin-bottom: 0.75rem; cursor: pointer;">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <input type="checkbox" id="fb-usage" checked>
                            <span style="font-weight: 500;">Usage Stats</span>
                        </div>
                        <div style="font-size: 0.75rem; color: var(--text-light); margin-left: 1.75rem; margin-top: 0.25rem;">Time: ${timeSpent}s, Static: ${(this.staticModeTime / 1000).toFixed(0)}s, Chat: ${(this.chatModeTime / 1000).toFixed(0)}s, Messages: ${this.userMessages}${this.isModelLoaded ? `, Avg reply: ${avgReplyTime}s, Max: ${maxReplyTime}s` : ''}</div>
                    </label>
                    
                    <label style="display: block; margin-bottom: 0.75rem; cursor: pointer;">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <input type="checkbox" id="fb-technical" checked>
                            <span style="font-weight: 500;">Technical Info</span>
                        </div>
                        <div style="font-size: 0.75rem; color: var(--text-light); margin-left: 1.75rem; margin-top: 0.25rem;">Model: ${modelName}${this.modelLoadTime ? `, Load: ${this.modelLoadTime}s` : ''}, Lang: ${language}, Ref: ${referrer}</div>
                    </label>
                </div>
                
                <div class="feedback-modal-actions">
                    <button type="button" onclick="document.getElementById('closeFeedbackModal').click()">Cancel</button>
                    <button type="submit">Send Feedback</button>
                </div>
            </form>
        `;
        
        // Handle form submission
        document.getElementById('feedbackForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = document.getElementById('fb-name').value;
            const email = document.getElementById('fb-email').value;
            const company = document.getElementById('fb-company').value;
            const message = document.getElementById('fb-message').value;
            
            const parts = [];
            
            // Personal Info
            if (document.getElementById('fb-personal').checked) {
                parts.push('=== Personal Info ===');
                parts.push(`Name: ${name}`);
                parts.push(`Email: ${email}`);
                if (company) parts.push(`Company: ${company}`);
                if (message) {
                    parts.push('');
                    parts.push('Message:');
                    parts.push(message);
                }
                parts.push('');
            }
            
            // Usage Stats
            if (document.getElementById('fb-usage').checked) {
                parts.push('=== Usage Stats ===');
                parts.push(`Total time: ${timeSpent}s`);
                parts.push(`Static mode time: ${(this.staticModeTime / 1000).toFixed(0)}s`);
                parts.push(`Chat mode time: ${(this.chatModeTime / 1000).toFixed(0)}s`);
                parts.push(`Messages sent: ${this.userMessages}`);
                if (this.isModelLoaded) {
                    parts.push(`Avg reply time: ${avgReplyTime}s`);
                    parts.push(`Max reply time: ${maxReplyTime}s`);
                }
                parts.push('');
            }
            
            // Technical Info
            if (document.getElementById('fb-technical').checked) {
                parts.push('=== Technical Info ===');
                parts.push(`Model: ${modelName}`);
                if (this.modelLoadTime) parts.push(`Model load time: ${this.modelLoadTime}s`);
                parts.push(`Language: ${language}`);
                parts.push(`Referrer: ${referrer}`);
            }
            
            const body = parts.join('%0D%0A');
            const subject = 'Portfolio Feedback';
            const mailtoLink = `mailto:vitor@goncalves.pt?subject=${encodeURIComponent(subject)}&body=${body}`;
            
            window.location.href = mailtoLink;
            this.closeFeedbackModalPanel();
            this.showAlert('Thank you for your feedback! 🙏', 'success');
        });
    }
    
    closeFeedbackModalPanel() {
        this.feedbackModal.classList.add('hidden');
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
