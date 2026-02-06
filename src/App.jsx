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
import { APP_CONFIG } from './constants/appConstants';

/**
 * Main Application Component
 * Manages the global state and provides the main UI structure.
 */
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
    lastOrder: null, // To keep track of data for Time Machine after form is cleared
  });

  // 4. ASYNC STATE - logical groupings for loading and errors
  const [asyncState, setAsyncState] = useState({
    isWeatherLoading: false,
    isForecastLoading: false,
    isOrderSubmitting: false,
    error: '',
    errorType: null,
  });

  // 5. SIMULATION STATE - time machine mode
  const [simulation, setSimulation] = useState({
    isActive: false,
    data: null,
  });

  // 6. TOKENS - separate for localStorage sync
  const [tokens, setTokens] = useState(() => {
    const savedTokens = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.TOKENS);
    return savedTokens ? parseInt(savedTokens) : APP_CONFIG.INITIAL_TOKENS;
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
    localStorage.setItem(APP_CONFIG.STORAGE_KEYS.TOKENS, tokens.toString());
  }, [tokens]);

  useEffect(() => {
    // Check for simulation mode
    const params = new URLSearchParams(window.location.search);
    if (params.get('simulation') === 'refund') {
      const scenarioData = weatherService.simulateRefundScenario();
      
      // Explicitly pull parameters from URL
      const dateParam = params.get('date');
      const tempParam = params.get('desiredTemp');
      const condParam = params.get('desiredConditions');
      const tokensParam = params.get('tokens');

      // Construct simulation data object - STRICTLY prioritizing URL parameters
      const simulationData = {
        ...scenarioData,
        date: dateParam || scenarioData.date,
        originalForecast: {
          temp: tempParam !== null ? tempParam : scenarioData.originalForecast.temp,
          condition: condParam !== null ? condParam : scenarioData.originalForecast.condition
        },
        refundAmount: 0 // Will be set below
      };

      // Recalculate evaluation with the EXACT parameters from URL
      const evaluation = evaluateOrder(
        { desiredTemp: tempParam, desiredCondition: condParam },
        { 
          temp: simulationData.actualWeather.temp, 
          condition: simulationData.actualWeather.condition 
        }
      );
      
      simulationData.message = evaluation.message;
      simulationData.isSuccess = evaluation.isSuccess;
      simulationData.refundAmount = evaluation.isSuccess ? 0 : parseInt(tokensParam || 0);
      
      // Update local form state for UI consistency
      updateOrderForm({
        selectedDate: dateParam || '',
        desiredTemp: tempParam || '',
        desiredConditions: condParam || '',
        tokensToSpend: tokensParam || '',
      });

      // Handle token refund logic
      if (!evaluation.isSuccess && window.opener && tokensParam) {
        try {
          const currentTokens = parseInt(localStorage.getItem('weatherWizardTokens') || '100');
          const newTokens = currentTokens + parseInt(tokensParam);
          localStorage.setItem('weatherWizardTokens', newTokens.toString());
          window.opener.postMessage({ type: 'TOKEN_UPDATE', tokens: newTokens }, '*');
        } catch (error) {
          console.error('Simulation: Token update failed', error);
        }
      }
      
      updateSimulation({ isActive: true, data: simulationData });
    }

    // Listen for token updates from simulation window
    const handleMessage = (event) => {
      if (event.data.type === 'TOKEN_UPDATE') {
        setTokens(event.data.tokens);
      }
    };
    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // ============================================
  // EVENT HANDLERS
  // ============================================

  const handleCheckWeather = async () => {
    if (!weatherData.city) return;
    
    updateAsyncState({ 
      isWeatherLoading: true, 
      isForecastLoading: true, 
      error: '', 
      errorType: null 
    });
    
    try {
      // Parallel fetch for better performance
      const [current, forecast] = await Promise.all([
        weatherService.getCurrentWeather(weatherData.city),
        weatherService.getForecast(weatherData.city)
      ]);
      
      updateWeatherData({ current, forecast });
    } catch (err) {
      updateAsyncState({ 
        error: err.message, 
        errorType: err.type || 'api' 
      });
    } finally {
      updateAsyncState({ 
        isWeatherLoading: false, 
        isForecastLoading: false 
      });
    }
  };

  const handleOrderSubmit = () => {
    updateAsyncState({ isOrderSubmitting: true, error: '', errorType: null });
    
    // Validate using pure function
    const validation = validateOrderForm(orderForm, tokens);
    
    if (!validation.isValid) {
      updateAsyncState({ 
        isOrderSubmitting: false,
        error: validation.firstError.message, 
        errorType: 'validation' 
      });
      // Clear message after 3 seconds for validation errors
      setTimeout(() => updateAsyncState({ error: '', errorType: null }), 3000);
      return;
    }

    // Deduct tokens when placing order
    setTokens(prev => prev - parseInt(orderForm.tokensToSpend));

    updateUiState({ 
      orderPlaced: true, 
      orderStatus: 'Order successful!',
      lastOrder: { ...orderForm } // Save data for Time Machine
    });
    updateAsyncState({ isOrderSubmitting: false });
    
    // Start fade out after 2 seconds
    setTimeout(() => {
      updateUiState({ orderStatus: 'Order successful! fade-out' });
    }, 2000);

    // Completely remove after 3 seconds
    setTimeout(() => {
      updateUiState({ orderStatus: '' });
    }, 3000);

    // Clear form fields explicitly
    setOrderForm({
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
    const data = uiState.lastOrder || orderForm;
    const { selectedDate, desiredTemp, desiredConditions, tokensToSpend } = data;
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
        isLoading={asyncState.isWeatherLoading}
        onCityChange={(city) => updateWeatherData({ city })}
        onCheckWeather={handleCheckWeather}
        onToggleMap={() => updateUiState({ showMap: !uiState.showMap })}
        onMapLocationSelect={handleMapLocationSelect}
      />

      <DateSelector 
        forecast={weatherData.forecast}
        selectedDate={orderForm.selectedDate}
        isLoading={asyncState.isForecastLoading}
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
