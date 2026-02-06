/**
 * Portfolio Website - Static Content & Search
 * Handles: Data rendering, vector search, feedback, drawer, accessibility
 */

class PortfolioApp {
    constructor() {
        this.data = null;
        this.embeddings = null;
        this.timeTracking = {
            startTime: Date.now(),
            chatTime: 0,
            portfolioTime: 0,
            currentMode: 'portfolio',
            modeStartTime: Date.now()
        };
        this.feedbackShown = false;
        this.feedbackDismissed = false;
        
        this.init();
    }
    
    async init() {
        try {
            // Set random primary color
            this.setRandomPrimaryColor();
            
            // Load data
            await this.loadData();
            
            // Render portfolio
            this.renderPortfolio();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Setup feedback tracking
            this.setupFeedbackTracking();
            
            console.log('[portfolio.js] Initialized successfully');
        } catch (error) {
            console.error('[portfolio.js] Initialization error:', error);
            this.showAlert('Failed to load portfolio content', 'error');
        }
    }
    
    /**
     * Set random primary color on page load
     */
    setRandomPrimaryColor() {
        const hue = Math.floor(Math.random() * 360);
        const saturation = 60 + Math.floor(Math.random() * 30); // 60-90%
        const lightness = 25 + Math.floor(Math.random() * 15); // 25-40%
        
        const primary = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        const primaryDark = `hsl(${hue}, ${saturation}%, ${lightness - 10}%)`;
        const primaryLight = `hsl(${hue}, ${saturation}%, 85%)`;
        
        document.documentElement.style.setProperty('--primary', primary);
        document.documentElement.style.setProperty('--primary-dark', primaryDark);
        document.documentElement.style.setProperty('--primary-light', primaryLight);
        
        console.log('[portfolio.js] Random primary color:', primary);
    }
    
    /**
     * Load JSON data files
     */
    async loadData() {
        try {
            const [dataResponse, embeddingsResponse] = await Promise.all([
                fetch('data-002.json'),
                fetch('embeddings.json')
            ]);
            
            this.data = await dataResponse.json();
            this.embeddings = await embeddingsResponse.json();
            
            console.log('[portfolio.js] Data loaded:', {
                personal: !!this.data.personal,
                projects: this.data.projects?.length,
                embeddings: this.embeddings?.length
            });
        } catch (error) {
            console.error('[portfolio.js] Failed to load data:', error);
            throw error;
        }
    }
    
    /**
     * Render entire portfolio
     */
    renderPortfolio() {
        this.renderSummary();
        this.renderSkills();
        this.renderLanguages();
        this.renderEducation();
        this.renderExperience();
        this.renderProjects();
    }
    
    /**
     * Render executive summary
     */
    renderSummary() {
        const container = document.getElementById('summary-container');
        if (!container || !this.data.personal) return;
        
        const { name, title, location, email, phone, linkedin, summary } = this.data.personal;
        
        container.innerHTML = `
            <div class="summary-card">
                <h3>${name}</h3>
                <p><strong>${title}</strong></p>
                <p>${summary}</p>
                <div class="contact-info">
                    <p><strong>Location:</strong> ${location}</p>
                    <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
                    <p><strong>Phone:</strong> <a href="tel:${phone}">${phone}</a></p>
                    <p><strong>LinkedIn:</strong> <a href="${linkedin}" target="_blank" rel="noopener">View Profile</a></p>
                </div>
            </div>
        `;
    }
    
    /**
     * Render skills section
     */
    renderSkills() {
        const container = document.getElementById('skills-container');
        if (!container || !this.data.personal?.skills) return;
        
        container.innerHTML = this.data.personal.skills.map(skill => `
            <div class="skill-card">
                <h3>${skill.category}</h3>
                <p>${skill.description}</p>
                <div class="skill-tools">
                    ${skill.tools.map(tool => `<span class="skill-tag">${tool}</span>`).join('')}
                </div>
            </div>
        `).join('');
    }
    
