// Main entry point - app initialization
console.log('Hey there, curious mind 👀 — feel free to reach out: vitorgomateus@gmail.com');

import { renderPortfolio } from '../features/portfolio/render.js';
import { loadEmbeddings } from '../features/portfolio/search.js';
import { setRandomPrimaryColor } from '../features/ui/header.js';
import { setupTextareaResize } from '../features/ui/input.js';
import { setupEvents } from './events.js';
import state from './state.js';

function estimateCapacityText({ hasWebGPU, memoryGB, cpuCores }) {
  if (!hasWebGPU) {
    return {
      tier: 'likely-fail',
      text: 'Capacity: May fail (WebGPU unavailable)'
    };
  }

  const hasStrongMemory = typeof memoryGB === 'number' && memoryGB >= 8;
  const hasStrongCpu = typeof cpuCores === 'number' && cpuCores >= 8;
  const hasLimitedMemory = typeof memoryGB === 'number' && memoryGB <= 4;
  const hasLimitedCpu = typeof cpuCores === 'number' && cpuCores <= 4;

  if (hasStrongMemory && hasStrongCpu) {
    return {
      tier: 'likely',
      text: 'Capacity: Likely runs well'
    };
  }

  if (hasLimitedMemory || hasLimitedCpu) {
    return {
      tier: 'maybe-slow',
      text: 'Capacity: May be slow'
    };
  }

  return {
    tier: 'likely',
    text: 'Capacity: Likely runs well'
  };
}

function detectBrowserCapabilities() {
  const hasWebGPU = !!navigator.gpu;
  const cpuCores = Number.isFinite(navigator.hardwareConcurrency)
    ? navigator.hardwareConcurrency
    : null;
  const memoryGB = Number.isFinite(navigator.deviceMemory)
    ? navigator.deviceMemory
    : null;

  const estimate = estimateCapacityText({ hasWebGPU, memoryGB, cpuCores });

  state.browserDiagnostics.hasWebGPU = hasWebGPU;
  state.browserDiagnostics.cpuCores = cpuCores;
  state.browserDiagnostics.memoryGB = memoryGB;
  state.browserDiagnostics.capacityTier = estimate.tier;
  state.browserDiagnostics.capacityText = estimate.text;
}

function ensureBaseHref() {
  const baseUrl = new URL('../../', import.meta.url);
  let baseEl = document.querySelector('base');

  if (!baseEl) {
    baseEl = document.createElement('base');
    document.head.prepend(baseEl);
  }

  baseEl.href = baseUrl.href;
}

async function init() {
  ensureBaseHref();
  detectBrowserCapabilities();

  // Set random primary color & favicon
  setRandomPrimaryColor();

  // Start portfolio time tracking
  state.portfolioStartTime = Date.now();

  // Load portfolio data
  try {
    const data = await loadPortfolioData();
    state.portfolioData = data;

    // Render portfolio
    const container = document.getElementById('portfolio-container');
    if (container && data) {
      renderPortfolio(container, data);
    }
  } catch (error) {
    console.error('[app] Failed to load portfolio data:', error);
  }

  // Load embeddings for search
  await loadEmbeddings();

  // Setup events
  setupEvents();

  // Setup textarea auto-resize
  setupTextareaResize();

  // Initialize feather icons
  if (window.feather) {
    window.feather.replace();
  }
}

// Load portfolio data JSON file
async function loadPortfolioData() {
  const filename = 'data-002.json';
  const response = await fetch(filename);
  if (!response.ok) {
    throw new Error(`Failed to load ${filename}: HTTP ${response.status}`);
  }
  const data = await response.json();
  return data;
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
