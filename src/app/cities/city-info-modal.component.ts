import { Component, Input, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CityData, WeatherData } from './city.model';
import { CityWeatherService } from './city-weather.service';

@Component({
  selector: 'app-city-info-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './city-info-modal.component.html',
  styleUrl: './city-info-modal.component.scss'
})
export class CityInfoModalComponent implements OnInit, OnDestroy {
  activeModal = inject(NgbActiveModal);
  private weatherService = inject(CityWeatherService);

  @Input({ required: true }) city!: CityData;
  @Input() unit: 'C' | 'F' = 'C';

  weatherLoading = false;
  weatherError = false;

  currentTime = new Date();
  private timerRef: any = null;

  get weather(): WeatherData | undefined {
    return this.weatherService.weatherMap().get(this.city?.id);
  }

  ngOnInit(): void {
    this.timerRef = setInterval(() => {
      this.currentTime = new Date();
    }, 1000);

    if (this.city && !this.weather) {
      this.fetchWeather();
    }
  }

  ngOnDestroy(): void {
    if (this.timerRef) {
      clearInterval(this.timerRef);
      this.timerRef = null;
    }
  }

  getCityLocalTime(): string {
    if (!this.city) return '';
    try {
      return this.currentTime.toLocaleTimeString('en-US', {
        timeZone: this.city.ianaTimeZone,
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch {
      return this.currentTime.toLocaleTimeString('en-US');
    }
  }

  getCityLocalDate(): string {
    if (!this.city) return '';
    try {
      return this.currentTime.toLocaleDateString('en-US', {
        timeZone: this.city.ianaTimeZone,
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return this.currentTime.toLocaleDateString('en-US');
    }
  }

  toggleUnit(): void {
    this.unit = this.unit === 'C' ? 'F' : 'C';
  }

  fetchWeather(): void {
    if (!this.city) return;

    this.weatherLoading = true;
    this.weatherError = false;

    this.weatherService.fetchCityWeather(this.city, () => {
      this.weatherLoading = false;
    });
  }
}
