const API_KEY = import.meta.env.OPENWEATHER_API_KEY || import.meta.env.VITE_OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org';

export const weatherService = {
  async getCurrentWeather(city) {
    if (!API_KEY) throw new Error('API Key is missing');
    const response = await fetch(`${BASE_URL}/weather?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`);
    if (!response.ok) throw new Error('City not found');
    return response.json();
  },

  async getForecast(city) {
    if (!API_KEY) throw new Error('API Key is missing');
    const response = await fetch(`${BASE_URL}/forecast?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`);
    if (!response.ok) throw new Error('City not found');
    const data = await response.json();
    
    // Process forecast to get one entry per day (approx mid-day)
    // OpenWeatherMap returns data every 3 hours.
    const dailyForecasts = [];
    const seenDates = new Set();

    for (const item of data.list) {
      const date = item.dt_txt.split(' ')[0];
      if (!seenDates.has(date)) {
        seenDates.add(date);
        dailyForecasts.push(item);
      }
      if (dailyForecasts.length === 5) break;
    }
    
    return dailyForecasts;
  },

  /**
   * Reverse geocode coordinates to get city name.
   * Uses OpenStreetMap Nominatim API.
   * 
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @returns {Promise<string|null>} - City name or null on error
   */
  async reverseGeocode(lat, lon) {
    try {
      const response = await fetch(
        `${NOMINATIM_URL}/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`
      );
      
      if (!response.ok) {
        console.error('Geocoding request failed:', response.status);
        return null;
      }
      
      const data = await response.json();
      
      // Try to extract city name from various address fields
      const cityName = data.address?.city 
        || data.address?.town 
        || data.address?.village 
        || data.address?.municipality
        || data.display_name?.split(',')[0];
      
      return cityName || null;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  },

  simulateRefundScenario() {
    // Returns data for the "Time Machine" simulation
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    
    return {
      date: futureDate.toISOString().split('T')[0],
      actualWeather: {
        temp: 15,
        condition: 'Rain',
        description: 'heavy intensity rain'
      },
      originalForecast: {
        condition: 'Clear',
        temp: 25
      },
      refundAmount: 50,
      message: 'Refund Processed! The weather did not match your order.'
    };
  }
};

