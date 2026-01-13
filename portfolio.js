/**
 * Portfolio Data Renderer
 * Renders education, experience, and projects from data.json
 * Clean, modern card-based layout with accessible modal system
 */

let siteData = null;
let lastFocusedElement = null;

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  setupModalHandlers();
  setupKeyboardNav();
});

/**
 * Fetch and render data from JSON
 */
async function loadData() {
  try {
    const response = await fetch('data.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    siteData = await response.json();
    renderAll();
  } catch (error) {
    console.error('[portfolio.js] Error loading data:', error);
    showError('Failed to load portfolio data. Please refresh the page.');
  }
}

/**
 * Render all sections
 */
function renderAll() {
  if (!siteData) return;
  
  renderSummary(siteData.personal);
  renderSkills(siteData.personal.skills);
  renderLanguages(siteData.personal.languages);
  renderEducation(siteData.education);
  renderExperience(siteData.experience);
  renderProjects(siteData.projects.filter(p => p.active));
}

/**
 * Render executive summary
 */
function renderSummary(personal) {
  const container = document.getElementById('summary-container');
  if (!container || !personal) return;
  
  container.innerHTML = `
    <div class="summary-content">
      <p class="summary-text">${personal.summary}</p>
      <div class="summary-contact">
        <a href="mailto:${personal.email}" class="contact-link">${personal.email}</a> •
        <a href="tel:${personal.phone}" class="contact-link">${personal.phone}</a>
      </div>
    </div>
  `;
}

/**
 * Render skills section
 */
function renderSkills(skills) {
  const container = document.getElementById('skills-container');
  if (!container || !skills) return;
  
  container.innerHTML = skills.map(skill => `
    <article class="portfolio-card portfolio-card-static skills-card" role="article">
      <div class="card-content">
        <h3 class="card-title">${skill.category}</h3>
        <p class="card-description">${skill.description}</p>
        <div class="card-skills" aria-label="Tools and technologies">
          ${skill.tools.map(tool => 
            `<span class="skill-tag">${tool}</span>`
          ).join('')}
        </div>
      </div>
    </article>
  `).join('');
}

/**
 * Render languages
 */
function renderLanguages(languages) {
  const container = document.getElementById('languages-container');
  if (!container || !languages) return;
  
  const languageList = Object.entries(languages).map(([lang, level]) => 
    `<span class="language-item"><strong>${lang.charAt(0).toUpperCase() + lang.slice(1)}:</strong> ${level}</span>`
  ).join(' • ');
  
  container.innerHTML = `<p class="languages-list">${languageList}</p>`;
}

/**
 * Render education cards
 */
function renderEducation(education) {
  const container = document.getElementById('education-container');
  if (!container || !education) return;
  
  container.innerHTML = education.map(edu => `
    <article class="portfolio-card portfolio-card-static" role="article">
      <div class="card-content">
        <h3 class="card-title">${edu.degree}</h3>
        <p class="card-subtitle">
          ${edu.institutionUrl 
            ? `<a href="${edu.institutionUrl}" target="_blank" rel="noopener noreferrer" class="card-link">${edu.institution}</a>`
            : edu.institution
          }
        </p>
        <p class="card-meta">${edu.period} • ${edu.location}</p>
        <p class="card-description">${edu.focus}</p>
      </div>
    </article>
  `).join('');
}

/**
 * Render experience cards
 */
function renderExperience(experience) {
  const container = document.getElementById('experience-container');
  if (!container || !experience) return;
  
  container.innerHTML = experience.map(exp => `
    <article class="portfolio-card portfolio-card-static" role="article">
      <div class="card-content">
        <h3 class="card-title">${exp.title}</h3>
        <p class="card-subtitle">
          ${exp.companyUrl 
            ? `<a href="${exp.companyUrl}" target="_blank" rel="noopener noreferrer" class="card-link">${exp.company}</a>`
            : exp.company
          }
        </p>
        <p class="card-meta">${exp.period} • ${exp.location}</p>
        <p class="card-description">${exp.description}</p>
      </div>
    </article>
  `).join('');
}

/**
 * Render project cards (active only)
 */
function renderProjects(projects) {
  const container = document.getElementById('projects-container');
  if (!container || !projects) return;
  
  container.innerHTML = projects.map(project => {
    const firstImage = project.images && project.images.length > 0 
      ? project.images[0] 
      : null;
    
    return `
      <article class="portfolio-card portfolio-card-clickable" 
               role="button" 
               tabindex="0"
               data-project-id="${project.id}"
               aria-label="View ${project.title} project details">
        ${firstImage ? `
          <div class="card-image" role="img" aria-label="${firstImage.alt || project.title}">
            <img src="${firstImage.src}" alt="${firstImage.alt || project.title}" loading="lazy">
          </div>
        ` : ''}
        <div class="card-content">
          <h3 class="card-title">${project.title}</h3>
          <p class="card-subtitle">${project.subtitle}</p>
          <p class="card-meta">${project.year}${project.company ? ` • ${project.company}` : ''}</p>
          <p class="card-description">${project.shortDescription}</p>
          <div class="card-skills" aria-label="Skills used">
            ${project.skills.slice(0, 3).map(skill => 
              `<span class="skill-tag">${skill}</span>`
            ).join('')}
            ${project.skills.length > 3 ? `<span class="skill-tag">+${project.skills.length - 3}</span>` : ''}
          </div>
        </div>
      </article>
    `;
  }).join('');
  
  // Add click/keyboard handlers to project cards
  container.querySelectorAll('[data-project-id]').forEach(card => {
    card.addEventListener('click', () => openProjectModal(card.dataset.projectId));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openProjectModal(card.dataset.projectId);
      }
    });
  });
}

