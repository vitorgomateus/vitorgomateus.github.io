// Input bar handling - search & chat send

import state from '../../core/state.js';
import { addMessage, addProgressMessage, addSystemMessage, hideTypingIndicator, showTypingIndicator, updateProgress } from '../chatbot/messages.js';
import { checkWebGPUSupport, generateResponse, getNextSuggestions, getRandomGreeting, initModel } from '../chatbot/model.js';
import { setVisibleChunks } from '../portfolio/render.js';
import { resultsToChunkIds, searchEmbeddings } from '../portfolio/search.js';
import { showAlert } from './alerts.js';

let chatInitialized = false;
let permissionGranted = false;

// Handle input submission (search or chat)
export async function handleInput() {
  const textarea = document.getElementById('user-input');
  if (!textarea) return;

  const value = textarea.value.trim();
  if (!value) return;

  textarea.value = '';
  resetTextareaHeight(textarea);

  if (state.experimentalMode) {
    await handleChatInput(value);
  } else {
    await handleSearchInput(value);
  }
}

// Handle search in portfolio mode
async function handleSearchInput(query) {
  const results = await searchEmbeddings(query, { minWords: 1 });
  if (results.length === 0) {
    showAlert('No matching results found. Try different terms.', 'info');
    return;
  }

  const chunkIds = resultsToChunkIds(results);
  setVisibleChunks(chunkIds, 'filter');

  // Scroll to top of results
  const main = document.getElementById('main-content');
  if (main) main.scrollTop = 0;
}

// Handle chat message
async function handleChatInput(message) {
  // Add user message to UI
  addMessage(message, 'user');

  // If waiting for permission
  if (!permissionGranted && !state.isModelLoaded && !state.isModelLoading) {
    const isYes = message.toLowerCase().includes('yes');
    if (isYes) {
      permissionGranted = true;
      await startModelDownload();
    } else {
      addMessage("No worries! You can always enable the AI later. For now, try the portfolio search instead.", 'bot');
    }
    return;
  }

  // If model not yet loaded, wait
  if (!state.isModelLoaded) {
    addMessage("The model is still loading. Please wait a moment!", 'bot');
    return;
  }

  // Generate response
  const indicator = showTypingIndicator();
  const inputBtn = document.getElementById('input-btn');
  if (inputBtn) inputBtn.disabled = true;

  try {
    const response = await generateResponse(message);
    hideTypingIndicator();
    addMessage(response, 'bot');

    // Show next suggestions
    showSuggestions();
  } catch (error) {
    hideTypingIndicator();
    console.error('[input] Generation error:', error);
    addMessage("Sorry, I had trouble generating a response. Please try again.", 'bot');
  } finally {
    if (inputBtn) inputBtn.disabled = false;
  }
}

// Initialize chat when experimental mode is first activated
export function initChat() {
  if (chatInitialized) return;
  chatInitialized = true;

  // Disclaimer message
  addSystemMessage(
    '<span class="message__icon">🔒</span> <strong>100% Private</strong><br>Everything runs locally in your browser. Zero server communication. Your messages never leave your device.'
  );

  // WebGPU check
  if (!checkWebGPUSupport()) {
    addSystemMessage(
      '<span class="message__icon">⚠️</span> Your browser doesn\'t support WebGPU. The AI chatbot requires Chrome or Edge 113+.'
    );
    return;
  }

  // Permission request
  setTimeout(() => {
    addMessage(
      "To chat with me, I need to download a small AI model (~1.9GB). It's a one-time download and will be cached for future visits. Ready to proceed?",
      'bot'
    );

    // Show "Yes!" suggestion
    showPermissionSuggestion();
  }, 800);
}

// Start model download after permission
async function startModelDownload() {
  addProgressMessage();

  try {
    await initModel((progress) => {
      updateProgress(progress);
    });

    // Model loaded - show greeting
    const greeting = getRandomGreeting();
    addMessage(greeting, 'bot');

    // Show suggestions
    state.showSuggestions = true;
    showSuggestions();

    showAlert('AI model loaded and ready!', 'success');
  } catch (error) {
    console.error('[input] Model loading failed:', error);
    addMessage("I'm sorry, there was an error loading the AI model. Please try refreshing the page.", 'bot');
    showAlert('Failed to load AI model.', 'error');
  }
}

// Show permission suggestion ("Yes!")
function showPermissionSuggestion() {
  const container = document.getElementById('suggestions-container');
  if (!container) return;

  container.innerHTML = '';
  container.hidden = false;

  const btn = document.createElement('button');
  btn.className = 'suggestion-btn';
  btn.textContent = 'Yes!';
  btn.addEventListener('click', () => {
    container.hidden = true;
    const textarea = document.getElementById('user-input');
    if (textarea) textarea.value = 'Yes!';
    handleInput();
  });
  container.appendChild(btn);
}

// Show chat suggestions
export function showSuggestions() {
  if (!state.experimentalMode || !state.showSuggestions) return;

  const container = document.getElementById('suggestions-container');
  if (!container) return;

  container.innerHTML = '';
  container.hidden = false;

  const suggestions = getNextSuggestions();
  suggestions.forEach(text => {
    const btn = document.createElement('button');
    btn.className = 'suggestion-btn';
    btn.textContent = text;
    btn.addEventListener('click', () => {
      const textarea = document.getElementById('user-input');
      if (textarea) textarea.value = text;
      container.hidden = true;
      handleInput();
    });
    container.appendChild(btn);
  });
}

export function restoreChatSuggestions() {
  if (!state.experimentalMode) return;

  const container = document.getElementById('suggestions-container');
  if (!container) return;

  if (!state.isModelLoaded && !state.isModelLoading && !permissionGranted) {
    showPermissionSuggestion();
    return;
  }

  if (state.isModelLoaded && state.showSuggestions) {
    showSuggestions();
    return;
  }

  container.hidden = true;
}

// Auto-resize textarea
export function setupTextareaResize() {
  const textarea = document.getElementById('user-input');
  if (!textarea) return;

  textarea.addEventListener('input', () => {
    resetTextareaHeight(textarea);
    textarea.style.height = Math.min(textarea.scrollHeight, 96) + 'px';
  });
}

function resetTextareaHeight(textarea) {
  textarea.style.height = 'auto';
}

// Close expanded view and return to full portfolio
export function closeExpandedView() {
  const expandedProjectId = state.expandedProject;
  setVisibleChunks(null);

  const main = document.getElementById('main-content');
  if (!main) return;

  if (expandedProjectId) {
    const project = document.getElementById(`project-${expandedProjectId}`);
    if (project) {
      main.scrollTop = Math.max(0, project.offsetTop - 12);
      return;
    }
  }

  main.scrollTop = 0;
}
