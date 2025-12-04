import { useState, useEffect } from 'react';
import './index.css';
import { weatherService } from './services/weatherService';
import MapLocationPicker from './MapLocationPicker';
import logoImage from './assets/weather-wizard-logo.jpg';

function App() {
  // State
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [tokens, setTokens] = useState(() => {
    const savedTokens = localStorage.getItem('weatherWizardTokens');
    return savedTokens ? parseInt(savedTokens) : 100;
  });
  const [orderStatus, setOrderStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSimulation, setIsSimulation] = useState(false);
  const [simulationData, setSimulationData] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  // Order Form State
  const [desiredTemp, setDesiredTemp] = useState('');
  const [desiredConditions, setDesiredConditions] = useState('');
  const [tokensToSpend, setTokensToSpend] = useState('');
  const [orderPlaced, setOrderPlaced] = useState(false);

  // Save tokens to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('weatherWizardTokens', tokens.toString());
  }, [tokens]);

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
      const desiredConditionsParam = params.get('desiredConditions');
      const tokensParam = params.get('tokens');
      
      if (desiredTempParam) {
        data.originalForecast.temp = desiredTempParam;
      }
      
      if (desiredConditionsParam) {
        data.originalForecast.condition = desiredConditionsParam;
      }
      
      // Check if actual weather meets the order
      // Actual is hardcoded to 15°C and 'Rain' in weatherService
      const tempMatches = data.actualWeather.temp >= parseFloat(desiredTempParam || -Infinity);
      const conditionMatches = !desiredConditionsParam || data.actualWeather.condition === desiredConditionsParam;
      
      if (tempMatches && conditionMatches) {
        data.message = "Weather matched your order. Payment kept.";
        data.refundAmount = 0;
        data.isSuccess = true;
        // No refund, tokens stay deducted
      } else {
        const reason = !tempMatches ? 'temperature' : 'weather condition';
        data.message = `Refund Processed! The ${reason} did not match your order.`;
        data.isSuccess = false;
        
        // Update parent window's tokens if this is a popup
        if (window.opener && tokensParam) {
          try {
            const currentTokens = parseInt(localStorage.getItem('weatherWizardTokens') || '100');
            const newTokens = currentTokens + parseInt(tokensParam);
            localStorage.setItem('weatherWizardTokens', newTokens.toString());
            // Trigger storage event for parent window
            window.opener.postMessage({ type: 'TOKEN_UPDATE', tokens: newTokens }, '*');
          } catch (error) {
            console.error('Error updating parent tokens:', error);
          }
        }
      }
      
      // Set refund amount from URL parameter
      if (tokensParam) {
        data.refundAmount = parseInt(tokensParam);
      }
      
      setSimulationData(data);
    }

    // Listen for token updates from simulation window
    const handleMessage = (event) => {
      if (event.data.type === 'TOKEN_UPDATE') {
        setTokens(event.data.tokens);
      }
    };
    window.addEventListener('message', handleMessage);

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

    return () => {
      window.removeEventListener('message', handleMessage);
    };
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
      // Don't auto-select date - user must choose
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOrder = () => {
    // Validate all required fields
    if (!selectedDate) {
      setOrderStatus('Please select a date.');
      return;
    }
    if (!desiredTemp || desiredTemp === '') {
      setOrderStatus('Please enter desired temperature.');
      return;
    }
    if (!desiredConditions || desiredConditions === '') {
      setOrderStatus('Please select desired conditions.');
      return;
    }
    if (!tokensToSpend || tokensToSpend <= 0) {
      setOrderStatus('Please enter a valid token amount.');
      return;
    }
    if (tokensToSpend > tokens) {
      setOrderStatus('Not enough tokens!');
      return;
    }

    // Deduct tokens when placing order
    setTokens(prev => prev - parseInt(tokensToSpend));

    setOrderPlaced(true);
    setOrderStatus('Order successful!');
  };

  const handleMapLocationSelect = (location) => {
    if (location && location.placeName) {
      // Extract city name from place name (usually first part before comma)
      const cityMatch = location.placeName.split(',')[0];
      setCity(cityMatch.trim());
    }
  };

  const openTimeMachine = () => {
    window.open(`/?simulation=refund&date=${selectedDate}&desiredTemp=${desiredTemp}&desiredConditions=${desiredConditions}&tokens=${tokensToSpend}`, '_blank');
  };

  if (isSimulation && simulationData) { /* Here is content of simulation page */
    return (
      <div className="container simulation-mode">
        <h1>TIME MACHINE: FUTURE VIEW</h1>
        <div className="card">
          <h2>Weather Report: {selectedDate}</h2>
          <div className={`alert ${simulationData.isSuccess ? 'success' : 'error'}`}>
            <h3>Actual Weather: {simulationData.actualWeather.condition} ({simulationData.actualWeather.temp}°C)</h3>
            <h3>Ordered Weather: {simulationData.originalForecast.condition} ({simulationData.originalForecast.temp}°C)</h3>
          </div>
          <div className="refund-notice" style={{ backgroundColor: simulationData.isSuccess ? '#4caf50' : '#ff9800' }}>
            <h3>{simulationData.message}</h3>
            {!simulationData.isSuccess && (
                <p className="token-change">+{simulationData.refundAmount} Tokens</p>
            )}
          </div>
          <button onClick={() => window.close()} style={{ marginTop: '2rem' }}>Return to Present</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
			<img src={logoImage} alt="Weather Wizard Logo" className="app-logo" />
      <h1>Weather Wizard</h1>
      
      <div className="tokens-display">
        <h3>Current balance (tokens): {tokens}</h3>
      </div>

      <section className="card">
        <h2>1. Select City</h2>
        <div className="input-group">
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Enter city (e.g., London)" 
          />
          <button className="time-machine-btn" onClick={handleCheckCurrent} disabled={loading}>
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

      {forecast.length > 0 && (() => {
        // Filter to show only future dates (tomorrow onwards)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const futureForecast = forecast.filter(item => {
          const forecastDate = new Date(item.dt_txt.split(' ')[0]);
          return forecastDate >= tomorrow;
        });
        
        return futureForecast.length > 0 ? (
        <>
          <section className="card">
            <h2>2. Select Date</h2>
            <select 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)}
            >
              <option value="" disabled>Choose the date</option>
              {futureForecast.map(item => (
                <option key={item.dt} value={item.dt_txt.split(' ')[0]}>
                  {item.dt_txt.split(' ')[0]}
                </option>
              ))}
            </select>
          </section>

          <section className="card highlight">
            <h2>3. Order Your Weather</h2>
            <p>Guarantee good weather for {selectedDate || 'your selected date'}!</p>
            
            <div className="form-grid">
              <div className="form-group">
                <label>Desired Temperature (°C):</label>
                <input 
                  type="number" 
                  value={desiredTemp}
                  onChange={(e) => setDesiredTemp(e.target.value)}
                  placeholder="Type the desired temperature"
                />
              </div>

							<div className="form-group">
                <label>Desired Conditions:</label>
                <select 
                  value={desiredConditions}
                  onChange={(e) => setDesiredConditions(e.target.value)}
                >
                  <option value="" disabled>Choose from the list</option>
                  <option value="Clear">Clear</option>
                  <option value="Clouds">Clouds</option>
                  <option value="Rain">Rain</option>
                  <option value="Drizzle">Drizzle</option>
                  <option value="Thunderstorm">Thunderstorm</option>
                  <option value="Snow">Snow</option>
                  <option value="Mist">Mist</option>
                  <option value="Fog">Fog</option>
                </select>
              </div>

              <div className="form-group">
                <label>Tokens to Spend:</label>
                <input 
                  type="number" 
                  value={tokensToSpend}
                  onChange={(e) => setTokensToSpend(e.target.value)}
                  placeholder="Type amount"
                />
              </div>
            </div>

            <button className="primary-btn" onClick={handleOrder}>
              Place Order
            </button>

            {orderStatus && <p className="status-message">{orderStatus}</p>}
          </section>
        </>
        ) : null;
      })()}

      {orderPlaced && (
        <section className="time-machine-section">
          <button className="time-machine-btn" onClick={openTimeMachine}>
            TIME MACHINE 🕒
          </button>
        </section>
      )}
    </div>
  );
}

export default App;
