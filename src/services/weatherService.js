const API_KEY = import.meta.env.OPENWEATHER_API_KEY || import.meta.env.VITE_OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

export const weatherService = {
  async getCurrentWeather(city) {
    if (!API_KEY) throw new Error('API Key is missing');
    const response = await fetch(`${BASE_URL}/weather?q=${city}&units=metric&appid=${API_KEY}`);
    if (!response.ok) throw new Error('City not found');
    return response.json();
  },

  async getForecast(city) {
    if (!API_KEY) throw new Error('API Key is missing');
    const response = await fetch(`${BASE_URL}/forecast?q=${city}&units=metric&appid=${API_KEY}`);
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
