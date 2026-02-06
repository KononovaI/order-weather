/**
 * Weather Conditions Constants
 * Centralized list of weather conditions for dropdowns and validation.
 */

export const WEATHER_CONDITIONS = [
  { value: 'Clear', label: 'Clear ☀️' },
  { value: 'Clouds', label: 'Cloudy ☁️' },
  { value: 'Rain', label: 'Rain 🌧️' },
  { value: 'Drizzle', label: 'Drizzle 🌦️' },
  { value: 'Thunderstorm', label: 'Thunderstorm ⛈️' },
  { value: 'Snow', label: 'Snow ❄️' },
  { value: 'Mist', label: 'Mist 🌫️' },
  { value: 'Fog', label: 'Fog 🌁' },
];

/**
 * Get condition label by value
 * @param {string} value - The condition value
 * @returns {string} - The display label
 */
export function getConditionLabel(value) {
  const condition = WEATHER_CONDITIONS.find((c) => c.value === value);
  return condition ? condition.label : value;
}

/**
 * Check if a condition value is valid
 * @param {string} value - The condition value to check
 * @returns {boolean} - True if valid
 */
export function isValidCondition(value) {
  return WEATHER_CONDITIONS.some((c) => c.value === value);
}
