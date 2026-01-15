import { CONFIG } from '../../constants/config';
import { WeatherCondition } from '../../types';
import { StorageService, STORAGE_KEYS } from '../storage/storage.service';

export class FMIWeatherService {
  // Fetch current weather for any coordinates
  static async getCurrentWeather(
    latitude: number,
    longitude: number
  ): Promise<WeatherCondition> {
    try {
      // Check cache first
      const cached = await this.getCachedWeather();
      if (cached && !this.isCacheExpired(cached.timestamp)) {
        console.log('Using cached weather data');
        return cached;
      }

      console.log(`Fetching weather for: ${latitude}, ${longitude}`);

      // Use a 24-hour window so data is displayed (previously stricter checks caused failure)
      const now = new Date();
      const startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
      
      const params = new URLSearchParams({
        service: 'WFS',
        version: '2.0.0',
        request: 'getFeature',
        storedquery_id: 'fmi::observations::weather::simple',
        latlon: `${latitude},${longitude}`,
        parameters: 't2m,ws_10min,rh,wawa',
        starttime: startTime.toISOString(),
        endtime: now.toISOString(),
        maxlocations: '1',
        timestep: '60', // Get hourly data
      });

      const url = `${CONFIG.FMI_API_BASE_URL}?${params}`;
      console.log('FMI API URL (24h window):', url);

      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`FMI API error: ${response.status}`);
        throw new Error(`FMI API error: ${response.status}`);
      }

      const xmlText = await response.text();
      console.log('FMI Response length:', xmlText.length);
      
      // Check for data
      const numberReturned = xmlText.match(/numberReturned="(\d+)"/);
      const dataCount = numberReturned ? parseInt(numberReturned[1]) : 0;
      console.log(`Number of observations returned: ${dataCount}`);

      if (dataCount === 0) {
        console.log('No data returned from FMI, trying fallback query...');
        return this.fetchWithBoundingBox(latitude, longitude);
      }

      // Extract station name
      const stationMatch = xmlText.match(/<gml:name>(.*?)<\/gml:name>/);
      const stationName = stationMatch ? stationMatch[1] : 'Unknown';
      console.log(`Using weather station: ${stationName}`);

      const weather = this.parseSimpleXML(xmlText, stationName);

      // Cache the result
      await StorageService.save(STORAGE_KEYS.CACHED_WEATHER, weather);

