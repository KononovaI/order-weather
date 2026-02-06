import { APP_CONFIG } from '../constants/appConstants';

/**
 * Rate Limiter Utility
 * A simple client-side rate limiter using localStorage.
 */

const RATE_LIMITS = {
  weatherApi: { 
    maxRequests: 5, 
    windowMs: 60000, 
    name: 'Weather API'
  },
  geocoding: { 
    maxRequests: 3, 
    windowMs: 60000, 
    name: 'Geocoding'
  },
  mapClick: { 
    maxRequests: 3, 
    windowMs: 5000, 
    name: 'Map Click'
  },
};

/**
 * Get localStorage key for a rate limit
 * @param {string} apiName - Name of the API/operation
 * @returns {string} - localStorage key
 */
function getRateLimitKey(apiName) {
  return `${APP_CONFIG.STORAGE_KEYS.RATE_LIMIT_PREFIX}${apiName}`;
}

/**
 * Check if a request is allowed under the rate limit.
 * @param {string} apiName - The API/operation name
 * @returns {Object} - { allowed: boolean, waitTimeSeconds?: number, message?: string }
 */
export function checkRateLimit(apiName) {
  const config = RATE_LIMITS[apiName];
  if (!config) return { allowed: true };

  const key = getRateLimitKey(apiName);
  const now = Date.now();
  
  let requests = [];
  try {
    const stored = localStorage.getItem(key);
    requests = stored ? JSON.parse(stored) : [];
  } catch (error) {
    requests = [];
  }

  requests = requests.filter(timestamp => now - timestamp < config.windowMs);

  if (requests.length >= config.maxRequests) {
    const oldestRequest = Math.min(...requests);
    const waitTimeMs = config.windowMs - (now - oldestRequest);
    const waitTimeSeconds = Math.ceil(waitTimeMs / 1000);
    
    return {
      allowed: false,
      waitTimeSeconds,
      message: `Too many requests. Please wait ${waitTimeSeconds} seconds.`,
      limitName: config.name,
    };
  }

  requests.push(now);
  try {
    localStorage.setItem(key, JSON.stringify(requests));
  } catch (error) {}

  return { allowed: true };
}

export function resetRateLimit(apiName) {
  const key = getRateLimitKey(apiName);
  localStorage.removeItem(key);
}
