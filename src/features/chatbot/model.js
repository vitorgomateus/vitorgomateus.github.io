// WebLLM model integration

import state from '../../core/state.js';
import { getRelevantContext } from './rag.js';

// Model configuration
const MODEL_CONFIG = {
  // selectedModel: 'Qwen3-1.7B-q4f16_1-MLC',   // ~2.0GB | Alibaba | enable_thinking: false required
  selectedModel: 'gemma-2-2b-it-q4f16_1-MLC', // ~1.4GB | Google  | no special flags needed
  maxTokens: 256,
  temperature: 0.3
};

const PERSONALITIES = [
  'Adopt a warm, professional, and restrained manner.',
  'Adopt a cold, neutral, and direct manner, distant but not rude.',
  'Adopt an enthusiastic and engaged manner.'
];

const BASE_INSTRUCTIONS = `SYSTEM RULES:
- You are Goma, a portfolio assistant for Vítor Gonçalves (UX Designer).
- Only discuss Vítor's portfolio context and prior conversation. Refuse off-topic requests briefly.
- Keep replies short, clear, and professional.
- Ask for at most one user detail at a time, naturally (never pushy).
- PERSONALITY_PLACEHOLDER`;

const EXTRACTION_INSTRUCTIONS = `\n\nEXTRACTION RULES:
- Append EXACTLY ONE extraction block at the END of every reply.
- Use ONLY this format and valid JSON:
[EXTRACT]{"name":"","email":"","company":"","position":"","relevant_info":""}[/EXTRACT]
- Extract ONLY information THE USER shares ABOUT THEMSELVES in their messages.
- DO NOT extract information about yourself, Vítor, the portfolio, or anything else.
- Fill only values explicitly stated by the user; keep unknown as empty strings.
- For relevant_info: store concise keywords/expressions about the user only (comma-separated).
- Never mention extraction in the visible reply.`;

