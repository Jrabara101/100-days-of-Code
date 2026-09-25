import { CitySearchResult, WeatherData, DailyForecastItem, HourlyForecastItem } from '../types/weather';

export function getWmoCondition(code: number): { text: string; category: 'clear' | 'clouds' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'thunder' } {
  switch (code) {
    case 0:
      return { text: 'Clear Sky', category: 'clear' };
    case 1:
      return { text: 'Mainly Clear', category: 'clear' };
    case 2:
      return { text: 'Partly Cloudy', category: 'clouds' };
    case 3:
      return { text: 'Overcast', category: 'clouds' };
    case 45:
      return { text: 'Foggy', category: 'fog' };
    case 48:
      return { text: 'Depositing Rime Fog', category: 'fog' };
    case 51:
      return { text: 'Light Drizzle', category: 'drizzle' };
    case 53:
      return { text: 'Moderate Drizzle', category: 'drizzle' };
    case 55:
      return { text: 'Dense Drizzle', category: 'drizzle' };
    case 56:
    case 57:
      return { text: 'Freezing Drizzle', category: 'drizzle' };
    case 61:
      return { text: 'Slight Rain', category: 'rain' };
    case 63:
      return { text: 'Moderate Rain', category: 'rain' };
    case 65:
      return { text: 'Heavy Rain', category: 'rain' };
    case 66:
    case 67:
      return { text: 'Freezing Rain', category: 'rain' };
    case 71:
      return { text: 'Slight Snow Fall', category: 'snow' };
    case 73:
      return { text: 'Moderate Snow Fall', category: 'snow' };
    case 75:
      return { text: 'Heavy Snow Fall', category: 'snow' };
    case 77:
      return { text: 'Snow Grains', category: 'snow' };
    case 80:
      return { text: 'Slight Rain Showers', category: 'rain' };
    case 81:
      return { text: 'Moderate Rain Showers', category: 'rain' };
    case 82:
      return { text: 'Violent Rain Showers', category: 'rain' };
    case 85:
      return { text: 'Slight Snow Showers', category: 'snow' };
    case 86:
      return { text: 'Heavy Snow Showers', category: 'snow' };
    case 95:
      return { text: 'Thunderstorm', category: 'thunder' };
    case 96:
    case 99:
      return { text: 'Thunderstorm with Hail', category: 'thunder' };
    default:
      return { text: 'Atmospheric Variance', category: 'clouds' };
  }
}

export function getAqiCategory(aqi: number): 'Good' | 'Moderate' | 'Unhealthy for Sensitive' | 'Unhealthy' | 'Very Unhealthy' | 'Hazardous' {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
}

export const PRESET_CITIES: CitySearchResult[] = [
  { id: 1, name: 'San Francisco', country: 'United States', admin1: 'California', latitude: 37.7749, longitude: -122.4194, countryCode: 'US' },
  { id: 2, name: 'Tokyo', country: 'Japan', admin1: 'Tokyo', latitude: 35.6762, longitude: 139.6503, countryCode: 'JP' },
  { id: 3, name: 'Reykjavik', country: 'Iceland', admin1: 'Capital Region', latitude: 64.1466, longitude: -21.9426, countryCode: 'IS' },
  { id: 4, name: 'London', country: 'United Kingdom', admin1: 'England', latitude: 51.5074, longitude: -0.1278, countryCode: 'GB' },
  { id: 5, name: 'Cairo', country: 'Egypt', admin1: 'Cairo', latitude: 30.0444, longitude: 31.2357, countryCode: 'EG' },
  { id: 6, name: 'Sydney', country: 'Australia', admin1: 'New South Wales', latitude: -33.8688, longitude: 151.2093, countryCode: 'AU' },
  { id: 7, name: 'New York', country: 'United States', admin1: 'New York', latitude: 40.7128, longitude: -74.006, countryCode: 'US' },
  { id: 8, name: 'Singapore', country: 'Singapore', admin1: 'Central Singapore', latitude: 1.3521, longitude: 103.8198, countryCode: 'SG' },
  { id: 9, name: 'Zurich', country: 'Switzerland', admin1: 'Zurich', latitude: 47.3769, longitude: 8.5417, countryCode: 'CH' },
  { id: 10, name: 'Honolulu', country: 'United States', admin1: 'Hawaii', latitude: 21.3069, longitude: -157.8583, countryCode: 'US' },
];

