// Centralized state management

const state = {
  // Feature mode
  experimentalMode: false,

  // Portfolio
  embeddings: [],
  portfolioData: null,
  expandedProject: null,
  searchActive: false,
  searchQuery: '',
  searchResults: [],

  // Chat
  chatMessages: [],
  chatHistory: [],
  maxHistory: 5,
  maxMessages: 50,
  isModelLoaded: false,
  isModelLoading: false,
  isGenerating: false,
  modelStatus: 'none', // none | downloading | downloaded | loading | loaded

  // User extraction
  extractedUser: {
    name: '',
    email: '',
    company: '',
    position: '',
    relevant_info: ''
  },

  // Personality rotation
  personalityIndex: 0,

  // Suggestions
  suggestionIndex: 0,
  showSuggestions: false,

  // Performance
  performance: {
    messagesSent: 0,
    totalResponseTime: 0,
    slowResponses: 0,
    maxResponseTime: 0
  },

  // Browser diagnostics
  browserDiagnostics: {
    hasWebGPU: false,
    cpuCores: null,
    memoryGB: null,
    capacityTier: 'unknown', // unknown | likely | maybe-slow | likely-fail
    capacityText: 'Capacity: Estimating...',
    firstResponseMs: null,
    firstResponseObserved: false
  },

  // Retrieval diagnostics
  retrievalDiagnostics: {
    queryMs: 0,
    resultCount: 0,
    avgScore: 0,
    topScore: 0,
    threshold: 0,
    topK: 0,
    hasRun: false
  },

  retrievalConfig: {
    useHybridScoring: true,
    baseThreshold: 0.3,
    minThreshold: 0.18,
    maxThreshold: 0.45,
    baseTopK: 3,
    maxTopK: 6,
    vectorWeight: 0.7,
    lexicalWeight: 0.3
  },

  // Feedback
  feedbackDismissed: false,
  feedbackShown: false,
  chatPromptShown: false,

  // Time tracking
  portfolioStartTime: null,
  chatStartTime: null,
  portfolioTimeSpent: 0,
  chatTimeSpent: 0,

  // Accessibility
  accessibilityMode: false
};

export default state;