    /**
     * Render languages section
     */
    renderLanguages() {
        const container = document.getElementById('languages-container');
        if (!container || !this.data.personal?.languages) return;
        
        const langs = this.data.personal.languages;
        container.innerHTML = `
            <div class="languages-list">
                <div class="language-item">
                    <span class="language-name">English</span>
                    <span class="language-level">${langs.english}</span>
                </div>
                <div class="language-item">
                    <span class="language-name">Portuguese</span>
                    <span class="language-level">${langs.portuguese}</span>
                </div>
                <div class="language-item">
                    <span class="language-name">Spanish</span>
                    <span class="language-level">${langs.spanish}</span>
                </div>
            </div>
        `;
    }
    
    /**
     * Render education section
     */
    renderEducation() {
        const container = document.getElementById('education-container');
        if (!container || !this.data.education) return;
        
        container.innerHTML = this.data.education.map(edu => `
            <div class="education-card">
                <div class="card-header">
                    <h3 class="card-title">${edu.degree}</h3>
                    <a href="${edu.institutionUrl}" target="_blank" rel="noopener" class="card-subtitle">
                        ${edu.institution}
                    </a>
                    <div class="card-meta">
                        <span>${edu.location}</span>
                        <span>•</span>
                        <span>${edu.period}</span>
                    </div>
                </div>
                ${edu.focus ? `<div class="card-focus"><strong>Focus:</strong> ${edu.focus}</div>` : ''}
            </div>
        `).join('');
    }
    
    /**
     * Render experience section
     */
    renderExperience() {
        const container = document.getElementById('experience-container');
        if (!container || !this.data.experience) return;
        
        container.innerHTML = this.data.experience.map(exp => `
            <div class="experience-card">
                <div class="card-header">
                    <h3 class="card-title">${exp.title}</h3>
                    ${exp.companyUrl ? 
                        `<a href="${exp.companyUrl}" target="_blank" rel="noopener" class="card-subtitle">${exp.company}</a>` :
                        `<div class="card-subtitle">${exp.company}</div>`
                    }
                    <div class="card-meta">
                        <span>${exp.location}</span>
                        <span>•</span>
                        <span>${exp.period}</span>
                    </div>
                </div>
                <p class="card-description">${exp.description}</p>
            </div>
        `).join('');
    }
    
