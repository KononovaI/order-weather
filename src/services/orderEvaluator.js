/**
 * Order Evaluator Service
 * Pure functions for evaluating weather orders against actual weather.
 * These functions have no side effects and can be easily tested.
 */

/**
 * @typedef {Object} OrderData
 * @property {string|number} desiredTemp - Minimum desired temperature in Celsius
 * @property {string} desiredCondition - Desired weather condition (e.g., 'Clear', 'Rain')
 */

/**
 * @typedef {Object} ActualWeather
 * @property {number} temp - Actual temperature in Celsius
 * @property {string} condition - Actual weather condition
 */

/**
 * @typedef {Object} EvaluationResult
 * @property {boolean} isSuccess - Whether the order conditions were met
 * @property {string} message - Human-readable result message
 * @property {string|null} reason - The reason for failure (if failed)
 */

/**
 * Evaluates if the actual weather matches the ordered weather conditions.
 * This is a PURE FUNCTION - no side effects, easily testable.
 * 
 * @param {OrderData} order - The user's order with desired conditions
 * @param {ActualWeather} actual - The actual weather that occurred
 * @returns {EvaluationResult} - The evaluation result
 * 
 * @example
 * const result = evaluateOrder(
 *   { desiredTemp: 20, desiredCondition: 'Clear' },
 *   { temp: 25, condition: 'Clear' }
 * );
 * // result: { isSuccess: true, message: '...', reason: null }
 */
export function evaluateOrder(order, actual) {
  // Parse temperature to handle string inputs
  const desiredTemp = parseFloat(order.desiredTemp);
  const actualTemp = parseFloat(actual.temp);

  // Check if temperature meets or exceeds the desired minimum
  const tempMatches = !isNaN(desiredTemp) ? actualTemp >= desiredTemp : true;
  
  // Check if weather condition matches (if specified)
  const conditionMatches = !order.desiredCondition || 
                           actual.condition === order.desiredCondition;

  if (tempMatches && conditionMatches) {
    return {
      isSuccess: true,
      message: 'Weather matched your order. Payment kept.',
      reason: null,
    };
  }

  // Determine the reason for failure
  const reason = !tempMatches ? 'temperature' : 'weather condition';
  
  return {
    isSuccess: false,
    message: `Refund Processed! The ${reason} did not match your order.`,
    reason: reason,
  };
}

/**
 * Validates order form data before submission.
 * Returns an object with validation status and any errors.
 * 
 * @param {Object} orderForm - The order form data
 * @param {string} orderForm.selectedDate - Selected date
 * @param {string} orderForm.desiredTemp - Desired temperature
 * @param {string} orderForm.desiredConditions - Desired weather condition
 * @param {string|number} orderForm.tokensToSpend - Tokens to wager
 * @param {number} availableTokens - User's current token balance
 * @returns {Object} - { isValid, errors, firstError }
 */
export function validateOrderForm(orderForm, availableTokens) {
  const errors = [];

  if (!orderForm.selectedDate) {
    errors.push({ field: 'selectedDate', message: 'Please select a date' });
  }

  if (!orderForm.desiredTemp || orderForm.desiredTemp === '') {
    errors.push({ field: 'desiredTemp', message: 'Please enter desired temperature' });
  }

  if (!orderForm.desiredConditions || orderForm.desiredConditions === '') {
    errors.push({ field: 'desiredConditions', message: 'Please select weather condition' });
  }

  const tokenAmount = parseInt(orderForm.tokensToSpend);
  if (!tokenAmount || tokenAmount <= 0) {
    errors.push({ field: 'tokensToSpend', message: 'Please enter a valid token amount' });
  } else if (tokenAmount > availableTokens) {
    errors.push({ 
      field: 'tokensToSpend', 
      message: `Not enough tokens! You have ${availableTokens}` 
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    firstError: errors[0] || null,
  };
}

/**
 * Calculates the refund amount based on order evaluation.
 * 
 * @param {EvaluationResult} evaluation - Result from evaluateOrder
 * @param {number} originalTokens - Original tokens wagered
 * @returns {number} - Refund amount (0 if order was successful)
 */
export function calculateRefund(evaluation, originalTokens) {
  if (evaluation.isSuccess) {
    return 0;
  }
  return originalTokens;
}
