export interface CityData {
  id: number;
  name: string;
  country: string;
  flag: string;
  continent: 'Asia' | 'Europe' | 'North America' | 'South America' | 'Africa' | 'Oceania';
  population: number;
  areaKm2: number;
  elevationMeters: number;
  timezone: string;
  ianaTimeZone: string;
  currency: string;
  language: string;
  latitude: number;
  longitude: number;
  landmarks: string[];
  description: string;
  accentColor: string;
}

export interface WeatherData {
  temperatureC: number;
  temperatureF: number;
  apparentTemperatureC: number;
  apparentTemperatureF: number;
  humidity: number;
  windSpeedKmh: number;
  precipitationMm: number;
  isDay: boolean;
  weatherCode: number;
  conditionText: string;
  conditionIcon: string;
  fetchedAt: Date;
}

