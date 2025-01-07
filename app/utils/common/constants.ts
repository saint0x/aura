// Environment
export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
export const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// API Endpoints
export const API_ENDPOINTS = {
  OPENAI: 'https://api.openai.com/v1',
  ELEVENLABS: 'https://api.elevenlabs.io/v1'
};

// File System
export const FILE_SYSTEM = {
  ROOT: process.env.FILE_SYSTEM_ROOT || '/tmp/aura_workspace',
  ALLOWED_PATHS: (process.env.FILE_SYSTEM_ALLOWED_PATHS || '').split(','),
  MAX_SIZE: parseInt(process.env.FILE_SYSTEM_MAX_SIZE || '1000000000', 10)
};

// Screen Capture
export const SCREEN_CAPTURE = {
  MAX_SIZE: parseInt(process.env.SCREEN_CAPTURE_MAX_SIZE || '10000000', 10),
  FORMAT: process.env.SCREEN_CAPTURE_FORMAT || 'jpeg',
  QUALITY: parseInt(process.env.SCREEN_CAPTURE_QUALITY || '80', 10)
};

// Memory & Context
export const MEMORY = {
  STORAGE_TYPE: process.env.MEMORY_STORAGE_TYPE || 'redis',
  MAX_ENTRIES: parseInt(process.env.MAX_MEMORY_ENTRIES || '100', 10),
  CONTEXT_WINDOW: parseInt(process.env.CONTEXT_WINDOW_SIZE || '10', 10)
};

// Security
export const SECURITY = {
  JWT_SECRET: process.env.JWT_SECRET,
  SESSION_SECRET: process.env.SESSION_SECRET,
  RATE_LIMIT: {
    WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10),
    MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10)
  }
};

// Agent Configuration
export const AGENT = {
  NAME: process.env.AGENT_NAME || 'Aura',
  PERSONALITY: process.env.AGENT_PERSONALITY || 'helpful_professional',
  TEMPERATURE: parseFloat(process.env.AGENT_TEMPERATURE || '0.7'),
  MAX_TOKENS: parseInt(process.env.AGENT_MAX_TOKENS || '2000', 10)
};

// Media Processing
export const MEDIA = {
  IMAGE: {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif']
  },
  VIDEO: {
    MAX_SIZE: 50 * 1024 * 1024, // 50MB
    ALLOWED_TYPES: ['video/mp4', 'video/webm']
  },
  AUDIO: {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: ['audio/wav', 'audio/mp3', 'audio/mpeg']
  }
};

// Error Messages
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Operation not permitted',
  NOT_FOUND: 'Resource not found',
  VALIDATION_FAILED: 'Validation failed',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
  INTERNAL_ERROR: 'Internal server error'
}; 