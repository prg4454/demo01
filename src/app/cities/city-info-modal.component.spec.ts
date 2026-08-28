import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CityInfoModalComponent } from './city-info-modal.component';
import { CityData } from './city.model';

describe('CityInfoModalComponent', () => {
  let component: CityInfoModalComponent;
  let fixture: ComponentFixture<CityInfoModalComponent>;
  let httpTesting: HttpTestingController;

  const mockCity: CityData = {
    id: 1,
    name: 'Tokyo',
    country: 'Japan',
    flag: '🇯🇵',
    continent: 'Asia',
    population: 37400000,
    areaKm2: 2194,
    elevationMeters: 40,
    timezone: 'JST (UTC+9)',
    ianaTimeZone: 'Asia/Tokyo',
    currency: 'Japanese Yen (JPY, ¥)',
    language: 'Japanese',
    latitude: 35.6762,
    longitude: 139.6503,
    landmarks: ['Tokyo Skytree', 'Shibuya Crossing'],
    description: 'A bustling capital.',
    accentColor: 'linear-gradient(135deg, #e53935, #e35d5b)'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CityInfoModalComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        NgbActiveModal
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CityInfoModalComponent);
    component = fixture.componentInstance;
    component.city = mockCity;
    httpTesting = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should create modal component and format local time', () => {
    expect(component).toBeTruthy();
    const timeStr = component.getCityLocalTime();
    const dateStr = component.getCityLocalDate();
    expect(timeStr).toBeTruthy();
    expect(dateStr).toBeTruthy();
  });

  it('should fetch live weather', () => {
    const req = httpTesting.expectOne((r) => r.url.includes('api.open-meteo.com'));
    expect(req.request.method).toBe('GET');

    req.flush({
      current: {
        temperature_2m: 22.4,
        apparent_temperature: 21.0,
        relative_humidity_2m: 60,
        wind_speed_10m: 12,
        precipitation: 0,
        is_day: 1,
        weather_code: 0
      }
    });

    expect(component.weather).toBeTruthy();
    expect(component.weather?.temperatureC).toBe(22);
    expect(component.weather?.temperatureF).toBe(72);
    expect(component.weather?.conditionText).toBe('Clear Sky');
    expect(component.weatherLoading).toBeFalse();
  });
});

