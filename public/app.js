const citySelect = document.getElementById('city-select');
const districtSelect = document.getElementById('district-select');
const searchBtn = document.getElementById('search-btn');
const loading = document.getElementById('loading');
const weatherResult = document.getElementById('weather-result');

let districts = [];

// Weather code to emoji & description mapping
const weatherMap = {
  0: { icon: '☀️', desc: 'Açık' },
  1: { icon: '🌤️', desc: 'Çoğunlukla açık' },
  2: { icon: '⛅', desc: 'Parçalı bulutlu' },
  3: { icon: '☁️', desc: 'Bulutlu' },
  45: { icon: '🌫️', desc: 'Sisli' },
  48: { icon: '🌫️', desc: 'Kırağılı sis' },
  51: { icon: '🌦️', desc: 'Hafif çisenti' },
  53: { icon: '🌦️', desc: 'Orta çisenti' },
  55: { icon: '🌧️', desc: 'Yoğun çisenti' },
  61: { icon: '🌧️', desc: 'Hafif yağmur' },
  63: { icon: '🌧️', desc: 'Orta yağmur' },
  65: { icon: '🌧️', desc: 'Şiddetli yağmur' },
  66: { icon: '🌨️', desc: 'Dondurucu hafif yağmur' },
  67: { icon: '🌨️', desc: 'Dondurucu yağmur' },
  71: { icon: '❄️', desc: 'Hafif kar' },
  73: { icon: '❄️', desc: 'Orta kar' },
  75: { icon: '❄️', desc: 'Yoğun kar' },
  77: { icon: '🌨️', desc: 'Kar taneleri' },
  80: { icon: '🌦️', desc: 'Hafif sağanak' },
  81: { icon: '🌧️', desc: 'Orta sağanak' },
  82: { icon: '⛈️', desc: 'Şiddetli sağanak' },
  85: { icon: '🌨️', desc: 'Hafif kar sağanağı' },
  86: { icon: '🌨️', desc: 'Yoğun kar sağanağı' },
  95: { icon: '⛈️', desc: 'Gök gürültülü fırtına' },
  96: { icon: '⛈️', desc: 'Dolu ile fırtına' },
  99: { icon: '⛈️', desc: 'Şiddetli dolu fırtınası' },
};

function getWeatherInfo(code) {
  return weatherMap[code] || { icon: '🌡️', desc: 'Bilinmiyor' };
}

const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

// Load cities
async function loadCities() {
  try {
    const res = await fetch('/api/cities');
    const cities = await res.json();
    cities.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.name;
      citySelect.appendChild(opt);
    });
  } catch (e) {
    console.error('Şehirler yüklenemedi:', e);
  }
}

// City change → load districts
citySelect.addEventListener('change', async () => {
  const cityId = citySelect.value;
  districtSelect.innerHTML = '<option value="">İlçe seçin...</option>';
  searchBtn.disabled = true;

  if (!cityId) {
    districtSelect.disabled = true;
    return;
  }

  try {
    const res = await fetch(`/api/districts/${cityId}`);
    districts = await res.json();
    districts.forEach((d, i) => {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = d.name;
      districtSelect.appendChild(opt);
    });
    districtSelect.disabled = false;
  } catch (e) {
    console.error('İlçeler yüklenemedi:', e);
  }
});

// District change → enable button
districtSelect.addEventListener('change', () => {
  searchBtn.disabled = !districtSelect.value;
});

// Search
searchBtn.addEventListener('click', async () => {
  const idx = parseInt(districtSelect.value);
  const district = districts[idx];
  if (!district) return;

  const cityName = citySelect.options[citySelect.selectedIndex].text;
  const fullName = `${district.name}, ${cityName}`;

  weatherResult.classList.add('hidden');
  loading.classList.remove('hidden');

  try {
    const res = await fetch(`/api/weather?city=${encodeURIComponent(cityName)}&district=${encodeURIComponent(district.name)}`);
    const data = await res.json();
    renderWeather(data, fullName);
  } catch (e) {
    console.error('Hava durumu alınamadı:', e);
    alert('Hava durumu verisi alınamadı. Lütfen tekrar deneyin.');
  } finally {
    loading.classList.add('hidden');
  }
});

function renderWeather(data, name) {
  const cur = data.current;
  const info = getWeatherInfo(cur.weather_code);

  document.getElementById('weather-icon').textContent = info.icon;
  document.getElementById('location-name').textContent = name;
  document.getElementById('weather-desc').textContent = info.desc;
  document.getElementById('temp-main').textContent = `${Math.round(cur.temperature_2m)}°C`;
  document.getElementById('feels-like').textContent = `${Math.round(cur.apparent_temperature)}°C`;
  document.getElementById('humidity').textContent = `%${cur.relative_humidity_2m}`;
  document.getElementById('wind').textContent = `${Math.round(cur.wind_speed_10m)} km/s`;
  document.getElementById('precipitation').textContent = `${cur.precipitation} mm`;

  // 7-day forecast
  const grid = document.getElementById('forecast-grid');
  grid.innerHTML = '';

  for (let i = 0; i < 7; i++) {
    const date = new Date(data.daily.time[i]);
    const dayInfo = getWeatherInfo(data.daily.weather_code[i]);

    const card = document.createElement('div');
    card.className = 'forecast-card';
    card.innerHTML = `
      <div class="forecast-day">${i === 0 ? 'Bugün' : dayNames[date.getDay()]}</div>
      <div class="forecast-icon">${dayInfo.icon}</div>
      <div class="forecast-temps">
        <span class="temp-high">${Math.round(data.daily.temperature_2m_max[i])}°</span>
        <span class="temp-low">${Math.round(data.daily.temperature_2m_min[i])}°</span>
      </div>
      ${data.daily.precipitation_sum[i] > 0 ? `<div class="forecast-precip">💧 ${data.daily.precipitation_sum[i]} mm</div>` : ''}
    `;
    grid.appendChild(card);
  }

  weatherResult.classList.remove('hidden');
}

// Init
loadCities();