/**
 * Open project modal
 */
function openProjectModal(projectId) {
  const project = siteData.projects.find(p => p.id === projectId);
  if (!project) return;
  
  // Store last focused element for restoration
  lastFocusedElement = document.activeElement;
  
  // Create modal
  const modal = document.createElement('div');
  modal.className = 'project-modal';
  modal.id = 'project-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'modal-title');
  
  modal.innerHTML = `
    <div class="modal-overlay" aria-hidden="true"></div>
    <div class="modal-content" role="document">
      <div class="modal-inner">
      <header class="modal-header">
        <h2 id="modal-title" class="modal-title">${project.title}</h2>
        <button class="modal-close" 
                aria-label="Close project details" 
                title="Close (Esc)">
          <span aria-hidden="true">&times;</span>
        </button>
      </header>
      
      <div class="modal-body">
        <p class="modal-meta">${project.year} • ${project.company} • ${project.role}</p>
        
        ${project.images && project.images.length > 0 ? `
          <div class="modal-images" role="list" aria-label="Project images">
            ${project.images.map(img => `
              <figure class="modal-image" role="listitem">
                <img src="${img.bigSrc || img.src}" 
                     alt="${img.alt || project.title}" 
                     loading="lazy">
                ${img.caption ? `<figcaption>${img.caption}</figcaption>` : ''}
              </figure>
            `).join('')}
          </div>
        ` : ''}
        
        <div class="modal-description">
          ${project.fullDescription}
        </div>
        
        <div class="modal-skills" role="list" aria-label="Technologies and skills">
          ${project.skills.map(skill => 
            `<span class="skill-tag" role="listitem">${skill}</span>`
          ).join('')}
        </div>
      </div>
      
      <footer class="modal-footer">
        <button class="modal-close-btn" aria-label="Close project details">
          Close
        </button>
      </footer>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  
  // Animate in
  requestAnimationFrame(() => {
    modal.classList.add('modal-open');
  });
  
  // Focus first focusable element (close button)
  const closeBtn = modal.querySelector('.modal-close');
  if (closeBtn) closeBtn.focus();
  
  // Setup close handlers
  modal.querySelector('.modal-overlay').addEventListener('click', closeProjectModal);
  modal.querySelectorAll('.modal-close, .modal-close-btn').forEach(btn => {
    btn.addEventListener('click', closeProjectModal);
  });
  
  // Update URL without navigation
  history.pushState({ projectId }, '', `#project-${projectId}`);
}

/**
 * Close project modal
 */
function closeProjectModal() {
  const modal = document.getElementById('project-modal');
  if (!modal) return;
  
  // Animate out
  modal.classList.remove('modal-open');
  
  setTimeout(() => {
    modal.remove();
    document.body.style.overflow = '';
    
    // Restore focus
    if (lastFocusedElement) {
      lastFocusedElement.focus();
      lastFocusedElement = null;
    }
  }, 300);
  
  // Update URL
  history.pushState(null, '', window.location.pathname);
}

/**
 * Setup modal keyboard handlers
 */
function setupModalHandlers() {
  document.addEventListener('keydown', (e) => {
    const modal = document.getElementById('project-modal');
    if (!modal) return;
    
    // ESC to close
    if (e.key === 'Escape') {
      closeProjectModal();
    }
    
    // Trap focus within modal
    if (e.key === 'Tab') {
      trapFocus(modal, e);
    }
  });
}

/**
 * Trap focus within modal (accessibility)
 */
function trapFocus(modal, event) {
  const focusableElements = modal.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus();
  } else if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
}

/**
 * Setup keyboard navigation
 */
function setupKeyboardNav() {
  // Handle browser back/forward
  window.addEventListener('popstate', (e) => {
    const modal = document.getElementById('project-modal');
    if (modal) {
      closeProjectModal();
    } else if (e.state?.projectId) {
      openProjectModal(e.state.projectId);
    }
  });
}

/**
 * Show error message
 */
function showError(message) {
  const containers = [
    'summary-container',
    'skills-container',
    'education-container',
    'experience-container', 
    'projects-container'
  ];
  
  containers.forEach(id => {
    const container = document.getElementById(id);
    if (container) {
      container.innerHTML = `
        <div role="alert" class="error-message">
          <p>${message}</p>
        </div>
      `;
    }
  });
}
