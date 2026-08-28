import { Component, inject, OnInit, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { ModalHistoryService } from '../modal-history.service';
import { CityData, WeatherData } from './city.model';
import { CityInfoModalComponent } from './city-info-modal.component';
import { CityWeatherService } from './city-weather.service';

export type { CityData, WeatherData };

@Component({
  selector: 'app-cities',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbModalModule],
  templateUrl: './cities.component.html',
  styleUrl: './cities.component.scss'
})
export class CitiesComponent implements OnInit {
  private modalService = inject(NgbModal);
  private modalHistory = inject(ModalHistoryService);
  weatherService = inject(CityWeatherService);

  searchQuery = '';
  selectedContinent = 'All';
  sortBy: 'name' | 'population' | 'country' = 'name';
  sortAsc = true;
  unit: 'C' | 'F' = 'C';

  readonly continents = ['All', 'Africa', 'Asia', 'Europe', 'North America', 'Oceania', 'South America'];

  readonly cities: CityData[] = [
    {
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
      landmarks: ['Tokyo Skytree', 'Shibuya Crossing', 'Sensō-ji Temple'],
      description: 'The world\'s most populous metropolitan area, blending hyper-modern neon skyscrapers with serene ancient shrines.',
      accentColor: 'linear-gradient(135deg, #e53935, #e35d5b)'
    },
    {
      id: 2,
      name: 'New York City',
      country: 'United States',
      flag: '🇺🇸',
      continent: 'North America',
      population: 8336817,
      areaKm2: 783.8,
      elevationMeters: 10,
      timezone: 'EST/EDT (UTC-5/UTC-4)',
      ianaTimeZone: 'America/New_York',
      currency: 'US Dollar (USD, $)',
      language: 'English',
      latitude: 40.7128,
      longitude: -74.006,
      landmarks: ['Statue of Liberty', 'Central Park', 'Empire State Building'],
      description: 'The Big Apple: a global hub for finance, culture, art, fashion, and theater centered around iconic Manhattan.',
      accentColor: 'linear-gradient(135deg, #1e3c72, #2a5298)'
    },
    {
      id: 3,
      name: 'London',
      country: 'United Kingdom',
      flag: '🇬🇧',
      continent: 'Europe',
      population: 8982000,
      areaKm2: 1572,
      elevationMeters: 25,
      timezone: 'GMT/BST (UTC+0/UTC+1)',
      ianaTimeZone: 'Europe/London',
      currency: 'British Pound (GBP, £)',
      language: 'English',
      latitude: 51.5074,
      longitude: -0.1278,
      landmarks: ['Big Ben & Parliament', 'Tower Bridge', 'Buckingham Palace'],
      description: 'A 2,000-year-old historic capital on the River Thames, famed for royal heritage, world-class museums, and diverse districts.',
      accentColor: 'linear-gradient(135deg, #0d3b66, #64748b)'
    },
    {
      id: 4,
      name: 'Paris',
      country: 'France',
      flag: '🇫🇷',
      continent: 'Europe',
      population: 2161000,
      areaKm2: 105.4,
      elevationMeters: 35,
      timezone: 'CET/CEST (UTC+1/UTC+2)',
      ianaTimeZone: 'Europe/Paris',
      currency: 'Euro (EUR, €)',
      language: 'French',
      latitude: 48.8566,
      longitude: 2.3522,
      landmarks: ['Eiffel Tower', 'Louvre Museum', 'Arc de Triomphe'],
      description: 'The City of Light: celebrated worldwide for high fashion, gastronomy, romantic boulevards, and timeless architecture.',
      accentColor: 'linear-gradient(135deg, #6b21a8, #9333ea)'
    },
    {
      id: 5,
      name: 'Sydney',
      country: 'Australia',
      flag: '🇦🇺',
      continent: 'Oceania',
      population: 5312000,
      areaKm2: 12367,
      elevationMeters: 19,
      timezone: 'AEST/AEDT (UTC+10/UTC+11)',
      ianaTimeZone: 'Australia/Sydney',
      currency: 'Australian Dollar (AUD, A$)',
      language: 'English',
      latitude: -33.8688,
      longitude: 151.2093,
      landmarks: ['Sydney Opera House', 'Sydney Harbour Bridge', 'Bondi Beach'],
      description: 'A dazzling coastal metropolis known for sparkling harbour waters, sun-drenched surf beaches, and architectural wonders.',
      accentColor: 'linear-gradient(135deg, #0284c7, #06b6d4)'
    },
    {
      id: 6,
      name: 'Cairo',
      country: 'Egypt',
      flag: '🇪🇬',
      continent: 'Africa',
      population: 10100000,
      areaKm2: 3085,
      elevationMeters: 68,
      timezone: 'EET/EEST (UTC+2/UTC+3)',
      ianaTimeZone: 'Africa/Cairo',
      currency: 'Egyptian Pound (EGP, E£)',
      language: 'Arabic',
      latitude: 30.0444,
      longitude: 31.2357,
      landmarks: ['Giza Pyramid Complex', 'The Great Sphinx', 'Khan el-Khalili Bazaar'],
      description: 'The historic cradle of civilization on the Nile River, bridging millennia of pharaonic wonders with bustling urban life.',
      accentColor: 'linear-gradient(135deg, #d97706, #b45309)'
    },
    {
      id: 7,
      name: 'Rio de Janeiro',
      country: 'Brazil',
      flag: '🇧🇷',
      continent: 'South America',
      population: 6748000,
      areaKm2: 1200,
      elevationMeters: 2,
      timezone: 'BRT (UTC-3)',
      ianaTimeZone: 'America/Sao_Paulo',
      currency: 'Brazilian Real (BRL, R$)',
      language: 'Portuguese',
      latitude: -22.9068,
      longitude: -43.1729,
      landmarks: ['Christ the Redeemer', 'Sugarloaf Mountain', 'Copacabana Beach'],
      description: 'The Marvelous City: vibrant samba rhythms, breathtaking granite peaks emerging from the Atlantic, and legendary beaches.',
      accentColor: 'linear-gradient(135deg, #16a34a, #059669)'
    },
    {
      id: 8,
      name: 'Rome',
      country: 'Italy',
      flag: '🇮🇹',
      continent: 'Europe',
      population: 2873000,
      areaKm2: 1285,
      elevationMeters: 21,
      timezone: 'CET/CEST (UTC+1/UTC+2)',
      ianaTimeZone: 'Europe/Rome',
      currency: 'Euro (EUR, €)',
      language: 'Italian',
      latitude: 41.9028,
      longitude: 12.4964,
      landmarks: ['Colosseum', 'Trevi Fountain', 'Vatican City & St. Peter\'s'],
      description: 'The Eternal City: an open-air museum of classical ruins, Renaissance art, baroque fountains, and exquisite culinary heritage.',
      accentColor: 'linear-gradient(135deg, #b91c1c, #dc2626)'
    },
    {
      id: 9,
      name: 'Toronto',
      country: 'Canada',
      flag: '🇨🇦',
      continent: 'North America',
      population: 2794000,
      areaKm2: 630.2,
      elevationMeters: 76,
      timezone: 'EST/EDT (UTC-5/UTC-4)',
      ianaTimeZone: 'America/Toronto',
      currency: 'Canadian Dollar (CAD, C$)',
      language: 'English, French',
      latitude: 43.6532,
      longitude: -79.3832,
      landmarks: ['CN Tower', 'Royal Ontario Museum', 'Distillery Historic District'],
      description: 'Canada\'s largest city and cultural engine, celebrated for its multicultural mosaic, vibrant arts scene, and lakeside skyline.',
      accentColor: 'linear-gradient(135deg, #dc2626, #991b1b)'
    },
    {
      id: 10,
      name: 'Singapore',
      country: 'Singapore',
      flag: '🇸🇬',
      continent: 'Asia',
      population: 5918000,
      areaKm2: 728.6,
      elevationMeters: 15,
      timezone: 'SGT (UTC+8)',
      ianaTimeZone: 'Asia/Singapore',
      currency: 'Singapore Dollar (SGD, S$)',
      language: 'English, Malay, Mandarin, Tamil',
      latitude: 1.3521,
      longitude: 103.8198,
      landmarks: ['Marina Bay Sands', 'Gardens by the Bay', 'Jewel Changi Airport'],
      description: 'A futuristic "City in a Garden" island nation renowned for sustainability, pristine streets, street food hawker centers, and innovation.',
      accentColor: 'linear-gradient(135deg, #059669, #0d9488)'
    },
    {
      id: 11,
      name: 'Dubai',
      country: 'United Arab Emirates',
      flag: '🇦🇪',
      continent: 'Asia',
      population: 3550000,
      areaKm2: 4114,
      elevationMeters: 5,
      timezone: 'GST (UTC+4)',
      ianaTimeZone: 'Asia/Dubai',
      currency: 'UAE Dirham (AED, د.إ)',
      language: 'Arabic, English',
      latitude: 25.2048,
      longitude: 55.2708,
      landmarks: ['Burj Khalifa', 'Palm Jumeirah', 'Dubai Mall & Fountain'],
      description: 'An ultra-modern desert oasis famed for record-breaking skyscrapers, luxury shopping, man-made islands, and visionary design.',
      accentColor: 'linear-gradient(135deg, #d97706, #ca8a04)'
    },
    {
      id: 12,
      name: 'Bangkok',
      country: 'Thailand',
      flag: '🇹🇭',
      continent: 'Asia',
      population: 10539000,
      areaKm2: 1569,
      elevationMeters: 2,
      timezone: 'ICT (UTC+7)',
      ianaTimeZone: 'Asia/Bangkok',
      currency: 'Thai Baht (THB, ฿)',
      language: 'Thai',
      latitude: 13.7563,
      longitude: 100.5018,
      landmarks: ['Grand Palace', 'Wat Arun (Temple of Dawn)', 'Chatuchak Weekend Market'],
      description: 'Known as Krung Thep, a city of vibrant street life, ornate golden shrines, bustling canal networks, and legendary nightlife.',
      accentColor: 'linear-gradient(135deg, #7c3aed, #a855f7)'
    },
    {
      id: 13,
      name: 'Berlin',
      country: 'Germany',
      flag: '🇩🇪',
      continent: 'Europe',
      population: 3677000,
      areaKm2: 891.8,
      elevationMeters: 34,
      timezone: 'CET/CEST (UTC+1/UTC+2)',
      ianaTimeZone: 'Europe/Berlin',
      currency: 'Euro (EUR, €)',
      language: 'German',
      latitude: 52.52,
      longitude: 13.405,
      landmarks: ['Brandenburg Gate', 'Reichstag Building', 'East Side Gallery'],
      description: 'Germany\'s creative capital, famous for profound history, techno clubs, expansive parks, and groundbreaking contemporary culture.',
      accentColor: 'linear-gradient(135deg, #334155, #475569)'
    },
    {
      id: 14,
      name: 'Seoul',
      country: 'South Korea',
      flag: '🇰🇷',
      continent: 'Asia',
      population: 9776000,
      areaKm2: 605.2,
      elevationMeters: 38,
      timezone: 'KST (UTC+9)',
      ianaTimeZone: 'Asia/Seoul',
      currency: 'South Korean Won (KRW, ₩)',
      language: 'Korean',
      latitude: 37.5665,
      longitude: 126.978,
      landmarks: ['Gyeongbokgung Palace', 'N Seoul Tower', 'Dongdaemun Design Plaza'],
      description: 'A dynamic high-tech epicenter where K-pop, cutting-edge electronics, and royal Joseon dynasties seamlessly coalesce.',
      accentColor: 'linear-gradient(135deg, #0284c7, #2563eb)'
    },
    {
      id: 15,
      name: 'Buenos Aires',
      country: 'Argentina',
      flag: '🇦🇷',
      continent: 'South America',
      population: 3120000,
      areaKm2: 203,
      elevationMeters: 25,
      timezone: 'ART (UTC-3)',
      ianaTimeZone: 'America/Argentina/Buenos_Aires',
      currency: 'Argentine Peso (ARS, $)',
      language: 'Spanish',
      latitude: -34.6037,
      longitude: -58.3816,
      landmarks: ['Teatro Colón', 'La Boca & Caminito', 'Plaza de Mayo'],
      description: 'The Paris of South America: passionate tango dancing, grand European-style avenues, steakhouse parrillas, and literary cafes.',
      accentColor: 'linear-gradient(135deg, #0ea5e9, #38bdf8)'
    },
    {
      id: 16,
      name: 'Cape Town',
      country: 'South Africa',
      flag: '🇿🇦',
      continent: 'Africa',
      population: 4772000,
      areaKm2: 2446,
      elevationMeters: 42,
      timezone: 'SAST (UTC+2)',
      ianaTimeZone: 'Africa/Johannesburg',
      currency: 'South African Rand (ZAR, R)',
      language: 'Afrikaans, English, Xhosa',
      latitude: -33.9249,
      longitude: 18.4241,
      landmarks: ['Table Mountain', 'Cape Point', 'V&A Waterfront'],
      description: 'Framed by dramatic Table Mountain and two oceans, Cape Town offers scenic coastlines, world-class vineyards, and rich history.',
      accentColor: 'linear-gradient(135deg, #10b981, #047857)'
    },
    {
      id: 17,
      name: 'Amsterdam',
      country: 'Netherlands',
      flag: '🇳🇱',
      continent: 'Europe',
      population: 882000,
      areaKm2: 219.3,
      elevationMeters: -2,
      timezone: 'CET/CEST (UTC+1/UTC+2)',
      ianaTimeZone: 'Europe/Amsterdam',
      currency: 'Euro (EUR, €)',
      language: 'Dutch',
      latitude: 52.3676,
      longitude: 4.9041,
      landmarks: ['Rijksmuseum', 'Anne Frank House', 'Canal Ring (Grachtengordel)'],
      description: 'A city of bridges and bicycles, famous for historic canal mansions, legendary Dutch Master art, and progressive urban living.',
      accentColor: 'linear-gradient(135deg, #ea580c, #f97316)'
    },
    {
      id: 18,
      name: 'San Francisco',
      country: 'United States',
      flag: '🇺🇸',
      continent: 'North America',
      population: 808437,
      areaKm2: 121.4,
      elevationMeters: 16,
      timezone: 'PST/PDT (UTC-8/UTC-7)',
      ianaTimeZone: 'America/Los_Angeles',
      currency: 'US Dollar (USD, $)',
      language: 'English',
      latitude: 37.7749,
      longitude: -122.4194,
      landmarks: ['Golden Gate Bridge', 'Alcatraz Island', 'Fisherman\'s Wharf'],
      description: 'Foggy bays, rolling hills, iconic cable cars, and Victorian Painted Ladies at the heart of Silicon Valley innovation.',
      accentColor: 'linear-gradient(135deg, #e11d48, #be123c)'
    },
    {
      id: 19,
      name: 'Mumbai',
      country: 'India',
      flag: '🇮🇳',
      continent: 'Asia',
      population: 12478000,
      areaKm2: 603.4,
      elevationMeters: 14,
      timezone: 'IST (UTC+5:30)',
      ianaTimeZone: 'Asia/Kolkata',
      currency: 'Indian Rupee (INR, ₹)',
      language: 'Marathi, Hindi, English',
      latitude: 19.076,
      longitude: 72.8777,
      landmarks: ['Gateway of India', 'Marine Drive', 'Chhatrapati Shivaji Maharaj Terminus'],
      description: 'India\'s commercial powerhouse and home to Bollywood: a dynamic metropolis brimming with entrepreneurial drive along the Arabian Sea.',
      accentColor: 'linear-gradient(135deg, #f59e0b, #d97706)'
    },
    {
      id: 20,
      name: 'Mexico City',
      country: 'Mexico',
      flag: '🇲🇽',
      continent: 'North America',
      population: 9209000,
      areaKm2: 1485,
      elevationMeters: 2240,
      timezone: 'CST (UTC-6)',
      ianaTimeZone: 'America/Mexico_City',
      currency: 'Mexican Peso (MXN, $)',
      language: 'Spanish',
      latitude: 19.4326,
      longitude: -99.1332,
      landmarks: ['Zócalo & Metropolitan Cathedral', 'Chapultepec Castle', 'Frida Kahlo Museum'],
      description: 'Built upon ancient Aztec ruins at high altitude, a sprawling cultural capital rich in muralism, gastronomy, and festive energy.',
      accentColor: 'linear-gradient(135deg, #059669, #10b981)'
    },
    {
      id: 21,
      name: 'Istanbul',
      country: 'Turkey',
      flag: '🇹🇷',
      continent: 'Europe',
      population: 15460000,
      areaKm2: 5343,
      elevationMeters: 40,
      timezone: 'TRT (UTC+3)',
      ianaTimeZone: 'Europe/Istanbul',
      currency: 'Turkish Lira (TRY, ₺)',
      language: 'Turkish',
      latitude: 41.0082,
      longitude: 28.9784,
      landmarks: ['Hagia Sophia', 'Blue Mosque', 'Grand Bazaar'],
      description: 'The historic bridge between East and West, straddling the Bosphorus Strait across two continents with grand imperial majesty.',
      accentColor: 'linear-gradient(135deg, #b91c1c, #991b1b)'
    },
    {
      id: 22,
      name: 'Barcelona',
      country: 'Spain',
      flag: '🇪🇸',
      continent: 'Europe',
      population: 1620000,
      areaKm2: 101.9,
      elevationMeters: 12,
      timezone: 'CET/CEST (UTC+1/UTC+2)',
      ianaTimeZone: 'Europe/Madrid',
      currency: 'Euro (EUR, €)',
      language: 'Catalan, Spanish',
      latitude: 41.3851,
      longitude: 2.1734,
      landmarks: ['Basílica de la Sagrada Família', 'Park Güell', 'La Rambla'],
      description: 'The Catalan jewel on the Mediterranean, celebrated for Antoni Gaudí\'s surreal architecture, golden beaches, and tapas culture.',
      accentColor: 'linear-gradient(135deg, #4f46e5, #6366f1)'
    },
    {
      id: 23,
      name: 'Vienna',
      country: 'Austria',
      flag: '🇦🇹',
      continent: 'Europe',
      population: 1931000,
      areaKm2: 414.6,
      elevationMeters: 171,
      timezone: 'CET/CEST (UTC+1/UTC+2)',
      ianaTimeZone: 'Europe/Vienna',
      currency: 'Euro (EUR, €)',
      language: 'German',
      latitude: 48.2082,
      longitude: 16.3738,
      landmarks: ['Schönbrunn Palace', 'St. Stephen\'s Cathedral', 'Vienna State Opera'],
      description: 'The City of Music and Imperial Grandeur, where Mozart and Beethoven composed, famed for historic cafes and pristine quality of life.',
      accentColor: 'linear-gradient(135deg, #be123c, #e11d48)'
    },
    {
      id: 24,
      name: 'Auckland',
      country: 'New Zealand',
      flag: '🇳🇿',
      continent: 'Oceania',
      population: 1657000,
      areaKm2: 1086,
      elevationMeters: 45,
      timezone: 'NZST/NZDT (UTC+12/UTC+13)',
      ianaTimeZone: 'Pacific/Auckland',
      currency: 'New Zealand Dollar (NZD, NZ$)',
      language: 'English, Māori',
      latitude: -36.8485,
      longitude: 174.7633,
      landmarks: ['Sky Tower Auckland', 'Waiheke Island', 'Mount Eden Crater'],
      description: 'The "City of Sails": built around two shimmering harbours and volcanic cones, offering unmatched outdoor lifestyle and Pacific vibes.',
      accentColor: 'linear-gradient(135deg, #0d9488, #0891b2)'
    },
    {
      id: 25,
      name: 'Reykjavik',
      country: 'Iceland',
      flag: '🇮🇸',
      continent: 'Europe',
      population: 139000,
      areaKm2: 273,
      elevationMeters: 15,
      timezone: 'GMT (UTC+0)',
      ianaTimeZone: 'Atlantic/Reykjavik',
      currency: 'Icelandic Króna (ISK, kr)',
      language: 'Icelandic',
      latitude: 64.1466,
      longitude: -21.9426,
      landmarks: ['Hallgrímskirkja', 'Harpa Concert Hall', 'Sun Voyager Sculpture'],
      description: 'The northernmost world capital, run on 100% geothermal energy, gateway to the Northern Lights, glaciers, and volcanic landscapes.',
      accentColor: 'linear-gradient(135deg, #0369a1, #0284c7)'
    },
    {
      id: 26,
      name: 'Hong Kong',
      country: 'China',
      flag: '🇭🇰',
      continent: 'Asia',
      population: 7413000,
      areaKm2: 1114,
      elevationMeters: 9,
      timezone: 'HKT (UTC+8)',
      ianaTimeZone: 'Asia/Hong_Kong',
      currency: 'Hong Kong Dollar (HKD, HK$)',
      language: 'Cantonese, English, Mandarin',
      latitude: 22.3193,
      longitude: 114.1694,
      landmarks: ['Victoria Peak', 'Victoria Harbour & Star Ferry', 'Tian Tan Giant Buddha'],
      description: 'A dazzling vertical skyline enclosed between lush mountains and ocean channels, internationally famed for dim sum and bustling commerce.',
      accentColor: 'linear-gradient(135deg, #b91c1c, #e11d48)'
    },
    {
      id: 27,
      name: 'Stockholm',
      country: 'Sweden',
      flag: '🇸🇪',
      continent: 'Europe',
      population: 975000,
      areaKm2: 188,
      elevationMeters: 28,
      timezone: 'CET/CEST (UTC+1/UTC+2)',
      ianaTimeZone: 'Europe/Stockholm',
      currency: 'Swedish Krona (SEK, kr)',
      language: 'Swedish',
      latitude: 59.3293,
      longitude: 18.0686,
      landmarks: ['Gamla Stan (Old Town)', 'Vasa Museum', 'Stockholm Royal Palace'],
      description: 'The "Venice of the North": spread gracefully across 14 islands connected by 57 bridges where Lake Mälaren meets the Baltic.',
      accentColor: 'linear-gradient(135deg, #1d4ed8, #3b82f6)'
    },
    {
      id: 28,
      name: 'Vancouver',
      country: 'Canada',
      flag: '🇨🇦',
      continent: 'North America',
      population: 675218,
      areaKm2: 115,
      elevationMeters: 38,
      timezone: 'PST/PDT (UTC-8/UTC-7)',
      ianaTimeZone: 'America/Vancouver',
      currency: 'Canadian Dollar (CAD, C$)',
      language: 'English',
      latitude: 49.2827,
      longitude: -123.1207,
      landmarks: ['Stanley Park Seawall', 'Capilano Suspension Bridge', 'Granville Island'],
      description: 'A Pacific Northwest gem where majestic snow-capped coastal mountains meet temperate rainforest and sparkling ocean shores.',
      accentColor: 'linear-gradient(135deg, #047857, #059669)'
    },
    {
      id: 29,
      name: 'Nairobi',
      country: 'Kenya',
      flag: '🇰🇪',
      continent: 'Africa',
      population: 4397000,
      areaKm2: 696,
      elevationMeters: 1795,
      timezone: 'EAT (UTC+3)',
      ianaTimeZone: 'Africa/Nairobi',
      currency: 'Kenyan Shilling (KES, KSh)',
      language: 'Swahili, English',
      latitude: -1.2921,
      longitude: 36.8219,
      landmarks: ['Nairobi National Park', 'Giraffe Centre', 'Karen Blixen Museum'],
      description: 'The "Green City in the Sun" and East Africa\'s tech powerhouse: the only city in the world bordering a wild game safari park.',
      accentColor: 'linear-gradient(135deg, #b45309, #d97706)'
    },
    {
      id: 30,
      name: 'Honolulu',
      country: 'United States',
      flag: '🇺🇸',
      continent: 'Oceania',
      population: 350964,
      areaKm2: 177.2,
      elevationMeters: 6,
      timezone: 'HST (UTC-10)',
      ianaTimeZone: 'Pacific/Honolulu',
      currency: 'US Dollar (USD, $)',
      language: 'English, Hawaiian',
      latitude: 21.3069,
      longitude: -157.8583,
      landmarks: ['Waikiki Beach', 'Diamond Head State Monument', 'Pearl Harbor National Memorial'],
      description: 'The tropical capital of Hawaii, renowned for world-famous surfing, warm Aloha spirit, volcanic calderas, and Polynesian culture.',
      accentColor: 'linear-gradient(135deg, #0284c7, #06b6d4)'
    },
    {
      id: 31,
      name: 'Orlando',
      country: 'United States',
      flag: '🇺🇸',
      continent: 'North America',
      population: 316081,
      areaKm2: 308.4,
      elevationMeters: 25,
      timezone: 'EST/EDT (UTC-5/UTC-4)',
      ianaTimeZone: 'America/New_York',
      currency: 'US Dollar (USD, $)',
      language: 'English',
      latitude: 28.5383,
      longitude: -81.3792,
      landmarks: ['Walt Disney World', 'Universal Studios Florida', 'Lake Eola Park'],
      description: 'The "Theme Park Capital of the World," renowned for iconic entertainment resorts, vibrant sunny lakes, and aerospace/tech innovation.',
      accentColor: 'linear-gradient(135deg, #f59e0b, #ec4899)'
    }
  ];

