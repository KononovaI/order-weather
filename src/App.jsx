import { useState, useEffect } from 'react';
import './index.css';
import { weatherService } from './services/weatherService';
import { evaluateOrder, validateOrderForm } from './services/orderEvaluator';
import MapLocationPicker from './MapLocationPicker';
import logoImage from './assets/weather-wizard-logo.jpg';

function App() {
  // ============================================
  // CONSOLIDATED STATE (Phase 1.1 Refactoring)
  // ============================================

  // 1. WEATHER DATA - city, current weather, forecast, user location
  const [weatherData, setWeatherData] = useState({
    city: '',
    current: null,
    forecast: [],
    userLocation: null,
  });

  // 2. ORDER FORM - all order-related inputs
  const [orderForm, setOrderForm] = useState({
    selectedDate: '',
    desiredTemp: '',
    desiredConditions: '',
    tokensToSpend: '',
  });

  // 3. UI STATE - visual/interaction state
  const [uiState, setUiState] = useState({
    showMap: false,
    orderPlaced: false,
    orderStatus: '',
  });

  // 4. ASYNC STATE - loading indicators and errors
  const [asyncState, setAsyncState] = useState({
    isLoading: false,
    error: '',
  });

  // 5. SIMULATION STATE - time machine mode
  const [simulation, setSimulation] = useState({
    isActive: false,
    data: null,
  });

  // 6. TOKENS - separate for localStorage sync
  const [tokens, setTokens] = useState(() => {
    const savedTokens = localStorage.getItem('weatherWizardTokens');
    return savedTokens ? parseInt(savedTokens) : 100;
  });

  // ============================================
  // STATE UPDATE HELPERS
  // ============================================

  const updateWeatherData = (updates) => {
    setWeatherData(prev => ({ ...prev, ...updates }));
  };

  const updateOrderForm = (updates) => {
    setOrderForm(prev => ({ ...prev, ...updates }));
  };

  const updateUiState = (updates) => {
    setUiState(prev => ({ ...prev, ...updates }));
  };

  const updateAsyncState = (updates) => {
    setAsyncState(prev => ({ ...prev, ...updates }));
  };

  const updateSimulation = (updates) => {
    setSimulation(prev => ({ ...prev, ...updates }));
  };

  // ============================================
  // EFFECTS
  // ============================================

  // Save tokens to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('weatherWizardTokens', tokens.toString());
  }, [tokens]);

  useEffect(() => {
    // Check for simulation mode
    const params = new URLSearchParams(window.location.search);
    if (params.get('simulation') === 'refund') {
      updateSimulation({ isActive: true });
      const data = weatherService.simulateRefundScenario();
      
      const dateParam = params.get('date');
      if (dateParam) {
        updateOrderForm({ selectedDate: dateParam });
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
      
      // Use pure function to evaluate order (Phase 1.2)
      const evaluation = evaluateOrder(
        { desiredTemp: desiredTempParam, desiredCondition: desiredConditionsParam },
        { temp: data.actualWeather.temp, condition: data.actualWeather.condition }
      );
      
      data.message = evaluation.message;
      data.isSuccess = evaluation.isSuccess;
      data.refundAmount = evaluation.isSuccess ? 0 : parseInt(tokensParam || 0);
      
      // Handle refund for popup window
      if (!evaluation.isSuccess && window.opener && tokensParam) {
        try {
          const currentTokens = parseInt(localStorage.getItem('weatherWizardTokens') || '100');
          const newTokens = currentTokens + parseInt(tokensParam);
          localStorage.setItem('weatherWizardTokens', newTokens.toString());
          window.opener.postMessage({ type: 'TOKEN_UPDATE', tokens: newTokens }, '*');
        } catch (error) {
          console.error('Error updating parent tokens:', error);
        }
      }
      
      updateSimulation({ data });
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
          updateWeatherData({ userLocation: [latitude, longitude] });

          // Reverse geocode to get city name (Phase 1.3 - use service layer)
          const cityName = await weatherService.reverseGeocode(latitude, longitude);
          if (cityName) {
            updateWeatherData({ city: cityName });
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

  // ============================================
  // EVENT HANDLERS
  // ============================================

  const handleCheckCurrent = async () => {
    if (!weatherData.city) return;
    
    updateAsyncState({ isLoading: true, error: '' });
    
    try {
      const data = await weatherService.getCurrentWeather(weatherData.city);
      updateWeatherData({ current: data });
      
      const forecastData = await weatherService.getForecast(weatherData.city);
      updateWeatherData({ forecast: forecastData });
    } catch (err) {
      updateAsyncState({ error: err.message });
    } finally {
      updateAsyncState({ isLoading: false });
    }
  };

  const handleOrder = () => {
    // Validate using pure function (Phase 1.2)
    const validation = validateOrderForm(orderForm, tokens);
    
    if (!validation.isValid) {
      updateUiState({ orderStatus: validation.firstError.message });
      return;
    }

    // Deduct tokens when placing order
    setTokens(prev => prev - parseInt(orderForm.tokensToSpend));

    updateUiState({ orderPlaced: true, orderStatus: 'Order successful!' });

    // Start fade out after 2 seconds
    setTimeout(() => {
      updateUiState({ orderStatus: 'Order successful! fade-out' });
    }, 2000);

    // Completely remove after 3 seconds
    setTimeout(() => {
      updateUiState({ orderStatus: '' });
    }, 3000);

    // Clear form fields
    updateOrderForm({
      selectedDate: '',
      desiredTemp: '',
      desiredConditions: '',
      tokensToSpend: '',
    });
  };

  const handleMapLocationSelect = (location) => {
    if (location && location.placeName) {
      const cityMatch = location.placeName.split(',')[0];
      updateWeatherData({ city: cityMatch.trim() });
    }
  };

  const openTimeMachine = () => {
    const { selectedDate, desiredTemp, desiredConditions, tokensToSpend } = orderForm;
    window.open(
      `/?simulation=refund&date=${selectedDate}&desiredTemp=${desiredTemp}&desiredConditions=${desiredConditions}&tokens=${tokensToSpend}`,
      '_blank'
    );
  };

  // ============================================
  // RENDER: SIMULATION MODE
  // ============================================

  if (simulation.isActive && simulation.data) {
    return (
      <div className="container simulation-mode">
        <h1>TIME MACHINE: FUTURE VIEW</h1>
        <div className="card">
          <h2>Weather Report: {orderForm.selectedDate}</h2>
          <div className={`alert ${simulation.data.isSuccess ? 'success' : 'error'}`}>
            <h3>Actual Weather: {simulation.data.actualWeather.condition} ({simulation.data.actualWeather.temp}°C)</h3>
            <h3>Ordered Weather: {simulation.data.originalForecast.condition} ({simulation.data.originalForecast.temp}°C)</h3>
          </div>
          <div className="refund-notice" style={{ backgroundColor: simulation.data.isSuccess ? '#4caf50' : '#ff9800' }}>
            <h3>{simulation.data.message}</h3>
            {!simulation.data.isSuccess && (
              <p className="token-change">+{simulation.data.refundAmount} Tokens</p>
            )}
          </div>
          <button onClick={() => window.close()} style={{ marginTop: '2rem' }}>Return to Present</button>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER: MAIN APP
  // ============================================

  // Filter forecast to show only future dates
  const getFutureForecast = () => {
    if (weatherData.forecast.length === 0) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return weatherData.forecast.filter(item => {
      const forecastDate = new Date(item.dt_txt.split(' ')[0]);
      return forecastDate >= tomorrow;
    });
  };

  const futureForecast = getFutureForecast();

  return (
    <div className="container">
      <img src={logoImage} alt="Weather Wizard Logo" className="app-logo" />
      <h1>Weather Wizard</h1>
      
      <div className="tokens-display">
        <h3>Current balance (tokens): {tokens}</h3>
      </div>

      {/* SECTION 1: City Selection */}
      <section className="card">
        <h2>1. Select City</h2>
        <div className="input-group">
          <input
            value={weatherData.city}
            onChange={(e) => updateWeatherData({ city: e.target.value })}
            placeholder="Enter city (e.g., London)" 
          />
          <button 
            className="fancy-btn" 
            onClick={handleCheckCurrent} 
            disabled={asyncState.isLoading}
          >
            {asyncState.isLoading ? 'Loading...' : 'Check Weather'}
          </button>
        </div>
        
        {asyncState.error && <p className="error">{asyncState.error}</p>}

        <button
          className={`map-toggle-btn ${uiState.showMap ? 'active' : ''}`}
          onClick={() => updateUiState({ showMap: !uiState.showMap })}
        >
          {uiState.showMap ? '✕ Hide Map' : '📍 Select on Map'}
        </button>

        {uiState.showMap && (
          <MapLocationPicker
            onLocationSelect={handleMapLocationSelect}
            initialCenter={weatherData.userLocation}
          />
        )}

        {weatherData.current && (
          <div className="weather-info">
            <h3>Current Weather in {weatherData.current.name}</h3>
            <div className="weather-stat">
              <span className="temp">{Math.round(weatherData.current.main.temp)}°C</span>
              <span className="condition">{weatherData.current.weather[0].main}</span>
            </div>
          </div>
        )}
      </section>

      {/* SECTION 2 & 3: Date Selection and Order Form */}
      {futureForecast.length > 0 && (
        <>
          <section className="card">
            <h2>2. Select Date</h2>
            <select 
              value={orderForm.selectedDate} 
              onChange={(e) => updateOrderForm({ selectedDate: e.target.value })}
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
            <p>Guarantee good weather for {orderForm.selectedDate || 'your selected date'}!</p>
            
            <div className="form-grid">
              <div className="form-group">
                <label>Desired Temperature (°C):</label>
                <input 
                  type="number" 
                  value={orderForm.desiredTemp}
                  onChange={(e) => updateOrderForm({ desiredTemp: e.target.value })}
                  placeholder="Type the desired temperature"
                />
              </div>

              <div className="form-group">
                <label>Desired Conditions:</label>
                <select 
                  value={orderForm.desiredConditions}
                  onChange={(e) => updateOrderForm({ desiredConditions: e.target.value })}
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
                  value={orderForm.tokensToSpend}
                  onChange={(e) => updateOrderForm({ tokensToSpend: e.target.value })}
                  placeholder="Type amount"
                />
              </div>
            </div>

            <button className="primary-btn" onClick={handleOrder}>
              Place Order
            </button>

            {uiState.orderStatus && (
              <p className={`status-message ${uiState.orderStatus.includes('fade-out') ? 'fade-out' : ''}`}>
                {uiState.orderStatus.replace(' fade-out', '')}
              </p>
            )}
          </section>
        </>
      )}

      {/* TIME MACHINE BUTTON */}
      {uiState.orderPlaced && (
        <section className="time-machine-section">
          <button className="fancy-btn pulsate" onClick={openTimeMachine}>
            TIME MACHINE 🕒
          </button>
        </section>
      )}
    </div>
  );
}

export default App;