export async function searchCities(query: string): Promise<CitySearchResult[]> {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return PRESET_CITIES.slice(0, 6);

  try {
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmed)}&count=7&language=en&format=json`);
    if (!res.ok) throw new Error('Geocoding service unavailable');
    const data = await res.json();
    if (!data.results || !data.results.length) {
      // Local fallback filter
      return PRESET_CITIES.filter(
        c => c.name.toLowerCase().includes(trimmed) || c.country.toLowerCase().includes(trimmed)
      );
    }
    return data.results.map((item: any) => ({
      id: item.id,
      name: item.name,
      country: item.country,
      admin1: item.admin1,
      latitude: item.latitude,
      longitude: item.longitude,
      countryCode: item.country_code,
    }));
  } catch (err) {
    console.warn('Geocoding fetch fallback:', err);
    return PRESET_CITIES.filter(
      c => c.name.toLowerCase().includes(trimmed) || c.country.toLowerCase().includes(trimmed)
    );
  }
}

export async function fetchWeatherData(
  cityName: string,
  lat: number,
  lon: number,
  country = 'Global'
): Promise<WeatherData> {
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index,visibility&hourly=temperature_2m,precipitation_probability,weather_code,wind_speed_10m,wind_direction_10m,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset&timezone=auto`;
  const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5,pm10`;

  const [weatherRes, aqiRes] = await Promise.allSettled([
    fetch(weatherUrl).then(r => r.json()),
    fetch(aqiUrl).then(r => r.json()),
  ]);

  if (weatherRes.status !== 'fulfilled' || !weatherRes.value?.current) {
    throw new Error('Weather API returned invalid payload');
  }

  const w = weatherRes.value;
  const current = w.current;
  const hourlyRaw = w.hourly || {};
  const dailyRaw = w.daily || {};

  let aqiVal = 38;
  let pm25Val = 8.5;
  let pm10Val = 14.2;

  if (aqiRes.status === 'fulfilled' && aqiRes.value?.current) {
    const a = aqiRes.value.current;
    if (typeof a.us_aqi === 'number') aqiVal = Math.round(a.us_aqi);
    if (typeof a.pm2_5 === 'number') pm25Val = Math.round(a.pm2_5 * 10) / 10;
    if (typeof a.pm10 === 'number') pm10Val = Math.round(a.pm10 * 10) / 10;
  }

  const cond = getWmoCondition(current.weather_code ?? 0);

  // Format hourly (first 24-48 hours)
  const hourly: HourlyForecastItem[] = [];
  const times: string[] = hourlyRaw.time || [];
  const temps: number[] = hourlyRaw.temperature_2m || [];
  const precipProbs: number[] = hourlyRaw.precipitation_probability || [];
  const codes: number[] = hourlyRaw.weather_code || [];
  const windSpeeds: number[] = hourlyRaw.wind_speed_10m || [];
  const windDirs: number[] = hourlyRaw.wind_direction_10m || [];
  const isDays: number[] = hourlyRaw.is_day || [];

  // Find index of current hour
  const now = new Date();
  const currentIsoPrefix = now.toISOString().slice(0, 13);
  let startIdx = times.findIndex(t => t.startsWith(currentIsoPrefix));
  if (startIdx === -1) startIdx = 0;

  for (let i = startIdx; i < Math.min(startIdx + 24, times.length); i++) {
    const rawTime = times[i];
    const dateObj = new Date(rawTime);
    const hourFormatted = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    hourly.push({
      time: hourFormatted,
      timestamp: dateObj.getTime(),
      tempC: Math.round(temps[i] ?? current.temperature_2m),
      precipProb: precipProbs[i] ?? 0,
      conditionCode: codes[i] ?? current.weather_code ?? 0,
      windSpeedKmh: Math.round(windSpeeds[i] ?? current.wind_speed_10m),
      windDirectionDeg: windDirs[i] ?? current.wind_direction_10m,
      isDay: Boolean(isDays[i] ?? 1),
    });
  }

  // Format 7-day daily forecast
  const daily: DailyForecastItem[] = [];
  const dTimes: string[] = dailyRaw.time || [];
  const dCodes: number[] = dailyRaw.weather_code || [];
  const dMax: number[] = dailyRaw.temperature_2m_max || [];
  const dMin: number[] = dailyRaw.temperature_2m_min || [];
  const dPrecip: number[] = dailyRaw.precipitation_probability_max || [];

  for (let i = 0; i < Math.min(7, dTimes.length); i++) {
    const dDate = new Date(dTimes[i]);
    const dayName = i === 0 ? 'Today' : dDate.toLocaleDateString([], { weekday: 'short' });
    const code = dCodes[i] ?? 0;

    daily.push({
      date: dTimes[i],
      dayName,
      conditionCode: code,
      conditionText: getWmoCondition(code).text,
      tempMaxC: Math.round(dMax[i] ?? 20),
      tempMinC: Math.round(dMin[i] ?? 12),
      precipProbMax: dPrecip[i] ?? 0,
    });
  }

  const sunrise = dailyRaw.sunrise?.[0] ? new Date(dailyRaw.sunrise[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '06:15';
  const sunset = dailyRaw.sunset?.[0] ? new Date(dailyRaw.sunset[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '18:45';

  return {
    cityName,
    country,
    lat,
    lon,
    timezone: w.timezone || 'UTC',
    tempC: Math.round(current.temperature_2m),
    feelsLikeC: Math.round(current.apparent_temperature ?? current.temperature_2m),
    conditionCode: current.weather_code ?? 0,
    conditionText: cond.text,
    isDay: Boolean(current.is_day ?? 1),
    windSpeedKmh: Math.round(current.wind_speed_10m ?? 10),
    windDirectionDeg: Math.round(current.wind_direction_10m ?? 0),
    windGustsKmh: Math.round(current.wind_gusts_10m ?? current.wind_speed_10m ?? 15),
    humidityPct: Math.round(current.relative_humidity_2m ?? 50),
    pressureHpa: Math.round(current.surface_pressure ?? 1013),
    uvIndex: Math.round((current.uv_index ?? 2) * 10) / 10,
    aqi: aqiVal,
    aqiCategory: getAqiCategory(aqiVal),
    pm25: pm25Val,
    pm10: pm10Val,
    visibilityKm: Math.round(((current.visibility ?? 10000) / 1000) * 10) / 10,
    precipitationMm: current.precipitation ?? 0,
    sunrise,
    sunset,
    tempMaxC: daily[0]?.tempMaxC ?? Math.round(current.temperature_2m + 4),
    tempMinC: daily[0]?.tempMinC ?? Math.round(current.temperature_2m - 4),
    hourly,
    daily,
  };
}

// Offline fallback mock generator if network is completely down
export function getMockFallbackWeather(cityName: string, lat: number, lon: number, country = 'Local Simulation'): WeatherData {
  const isTokyo = cityName.toLowerCase().includes('tokyo');
  const isReykjavik = cityName.toLowerCase().includes('reykjavik');
  const isCairo = cityName.toLowerCase().includes('cairo');

  const conditionCode = isReykjavik ? 73 : isTokyo ? 63 : isCairo ? 0 : 2;
  const tempC = isReykjavik ? -2 : isTokyo ? 18 : isCairo ? 34 : 22;
  const cond = getWmoCondition(conditionCode);

  const hourly: HourlyForecastItem[] = [];
  const hours = ['12 AM', '3 AM', '6 AM', '9 AM', '12 PM', '3 PM', '6 PM', '9 PM'];
  hours.forEach((h, idx) => {
    hourly.push({
      time: h,
      timestamp: Date.now() + idx * 3600 * 1000 * 3,
      tempC: tempC + Math.sin(idx) * 4,
      precipProb: conditionCode >= 50 ? 70 : 10,
      conditionCode,
      windSpeedKmh: 14 + idx * 2,
      windDirectionDeg: (45 + idx * 30) % 360,
      isDay: idx >= 2 && idx <= 5,
    });
  });

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const daily: DailyForecastItem[] = days.map((d, idx) => ({
    date: `2026-09-${25 + idx}`,
    dayName: idx === 0 ? 'Today' : d,
    conditionCode,
    conditionText: cond.text,
    tempMaxC: tempC + 4,
    tempMinC: tempC - 4,
    precipProbMax: conditionCode >= 50 ? 80 : 15,
  }));

  return {
    cityName,
    country,
    lat,
    lon,
    timezone: 'UTC',
    tempC,
    feelsLikeC: tempC - 1,
    conditionCode,
    conditionText: cond.text,
    isDay: true,
    windSpeedKmh: isReykjavik ? 32 : 16,
    windDirectionDeg: 65,
    windGustsKmh: isReykjavik ? 48 : 22,
    humidityPct: isTokyo ? 84 : 45,
    pressureHpa: 1014,
    uvIndex: isCairo ? 9.2 : 4.5,
    aqi: 42,
    aqiCategory: 'Good',
    pm25: 7.2,
    pm10: 12.0,
    visibilityKm: 16.0,
    precipitationMm: isTokyo ? 4.2 : 0,
    sunrise: '06:22 AM',
    sunset: '06:54 PM',
    tempMaxC: tempC + 5,
    tempMinC: tempC - 4,
    hourly,
    daily,
  };
}
