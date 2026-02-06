import { checkRateLimit } from '../utils/rateLimiter';
import { ERROR_TYPES } from '../constants/errorMessages';
import { APP_CONFIG } from '../constants/appConstants';

const API_KEY = import.meta.env.OPENWEATHER_API_KEY || import.meta.env.VITE_OPENWEATHER_API_KEY;
const BASE_URL = APP_CONFIG.API.WEATHER;
const NOMINATIM_URL = APP_CONFIG.API.NOMINATIM;

/**
 * Create a typed error for better error handling
 */
function createError(message, type, details = {}) {
  const error = new Error(message);
  error.type = type;
  error.details = details;
  return error;
}

export const weatherService = {
  /**
   * Get current weather for a city
   * @param {string} city - City name
   * @returns {Promise<Object>} - Weather data
   * @throws {Error} - With type property for error classification
   */
  async getCurrentWeather(city) {
    // Check rate limit before making request
    const rateCheck = checkRateLimit('weatherApi');
    if (!rateCheck.allowed) {
      throw createError(rateCheck.message, ERROR_TYPES.RATE_LIMIT, {
        waitTimeSeconds: rateCheck.waitTimeSeconds
      });
    }

    if (!API_KEY) {
      throw createError('API Key is missing', ERROR_TYPES.API);
    }

    try {
      const response = await fetch(
        `${BASE_URL}/weather?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`
      );
      
      if (response.status === 429) {
        throw createError('API rate limit exceeded. Please try again later.', ERROR_TYPES.RATE_LIMIT);
      }
      
      if (!response.ok) {
        throw createError('City not found', ERROR_TYPES.NOT_FOUND);
      }
      
      return response.json();
    } catch (error) {
      // Re-throw typed errors
      if (error.type) throw error;
      
      // Wrap network errors
      throw createError('Network error. Please check your connection.', ERROR_TYPES.NETWORK);
    }
  },

  /**
   * Get weather forecast for a city
   * @param {string} city - City name
   * @returns {Promise<Array>} - Array of daily forecasts
   * @throws {Error} - With type property for error classification
   */
  async getForecast(city) {
    // Check rate limit before making request
    const rateCheck = checkRateLimit('weatherApi');
    if (!rateCheck.allowed) {
      throw createError(rateCheck.message, ERROR_TYPES.RATE_LIMIT, {
        waitTimeSeconds: rateCheck.waitTimeSeconds
      });
    }

    if (!API_KEY) {
      throw createError('API Key is missing', ERROR_TYPES.API);
    }

    try {
      const response = await fetch(
        `${BASE_URL}/forecast?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`
      );
      
      if (response.status === 429) {
        throw createError('API rate limit exceeded. Please try again later.', ERROR_TYPES.RATE_LIMIT);
      }
      
      if (!response.ok) {
        throw createError('City not found', ERROR_TYPES.NOT_FOUND);
      }
      
      const data = await response.json();
      
      // Process forecast to get one entry per day (approx mid-day)
      const dailyForecasts = [];
      const seenDates = new Set();

      for (const item of data.list) {
        const date = item.dt_txt.split(' ')[0];
        if (!seenDates.has(date)) {
          seenDates.add(date);
          dailyForecasts.push(item);
        }
        if (dailyForecasts.length === 5) break;
      }
      
      return dailyForecasts;
    } catch (error) {
      if (error.type) throw error;
      throw createError('Network error. Please check your connection.', ERROR_TYPES.NETWORK);
    }
  },

  /**
   * Reverse geocode coordinates to get city name.
   * Uses OpenStreetMap Nominatim API.
   * 
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @returns {Promise<string|null>} - City name or null on error
   */
  async reverseGeocode(lat, lon) {
    // Check rate limit for geocoding
    const rateCheck = checkRateLimit('geocoding');
    if (!rateCheck.allowed) {
      console.warn('Geocoding rate limited:', rateCheck.message);
      return null;
    }

    try {
      const response = await fetch(
        `${NOMINATIM_URL}/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`
      );
      
      if (!response.ok) {
        console.error('Geocoding request failed:', response.status);
        return null;
      }
      
      const data = await response.json();
      
      // Try to extract city name from various address fields
      const cityName = data.address?.city 
        || data.address?.town 
        || data.address?.village 
        || data.address?.municipality
        || data.display_name?.split(',')[0];
      
      return cityName || null;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  },

  simulateRefundScenario() {
    // Returns data for the "Time Machine" simulation
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    
    return {
      date: futureDate.toISOString().split('T')[0],
      actualWeather: {
        temp: 15,
        condition: 'Rain',
        description: 'heavy intensity rain'
      },
      originalForecast: {
        condition: 'Clear',
        temp: 25
      },
      refundAmount: 50,
      message: 'Refund Processed! The weather did not match your order.'
    };
  }
};


