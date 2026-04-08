// Transformers.js model integration

import state from '../../core/state.js';
import { getRelevantContext } from './rag.js';

// Model configuration
// Requires pre-exported ONNX models available on HuggingFace.
// If onnx-community/gemma-4-E2B-it-ONNX is not yet published, export it with:
//   optimum-cli export onnx --model google/gemma-4-E2B-it --task text-generation-with-past --dtype fp16 out/
// then upload to HuggingFace and update selectedModel below.
const MODEL_CONFIG = {
  selectedModel: 'onnx-community/gemma-4-E2B-it-ONNX',
  dtype: 'q4f16',
  maxTokens: 256,
  temperature: 0.3
};

const MODEL_INFO = {
  'onnx-community/gemma-4-E2B-it-ONNX': { name: 'Gemma 4 E2B-it', size: '~1.5GB', dtype: 'q4f16' }
};

const MODEL_RUNTIMES = {
  primary: { device: 'webgpu', label: 'WebGPU' },
  fallback: { device: 'wasm', label: 'compatibility mode' }
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
let processor = null;
let tokenizer = null;
let activeModelId = MODEL_CONFIG.selectedModel;
let activeRuntime = MODEL_RUNTIMES.primary;
let transformersModulePromise = null;

function getTransformersModule() {
  if (!transformersModulePromise) {
    transformersModulePromise = import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.0.1');
  }

  return transformersModulePromise;
}

function getModelMeta() {
  return MODEL_INFO[MODEL_CONFIG.selectedModel] || {
    name: MODEL_CONFIG.selectedModel,
    size: 'unknown',
    dtype: MODEL_CONFIG.dtype
  };
}

function isUnauthorizedAccessError(error) {
  const message = (error?.message || '').toLowerCase();
  return message.includes('unauthorized') || message.includes('401');
}

function isRecoverableWebGPUQuantizedKernelError(error) {
  const message = (error?.message || '').toLowerCase();
  return message.includes('gatherblockquantized') ||
    message.includes('normalizedispatchgroupsize invalid dispatch group size') ||
    (message.includes('dispatch group size') && message.includes('failed to call ortrun'));
}

function isUnsupportedCompatibilityRuntimeError(error) {
  const message = (error?.message || '').toLowerCase();
  return message.includes("could not find an implementation for gatherblockquantized") ||
    message.includes("can't create a session") ||
    message.includes('error_code: 9');
}

async function disposeEngine() {
  if (!engine) return;

  await engine.dispose?.();
  engine = null;
}

async function loadTextProcessor(progressCallback) {
  if (tokenizer || processor) return;

  const { AutoProcessor, AutoTokenizer } = await getTransformersModule();

  try {
    processor = await AutoProcessor.from_pretrained(MODEL_CONFIG.selectedModel, {
      progress_callback: progressCallback
    });

    tokenizer = processor?.tokenizer || await AutoTokenizer.from_pretrained(MODEL_CONFIG.selectedModel, {
      progress_callback: progressCallback
    });
  } catch (processorError) {
    const message = (processorError?.message || '').toLowerCase();
    const missingProcessorConfig =
      message.includes('image_processor_type') ||
      message.includes('feature_extractor_type');

    if (!missingProcessorConfig) {
      throw processorError;
    }

    // Fallback for text-only chat when processor metadata is missing.
    console.warn('[model] AutoProcessor metadata missing; falling back to AutoTokenizer for text-only generation.');
    tokenizer = await AutoTokenizer.from_pretrained(MODEL_CONFIG.selectedModel, {
      progress_callback: progressCallback
    });
    processor = tokenizer;
  }
}

async function loadEngine(runtime, progressCallback) {
  const { Gemma4ForConditionalGeneration } = await getTransformersModule();
  const modelMeta = getModelMeta();

  await disposeEngine();

  engine = await Gemma4ForConditionalGeneration.from_pretrained(MODEL_CONFIG.selectedModel, {
    device: runtime.device,
    dtype: modelMeta.dtype || MODEL_CONFIG.dtype,
    progress_callback: progressCallback
  });

  activeRuntime = runtime;
  console.info(`[model] Loaded model: ${MODEL_CONFIG.selectedModel} on ${runtime.label}`);
}

async function switchRuntime(runtime) {
  if (engine && activeRuntime.device === runtime.device) {
    return false;
  }

  state.isModelLoading = true;
  state.isModelLoaded = false;
  state.modelStatus = 'loading';

  try {
    await loadEngine(runtime);
    state.isModelLoaded = true;
    state.isModelLoading = false;
    state.modelStatus = 'loaded';
    return true;
  } catch (error) {
    if (runtime.device !== MODEL_RUNTIMES.primary.device) {
      activeRuntime = MODEL_RUNTIMES.primary;
    }
    state.isModelLoading = false;
    state.modelStatus = 'none';
    throw error;
  }
}

async function generateModelText(messages, textProcessor, requestPayload) {
  const prompt = textProcessor.apply_chat_template(messages, {
    enable_thinking: false,
    add_generation_prompt: true
  });
  const inputs = await textProcessor(prompt, {
    add_special_tokens: false
  });

  const outputs = await engine.generate({
    ...inputs,
    ...requestPayload
  });
  const inputLength = inputs?.input_ids?.dims?.at(-1) || 0;
  const decoded = textProcessor.batch_decode(
    outputs.slice(null, [inputLength, null]),
    { skip_special_tokens: true }
  );

  console.info('[telemetry] Model response payload:', decoded);
  return decoded?.[0] || '';
}

// Initialize the Gemma 4 Transformers.js engine
export async function initModel(onProgress) {
  if (state.isModelLoading || state.isModelLoaded) return;

  state.isModelLoading = true;
  state.modelStatus = 'downloading';
  const modelInitStart = performance.now();
  try {
    let loadingStart = null;

    const modelMeta = getModelMeta();
    activeModelId = MODEL_CONFIG.selectedModel;
    activeRuntime = MODEL_RUNTIMES.primary;

    if (onProgress) {
      onProgress({ text: `Preparing ${modelMeta.name}...` });
    }

    let stagedProgress = 0;
    const assetProgress = new Map();

    function getAggregateDownloadProgress(event) {
      const key = event.file || event.name || event.url || null;
      const hasBytes = Number.isFinite(event.loaded) && Number.isFinite(event.total) && event.total > 0;

      if (hasBytes && key) {
        assetProgress.set(String(key), { loaded: event.loaded, total: event.total });

        let loadedSum = 0;
        let totalSum = 0;
        for (const value of assetProgress.values()) {
          loadedSum += value.loaded;
          totalSum += value.total;
        }

        if (totalSum > 0) {
          return Math.max(0, Math.min(1, loadedSum / totalSum));
        }
      }

      if (event.progress !== undefined) {
        const perEventProgress = Math.max(0, Math.min(100, event.progress)) / 100;
        // Conservative fallback for per-asset percentages that reset across files.
        return Math.max(stagedProgress, perEventProgress * 0.9);
      }

      return stagedProgress;
    }

    const progressCallback = (progress) => {
      // Adapt Transformers.js progress events to the { progress: 0-1, text } shape
      // expected by messages.js updateProgress()
      const adapted = {};

      const hasPercent = progress.progress !== undefined;
      const hasByteProgress = Number.isFinite(progress.loaded) && Number.isFinite(progress.total) && progress.total > 0;

      if ((progress.status === 'progress' || progress.status === 'progress_total') && (hasPercent || hasByteProgress)) {
        // Aggregate progress across model assets to avoid percentage resets.
        const downloadProgress = getAggregateDownloadProgress(progress);
        // Keep download phase under 90% to reserve visible headroom for load/finalize.
        stagedProgress = Math.max(stagedProgress, Math.min(0.9, downloadProgress));
        adapted.progress = stagedProgress;
        adapted.text = `Downloading model... ${Math.round(stagedProgress * 100)}%`;
      } else if (progress.status === 'loading') {
        // Do not jump to near-complete; advance gradually during load phase.
        stagedProgress = Math.max(stagedProgress, Math.min(0.96, stagedProgress + 0.02));
        adapted.progress = stagedProgress;
        adapted.text = 'Loading model...';
        if (loadingStart === null) {
          loadingStart = performance.now();
          const downloadMs = Math.round(loadingStart - modelInitStart);
          console.info(`[telemetry] Model download time: ${downloadMs}ms`);
        }
        state.modelStatus = 'loading';
      } else if (progress.status === 'ready') {
        stagedProgress = Math.max(stagedProgress, Math.min(0.99, stagedProgress + 0.01));
        adapted.progress = stagedProgress;
        adapted.text = 'Finalizing model...';
      } else if (progress.status === 'initiate' || progress.status === 'download') {
        stagedProgress = Math.max(stagedProgress, 0.02);
        adapted.progress = stagedProgress;
        adapted.text = 'Downloading model...';
      }

      if (onProgress && (adapted.text || adapted.progress !== undefined)) {
        onProgress(adapted);
      }
    };

    try {
      await loadTextProcessor(progressCallback);
      await loadEngine(MODEL_RUNTIMES.primary, progressCallback);
    } catch (error) {
      if (!isRecoverableWebGPUQuantizedKernelError(error)) {
        throw error;
      }

      console.warn('[model] WebGPU quantized kernel failed during model startup; retrying with compatibility mode.', error);
      stagedProgress = Math.max(stagedProgress, 0.96);
      if (onProgress) {
        onProgress({ progress: stagedProgress, text: 'Switching to compatibility mode...' });
      }
      await loadEngine(MODEL_RUNTIMES.fallback, progressCallback);
    }

    state.isModelLoaded = true;
    state.isModelLoading = false;
    state.modelStatus = 'loaded';

    if (onProgress) {
      onProgress({ progress: 1, text: 'Model ready!' });
    }

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
    if (isUnauthorizedAccessError(error)) {
      console.error('[model] Gemma repository returned unauthorized access. Ensure the model is public or your access is approved.');
    }
    console.error('[model] Failed to load model:', error);
    state.isModelLoading = false;
    state.modelStatus = 'none';
    throw error;
  }
}

// Generate a response from the model
export async function generateResponse(userMessage) {
  const textProcessor = tokenizer || processor?.tokenizer || processor;

  if (!engine || !textProcessor || !state.isModelLoaded) {
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
      max_new_tokens: MODEL_CONFIG.maxTokens,
      temperature: MODEL_CONFIG.temperature,
      do_sample: true
    };
    console.info('[telemetry] Model request payload:', requestPayload);

    let rawResponse;

    try {
      rawResponse = await generateModelText(messages, textProcessor, requestPayload);
    } catch (error) {
      if (activeRuntime.device !== MODEL_RUNTIMES.primary.device || !isRecoverableWebGPUQuantizedKernelError(error)) {
        throw error;
      }

      console.warn('[model] WebGPU generation failed on a quantized kernel; retrying with compatibility mode.', error);

      try {
        await switchRuntime(MODEL_RUNTIMES.fallback);
      } catch (fallbackError) {
        if (!isUnsupportedCompatibilityRuntimeError(fallbackError)) {
          throw fallbackError;
        }

        console.error('[model] Compatibility mode is unavailable for this Gemma quantized build.', fallbackError);
        throw new Error('This browser can load the model, but its current ONNX/WebGPU runtime cannot execute this Gemma build reliably.');
      }

      const fallbackProcessor = tokenizer || processor?.tokenizer || processor;
      rawResponse = await generateModelText(messages, fallbackProcessor, requestPayload);
    }

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
    await disposeEngine();
    processor = null;
    tokenizer = null;
    activeRuntime = MODEL_RUNTIMES.primary;

    // Clear Cache API entries used by Transformers.js
    const cacheNames = await caches.keys();
    const tfCaches = cacheNames.filter(name =>
      name.includes('transformers') ||
      name.includes('huggingface')
    );
    await Promise.all(tfCaches.map(name => caches.delete(name)));

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
  const modelMeta = MODEL_INFO[activeModelId] || { name: activeModelId, size: 'unknown' };
  return {
    name: modelMeta.name,
    fullName: activeModelId,
    size: modelMeta.size,
    runtime: activeRuntime.label,
    status: state.modelStatus
  };
}
