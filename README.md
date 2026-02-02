# Welcome to "Weather Wizard" aka "Order Weather"
Weather Wizard is a web application that allows users to “order” good weather for a specific date. The user makes a payment (tokens simulate real-life payments), and if the weather on the selected day matches the conditions (you can check the conditions in the Simulation Mode) — e.g., "Rain" and temperature 15°C — the payment is kept. Otherwise, the amount is automatically refunded.

## 🚀 Key Features

- **📍 Interactive Location Selection**: Use the integrated Leaflet map to pinpoint any location or use your browser's geolocation to find your current city.
- **📊 Real-time Weather Data**: Fetches current conditions and 4-day forecasts via the OpenWeatherMap API.
- **💰 Token System**: Manage a virtual balance (stored locally) to place weather orders and simulates real payments.
- **🎭 Simulation Mode (Time Machine)**: A unique feature allowing users to fast-forward in time to see if their weather order was successful and witness the refund logic in action.
- **📱 Responsive Design**: Fully optimized for both desktop and mobile devices with a clean, modern UI.

## 🛠️ Technologies Used

- **Framework**: [React 18](https://reactjs.org/) (Hooks-based)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Maps**: [Leaflet](https://leafletjs.com/) & [React-Leaflet](https://react-leaflet.js.org/)
- **API**: [OpenWeatherMap API](https://openweathermap.org/api)
- **Styling**: Modern CSS3 (Custom properties, Flexbox/Grid)

## ⚙️ Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v16.0.0 or higher recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)

### 1. Clone the repository
   ```bash
git clone https://github.com/KononovaI/order-weather.git
cd order-weather
npm install
```

### 2. API Keys Setup
The project requires an API key from OpenWeatherMap.
1. Create a `.env` file in the root directory.
2. Add your API key:
  ```env
  VITE_OPENWEATHER_API_KEY=your_api_key_here
  ```
  *(Note: Use `VITE_` prefix for environment variables in Vite projects)*

## 🖥️ Usage

### Development Server
Run the app in development mode with hot-reload:
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

## 📁 Project Structure

```text
order-weather/
├── dist/                      # Production build output
├── src/                       # Source code directory
│   ├── assets/                # Static assets (images, logos, etc.)
│   │   ├── favicon.png
│   │   └── weather-wizard-logo.jpg
│   ├── services/              # API call services and helper functions
│   │   └── weatherService.js  # Logic for OpenWeatherMap API communication
│   ├── App.jsx                # Main application component and logic
│   ├── index.css              # Global styles
│   ├── main.jsx               # Application bootstrap entry point
│   └── mapLocationPicker.jsx  # Map interaction component for selecting locations
├── .env                       # Secret API keys and environment variables
├── .env.example               # Template for environment variables
├── .gitignore                 # Git ignore rules
├── CONCEPT.md                 # Project conceptual documentation
├── index.html                 # Entry point for the web application
├── package.json               # Project dependencies and scripts
├── README.md                  # Project overview and installation instructions
└── vite.config.js             # Vite configuration
```

## 👥 Team Members
- **Member 1**: Jānis S.
- **Member 2**: Ivo
- **Member 3**: Inga K.

---
*Created for study purposes.*