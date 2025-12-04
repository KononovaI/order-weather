import { useState, useEffect } from 'react';
import './index.css';
import { weatherService } from './services/weatherService';
import MapLocationPicker from './mapLocationPicker';
import logoImage from './assets/weather-wizard-logo.jpg';

function App() {
  // State
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [tokens, setTokens] = useState(100);
  const [orderStatus, setOrderStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSimulation, setIsSimulation] = useState(false);
  const [simulationData, setSimulationData] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  // Order Form State
  const [desiredTemp, setDesiredTemp] = useState('');
  const [tokensToSpend, setTokensToSpend] = useState('');

  useEffect(() => {
    // Check for simulation mode
    const params = new URLSearchParams(window.location.search);
    if (params.get('simulation') === 'refund') {
      setIsSimulation(true);
      const data = weatherService.simulateRefundScenario();
      
      const dateParam = params.get('date');
      if (dateParam) {
        setSelectedDate(dateParam);
      }

      const desiredTempParam = params.get('desiredTemp');
      const tokensParam = params.get('tokens');
      
      if (desiredTempParam) {
        data.originalForecast.temp = desiredTempParam;
        
        // Check if actual weather meets the order
        // Actual is hardcoded to 15 in weatherService
        if (data.actualWeather.temp >= parseFloat(desiredTempParam)) {
            data.message = "Weather matched your order. Payment kept.";
            data.refundAmount = 0;
            data.isSuccess = true;
        }
      }
      
      // Set refund amount from URL parameter
      if (tokensParam) {
        data.refundAmount = parseInt(tokensParam);
      }
      
      setSimulationData(data);
    }

    // Get user's geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);

          // Reverse geocode to get city name
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
            );
            const data = await response.json();
            const cityName = data.address?.city || data.address?.town || data.address?.village || data.display_name.split(',')[0];
            setCity(cityName);
          } catch (error) {
            console.error('Error getting city name:', error);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }

  }, []);

  const handleCheckCurrent = async () => {
    if (!city) return;
    setLoading(true);
    setError('');
    try {
      const data = await weatherService.getCurrentWeather(city);
      setWeather(data);
      // Also fetch forecast when city changes
      const forecastData = await weatherService.getForecast(city);
      setForecast(forecastData);
      if (forecastData.length > 0) {
        setSelectedDate(forecastData[0].dt_txt.split(' ')[0]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOrder = () => {
    if (!tokensToSpend || tokensToSpend <= 0) {
      setOrderStatus('Please enter a valid token amount.');
      return;
    }
    if (tokensToSpend > tokens) {
      setOrderStatus('Not enough tokens!');
      return;
    }
    if (!selectedDate) {
      setOrderStatus('Please select a date.');
      return;
    }

    // Deduct tokens initially
    setTokens(prev => prev - parseInt(tokensToSpend));

    // Find forecast for selected date
    const dayForecast = forecast.find(f => f.dt_txt.startsWith(selectedDate));
    
    if (!dayForecast) {
      setOrderStatus('No forecast data for selected date.');
      return;
    }

    // Check conditions
    const forecastTemp = dayForecast.main.temp;
    const target = desiredTemp ? parseFloat(desiredTemp) : -Infinity;

    const isSuccess = forecastTemp >= target;

    if (isSuccess) {
      setOrderStatus(`Order Successful!`);
    } else {
      // Refund
      setTimeout(() => {
        setTokens(prev => prev + parseInt(tokensToSpend));
        setOrderStatus(`Order Successful!`);
      }, 1500); // Simulate processing delay
      setOrderStatus('Processing...');
    }
  };

  const handleMapLocationSelect = (location) => {
    if (location && location.placeName) {
      // Extract city name from place name (usually first part before comma)
      const cityMatch = location.placeName.split(',')[0];
      setCity(cityMatch.trim());
    }
  };

  const openTimeMachine = () => {
    window.open(`/?simulation=refund&date=${selectedDate}&desiredTemp=${desiredTemp}&tokens=${tokensToSpend}`, '_blank');
  };

  if (isSimulation && simulationData) { /* Here is content of simulation page */
    return (
      <div className="container simulation-mode">
        <h1>TIME MACHINE: FUTURE VIEW</h1>
        <div className="card">
          <h2>Date: {selectedDate}</h2>
          <div className={`alert ${simulationData.isSuccess ? 'success' : 'error'}`}>
            <h3>Weather Report</h3>
            <p>Actual Weather: {simulationData.actualWeather.condition} ({simulationData.actualWeather.temp}°C)</p>
            <p>Ordered Weather: {simulationData.originalForecast.condition} ({simulationData.originalForecast.temp}°C)</p>
          </div>
          <div className="refund-notice" style={{ backgroundColor: simulationData.isSuccess ? '#4caf50' : '#ff9800' }}>
            <h3>{simulationData.message}</h3>
            {!simulationData.isSuccess && (
                <p className="token-change">+{simulationData.refundAmount} Tokens</p>
            )}
          </div>
          <button onClick={() => window.close()}>Return to Present</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
			<img src={logoImage} alt="Weather Wizard Logo" className="app-logo" />
      <h1>Weather Wizard</h1>
      
      <div className="tokens-display">
        <span>Current balance (tokens): {tokens}</span>
      </div>

      <section className="card">
        <h2>1. Select City</h2>
        <div className="input-group">
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Enter city (e.g., London)" 
          />
          <button onClick={handleCheckCurrent} disabled={loading}>
            {loading ? 'Loading...' : 'Check Weather'}
          </button>
        </div>
        {error && <p className="error">{error}</p>}

        <button
          className={`map-toggle-btn ${showMap ? 'active' : ''}`}
          onClick={() => setShowMap(!showMap)}
        >
          {showMap ? '✕ Hide Map' : '📍 Select on Map'}
        </button>

        {showMap && (
          <MapLocationPicker
            onLocationSelect={handleMapLocationSelect}
            initialCenter={userLocation}
          />
        )}

        {weather && (
          <div className="weather-info">
            <h3>Current Weather in {weather.name}</h3>
            <div className="weather-stat">
              <span className="temp">{Math.round(weather.main.temp)}°C</span>
              <span className="condition">{weather.weather[0].main}</span>
            </div>
          </div>
        )}
      </section>

      {forecast.length > 0 && (
        <>
          <section className="card">
            <h2>2. Select Date</h2>
            <select 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)}
            >
              {forecast.map(item => (
                <option key={item.dt} value={item.dt_txt.split(' ')[0]}>
                  {item.dt_txt.split(' ')[0]}
                </option>
              ))}
            </select>
          </section>

          <section className="card highlight">
            <h2>3. Order Your Weather</h2>
            <p>Guarantee good weather for {selectedDate}!</p>
            
            <div className="form-grid">
              <div className="form-group">
                <label>Desired Temperature (°C):</label>
                <input 
                  type="number" 
                  value={desiredTemp}
                  onChange={(e) => setDesiredTemp(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Tokens to Spend:</label>
                <input 
                  type="number" 
                  value={tokensToSpend}
                  onChange={(e) => setTokensToSpend(e.target.value)}
                />
              </div>
            </div>

            <button className="primary-btn" onClick={handleOrder}>
              Place Order
            </button>

            {orderStatus && <p className="status-message">{orderStatus}</p>}
          </section>
        </>
      )}

      <section className="time-machine-section">
        <button className="time-machine-btn" onClick={openTimeMachine}>
          TIME MACHINE!!! 🕒
        </button>
      </section>
    </div>
  );
}

export default App;
