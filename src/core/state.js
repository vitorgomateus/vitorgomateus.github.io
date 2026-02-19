// Centralized state management

const state = {
  // Feature mode
  experimentalMode: false,

  // Portfolio
  embeddings: [],
  portfolioData: null,
  expandedProject: null,
  searchActive: false,
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
