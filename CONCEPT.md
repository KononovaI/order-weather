# OrderWeather

## Team Members
- Member 1 - Jānis  
- Member 2 - Ivo  
- Member 3 - Inga  

## Project Description
Weather Wizard aka OrderWeather is a web application that allows users to “order” good weather for a specific date. The user makes a payment, and if the weather on the selected day matches the conditions (according to OpenWeatherMap API) — e.g., no rain and temperature above 20°C — the payment is kept. Otherwise, the amount is automatically refunded.

## Problem Statement
Many people rely on good weather for important events like weddings or outdoor activities. This app offers a form of symbolic “weather insurance,” allowing users to secure or recover their payment based on objective forecast data. It’s designed for anyone who wants some peace of mind when weather matters.

## API Selection
**API Name:** OpenWeatherMap API  
**API Documentation:** https://openweathermap.org/api  
**Why this API?**  
OpenWeatherMap provides reliable weather forecasts and real-time data, making it ideal for verifying if weather conditions meet the user's request. It’s widely used and well-documented for programmatic access.

### 2. GitHub Repository

**Project structure:**

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