/**
 * App Constants
 * Global configuration values and string constants to avoid magic values.
 */

export const APP_CONFIG = {
  INITIAL_TOKENS: 100,
  STORAGE_KEYS: {
    TOKENS: 'weatherWizardTokens',
    RATE_LIMIT_PREFIX: 'rateLimit_',
  },
  ANIMATION_DURATIONS: {
    STATUS_MESSAGE_FADE: 2000,
    STATUS_MESSAGE_REMOVE: 3000,
    ERROR_DISMISS_TIMEOUT: 3000,
  },
  MAP: {
    DEFAULT_CENTER: [56.9496, 24.1052], // Riga, Latvia
    DEFAULT_ZOOM: 10,
  },
  API: {
    WEATHER: 'https://api.openweathermap.org/data/2.5',
    NOMINATIM: 'https://nominatim.openstreetmap.org',
  }
};

/**
 * @typedef {Object} WeatherData
 * @property {string} city - Current city name
 * @property {Object|null} current - Current weather object from OpenWeather
 * @property {Array} forecast - Array of forecast items
 * @property {Array|null} userLocation - [lat, lon] coordinates
 */

/**
 * @typedef {Object} OrderForm
 * @property {string} selectedDate - YYYY-MM-DD
 * @property {string} desiredTemp - Desired temperature (°C)
 * @property {string} desiredConditions - Desired weather condition value
 * @property {string} tokensToSpend - Tokens wagered
 */

/**
 * @typedef {Object} EvaluationResult
 * @property {boolean} isSuccess - Whether the order conditions were met
 * @property {string} message - Human-readable result message
 * @property {string|null} reason - The reason for failure (if failed)
 */
