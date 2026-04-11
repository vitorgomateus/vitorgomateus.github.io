// Event delegation setup

import { clearModelCache } from '../features/chatbot/model.js';
import { setVisibleChunks } from '../features/portfolio/render.js';
import { showAlert } from '../features/ui/alerts.js';
import { closeDrawer, openDrawer, toggleAccessibility, toggleExperimentalMode } from '../features/ui/header.js';
import { closeExpandedView, handleInput, initChat } from '../features/ui/input.js';
import { initLightbox } from '../features/ui/lightbox.js';
import { initNavigation, pushNavigationState } from '../features/ui/navigation.js';
import state from './state.js';

export function setupEvents() {
  // Feature toggle
  const featureToggle = document.getElementById('feature-toggle');
  if (featureToggle) {
    featureToggle.addEventListener('click', () => {
      toggleExperimentalMode();
      if (state.experimentalMode) initChat();
      pushNavigationState();
    });
  }

  // Menu button
  const menuBtn = document.getElementById('menu-btn');
  if (menuBtn) {
    menuBtn.addEventListener('click', openDrawer);
  }

  // Drawer close
  const drawerCloseBtn = document.getElementById('drawer-close-btn');
  if (drawerCloseBtn) {
    drawerCloseBtn.addEventListener('click', closeDrawer);
  }

  const drawerOverlay = document.getElementById('drawer-overlay');
  if (drawerOverlay) {
    drawerOverlay.addEventListener('click', closeDrawer);
  }

  // AI teaser button in Now section
  const aiTeaserBtn = document.getElementById('ai-teaser-btn');
  if (aiTeaserBtn) {
    aiTeaserBtn.addEventListener('click', () => {
      const featureToggle = document.getElementById('feature-toggle');
      if (featureToggle && !state.experimentalMode) featureToggle.click();
    });
  }

  // Close expanded view button (the entire close bar)
  const closeBar = document.getElementById('close-bar');
  if (closeBar) {
    closeBar.addEventListener('click', closeExpandedView);
  }

  // Input bar
  const inputBtn = document.getElementById('input-btn');
  if (inputBtn) {
    inputBtn.addEventListener('click', handleInput);
  }

  const inputTextarea = document.getElementById('user-input');
  if (inputTextarea) {
    inputTextarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleInput();
      }
    });
  }

  // Project clicks (delegated)
  const portfolioContainer = document.getElementById('portfolio-container');
  if (portfolioContainer) {
    portfolioContainer.addEventListener('click', (e) => {
      const readFull = e.target.closest('.portfolio__read-full-btn');
      if (readFull) {
        const project = readFull.closest('.portfolio__project');
        if (project) handleProjectClick(project.getAttribute('data-project-id'));
        return;
      }

      const summary = e.target.closest('.portfolio__project-summary');
      if (summary) {
        if (summary.getAttribute('data-search-locked') === 'true') return;
        const project = summary.closest('.portfolio__project');
        if (project) {
          const projectId = project.getAttribute('data-project-id');
          handleProjectClick(projectId);
        }
      }
    });

    portfolioContainer.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const summary = e.target.closest('.portfolio__project-summary');
        if (summary) {
          e.preventDefault();
          if (summary.getAttribute('data-search-locked') === 'true') return;
          const project = summary.closest('.portfolio__project');
          if (project) {
            const projectId = project.getAttribute('data-project-id');
            handleProjectClick(projectId);
          }
        }
      }
    });
  }

  // Clear cache button
  const clearCacheBtn = document.getElementById('clear-cache-btn');
  if (clearCacheBtn) {
    clearCacheBtn.addEventListener('click', async () => {
      if (confirm('Remove the cached AI model? You will need to download it again.')) {
        try {
          await clearModelCache();
          showAlert('Model cache cleared successfully.', 'success');
          closeDrawer();
        } catch (error) {
          showAlert('Failed to clear cache.', 'error');
        }
      }
    });
  }

  // Test alert button
  const testAlertBtn = document.getElementById('test-alert-btn');
  if (testAlertBtn) {
    testAlertBtn.addEventListener('click', () => {
      showAlert('This is a test alert notification.', 'primary');
    });
  }

  // Accessibility toggle
  const accessibilityToggle = document.getElementById('accessibility-toggle');
  if (accessibilityToggle) {
    accessibilityToggle.addEventListener('click', toggleAccessibility);
  }

  // Feedback button in drawer
  const feedbackBtn = document.getElementById('feedback-btn');
  if (feedbackBtn) {
    feedbackBtn.addEventListener('click', () => {
      closeDrawer();
      openFeedbackModal();
    });
  }

  // Feedback modal close
  const feedbackModalClose = document.getElementById('feedback-modal-close');
  if (feedbackModalClose) {
    feedbackModalClose.addEventListener('click', closeFeedbackModal);
  }

  const feedbackModalOverlay = document.getElementById('feedback-modal-overlay');
  if (feedbackModalOverlay) {
    feedbackModalOverlay.addEventListener('click', closeFeedbackModal);
  }

  // Feedback form submit
  const feedbackForm = document.getElementById('feedback-form');
  if (feedbackForm) {
    feedbackForm.addEventListener('submit', (e) => {
      e.preventDefault();
      submitFeedback();
    });
  }

  // Global Escape key handler
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      // Close in priority order: modal > drawer > expanded view
      const modal = document.getElementById('feedback-modal');
      const drawer = document.getElementById('settings-drawer');
      const closeBar = document.getElementById('close-bar');

      if (modal && !modal.hidden) {
        closeFeedbackModal();
      } else if (drawer && !drawer.hidden) {
        closeDrawer();
      } else if (closeBar && !closeBar.hidden) {
        closeExpandedView();
      }
    }
  });

  // Feedback timer
  // disabled for now
  // Should we use this?
  // setupFeedbackTimer();

  // setupChatPromptTimer(); // replaced by the AI teaser in the Now section

  // Initialize navigation and lightbox
  initNavigation();
  initLightbox();
}

