# OrderWeather

## Team Members
- Member 1 - Jānis  
- Member 2 - Ivo  
- Member 3 - Inga  

## Project Description
OrderWeather is a web application that allows users to “order” good weather for a specific date. The user makes a payment, and if the weather on the selected day matches the conditions (according to OpenWeatherMap API) — e.g., no rain and temperature above 20°C — the payment is kept. Otherwise, the amount is automatically refunded.

## Problem Statement
Many people rely on good weather for important events like weddings or outdoor activities. This app offers a form of symbolic “weather insurance,” allowing users to secure or recover their payment based on objective forecast data. It’s designed for anyone who wants some peace of mind when weather matters.

## API Selection
**API Name:** OpenWeatherMap API  
**API Documentation:** https://openweathermap.org/api  
**Why this API?**  
OpenWeatherMap provides reliable weather forecasts and real-time data, making it ideal for verifying if weather conditions meet the user's request. It’s widely used and well-documented for programmatic access.

### 2. GitHub Repository

**Project structure for now:**

orderweather/
|
└── README.md         # Main info of project
├── CONCEPT.md        # Project idea and API description
├── .gitignore        # Contains `.env`, `node_modules/`
├── .env              # Secreat info storage
├── .env.example      # Sample with variable names, no real values