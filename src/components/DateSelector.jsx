/**
 * DateSelector Component
 * Displays available forecast dates for selection.
 */

function DateSelector({ forecast, selectedDate, onDateChange }) {
  // Filter to show only future dates
  const getFutureForecast = () => {
    if (forecast.length === 0) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return forecast.filter((item) => {
      const forecastDate = new Date(item.dt_txt.split(' ')[0]);
      return forecastDate >= tomorrow;
    });
  };

  const futureForecast = getFutureForecast();

  if (futureForecast.length === 0) {
    return null;
  }

  return (
    <section className="card">
      <h2>2. Select Date</h2>
      <select
        value={selectedDate}
        onChange={(e) => onDateChange(e.target.value)}
      >
        <option value="" disabled>
          Choose the date
        </option>
        {futureForecast.map((item) => (
          <option key={item.dt} value={item.dt_txt.split(' ')[0]}>
            {item.dt_txt.split(' ')[0]}
          </option>
        ))}
      </select>
    </section>
  );
}

export default DateSelector;
