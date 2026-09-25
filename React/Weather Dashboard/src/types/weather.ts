export interface WeatherData {
  cityName: string;
  country: string;
  lat: number;
  lon: number;
  timezone: string;
  tempC: number;
  feelsLikeC: number;
  conditionCode: number; // WMO Weather code (0-99)
  conditionText: string;
  isDay: boolean;
  windSpeedKmh: number;
  windDirectionDeg: number;
  windGustsKmh: number;
  humidityPct: number;
  pressureHpa: number;
  uvIndex: number;
  aqi: number;
  aqiCategory: 'Good' | 'Moderate' | 'Unhealthy for Sensitive' | 'Unhealthy' | 'Very Unhealthy' | 'Hazardous';
  pm25: number;
  pm10: number;
  visibilityKm: number;
  precipitationMm: number;
  sunrise: string;
  sunset: string;
  tempMaxC: number;
  tempMinC: number;
  hourly: HourlyForecastItem[];
  daily: DailyForecastItem[];
}

export interface HourlyForecastItem {
  time: string; // ISO string or display time e.g. "14:00"
  timestamp: number;
  tempC: number;
  precipProb: number;
  conditionCode: number;
  windSpeedKmh: number;
  windDirectionDeg: number;
  isDay: boolean;
}

export interface DailyForecastItem {
  date: string;
  dayName: string;
  conditionCode: number;
  conditionText: string;
  tempMaxC: number;
  tempMinC: number;
  precipProbMax: number;
}

export interface ParticleConfig {
  rainDensity: number; // 0 to 1
  snowDensity: number; // 0 to 1
  windVector: { x: number; y: number };
  cloudCover: number; // 0 to 1
  sunRayIntensity: number; // 0 to 1
  lightningFreq: number; // 0 to 1
  fogDensity: number; // 0 to 1
}

export interface CacheEntry {
  data: WeatherData;
  fetchedAt: number;
  fromCache?: boolean;
}

export interface CitySearchResult {
  id: number;
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  countryCode?: string;
}