    /**
     * Render projects section
     */
    renderProjects() {
        const container = document.getElementById('projects-container');
        if (!container || !this.data.projects) return;
        
        const activeProjects = this.data.projects.filter(p => p.active);
        
        container.innerHTML = activeProjects.map(project => {
            const firstImage = project.contentBlocks?.find(block => block.image)?.image;
            const imageSrc = firstImage?.src || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 225"%3E%3Crect fill="%23f0f0f0" width="400" height="225"/%3E%3C/svg%3E';
            
            return `
                <div class="project-card" tabindex="0" role="button" data-project-id="${project.id}" aria-label="View ${project.title} details">
                    <img src="${imageSrc}" alt="${project.title}" class="project-image" loading="lazy">
                    <div class="project-content">
                        <div class="project-header">
                            <h3>${project.title}</h3>
                            <p class="project-subtitle">${project.subtitle}</p>
                        </div>
                        <p class="project-description">${project.shortDescription}</p>
                        <div class="project-skills">
                            ${project.skills.map(skill => `<span class="project-tag">${skill}</span>`).join('')}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Add click listeners
        container.querySelectorAll('.project-card').forEach(card => {
            card.addEventListener('click', () => {
                const projectId = card.dataset.projectId;
                this.showProjectDetail(projectId);
            });
            
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const projectId = card.dataset.projectId;
                    this.showProjectDetail(projectId);
                }
            });
        });
    }
    
    /**
     * Show project detail modal
     */
    showProjectDetail(projectId) {
        const project = this.data.projects.find(p => p.id === projectId);
        if (!project) return;
        
        const modal = document.createElement('div');
        modal.className = 'project-detail-modal';
        modal.innerHTML = `
            <div class="project-detail-content">
                <div class="project-detail-header">
                    <h2>${project.title}</h2>
                    <button class="close-modal-btn" aria-label="Close">×</button>
                </div>
                <div class="project-detail-body">
                    <div class="project-meta-info">
                        ${project.year ? `<div class="meta-item"><span class="meta-label">Year</span><span class="meta-value">${project.year}</span></div>` : ''}
                        ${project.company ? `<div class="meta-item"><span class="meta-label">Company</span><span class="meta-value">${project.company}</span></div>` : ''}
                        ${project.role ? `<div class="meta-item"><span class="meta-label">Role</span><span class="meta-value">${project.role}</span></div>` : ''}
                    </div>
                    ${project.contentBlocks?.map(block => {
                        let html = '<div class="content-block">';
                        
                        if (block.heading) {
                            html += `<h3>${block.heading}</h3>`;
                        }
                        
                        if (block.text) {
                            html += `<p>${block.text}</p>`;
                        }
                        
                        if (block.image) {
                            const imgClass = [
                                'content-block-image',
                                block.image.class || ''
                            ].filter(Boolean).join(' ');
                            
                            html += `<img src="${block.image.src}" alt="${block.image.alt || ''}" class="${imgClass}" loading="lazy">`;
                            
                            if (block.image.caption) {
                                html += `<p class="content-block-caption">${block.image.caption}</p>`;
                            }
                            
                            if (block.image.link) {
                                html += `<a href="${block.image.link.href}" target="_blank" rel="noopener" class="content-block-link">View Project →</a>`;
                            }
                        }
                        
                        html += '</div>';
                        return html;
                    }).join('') || ''}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close handlers
        const closeBtn = modal.querySelector('.close-modal-btn');
        const closeModal = () => {
            modal.remove();
            document.body.style.overflow = '';
        };
        
        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
        
        document.addEventListener('keydown', function escapeHandler(e) {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', escapeHandler);
            }
        });
        
        // Focus trap
        const content = modal.querySelector('.project-detail-content');
        const focusableElements = content.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])');
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];
        
        firstFocusable?.focus();
        
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstFocusable) {
                        e.preventDefault();
                        lastFocusable?.focus();
                    }
                } else {
                    if (document.activeElement === lastFocusable) {
                        e.preventDefault();
                        firstFocusable?.focus();
                    }
                }
            }
        });
        
        document.body.style.overflow = 'hidden';
    }
    
    /**
     * Vector search using cosine similarity
     */
    async performSearch(query) {
        if (!query || query.trim().length < 3) {
            this.showAlert('Please enter at least 3 characters', 'info');
            return;
        }
        
        const words = query.trim().split(/\s+/);
        if (words.length < 3) {
            this.showAlert('Please enter at least 3 words', 'info');
            return;
        }
        
        try {
            // Generate embedding for query
            const queryEmbedding = await this.generateQueryEmbedding(query);
            
            // Calculate similarities
            const results = this.embeddings.map(chunk => ({
                ...chunk,
                similarity: this.cosineSimilarity(queryEmbedding, chunk.embedding)
            }))
            .filter(result => result.similarity >= 0.3)
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 10);
            
            this.displaySearchResults(results, query);
        } catch (error) {
            console.error('[portfolio.js] Search error:', error);
            this.showAlert('Search failed. Please try again.', 'error');
        }
    }
    
    /**
     * Generate embedding for query (simplified - uses TF-IDF-like approach)
     */
    async generateQueryEmbedding(query) {
        // Since we can't run the actual model client-side easily,
        // we'll use a simple bag-of-words similarity approach
        // This matches against the text field directly
        return query.toLowerCase();
    }
    
    /**
     * Cosine similarity calculation
     */
    cosineSimilarity(queryText, embedding) {
        // Simplified similarity: check for word matches
        // In a real implementation, this would use actual vector math
        const queryWords = queryText.toLowerCase().split(/\s+/);
        const chunkText = typeof embedding === 'string' ? embedding : '';
        
        // For this implementation, we'll do text matching since we can't
        // easily generate embeddings client-side
        // Count matching words weighted by position
        let score = 0;
        queryWords.forEach(word => {
            if (word.length > 2) { // Skip short words
                const regex = new RegExp(word, 'gi');
                const matches = chunkText.match(regex);
                if (matches) {
                    score += matches.length * 0.1;
                }
            }
        });
        
        return Math.min(score, 1); // Cap at 1
    }
    
    /**
     * Simplified search using text matching
     */
    async performSearch(query) {
        if (!query || query.trim().length < 3) {
            this.showAlert('Please enter at least 3 characters', 'info');
            return;
        }
        
        const queryLower = query.toLowerCase();
        const results = this.embeddings
            .map(chunk => ({
                ...chunk,
                similarity: this.calculateTextSimilarity(queryLower, chunk.text)
            }))
            .filter(result => result.similarity >= 0.3)
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 10);
        
        this.displaySearchResults(results, query);
    }
    
    /**
     * Calculate text similarity
     */
    calculateTextSimilarity(query, text) {
        const queryWords = query.split(/\s+/).filter(w => w.length > 2);
        const textLower = text.toLowerCase();
        
        let matches = 0;
        queryWords.forEach(word => {
            if (textLower.includes(word)) {
                matches++;
            }
        });
        
        return matches / queryWords.length;
    }
    
    /**
     * Display search results
     */
    displaySearchResults(results, query) {
        const panel = document.getElementById('searchResultsPanel');
        const content = document.getElementById('searchResultsContent');
        
        if (results.length === 0) {
            content.innerHTML = `
                <div class="no-results">
                    <p>No results found for "${query}"</p>
                    <p>Try different keywords or browse the portfolio sections above.</p>
                </div>
            `;
        } else {
            // Group by section
            const grouped = {};
            results.forEach(result => {
                const section = result.section || 'Other';
                if (!grouped[section]) grouped[section] = [];
                grouped[section].push(result);
            });
            
            content.innerHTML = Object.entries(grouped).map(([section, items]) => `
                <div class="search-result-group">
                    <h3>${section} <span class="result-count">(${items.length})</span></h3>
                    ${items.map(item => `
                        <div class="search-result-item">
                            <div class="search-result-header">
                                <span class="result-title">${item.project || section}</span>
                                <span class="relevance-badge">${Math.round(item.similarity * 100)}%</span>
                            </div>
                            <p class="result-text">${item.text}</p>
                        </div>
                    `).join('')}
                </div>
            `).join('');
        }
        
        panel.classList.remove('hidden');
        document.getElementById('search-bar-container').style.display = 'none';
    }
    
    /**
     * Close search results
     */
    closeSearchResults() {
        const panel = document.getElementById('searchResultsPanel');
        panel.classList.add('hidden');
        document.getElementById('search-bar-container').style.display = 'flex';
        document.getElementById('searchInput').value = '';
    }
    
    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Search
        const searchBtn = document.getElementById('searchBtn');
        const searchInput = document.getElementById('searchInput');
        const closeSearchBtn = document.getElementById('closeSearchBtn');
        
        searchBtn?.addEventListener('click', () => {
            this.performSearch(searchInput.value);
        });
        
        searchInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.performSearch(searchInput.value);
            }
        });
        
        closeSearchBtn?.addEventListener('click', () => {
            this.closeSearchResults();
        });
        
        // Drawer
        const menuBtn = document.getElementById('menuBtn');
        const closeDrawer = document.getElementById('closeDrawer');
        const drawer = document.getElementById('drawer');
        const drawerOverlay = document.getElementById('drawerOverlay');
        
        menuBtn?.addEventListener('click', () => this.openDrawer());
        closeDrawer?.addEventListener('click', () => this.closeDrawer());
        drawerOverlay?.addEventListener('click', () => this.closeDrawer());
        
        // Feedback
        const feedbackBtn = document.getElementById('feedbackBtn');
        const feedbackBubble = document.getElementById('feedbackBubble');
        const closeFeedbackModal = document.getElementById('closeFeedbackModal');
        const dismissFeedback = document.getElementById('dismissFeedback');
        
        feedbackBtn?.addEventListener('click', () => this.showFeedbackModal());
        feedbackBubble?.addEventListener('click', () => this.showFeedbackModal());
        dismissFeedback?.addEventListener('click', () => this.dismissFeedbackBubble());
        closeFeedbackModal?.addEventListener('click', () => this.closeFeedbackModal());
        
        // Accessibility mode
        const accessibilityMode = document.getElementById('accessibilityMode');
        accessibilityMode?.addEventListener('change', (e) => {
            if (e.target.checked) {
                document.body.classList.add('accessibility-mode');
            } else {
                document.body.classList.remove('accessibility-mode');
            }
        });
        
        // AI toggle (handled by chatbot.js, but track time here)
        const aiToggle = document.getElementById('aiToggle');
        aiToggle?.addEventListener('change', (e) => {
            this.trackModeSwitch(e.target.checked ? 'chat' : 'portfolio');
        });
    }
    
    /**
     * Open drawer
     */
    openDrawer() {
        const drawer = document.getElementById('drawer');
        const overlay = document.getElementById('drawerOverlay');
        drawer?.classList.add('open');
        overlay?.classList.add('active');
    }
    
    /**
     * Close drawer
     */
    closeDrawer() {
        const drawer = document.getElementById('drawer');
        const overlay = document.getElementById('drawerOverlay');
        drawer?.classList.remove('open');
        overlay?.classList.remove('active');
    }
    
    /**
     * Track mode switching for feedback
     */
    trackModeSwitch(newMode) {
        const now = Date.now();
        const elapsed = now - this.timeTracking.modeStartTime;
        
        if (this.timeTracking.currentMode === 'chat') {
            this.timeTracking.chatTime += elapsed;
        } else {
            this.timeTracking.portfolioTime += elapsed;
        }
        
        this.timeTracking.currentMode = newMode;
        this.timeTracking.modeStartTime = now;
    }
    
    /**
     * Setup feedback tracking
     */
    setupFeedbackTracking() {
        setTimeout(() => {
            const totalTime = (Date.now() - this.timeTracking.startTime) / 1000 / 60; // minutes
            if (totalTime >= 2 && !this.feedbackShown && !this.feedbackDismissed) {
                this.showFeedbackBubble();
            }
        }, 2 * 60 * 1000); // 2 minutes
    }
    
    /**
     * Show feedback bubble
     */
    showFeedbackBubble() {
        const bubble = document.getElementById('feedbackBubble');
        if (bubble) {
            bubble.classList.remove('hidden');
            this.feedbackShown = true;
        }
    }
    
    /**
     * Dismiss feedback bubble
     */
    dismissFeedbackBubble() {
        const bubble = document.getElementById('feedbackBubble');
        if (bubble) {
            bubble.classList.add('hidden');
            this.feedbackDismissed = true;
        }
    }
    
    /**
     * Show feedback modal
     */
    showFeedbackModal() {
        const modal = document.getElementById('feedbackModal');
        const container = document.getElementById('feedbackFormContainer');
        
        // Get extracted info from chatbot if available
        const extractedInfo = window.chatbotApp?.extractedInfo || {};
        
        container.innerHTML = `
            <h2>Share Your Feedback</h2>
            <p>Your feedback helps improve this portfolio experience!</p>
            
            <form id="feedbackForm" style="margin-top: 1.5rem;">
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">What would you like to share?</label>
                    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                        <label style="display: flex; align-items: center; gap: 0.5rem;">
                            <input type="checkbox" name="analytics" checked>
                            <span>Time spent and interaction analytics</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.5rem;">
                            <input type="checkbox" name="context">
                            <span>Chat conversation context</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.5rem;">
                            <input type="checkbox" name="contact">
                            <span>My contact information</span>
                        </label>
                    </div>
                </div>
                
                <div style="margin-bottom: 1rem;">
                    <label for="feedbackName" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Name</label>
                    <input type="text" id="feedbackName" value="${extractedInfo.name || ''}" style="width: 100%; padding: 0.5rem; border: 1px solid var(--border); border-radius: var(--radius-md);">
                </div>
                
                <div style="margin-bottom: 1rem;">
                    <label for="feedbackEmail" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Email</label>
                    <input type="email" id="feedbackEmail" value="${extractedInfo.email || ''}" style="width: 100%; padding: 0.5rem; border: 1px solid var(--border); border-radius: var(--radius-md);">
                </div>
                
                <div style="margin-bottom: 1rem;">
                    <label for="feedbackCompany" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Company (optional)</label>
                    <input type="text" id="feedbackCompany" value="${extractedInfo.company || ''}" style="width: 100%; padding: 0.5rem; border: 1px solid var(--border); border-radius: var(--radius-md);">
                </div>
                
                <div style="margin-bottom: 1.5rem;">
                    <label for="feedbackMessage" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Message</label>
                    <textarea id="feedbackMessage" rows="5" style="width: 100%; padding: 0.5rem; border: 1px solid var(--border); border-radius: var(--radius-md); resize: vertical;"></textarea>
                </div>
                
                <button type="submit" class="btn-primary" style="width: 100%;">Send Feedback</button>
            </form>
        `;
        
        modal.classList.remove('hidden');
        this.dismissFeedbackBubble();
        
        // Form submission
        const form = document.getElementById('feedbackForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitFeedback();
        });
    }
    
    /**
     * Close feedback modal
     */
    closeFeedbackModal() {
        const modal = document.getElementById('feedbackModal');
        modal?.classList.add('hidden');
    }
    
    /**
     * Submit feedback via mailto
     */
    submitFeedback() {
        const form = document.getElementById('feedbackForm');
        const formData = new FormData(form);
        
        const name = document.getElementById('feedbackName').value;
        const email = document.getElementById('feedbackEmail').value;
        const company = document.getElementById('feedbackCompany').value;
        const message = document.getElementById('feedbackMessage').value;
        
        const includeAnalytics = form.querySelector('[name="analytics"]').checked;
        const includeContext = form.querySelector('[name="context"]').checked;
        const includeContact = form.querySelector('[name="contact"]').checked;
        
        let body = `Feedback from ${name || 'Anonymous'}\n\n`;
        
        if (includeContact && (email || company)) {
            body += `Contact Information:\n`;
            if (email) body += `Email: ${email}\n`;
            if (company) body += `Company: ${company}\n`;
            body += `\n`;
        }
        
        if (message) {
            body += `Message:\n${message}\n\n`;
        }
        
        if (includeAnalytics) {
            const totalTime = (Date.now() - this.timeTracking.startTime) / 1000 / 60;
            body += `Analytics:\n`;
            body += `Total time: ${totalTime.toFixed(1)} minutes\n`;
            body += `Portfolio time: ${(this.timeTracking.portfolioTime / 1000 / 60).toFixed(1)} minutes\n`;
            body += `Chat time: ${(this.timeTracking.chatTime / 1000 / 60).toFixed(1)} minutes\n`;
            body += `\n`;
        }
        
        if (includeContext && window.chatbotApp?.extractedInfo) {
            const info = window.chatbotApp.extractedInfo;
            body += `Conversation Context:\n`;
            if (info.context) body += `${info.context}\n`;
            body += `\n`;
        }
        
        const subject = `Portfolio Feedback from ${name || 'Anonymous'}`;
        const mailto = `mailto:hello@vitordesign.pt?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        window.location.href = mailto;
        
        this.closeFeedbackModal();
        this.showAlert('Opening email client...', 'success');
    }
    
    /**
     * Show alert message
     */
    showAlert(message, type = 'info') {
        const container = document.getElementById('alertContainer');
        if (!container) return;
        
        const alert = document.createElement('div');
        alert.className = `alert ${type}`;
        alert.innerHTML = `
            <span class="alert-message">${message}</span>
            <button class="alert-close" aria-label="Close">×</button>
        `;
        
        container.classList.remove('hidden');
        container.appendChild(alert);
        
        // Close button
        alert.querySelector('.alert-close').addEventListener('click', () => {
            alert.remove();
            if (container.children.length === 0) {
                container.classList.add('hidden');
            }
        });
        
        // Auto dismiss after 5 seconds
        setTimeout(() => {
            alert.remove();
            if (container.children.length === 0) {
                container.classList.add('hidden');
            }
        }, 5000);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.portfolioApp = new PortfolioApp();
    });
} else {
    window.portfolioApp = new PortfolioApp();
}