const GREETINGS = [
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

const SUGGESTION_MESSAGES = [
  "What's the carbon footprint of this website?",
  "Can Vítor do more than pretty things?",
  "Where is Vítor from?",
  // Placeholder: more suggestions will be added later
];

let engine = null;

// Initialize the WebLLM engine
export async function initModel(onProgress) {
  if (state.isModelLoading || state.isModelLoaded) return;

  state.isModelLoading = true;
  state.modelStatus = 'downloading';
  const modelInitStart = performance.now();
  let loadingStart = null;

  try {
    // Dynamic import of WebLLM
    const webllm = await import('https://esm.run/@mlc-ai/web-llm');

    engine = await webllm.CreateMLCEngine(MODEL_CONFIG.selectedModel, {
      initProgressCallback: (progress) => {
        if (onProgress) onProgress(progress);

        // Update status based on progress
        if (progress.text?.includes('Loading') && loadingStart === null) {
          loadingStart = performance.now();
          const downloadMs = Math.round(loadingStart - modelInitStart);
          console.info(`[telemetry] Model download time: ${downloadMs}ms`);
        }
        if (progress.text?.includes('Loading')) {
          state.modelStatus = 'loading';
        }
      }
    });

    state.isModelLoaded = true;
    state.isModelLoading = false;
    state.modelStatus = 'loaded';

    const loadedAt = performance.now();
    const loadStart = loadingStart ?? modelInitStart;
    const loadMs = Math.round(loadedAt - loadStart);
    const totalInitMs = Math.round(loadedAt - modelInitStart);
    if (loadingStart === null) {
      console.info(`[telemetry] Model download time: ${totalInitMs}ms`);
    }
    console.info(`[telemetry] Model load time: ${loadMs}ms`);
    console.info(`[telemetry] Model init total time: ${totalInitMs}ms`);

    return true;
  } catch (error) {
    console.error('[model] Failed to load model:', error);
    state.isModelLoading = false;
    state.modelStatus = 'none';
    throw error;
  }
}

// Generate a response from the model
export async function generateResponse(userMessage) {
  if (!engine || !state.isModelLoaded) {
    throw new Error('Model not loaded');
  }

  state.isGenerating = true;
  const startTime = performance.now();

  try {
    // Get RAG context
    const context = await getRelevantContext(userMessage);

    // Build system prompt with personality rotation
    const personality = PERSONALITIES[state.personalityIndex % PERSONALITIES.length];
    state.personalityIndex++;

    let systemPrompt = BASE_INSTRUCTIONS.replace('PERSONALITY_PLACEHOLDER', personality);
    systemPrompt += EXTRACTION_INSTRUCTIONS;

    // Inject extracted user info if available
    const userInfo = state.extractedUser;
    const hasUserInfo = Object.values(userInfo).some(v => v && v.length > 0);
    if (hasUserInfo) {
      systemPrompt += `\n\nKnown user information: ${JSON.stringify(userInfo)}`;
    }

    // Add RAG context
    if (context) {
      systemPrompt += `\n\nRelevant portfolio context:\n${context}`;
    }

    // Build messages array with history
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Add conversation history (limited to maxHistory turns)
    const historySlice = state.chatHistory.slice(-state.maxHistory * 2);
    messages.push(...historySlice);

    // Add current user message
    messages.push({ role: 'user', content: userMessage });

    const requestPayload = {
      messages,
      max_tokens: MODEL_CONFIG.maxTokens,
      temperature: MODEL_CONFIG.temperature,
      enable_thinking: false
    };
    console.info('[telemetry] Model request payload:', requestPayload);

    // Generate response
    const response = await engine.chat.completions.create(requestPayload);

    const rawResponse = response.choices[0]?.message?.content || '';
    console.info('[telemetry] Model response payload:', response);

    // Extract user data from response
    const { cleanResponse, extractedData } = parseExtraction(rawResponse);

    // Update extracted user data (cumulative)
    if (extractedData) {
      mergeExtractedData(extractedData);
    }

    // Update chat history
    state.chatHistory.push(
      { role: 'user', content: userMessage },
      { role: 'assistant', content: rawResponse }
    );

    // Track performance
    const responseTime = performance.now() - startTime;
    state.performance.messagesSent++;
    state.performance.totalResponseTime += responseTime;
    if (responseTime > 1500) state.performance.slowResponses++;
    if (responseTime > state.performance.maxResponseTime) {
      state.performance.maxResponseTime = responseTime;
    }
    console.info(`[telemetry] Model response time: ${Math.round(responseTime)}ms`);

    state.isGenerating = false;
    return cleanResponse;
  } catch (error) {
    state.isGenerating = false;
    console.error('[model] Generation error:', error);
    throw error;
  }
}

// Parse [EXTRACT] blocks from response
function parseExtraction(response) {
  const extractRegex = /\[EXTRACT\][\s\S]*?\[\/EXTRACT\]/g;
  const matches = response.match(extractRegex);

  let extractedData = null;

  if (matches) {
    try {
      // Get the JSON content between tags
      const jsonStr = matches[0]
        .replace('[EXTRACT]', '')
        .replace('[/EXTRACT]', '')
        .trim();
      extractedData = JSON.parse(jsonStr);
    } catch (error) {
      console.error('[model] Failed to parse extraction JSON:', error);
    }
  }

  // Remove extraction from displayed response
  const cleanResponse = response.replace(extractRegex, '').trim();

  return { cleanResponse, extractedData };
}

// Merge newly extracted data with existing
function mergeExtractedData(newData) {
  if (!newData) return;

  const fields = ['name', 'email', 'company', 'position'];
  fields.forEach(field => {
    if (newData[field] && newData[field].trim() && !newData[field].includes('<')) {
      state.extractedUser[field] = newData[field].trim();
    }
  });

  // Accumulate relevant_info
  if (newData.relevant_info && newData.relevant_info.trim() && !newData.relevant_info.includes('<')) {
    const incoming = newData.relevant_info
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);

    if (state.extractedUser.relevant_info) {
      const existing = state.extractedUser.relevant_info
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);
      const merged = Array.from(new Set([...existing, ...incoming]));
      state.extractedUser.relevant_info = merged.join(', ');
    } else {
      state.extractedUser.relevant_info = incoming.join(', ');
    }
  }

}

// Get a random greeting
export function getRandomGreeting() {
  return GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
}

// Get next suggestions
export function getNextSuggestions() {
  const suggestions = [];
  for (let i = 0; i < 2 && i < SUGGESTION_MESSAGES.length; i++) {
    const idx = (state.suggestionIndex + i) % SUGGESTION_MESSAGES.length;
    suggestions.push(SUGGESTION_MESSAGES[idx]);
  }
  state.suggestionIndex = (state.suggestionIndex + 2) % SUGGESTION_MESSAGES.length;
  return suggestions;
}

// Clear model cache
export async function clearModelCache() {
  try {
    if (engine) {
      await engine.unload();
      engine = null;
    }

    // Clear IndexedDB caches used by WebLLM
    const databases = await indexedDB.databases();
    const webllmDbs = databases.filter(db =>
      db.name?.includes('webllm') ||
      db.name?.includes('mlc') ||
      db.name?.includes('model')
    );

    for (const db of webllmDbs) {
      indexedDB.deleteDatabase(db.name);
    }

    state.isModelLoaded = false;
    state.isModelLoading = false;
    state.modelStatus = 'none';
    return true;
  } catch (error) {
    console.error('[model] Failed to clear cache:', error);
    throw error;
  }
}

// Check WebGPU support
export function checkWebGPUSupport() {
  return !!navigator.gpu;
}

// Get model display info
export function getModelInfo() {
  return {
    name: 'Qwen3-1.7B',
    fullName: MODEL_CONFIG.selectedModel,
    size: '~2.0GB',
    status: state.modelStatus
  };
}
