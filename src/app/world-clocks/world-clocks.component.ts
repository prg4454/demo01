import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { catchError, forkJoin, of } from 'rxjs';
import { CityNewsModalComponent } from './city-news-modal.component';

interface CityClock {
    // IANA timezone names let Intl handle daylight-saving changes automatically.
    name: string;
    country: string;
    timeZone: string;
    latitude: number;
    longitude: number;
    weather?: CurrentWeather;
    forecast?: DailyForecast;
    weatherError?: boolean;
}

interface CurrentWeather {
    temperature: number;
    apparentTemperature: number;
    weatherCode: number;
    windSpeed: number;
    isDay: boolean;
}

interface DailyForecast {
    weatherCode: number;
    high: number;
    low: number;
    precipitationChance: number;
}

interface OpenMeteoResponse {
    // Only the fields requested from Open-Meteo are represented here.
    current: {
        temperature_2m: number;
        apparent_temperature: number;
        weather_code: number;
        wind_speed_10m: number;
        is_day: number;
    };
    daily: {
        weather_code: number[];
        temperature_2m_max: number[];
        temperature_2m_min: number[];
        precipitation_probability_max: number[];
    };
}

@Component({
    selector: 'app-world-clocks',
    standalone: true,
    imports: [CommonModule, NgbModalModule],
    templateUrl: './world-clocks.component.html',
    styleUrl: './world-clocks.component.scss'
})
export class WorldClocksComponent implements OnInit {
    private readonly http = inject(HttpClient);
    private readonly modalService = inject(NgbModal);
    private readonly destroyRef = inject(DestroyRef);
    private clockTimer?: ReturnType<typeof setInterval>;
    private weatherTimer?: ReturnType<typeof setInterval>;

    now = new Date();
    weatherLoading = true;
    lastWeatherUpdate?: Date;

    // Coordinates are used for weather; timeZone is used for each local clock.
    readonly cities: CityClock[] = [
        { name: 'London', country: 'United Kingdom', timeZone: 'Europe/London', latitude: 51.5074, longitude: -0.1278 },
        { name: 'Tokyo', country: 'Japan', timeZone: 'Asia/Tokyo', latitude: 35.6762, longitude: 139.6503 },
        { name: 'Paris', country: 'France', timeZone: 'Europe/Paris', latitude: 48.8566, longitude: 2.3522 },
        { name: 'New York City', country: 'United States', timeZone: 'America/New_York', latitude: 40.7128, longitude: -74.0060 },
        { name: 'Los Angeles', country: 'United States', timeZone: 'America/Los_Angeles', latitude: 34.0522, longitude: -118.2437 },
        { name: 'Orlando', country: 'Florida, United States', timeZone: 'America/New_York', latitude: 28.5383, longitude: -81.3792 },
        { name: 'Auckland', country: 'New Zealand', timeZone: 'Pacific/Auckland', latitude: -36.8509, longitude: 174.7645 }
    ];

    ngOnInit(): void {
        this.loadWeather();

        // Redraw the clock hands every second and refresh weather every ten minutes.
        this.clockTimer = setInterval(() => this.now = new Date(), 1000);
        this.weatherTimer = setInterval(() => this.loadWeather(), 10 * 60 * 1000);

        // Prevent timers from continuing after the user leaves this route.
        this.destroyRef.onDestroy(() => {
            clearInterval(this.clockTimer);
            clearInterval(this.weatherTimer);
        });
    }

