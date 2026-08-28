import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { CitiesComponent } from './cities.component';
import { ModalHistoryService } from '../modal-history.service';

describe('CitiesComponent', () => {
  let component: CitiesComponent;
  let fixture: ComponentFixture<CitiesComponent>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CitiesComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ModalHistoryService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CitiesComponent);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
    // Handle the batch weather request triggered in ngOnInit
    const req = httpTesting.expectOne((r) => r.url.includes('api.open-meteo.com'));
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should contain cities including Orlando in the dataset', () => {
    const req = httpTesting.expectOne((r) => r.url.includes('api.open-meteo.com'));
    req.flush([]);
    expect(component.cities.length).toBe(31);
    expect(component.cities.some(c => c.name === 'Orlando')).toBeTrue();
  });

  it('should filter cities by continent', () => {
    const req = httpTesting.expectOne((r) => r.url.includes('api.open-meteo.com'));
    req.flush([]);
    component.selectedContinent = 'Asia';
    const asianCities = component.filteredCities;
    expect(asianCities.length).toBeGreaterThan(0);
    expect(asianCities.every(c => c.continent === 'Asia')).toBeTrue();
  });

  it('should filter cities by search term', () => {
    const req = httpTesting.expectOne((r) => r.url.includes('api.open-meteo.com'));
    req.flush([]);
    component.searchQuery = 'Tokyo';
    const matches = component.filteredCities;
    expect(matches.length).toBe(1);
    expect(matches[0].name).toBe('Tokyo');
  });

  it('should sort cities by population, country and name', () => {
    const req = httpTesting.expectOne((r) => r.url.includes('api.open-meteo.com'));
    req.flush([]);
    component.selectedContinent = 'All';
    component.searchQuery = '';
    component.sortBy = 'population';
    component.sortAsc = false;

    const highestPop = component.filteredCities[0];
    expect(highestPop.name).toBe('Tokyo');

    component.sortBy = 'name';
    component.sortAsc = true;
    expect(component.filteredCities[0].name).toBe('Amsterdam');
  });

  it('should toggle temperature unit between C and F', () => {
    const req = httpTesting.expectOne((r) => r.url.includes('api.open-meteo.com'));
    req.flush([]);
    expect(component.unit).toBe('C');
    component.toggleUnit();
    expect(component.unit).toBe('F');
    component.toggleUnit();
    expect(component.unit).toBe('C');
  });
});
