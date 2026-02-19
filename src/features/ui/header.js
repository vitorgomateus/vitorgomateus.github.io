// Header UI - toggle, menu, random color, favicon

import state from '../../core/state.js';
import { restoreChatSuggestions } from './input.js';

// Set random primary color on load
export function setRandomPrimaryColor() {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 60 + Math.floor(Math.random() * 31);
  const lightness = 25 + Math.floor(Math.random() * 16);

  const primaryColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  const primaryDark = `hsl(${hue}, ${saturation}%, ${Math.max(15, lightness - 10)}%)`;

  document.documentElement.style.setProperty('--primary', primaryColor);
  document.documentElement.style.setProperty('--primary-dark', primaryDark);

  updateFavicon(hue, saturation, lightness);
}

// Generate favicon with primary color
function updateFavicon(hue, saturation, lightness) {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  // Circle background
  ctx.beginPath();
  ctx.arc(32, 32, 30, 0, Math.PI * 2);
  ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  ctx.fill();

  // White "i" letter
  ctx.fillStyle = 'white';
  ctx.font = 'bold 36px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('i', 32, 34);

  // Set as favicon
  const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
  link.type = 'image/png';
  link.rel = 'shortcut icon';
  link.href = canvas.toDataURL('image/png');
  document.getElementsByTagName('head')[0].appendChild(link);
}

// Toggle experimental mode
export function toggleExperimentalMode() {
  state.experimentalMode = !state.experimentalMode;

  const toggle = document.getElementById('feature-toggle');
  const portfolioContainer = document.getElementById('portfolio-container');
  const chatContainer = document.getElementById('chat-container');
  const inputBar = document.getElementById('input-bar');
  const inputTextarea = document.getElementById('user-input');
  const inputBtn = document.getElementById('input-btn');
  const inputBtnIcon = document.getElementById('input-btn-icon');
  const suggestionsContainer = document.getElementById('suggestions-container');
  const closeBtn = document.getElementById('close-view-btn');

  if (!toggle) return;

  toggle.setAttribute('aria-checked', String(state.experimentalMode));

  const toggleIcon = document.getElementById('feature-toggle-icon');

  if (state.experimentalMode) {
    // Switch to chat mode
    if (portfolioContainer) portfolioContainer.hidden = true;
    if (chatContainer) chatContainer.hidden = false;
    if (inputTextarea) inputTextarea.placeholder = 'Type a message...';
    if (inputBtn) inputBtn.title = 'Send';
    if (inputBtn) inputBtn.setAttribute('aria-label', 'Send message');
    if (closeBtn) closeBtn.hidden = true;
    if (inputBar) inputBar.hidden = false;

    // Update icon to send
    if (inputBtnIcon) {
      inputBtnIcon.setAttribute('data-feather', 'send');
      if (window.feather) window.feather.replace();
    }

    if (toggleIcon) {
      toggleIcon.setAttribute('data-feather', 'code');
      if (window.feather) window.feather.replace();
    }

    setTimeout(() => restoreChatSuggestions(), 100);

    // Track time
    if (state.portfolioStartTime) {
      state.portfolioTimeSpent += Date.now() - state.portfolioStartTime;
      state.portfolioStartTime = null;
    }
    state.chatStartTime = Date.now();
  } else {
    // Switch to portfolio mode
    if (portfolioContainer) portfolioContainer.hidden = false;
    if (chatContainer) chatContainer.hidden = true;
    if (suggestionsContainer) suggestionsContainer.hidden = true;
    if (inputTextarea) inputTextarea.placeholder = 'Search portfolio...';
    if (inputBtn) inputBtn.title = 'Search';
    if (inputBtn) inputBtn.setAttribute('aria-label', 'Search');

    // Update icon to search
    if (inputBtnIcon) {
      inputBtnIcon.setAttribute('data-feather', 'search');
      if (window.feather) window.feather.replace();
    }

    if (toggleIcon) {
      toggleIcon.setAttribute('data-feather', 'cpu');
      if (window.feather) window.feather.replace();
    }

    // Show input bar unless project/search is expanded
    if (!state.expandedProject && !state.searchActive) {
      if (inputBar) inputBar.hidden = false;
    }

    // Track time
    if (state.chatStartTime) {
      state.chatTimeSpent += Date.now() - state.chatStartTime;
      state.chatStartTime = null;
    }
    state.portfolioStartTime = Date.now();
  }

}

// Open settings drawer
export function openDrawer() {
  const drawer = document.getElementById('settings-drawer');
  const overlay = document.getElementById('drawer-overlay');
  const closeBtn = document.getElementById('drawer-close-btn');

  if (drawer && !drawer.hidden) {
    closeDrawer();
    return;
  }

  if (drawer) drawer.hidden = false;
  if (overlay) overlay.hidden = false;

  // Update model status display
  updateModelStatusDisplay();

  // Focus trap - focus close button
  if (closeBtn) closeBtn.focus();
}

// Close settings drawer
export function closeDrawer() {
  const drawer = document.getElementById('settings-drawer');
  const overlay = document.getElementById('drawer-overlay');
  const menuBtn = document.getElementById('menu-btn');

  if (drawer) drawer.hidden = true;
  if (overlay) overlay.hidden = true;

  // Restore focus
  if (menuBtn) menuBtn.focus();
}

// Update model status in drawer
function updateModelStatusDisplay() {
  const statusEl = document.getElementById('model-status');
  if (!statusEl) return;

  const statusMap = {
    'none': 'Not loaded',
    'downloading': 'Downloading...',
    'downloaded': 'Downloaded',
    'loading': 'Loading...',
    'loaded': 'Ready'
  };

  statusEl.textContent = statusMap[state.modelStatus] || 'Unknown';
}

// Toggle accessibility mode
export function toggleAccessibility() {
  state.accessibilityMode = !state.accessibilityMode;

  const toggle = document.getElementById('accessibility-toggle');
  if (toggle) toggle.setAttribute('aria-checked', String(state.accessibilityMode));

  document.body.classList.toggle('accessibility-mode', state.accessibilityMode);
}