  ngOnInit(): void {
    // Fetch real-time weather from Open-Meteo for all cities
    this.weatherService.fetchBatchWeather(this.cities);
  }

  getCityWeather(cityId: number): WeatherData | undefined {
    return this.weatherService.weatherMap().get(cityId);
  }

  get filteredCities(): CityData[] {
    let result = this.cities;

    if (this.selectedContinent !== 'All') {
      result = result.filter(c => c.continent === this.selectedContinent);
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q) ||
        c.landmarks.some(l => l.toLowerCase().includes(q)) ||
        c.continent.toLowerCase().includes(q)
      );
    }

    return result.sort((a, b) => {
      let valA: any;
      let valB: any;

      if (this.sortBy === 'name') {
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
      } else if (this.sortBy === 'population') {
        valA = a.population;
        valB = b.population;
      } else if (this.sortBy === 'country') {
        valA = a.country.toLowerCase();
        valB = b.country.toLowerCase();
      }

      if (valA < valB) return this.sortAsc ? -1 : 1;
      if (valA > valB) return this.sortAsc ? 1 : -1;
      return 0;
    });
  }

  toggleSort(field: 'name' | 'population' | 'country'): void {
    if (this.sortBy === field) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortBy = field;
      this.sortAsc = true;
    }
  }

  openCityModal(city: CityData): void {
    const modalRef = this.modalService.open(CityInfoModalComponent, {
      size: 'lg',
      centered: true,
      scrollable: true,
      backdrop: true,
      keyboard: true,
      beforeDismiss: () => this.modalHistory.handleBeforeDismiss(modalRef)
    });
    modalRef.componentInstance.city = city;
    modalRef.componentInstance.unit = this.unit;
    this.modalHistory.registerModal(modalRef);
  }

  openInfo(content: TemplateRef<any>): void {
    const modalRef = this.modalService.open(content, {
      centered: true,
      size: 'lg'
    });
    this.modalHistory.registerModal(modalRef);
  }

  trackByCityId(index: number, city: CityData): number {
    return city.id;
  }

  toggleUnit(): void {
    this.unit = this.unit === 'C' ? 'F' : 'C';
  }
}
