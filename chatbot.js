/**
 * High-Performance Client-Side LLM Chatbot with WebLLM
 * Zero server communication - 100% local processing
 * Performance monitoring with graceful degradation
 */

import * as webllm from "https://esm.run/@mlc-ai/web-llm";

class Chatbot {
    constructor() {
        // DOM elements
        this.messagesContainer = document.getElementById('messages');
        this.userInput = document.getElementById('userInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.performanceWarning = document.getElementById('performanceWarning');
        this.aiToggle = document.getElementById('aiToggle');
        this.menuBtn = document.getElementById('menuBtn');
        this.drawer = document.getElementById('drawer');
        this.drawerOverlay = document.getElementById('drawerOverlay');
        this.closeDrawer = document.getElementById('closeDrawer');
        this.clearCacheBtn = document.getElementById('clearCache');
        this.accessibilityBtn = document.getElementById('accessibilityMode');
        
        // WebLLM engine
        // this.selectedModel = "Phi-3.5-mini-instruct-q4f16_1-MLC"; // for best balance of speed and quality
        // this.selectedModel = "Llama-3.2-3B-Instruct-q4f16_1-MLC"; // 1.7GB - Meta's Llama
        // this.selectedModel = "Qwen2.5-3B-Instruct-q4f16_1-MLC"; // 1.9GB - Strong reasoning
        // this.selectedModel = "gemma-2-2b-it-q4f16_1-MLC"; // 1.4GB - Google's Gemma (most lightweight)
        this.selectedModel = "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC"; // 0.6GB - Ultra lightweight
        
        this.engine = null;
        this.isModelLoaded = false;
        this.conversationHistory = [];
        
        // Performance tuning variables
        this.maxMessages = 50; // Max messages before pruning
        this.maxHistory = 10; // Max conversation history sent to model
        this.maxTokens = 512; // Max tokens in response
        this.temperature = 0.7; // Response randomness (0-1)
        this.prunePercent = 0.25; // Percent of messages to remove when pruning
        this.memoryCheckInterval = 20000; // Memory check interval (ms)
        this.memoryWarningThreshold = 75; // Memory usage warning % 
        this.slowResponseThreshold = 1500; // Slow response time (ms)
        this.performanceCheckThreshold = 1000; // Trigger warning if avg > this (ms)
        
        // State management
        this.messageCount = 0;
        this.isProcessing = false;
        this.aiEnabled = true;
        this.accessibilityMode = false;
        
        // Performance tracking
        this.performanceMetrics = {
            messagesSent: 0,
            avgResponseTime: 0,
            slowResponses: 0
        };
        
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
        this.userInput.disabled = true;
        
        // Initial greeting
        this.addBotMessage("Loading AI model... Please wait, this may take a minute. The model (1.9GB) will be cached for future visits.");
        
        // Check WebGPU support and auto-load model
        this.checkWebGPUSupport().then(supported => {
            if (supported) {
                this.loadModel();
            }
        });
        
        // Start performance monitoring
        this.startPerformanceMonitoring();
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
        
        if (!message || this.isProcessing) return;
        
        // If AI is disabled, show info instead
        if (!this.aiEnabled) {
            this.userInput.value = '';
            this.addUserMessage(message);
            this.addBotMessage("AI is currently turned off. Please enable it using the toggle switch in the header, or visit the info page for static information.");
            return;
        }
        
        if (!this.isModelLoaded) return;
        
        // Clear input and reset
        this.userInput.value = '';
        this.autoResize();
        this.isProcessing = true;
        this.sendBtn.disabled = true;
        
        // Add user message
        this.addUserMessage(message);
        
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
            
            // Remove typing, add response
            typingIndicator.remove();
            this.addBotMessage(response);
            
            // Add to conversation history
            this.conversationHistory.push({ role: "assistant", content: response });
            
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
    
    async checkWebGPUSupport() {
        if (!navigator.gpu) {
            this.addBotMessage("⚠️ WebGPU is not supported in your browser. Please use Chrome 113+ or Edge 113+ with WebGPU enabled.");
            this.loadModelBtn.disabled = true;
            return false;
        }
        return true;
    }
    
    async loadModel() {
        try {
            // Initialize engine with progress callback
            this.engine = await webllm.CreateMLCEngine(this.selectedModel, {
                initProgressCallback: (progress) => {
                    console.log(progress.text);
                    // Update the last bot message with progress
                    const messages = this.messagesContainer.querySelectorAll('.message.bot');
                    if (messages.length > 0) {
                        const lastMessage = messages[messages.length - 1];
                        const bubble = lastMessage.querySelector('.message-bubble');
                        if (bubble && progress.text) {
                            bubble.textContent = `Loading... ${progress.text}`;
                        }
                    }
                }
            });
            
            this.isModelLoaded = true;
            
            // Enable chat
            this.sendBtn.disabled = false;
            this.userInput.disabled = false;
            this.userInput.focus();
            
            this.addBotMessage("🚀 Ready! I'm a local AI running entirely in your browser. Your conversations are completely private. How can I help you?");
            
        } catch (error) {
            console.error('Error loading model:', error);
            this.addBotMessage(`❌ Failed to load AI model: ${error.message}. Please ensure you're using Chrome 113+ or Edge 113+ with WebGPU enabled.`);
        }
    }
    
    async generateLLMResponse(userMessage) {
        // Keep only recent conversation history to manage memory
        const recentHistory = this.conversationHistory.slice(-this.maxHistory);
        
        // Build messages array
        const messages = [
            { role: "system", content: "You are a helpful AI assistant. Be concise and friendly." },
            ...recentHistory,
            { role: "user", content: userMessage }
        ];
        
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
        if (!this.performanceWarning.classList.contains('hidden')) return;
        
        this.performanceWarning.classList.remove('hidden');
        
        // Auto-dismiss after 15 seconds
        setTimeout(() => {
            this.performanceWarning.classList.add('hidden');
        }, 15000);
    }
    
    // ===================================
    // UI Controls
    // ===================================
    
    toggleAI(enabled) {
        this.aiEnabled = enabled;
        
        if (!enabled) {
            this.addBotMessage("AI turned off. I'll show you information instead. You can turn AI back on using the toggle.");
            this.userInput.disabled = true;
            this.sendBtn.disabled = true;
        } else if (this.isModelLoaded) {
            this.addBotMessage("AI is back on! How can I help you?");
            this.userInput.disabled = false;
            this.sendBtn.disabled = false;
            this.userInput.focus();
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
    
    async handleClearCache() {
        if (confirm('This will clear the cached model (~1.9GB). You will need to download it again next time. Continue?')) {
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
                
                alert('Cache cleared successfully! Please refresh the page.');
            } catch (error) {
                console.error('Error clearing cache:', error);
                alert('Failed to clear cache. Check console for details.');
            }
        }
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
            document.body.style.fontFamily = 'OpenDyslexic, "Work Sans", sans-serif';
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