      return weather;
    } catch (error) {
      console.error('Weather fetch error:', error);
      
      // Return cached data if available
      const cached = await this.getCachedWeather();
      if (cached) {
        console.log('Using expired cache due to error');
        return cached;
      }

      return this.getDefaultWeather();
    }
  }

  // Fallback bounding box
  private static async fetchWithBoundingBox(
    latitude: number,
    longitude: number
  ): Promise<WeatherCondition> {
    try {
      const now = new Date();
      const startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      // Bounding box for the area
      const bbox = `${longitude - 0.5},${latitude - 0.5},${longitude + 0.5},${latitude + 0.5}`;
      
      const params = new URLSearchParams({
        service: 'WFS',
        version: '2.0.0',
        request: 'getFeature',
        storedquery_id: 'fmi::observations::weather::simple',
        bbox: bbox,
        parameters: 't2m,ws_10min,rh,wawa',
        starttime: startTime.toISOString(),
        endtime: now.toISOString(),
        maxlocations: '1',
      });

      const url = `${CONFIG.FMI_API_BASE_URL}?${params}`;
      console.log('FMI Fallback URL (bbox):', url);

      const response = await fetch(url);
      const xmlText = await response.text();
      
      console.log('Fallback response length:', xmlText.length);
      
      const numberReturned = xmlText.match(/numberReturned="(\d+)"/);
      const dataCount = numberReturned ? parseInt(numberReturned[1]) : 0;
      console.log(`Fallback: Number of observations: ${dataCount}`);

      if (dataCount === 0) {
        console.log('Fallback also returned no data, using defaults');
        return this.getDefaultWeather();
      }

      const stationMatch = xmlText.match(/<gml:name>(.*?)<\/gml:name>/);
      const stationName = stationMatch ? stationMatch[1] : 'Unknown';
      console.log(`Fallback station: ${stationName}`);

      return this.parseSimpleXML(xmlText, stationName);
    } catch (error) {
      console.error('Fallback fetch error:', error);
      return this.getDefaultWeather();
    }
  }

  private static parseSimpleXML(xmlText: string, stationName: string): WeatherCondition {
    try {
      const measurements: { [key: string]: number } = {};
      const bsWfsBlocks = xmlText.split('<BsWfs:BsWfsElement');

      console.log(`Parsing ${bsWfsBlocks.length - 1} data blocks`);

      for (const block of bsWfsBlocks) {
        const nameMatch = block.match(/<BsWfs:ParameterName>(.*?)<\/BsWfs:ParameterName>/);
        const valueMatch = block.match(/<BsWfs:ParameterValue>([-\d.]+)<\/BsWfs:ParameterValue>/);
        
        if (nameMatch && valueMatch) {
          const paramName = nameMatch[1];
          const value = parseFloat(valueMatch[1]);
          // Keep updating to get most recent value
          measurements[paramName] = value;
        }
      }

      const temperature = measurements['t2m'] ?? null;
      const windSpeed = measurements['ws_10min'] ?? null;
      const humidity = measurements['rh'] ?? null;
      const weatherCode = measurements['wawa'] ?? null;

      console.log('=== PARSED WEATHER ===');
      console.log(`Station: ${stationName}`);
      console.log(`Temperature: ${temperature}°C`);
      console.log(`Wind: ${windSpeed} m/s`);
      console.log(`Humidity: ${humidity}%`);
      console.log(`Weather code: ${weatherCode}`);
      console.log('===================');

      const temp = temperature ?? -5;
      const wind = windSpeed ?? 3;
      const humid = humidity ?? 70;
      const code = weatherCode ?? 0;

      return {
        temperature: temp,
        feelsLike: this.calculateFeelsLike(temp, wind),
        description: this.getWeatherDescription(code, temp),
        icon: this.getWeatherIcon(code, temp),
        humidity: humid,
        windSpeed: wind,
        timestamp: new Date(),
        isExtreme: this.isExtremeWeather(temp, wind),
      };
    } catch (error) {
      console.error('XML parsing error:', error);
      return this.getDefaultWeather();
    }
  }

  // Calculate feels-like temperature
  private static calculateFeelsLike(temp: number, windSpeed: number): number {
    if (temp < 10 && windSpeed > 1.3) {
      const windKmh = windSpeed * 3.6;
      const windChill = 13.12 + 0.6215 * temp - 11.37 * Math.pow(windKmh, 0.16) + 0.3965 * temp * Math.pow(windKmh, 0.16);
      return Math.round(windChill * 10) / 10;
    }
    return temp;
  }

  // Weather description
  private static getWeatherDescription(code: number, temp: number): string {
    if (code === 0) {
      if (temp < -20) return 'Extremely cold';
      if (temp < -10) return 'Very cold';
      if (temp < 0) return 'Cold';
      if (temp < 10) return 'Cool';
      if (temp < 20) return 'Mild';
      return 'Warm';
    }
    if (code >= 60 && code <= 69) return 'Rainy';
    if (code >= 70 && code <= 79) return 'Snowy';
    if (code >= 80 && code <= 89) return 'Showers';
    if (code >= 90 && code <= 99) return 'Thunderstorm';
    if (code >= 40 && code <= 49) return 'Foggy';
    if (code >= 1 && code <= 9) return 'Cloudy';
    return 'Clear';
  }

  // Weather icon
  private static getWeatherIcon(code: number, temp: number): string {
    if (code >= 60 && code <= 69) return 'rainy';
    if (code >= 70 && code <= 79) return 'snow';
    if (code >= 90 && code <= 99) return 'thunderstorm';
    if (code >= 40 && code <= 49) return 'cloudy';
    if (code === 0 && temp >= 15) return 'sunny';
    if (code === 0 && temp >= 0) return 'partly-sunny';
    if (temp < 0) return 'snow';
    return 'cloudy';
  }

  // Check extreme weather
  private static isExtremeWeather(temp: number, wind: number): boolean {
    return temp < -15 || temp > 30 || wind > 15;
  }

  // Cached weather
  private static async getCachedWeather(): Promise<WeatherCondition | null> {
    const cached = await StorageService.load<WeatherCondition>(STORAGE_KEYS.CACHED_WEATHER);
    if (cached && cached.timestamp) {
      cached.timestamp = new Date(cached.timestamp);
    }
    return cached;
  }

  // Cache expired check
  private static isCacheExpired(timestamp: Date): boolean {
    const now = new Date().getTime();
    const cacheTime = new Date(timestamp).getTime();
    return (now - cacheTime) > CONFIG.CACHE.WEATHER_EXPIRY_MS;
  }

  // Default weather placeholder adjusted for winter, can be removed and replaced with generic error screen instead 
  private static getDefaultWeather(): WeatherCondition {
    return {
      temperature: -5,
      feelsLike: -8,
      description: 'Weather data unavailable',
      icon: 'cloudy',
      humidity: 70,
      windSpeed: 3,
      timestamp: new Date(),
      isExtreme: false,
    };
  }
}