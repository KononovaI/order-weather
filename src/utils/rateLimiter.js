/**
 * Rate Limiter Utility
 * 
 * A simple client-side rate limiter using localStorage.
 * This is a FIRST LINE of defense against accidental API abuse,
 * not a replacement for server-side rate limiting!
 * 
 * Use cases:
 * - Prevent accidental rapid clicking
 * - Protect free API tier quotas
 * - Throttle expensive operations
 */

/**
 * Rate limit configurations for different operations
 */
const RATE_LIMITS = {
  weatherApi: { 
    maxRequests: 10, 
    windowMs: 60000,  // 10 requests per minute
    name: 'Weather API'
  },
  geocoding: { 
    maxRequests: 5, 
    windowMs: 60000,  // 5 requests per minute
    name: 'Geocoding'
  },
  mapClick: { 
    maxRequests: 3, 
    windowMs: 5000,   // 3 clicks per 5 seconds
    name: 'Map Click'
  },
};

/**
 * Get localStorage key for a rate limit
 * @param {string} apiName - Name of the API/operation
 * @returns {string} - localStorage key
 */
function getRateLimitKey(apiName) {
  return `rateLimit_${apiName}`;
}

/**
 * Check if a request is allowed under the rate limit.
 * If allowed, the request is automatically recorded.
 * 
 * @param {string} apiName - The API/operation name (must match RATE_LIMITS keys)
 * @returns {Object} - { allowed: boolean, waitTimeSeconds?: number, message?: string }
 * 
 * @example
 * const check = checkRateLimit('weatherApi');
 * if (!check.allowed) {
 *   console.log(check.message); // "Too many requests. Please wait 45 seconds."
 *   return;
 * }
 * // Proceed with API call...
 */
export function checkRateLimit(apiName) {
  const config = RATE_LIMITS[apiName];
  
  // If no config exists, allow the request
  if (!config) {
    console.warn(`No rate limit config for: ${apiName}`);
    return { allowed: true };
  }

  const key = getRateLimitKey(apiName);
  const now = Date.now();
  
  // Get existing request timestamps from storage
  let requests = [];
  try {
    const stored = localStorage.getItem(key);
    requests = stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading rate limit data:', error);
    requests = [];
  }

  // Filter to only keep requests within the time window
  requests = requests.filter(timestamp => now - timestamp < config.windowMs);

  // Check if limit is exceeded
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

  // Record this request
  requests.push(now);
  
  try {
    localStorage.setItem(key, JSON.stringify(requests));
  } catch (error) {
    console.error('Error saving rate limit data:', error);
  }

  return { 
    allowed: true,
    remainingRequests: config.maxRequests - requests.length,
  };
}

/**
 * Reset the rate limit counter for a specific API.
 * Useful for testing or after a successful authentication refresh.
 * 
 * @param {string} apiName - The API/operation name
 */
export function resetRateLimit(apiName) {
  const key = getRateLimitKey(apiName);
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error resetting rate limit:', error);
  }
}

/**
 * Reset all rate limits.
 * Useful for testing or app reset.
 */
export function resetAllRateLimits() {
  Object.keys(RATE_LIMITS).forEach(apiName => {
    resetRateLimit(apiName);
  });
}

/**
 * Get current rate limit status without making a request.
 * 
 * @param {string} apiName - The API/operation name
 * @returns {Object} - { remainingRequests, windowMs, maxRequests }
 */
export function getRateLimitStatus(apiName) {
  const config = RATE_LIMITS[apiName];
  if (!config) return null;

  const key = getRateLimitKey(apiName);
  const now = Date.now();
  
  let requests = [];
  try {
    const stored = localStorage.getItem(key);
    requests = stored ? JSON.parse(stored) : [];
    requests = requests.filter(timestamp => now - timestamp < config.windowMs);
  } catch {
    requests = [];
  }

  return {
    remainingRequests: Math.max(0, config.maxRequests - requests.length),
    maxRequests: config.maxRequests,
    windowMs: config.windowMs,
    currentRequests: requests.length,
  };
}
