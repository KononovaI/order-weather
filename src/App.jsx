import { useState, useEffect } from 'react';
import './index.css';
import { weatherService } from './services/weatherService';
import { evaluateOrder, validateOrderForm } from './services/orderEvaluator';
import logoImage from './assets/weather-wizard-logo.jpg';

// Phase 4: Sub-components logic decomposition
import TokenDisplay from './components/TokenDisplay';
import CitySelector from './components/CitySelector';
import DateSelector from './components/DateSelector';
import WeatherOrderForm from './components/WeatherOrderForm';
import SimulationView from './components/SimulationView';
import ErrorAlert from './components/ErrorAlert';
import LoadingSpinner from './components/LoadingSpinner';

function App() {
  // ============================================
  // CONSOLIDATED STATE
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
    errorType: null, // validation, api, network, etc.
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
      
      // Use pure function to evaluate order
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

          // Reverse geocode to get city name
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

  const handleCheckWeather = async () => {
    if (!weatherData.city) return;
    
    updateAsyncState({ isLoading: true, error: '', errorType: null });
    
    try {
      const current = await weatherService.getCurrentWeather(weatherData.city);
      const forecast = await weatherService.getForecast(weatherData.city);
      
      updateWeatherData({ current, forecast });
    } catch (err) {
      updateAsyncState({ 
        error: err.message, 
        errorType: err.type || 'api' 
      });
    } finally {
      updateAsyncState({ isLoading: false });
    }
  };

  const handleOrderSubmit = () => {
    // Validate using pure function
    const validation = validateOrderForm(orderForm, tokens);
    
    if (!validation.isValid) {
      updateAsyncState({ 
        error: validation.firstError.message, 
        errorType: 'validation' 
      });
      // Clear message after 3 seconds for validation errors
      setTimeout(() => updateAsyncState({ error: '', errorType: null }), 3000);
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
      <SimulationView 
        selectedDate={orderForm.selectedDate}
        simulationData={simulation.data}
        onClose={() => window.close()}
      />
    );
  }

  // ============================================
  // RENDER: MAIN APP
  // ============================================

  return (
    <div className="container">
      <img src={logoImage} alt="Weather Wizard Logo" className="app-logo" />
      <h1>Weather Wizard</h1>
      
      <TokenDisplay tokens={tokens} />

      {asyncState.error && (
        <ErrorAlert 
          type={asyncState.errorType} 
          message={asyncState.error} 
          onDismiss={() => updateAsyncState({ error: '', errorType: null })}
        />
      )}

      <CitySelector 
        city={weatherData.city}
        currentWeather={weatherData.current}
        userLocation={weatherData.userLocation}
        showMap={uiState.showMap}
        isLoading={asyncState.isLoading}
        onCityChange={(city) => updateWeatherData({ city })}
        onCheckWeather={handleCheckWeather}
        onToggleMap={() => updateUiState({ showMap: !uiState.showMap })}
        onMapLocationSelect={handleMapLocationSelect}
      />

      <DateSelector 
        forecast={weatherData.forecast}
        selectedDate={orderForm.selectedDate}
        onDateChange={(selectedDate) => updateOrderForm({ selectedDate })}
      />

      {weatherData.forecast.length > 0 && (
        <WeatherOrderForm 
          selectedDate={orderForm.selectedDate}
          orderForm={orderForm}
          orderStatus={uiState.orderStatus}
          onFormChange={updateOrderForm}
          onSubmit={handleOrderSubmit}
        />
      )}

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
