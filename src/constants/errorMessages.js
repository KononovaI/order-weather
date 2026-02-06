/**
 * Error Messages & Types
 * Centralized list of user-facing error messages for different scenarios.
 */

export const ERROR_TYPES = {
  NETWORK: 'network',
  VALIDATION: 'validation',
  API: 'api',
  RATE_LIMIT: 'rate_limit',
  NOT_FOUND: 'not_found',
};

export const ERROR_MESSAGES = {
  network: { 
    title: 'Connection Error', 
    message: 'Please check your internet connection and try again.', 
    icon: '🌐' 
  },
  api: { 
    title: 'Service Error', 
    message: 'The weather service is temporarily unavailable. Please try again later.', 
    icon: '⚠️' 
  },
  validation: { 
    title: 'Invalid Input', 
    message: 'Please correct the highlighted fields and try again.', 
    icon: '❌' 
  },
  rate_limit: { 
    title: 'Too Many Requests', 
    message: 'You are doing that too fast. Please wait a few moments.', 
    icon: '⏳' 
  },
  not_found: {
    title: 'City Not Found',
    message: 'We could not find the city you entered. Check the spelling and try again.',
    icon: '🔍'
  }
};
