// Chat message handling and DOM operations

import state from '../../core/state.js';

const MAX_MESSAGES = 50;
const PRUNE_PERCENT = 0.25;

// Add a message to the chat UI
export function addMessage(content, type = 'bot', options = {}) {
  const container = document.getElementById('chat-messages');
  if (!container) return null;

  const messageEl = document.createElement('div');
  messageEl.className = `message message--${type}`;

  if (options.icon) {
    const iconEl = document.createElement('span');
    iconEl.className = 'message__icon';
    iconEl.textContent = options.icon;
    messageEl.appendChild(iconEl);
  }

  if (options.html) {
    messageEl.innerHTML += content;
  } else {
    const textNode = document.createTextNode(content);
    messageEl.appendChild(textNode);
  }

  container.appendChild(messageEl);

  // Track in state
  state.chatMessages.push({ content, type, timestamp: Date.now() });

  // Prune if needed
  pruneMessages();

  // Scroll to bottom
  scrollToBottom();

  return messageEl;
}

// Add system message (centered, no bubble, supports HTML content)
export function addSystemMessage(content, html = true) {
  return addMessage(content, 'system', { html });
}

// Show typing indicator
export function showTypingIndicator() {
  const container = document.getElementById('chat-messages');
  if (!container) return null;

  const indicator = document.createElement('div');
  indicator.className = 'typing-indicator';
  indicator.id = 'typing-indicator';
  indicator.setAttribute('aria-label', 'Goma is typing');

  for (let i = 0; i < 3; i++) {
    const dot = document.createElement('span');
    dot.className = 'typing-indicator__dot';
    indicator.appendChild(dot);
  }

  container.appendChild(indicator);
  scrollToBottom();
  return indicator;
}

// Remove typing indicator
export function hideTypingIndicator() {
  const indicator = document.getElementById('typing-indicator');
  if (indicator) indicator.remove();
}

// Add progress bar message for model loading
export function addProgressMessage() {
  const container = document.getElementById('chat-messages');
  if (!container) return null;

  const messageEl = document.createElement('div');
  messageEl.className = 'message message--system';
  messageEl.id = 'model-progress-message';

  const statusText = document.createElement('p');
  statusText.id = 'model-progress-status';
  statusText.textContent = 'Preparing model...';
  messageEl.appendChild(statusText);

  const progressBar = document.createElement('div');
  progressBar.className = 'progress-bar';

  const progressFill = document.createElement('div');
  progressFill.className = 'progress-bar__fill';
  progressFill.id = 'model-progress-fill';
  progressBar.appendChild(progressFill);

  messageEl.appendChild(progressBar);
  container.appendChild(messageEl);

  scrollToBottom();
  return messageEl;
}

// Update progress bar
export function updateProgress(progress) {
  const fill = document.getElementById('model-progress-fill');
  const status = document.getElementById('model-progress-status');

  if (fill && progress.progress !== undefined) {
    const percent = Math.round(progress.progress * 100);
    fill.style.width = `${percent}%`;
  }

  if (status && progress.text) {
    // Simplify status text
    let text = progress.text;
    if (text.includes('Loading')) text = 'Loading model...';
    if (text.includes('Finish')) text = 'Almost ready...';
    status.textContent = text;
  }
}

// Prune oldest messages when limit reached
function pruneMessages() {
  const container = document.getElementById('chat-messages');
  if (!container) return;

  const messages = container.querySelectorAll('.message');
  if (messages.length > MAX_MESSAGES) {
    const removeCount = Math.ceil(MAX_MESSAGES * PRUNE_PERCENT);
    for (let i = 0; i < removeCount && i < messages.length; i++) {
      messages[i].remove();
    }
    state.chatMessages.splice(0, removeCount);
    console.log(`[messages] Pruned ${removeCount} old messages`);
  }
}

// Smooth scroll to bottom of chat
function scrollToBottom() {
  const main = document.getElementById('main-content');
  if (!main) return;

  requestAnimationFrame(() => {
    main.scrollTop = main.scrollHeight;
  });
}
