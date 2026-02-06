/**
 * WeatherOrderForm Component
 * Form for ordering weather with temperature, conditions, and token amount.
 */

import { WEATHER_CONDITIONS } from '../constants/weatherConditions';

function WeatherOrderForm({
  selectedDate,
  orderForm,
  orderStatus,
  onFormChange,
  onSubmit,
}) {
  const handleFieldChange = (field, value) => {
    onFormChange({ [field]: value });
  };

  return (
    <section className="card highlight">
      <h2>3. Order Your Weather</h2>
      <p>Guarantee good weather for {selectedDate || 'your selected date'}!</p>

      <div className="form-grid">
        <div className="form-group">
          <label>Desired Temperature (°C):</label>
          <input
            type="number"
            value={orderForm.desiredTemp}
            onChange={(e) => handleFieldChange('desiredTemp', e.target.value)}
            placeholder="Type the desired temperature"
          />
        </div>

        <div className="form-group">
          <label>Desired Conditions:</label>
          <select
            value={orderForm.desiredConditions}
            onChange={(e) => handleFieldChange('desiredConditions', e.target.value)}
          >
            <option value="" disabled>
              Choose from the list
            </option>
            {WEATHER_CONDITIONS.map((condition) => (
              <option key={condition.value} value={condition.value}>
                {condition.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Tokens to Spend:</label>
          <input
            type="number"
            value={orderForm.tokensToSpend}
            onChange={(e) => handleFieldChange('tokensToSpend', e.target.value)}
            placeholder="Type amount"
          />
        </div>
      </div>

      <button className="primary-btn" onClick={onSubmit}>
        Place Order
      </button>

      {orderStatus && (
        <p
          className={`status-message ${
            orderStatus.includes('fade-out') ? 'fade-out' : ''
          }`}
        >
          {orderStatus.replace(' fade-out', '')}
        </p>
      )}
    </section>
  );
}

export default WeatherOrderForm;
