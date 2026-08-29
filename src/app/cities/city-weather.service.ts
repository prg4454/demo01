import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CityData, WeatherData } from './city.model';

@Injectable({
  providedIn: 'root'
})
export class CityWeatherService {
  private http = inject(HttpClient);

  readonly weatherMap = signal<Map<number, WeatherData>>(new Map());

  getWeather(cityId: number): WeatherData | undefined {
    return this.weatherMap().get(cityId);
  }

  /**
   * Fetch weather for all cities in a single batch request and map by coordinate proximity.
   */
  fetchBatchWeather(cities: CityData[]): void {
    if (!cities || cities.length === 0) return;

    const lats = cities.map(c => c.latitude).join(',');
    const lngs = cities.map(c => c.longitude).join(',');
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lngs}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m`;

    this.http.get<any>(url).subscribe({
      next: (res) => {
        const nextMap = new Map<number, WeatherData>(this.weatherMap());
        if (Array.isArray(res)) {
          res.forEach((item) => {
            if (!item?.current) return;
            // Match to closest city by coordinate distance to prevent any array indexing or sort order mismatch
            let bestCity: CityData | null = null;
            let minDiff = Infinity;
            cities.forEach(c => {
              const diff = Math.hypot(c.latitude - item.latitude, c.longitude - item.longitude);
              if (diff < minDiff) {
                minDiff = diff;
                bestCity = c;
              }
            });

            const matchedCity = bestCity as CityData | null;
            if (matchedCity && minDiff < 2.0) {
              const weather = this.parseCurrentWeather(item.current);
              nextMap.set(matchedCity.id, weather);
            }
          });
        } else if (res?.current) {
          const weather = this.parseCurrentWeather(res.current);
          nextMap.set(cities[0].id, weather);
        }
        this.weatherMap.set(nextMap);
      },
      error: (err) => {
        console.warn('Batch weather fetch failed, fetching individual cities:', err);
        cities.forEach(city => this.fetchCityWeather(city));
      }
    });
  }

  /**
   * Fetch or refresh weather for a single city and update reactive signal.
   */
  fetchCityWeather(city: CityData, onComplete?: (weather: WeatherData) => void): void {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}&longitude=${city.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m`;

    this.http.get<any>(url).subscribe({
      next: (data) => {
        if (data?.current) {
          const weather = this.parseCurrentWeather(data.current);
          const nextMap = new Map<number, WeatherData>(this.weatherMap());
          nextMap.set(city.id, weather);
          this.weatherMap.set(nextMap);
          if (onComplete) {
            onComplete(weather);
          }
        }
      },
      error: (err) => {
        console.error(`Weather fetch failed for ${city.name}:`, err);
      }
    });
  }

  parseCurrentWeather(current: any): WeatherData {
    const rawTempC = Number(current.temperature_2m ?? 0);
    const tempC = Math.round(rawTempC);
    const tempF = Math.round((rawTempC * 9) / 5 + 32);

    const rawAppTempC = Number(current.apparent_temperature ?? current.temperature_2m ?? 0);
    const appTempC = Math.round(rawAppTempC);
    const appTempF = Math.round((rawAppTempC * 9) / 5 + 32);

    const code = current.weather_code ?? 0;
    const isDay = current.is_day !== undefined ? !!current.is_day : true;
    const { text, icon } = this.interpretWeatherCode(code, isDay);

    return {
      temperatureC: tempC,
      temperatureF: tempF,
      apparentTemperatureC: appTempC,
      apparentTemperatureF: appTempF,
      humidity: Math.round(current.relative_humidity_2m ?? 50),
      windSpeedKmh: Math.round(current.wind_speed_10m ?? 0),
      precipitationMm: current.precipitation ?? 0,
      isDay,
      weatherCode: code,
      conditionText: text,
      conditionIcon: icon,
      fetchedAt: new Date()
    };
  }

  private interpretWeatherCode(code: number, isDay: boolean): { text: string; icon: string } {
    switch (code) {
      case 0:
        return { text: 'Clear Sky', icon: isDay ? '☀️' : '🌙' };
      case 1:
        return { text: 'Mainly Clear', icon: isDay ? '🌤️' : '🌤️' };
      case 2:
        return { text: 'Partly Cloudy', icon: '⛅' };
      case 3:
        return { text: 'Overcast', icon: '☁️' };
      case 45:
      case 48:
        return { text: 'Foggy / Hazy', icon: '🌫️' };
      case 51:
      case 53:
      case 55:
        return { text: 'Drizzle', icon: '🌦️' };
      case 61:
      case 63:
      case 65:
        return { text: 'Rain', icon: '🌧️' };
      case 71:
      case 73:
      case 75:
      case 77:
        return { text: 'Snow', icon: '❄️' };
      case 80:
      case 81:
      case 82:
        return { text: 'Rain Showers', icon: '🌧️' };
      case 85:
      case 86:
        return { text: 'Snow Showers', icon: '🌨️' };
      case 95:
      case 96:
      case 99:
        return { text: 'Thunderstorm', icon: '⛈️' };
      default:
        return { text: 'Partly Sunny', icon: '🌤️' };
    }
  }
}
