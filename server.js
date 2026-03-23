const express = require('express');
const cors = require('cors');
const path = require('path');
const citiesData = require('./data/cities.json');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Get all cities
app.get('/api/cities', (req, res) => {
  const cities = citiesData.map(c => ({ id: c.id, name: c.name }));
  res.json(cities);
});

// Get districts for a city
app.get('/api/districts/:cityId', (req, res) => {
  const city = citiesData.find(c => c.id === parseInt(req.params.cityId));
  if (!city) return res.status(404).json({ error: 'Şehir bulunamadı' });
  res.json(city.districts);
});

// Get weather data from Open-Meteo using city and district
app.get('/api/weather', async (req, res) => {
  const { city, district } = req.query;
  if (!city || !district) return res.status(400).json({ error: 'city ve district gerekli' });

  try {
    // 1. First get coordinates from Open-Meteo Geocoding API
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(district + ' ' + city)}&count=1&language=tr&format=json`;
    const geoRes = await fetch(geoUrl);
    const geoData = await geoRes.json();
    
    // Default fallback to approximate city center if district not found accurately
    let lat, lon;
    if (geoData.results && geoData.results.length > 0) {
      lat = geoData.results[0].latitude;
      lon = geoData.results[0].longitude;
    } else {
      // fallback to just city name
      const fallbackGeoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=tr&format=json`;
      const fallbackRes = await fetch(fallbackGeoUrl);
      const fallbackData = await fallbackRes.json();
      if (!fallbackData.results || fallbackData.results.length === 0) {
          return res.status(404).json({ error: 'Koordinat bulunamadı' });
      }
      lat = fallbackData.results[0].latitude;
      lon = fallbackData.results[0].longitude;
    }

    // 2. Then get weather using coordinates
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&timezone=Europe/Istanbul&forecast_days=7`;
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Open-Meteo API hatası:', err);
    res.status(500).json({ error: 'Hava durumu verisi alınamadı' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor`);
});