    loadWeather(): void {
        this.weatherLoading = true;

        // Create one request per city, then wait until every request completes.
        const requests = this.cities.map(city => {
            const url = 'https://api.open-meteo.com/v1/forecast';
            const params = {
                latitude: city.latitude,
                longitude: city.longitude,
                current: 'temperature_2m,apparent_temperature,weather_code,wind_speed_10m,is_day',
                daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
                forecast_days: 1,
                temperature_unit: 'celsius',
                wind_speed_unit: 'kmh',
                timezone: city.timeZone
            };

            return this.http.get<OpenMeteoResponse>(url, { params }).pipe(
                // A failed city does not prevent the other cards from updating.
                catchError(() => of(null))
            );
        });

        forkJoin(requests).subscribe(results => {
            results.forEach((result, index) => {
                const city = this.cities[index];
                if (!result) {
                    city.weatherError = true;
                    return;
                }

                city.weatherError = false;
                // Convert the API response into the simpler shape used by the view.
                city.weather = {
                    temperature: result.current.temperature_2m,
                    apparentTemperature: result.current.apparent_temperature,
                    weatherCode: result.current.weather_code,
                    windSpeed: result.current.wind_speed_10m,
                    isDay: result.current.is_day === 1
                };
                city.forecast = {
                    weatherCode: result.daily.weather_code[0],
                    high: result.daily.temperature_2m_max[0],
                    low: result.daily.temperature_2m_min[0],
                    precipitationChance: result.daily.precipitation_probability_max[0]
                };
            });
            this.weatherLoading = false;
            this.lastWeatherUpdate = new Date();
        });
    }

    getTime(city: CityClock): string {
        // The same instant is formatted in the selected city's local timezone.
        return new Intl.DateTimeFormat('en-US', {
            timeZone: city.timeZone,
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit'
        }).format(this.now);
    }

    getDate(city: CityClock): string {
        return new Intl.DateTimeFormat('en-US', {
            timeZone: city.timeZone,
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        }).format(this.now);
    }

    getHandAngle(city: CityClock, hand: 'hour' | 'minute' | 'second'): number {
        // Extract local clock values without changing the browser's own timezone.
        const parts = new Intl.DateTimeFormat('en-US', {
            timeZone: city.timeZone,
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }).formatToParts(this.now);
        const value = (type: Intl.DateTimeFormatPartTypes) =>
            Number(parts.find(part => part.type === type)?.value ?? 0);
        const hours = value('hour') % 12;
        const minutes = value('minute');
        const seconds = value('second');

        // A clock is 360°: hours use 30° each and minutes/seconds use 6° each.
        // The smaller additions make the hour and minute hands move progressively.
        if (hand === 'hour') return (hours * 30) + (minutes * 0.5);
        if (hand === 'minute') return (minutes * 6) + (seconds * 0.1);
        return seconds * 6;
    }

    weatherLabel(code: number): string {
        // Translate Open-Meteo/WMO numeric condition codes into readable labels.
        if (code === 0) return 'Clear sky';
        if (code <= 3) return 'Partly cloudy';
        if (code === 45 || code === 48) return 'Foggy';
        if (code >= 51 && code <= 57) return 'Drizzle';
        if (code >= 61 && code <= 67) return 'Rain';
        if (code >= 71 && code <= 77) return 'Snow';
        if (code >= 80 && code <= 82) return 'Rain showers';
        if (code >= 85 && code <= 86) return 'Snow showers';
        if (code >= 95) return 'Thunderstorms';
        return 'Mixed conditions';
    }

    weatherIcon(code: number, isDay: boolean): string {
        if (code === 0) return isDay ? '☀️' : '🌙';
        if (code <= 3) return '⛅';
        if (code === 45 || code === 48) return '🌫️';
        if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return '🌧️';
        if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return '🌨️';
        if (code >= 95) return '⛈️';
        return '🌤️';
    }

    toFahrenheit(celsius: number): number {
        return (celsius * 9 / 5) + 32;
    }

    forecastSummary(forecast: DailyForecast): string {
        // Keep the forecast intentionally short enough to fit inside each card.
        const conditions = this.weatherLabel(forecast.weatherCode);
        const rain = forecast.precipitationChance >= 20
            ? `${forecast.precipitationChance}% chance of precipitation.`
            : 'Little chance of precipitation.';
        return `${conditions} today. ${rain}`;
    }

    openNews(city: CityClock): void {
        // Pass the selected location to a dedicated, read-only news modal.
        const modalRef = this.modalService.open(CityNewsModalComponent, {
            size: 'lg',
            centered: true,
            scrollable: true
        });
        modalRef.componentInstance.cityName = city.name;
        modalRef.componentInstance.country = city.country;
    }
}