// Handle project click
function handleProjectClick(projectId) {
  if (!projectId) return;

  if (state.expandedProject === projectId) {
    // Already expanded, collapse
    closeExpandedView();
    return;
  }

  setVisibleChunks([`project-${projectId}`], 'project');
  state.expandedProject = projectId;

  // Push navigation state for browser back button
  pushNavigationState();

  // Jump to top directly (no smooth behavior)
  const main = document.getElementById('main-content');
  if (main) main.scrollTop = 0;
}

// Feedback modal
function openFeedbackModal() {
  const modal = document.getElementById('feedback-modal');
  const overlay = document.getElementById('feedback-modal-overlay');
  const bubble = document.getElementById('feedback-bubble');

  if (modal) modal.hidden = false;
  if (overlay) overlay.hidden = false;
  if (bubble) bubble.hidden = true;

  // Pre-fill from extracted user data
  if (state.extractedUser.name) {
    const nameInput = document.getElementById('feedback-name');
    if (nameInput && !nameInput.value) nameInput.value = state.extractedUser.name;
  }
  if (state.extractedUser.email) {
    const emailInput = document.getElementById('feedback-email');
    if (emailInput && !emailInput.value) emailInput.value = state.extractedUser.email;
  }
  if (state.extractedUser.company) {
    const companyInput = document.getElementById('feedback-company');
    if (companyInput && !companyInput.value) companyInput.value = state.extractedUser.company;
  }

  // Focus first input
  const firstInput = document.getElementById('feedback-name');
  if (firstInput) firstInput.focus();

  // Focus trap
  trapFocus(modal);
}

function closeFeedbackModal() {
  const modal = document.getElementById('feedback-modal');
  const overlay = document.getElementById('feedback-modal-overlay');

  if (modal) modal.hidden = true;
  if (overlay) overlay.hidden = true;
}

function submitFeedback() {
  const name = document.getElementById('feedback-name')?.value || '';
  const email = document.getElementById('feedback-email')?.value || '';
  const company = document.getElementById('feedback-company')?.value || '';
  const message = document.getElementById('feedback-message')?.value || '';

  // Build mailto
  const subject = encodeURIComponent(`Portfolio Feedback from ${name || 'Visitor'}`);
  const body = encodeURIComponent(
    `Name: ${name}\nEmail: ${email}\nCompany: ${company}\n\nMessage:\n${message}\n\n---\nPortfolio time: ${Math.round(state.portfolioTimeSpent / 1000)}s\nChat time: ${Math.round(state.chatTimeSpent / 1000)}s\nMessages sent: ${state.performance.messagesSent}`
  );

  window.open(`mailto:hello@vitordesign.pt?subject=${subject}&body=${body}`, '_self');

  closeFeedbackModal();
  showAlert('Thank you for your feedback!', 'success');
}

// Show feedback alert after 2 minutes
function setupFeedbackTimer() {
  setTimeout(() => {
    if (!state.feedbackDismissed && !state.feedbackShown) {
      showAlert('Share your thoughts?', 'primary', {
        onClick: openFeedbackModal
      });
      state.feedbackShown = true;
    }
  }, 2 * 60 * 1000);
}

// Show chat prompt after 6 seconds if not in chat mode
function setupChatPromptTimer() {
  setTimeout(() => {
    if (!state.experimentalMode && !state.chatPromptShown) {
      const alert = showAlert('Try the experimental chat system <strong>here</strong>.', 'primary', {
        html: true,
        onClick: () => {
          const featureToggle = document.getElementById('feature-toggle');
          if (featureToggle) {
            featureToggle.click();
          }
        },
        autoDismiss: 8000
      });
      state.chatPromptShown = true;
    }
  }, 6000);
}

// Focus trap for modals
function trapFocus(element) {
  if (!element) return;

  const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  const focusable = element.querySelectorAll(focusableSelectors);
  if (focusable.length === 0) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  const handler = (e) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  element._focusTrapHandler = handler;
  element.addEventListener('keydown', handler);
}
