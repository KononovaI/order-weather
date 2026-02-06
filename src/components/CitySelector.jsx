/**
 * CitySelector Component
 * Handles city input, weather lookup, and map-based location selection.
 */

import MapLocationPicker from '../MapLocationPicker';
import LoadingSpinner from './LoadingSpinner';

function CitySelector({
  city,
  currentWeather,
  userLocation,
  showMap,
  isLoading,
  isGeocodingLoading,
  error,
  onCityChange,
  onCheckWeather,
  onToggleMap,
  onMapLocationSelect,
}) {
  return (
    <section className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>1. Select City</h2>
        {isGeocodingLoading && <small style={{ color: '#646cff' }}>📍 Detecting location...</small>}
      </div>
      
      <div className="input-group">
        <input
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          placeholder="Enter city (e.g., London)"
        />
        <button
          className="fancy-btn"
          onClick={onCheckWeather}
          disabled={isLoading}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '180px' }}
        >
          {isLoading ? <LoadingSpinner size="small" message="" /> : 'Check Weather'}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      <button
        className={`map-toggle-btn ${showMap ? 'active' : ''}`}
        onClick={onToggleMap}
      >
        {showMap ? '✕ Hide Map' : '📍 Select on Map'}
      </button>

      {showMap && (
        <MapLocationPicker
          onLocationSelect={onMapLocationSelect}
          initialCenter={userLocation}
        />
      )}

      {currentWeather && (
        <div className="weather-info">
          <h3>Current Weather in {currentWeather.name}</h3>
          <div className="weather-stat">
            <span className="temp">{Math.round(currentWeather.main.temp)}°C</span>
            <span className="condition">{currentWeather.weather[0].main}</span>
          </div>
        </div>
      )}
    </section>
  );
}

export default CitySelector;
