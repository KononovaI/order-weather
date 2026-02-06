/**
 * SimulationView Component
 * Displays the "Time Machine" simulation results page.
 */

function SimulationView({ simulationData, onClose }) {
  if (!simulationData) return null;

  return (
    <div className="container simulation-mode">
      <h1>TIME MACHINE: FUTURE VIEW</h1>
      <div className="card">
        <h2>Weather Report: {simulationData.date}</h2>
        
        <div className={`alert ${simulationData.isSuccess ? 'success' : 'error'}`}>
          <h3>
            Actual Weather: {simulationData.actualWeather.condition} (
            {simulationData.actualWeather.temp}°C)
          </h3>
          <h3>
            Ordered Weather: {simulationData.originalForecast.condition} (
            {simulationData.originalForecast.temp}°C)
          </h3>
        </div>

        <div
          className="refund-notice"
          style={{
            backgroundColor: simulationData.isSuccess ? '#4caf50' : '#ff9800',
          }}
        >
          <h3>{simulationData.message}</h3>
          {!simulationData.isSuccess && (
            <p className="token-change">+{simulationData.refundAmount} Tokens</p>
          )}
        </div>

        <button onClick={onClose} style={{ marginTop: '2rem' }}>
          Return to Present
        </button>
      </div>
    </div>
  );
}

export default SimulationView;
