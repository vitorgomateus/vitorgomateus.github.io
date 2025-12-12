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
        
        // WebLLM engine - using Phi-3.5-mini for best balance of speed and quality
        this.selectedModel = "Phi-3.5-mini-instruct-q4f16_1-MLC";
        this.engine = null;
        this.isModelLoaded = false;
        this.conversationHistory = [];
        
        // State management
        this.messageCount = 0;
        this.maxMessages = 50; // Conservative limit for memory
        this.isProcessing = false;
        
        // Performance tracking
        this.performanceMetrics = {
            messagesSent: 0,
            avgResponseTime: 0,
            slowResponses: 0
        };
        
        this.init();
    }
    
    init() {
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
    
    async handleSend() {
        const message = this.userInput.value.trim();
        
        if (!message || this.isProcessing || !this.isModelLoaded) return;
        
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
        const maxHistory = 10; // Last 10 messages
        const recentHistory = this.conversationHistory.slice(-maxHistory);
        
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
            temperature: 0.7,
            max_tokens: 512,
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
        // Remove oldest 25% to maintain performance
        const messagesToRemove = Math.floor(this.maxMessages * 0.25);
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
        
        // Track slow responses (> 1.5 seconds)
        if (responseTime > 1500) {
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
            }, 20000); // Check every 20 seconds
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
        
        // Warn at 75% memory usage
        if (usagePercent > 75) {
            this.showPerformanceWarning();
        }
    }
    
    checkPerformance() {
        const metrics = this.performanceMetrics;
        
        // Show warning if performance degrades:
        // - Average response time > 1 second
        // - More than 25% of responses are slow
        if (metrics.avgResponseTime > 1000 || 
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
}

// Initialize chatbot when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new Chatbot();
    });
} else {
    new Chatbot();
}
