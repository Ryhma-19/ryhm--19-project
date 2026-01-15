import { useState, useEffect } from 'react';
import { FMIWeatherService } from '../services/weather/fmi.service';
import { LocationService } from '../services/location/location.service';
import { WeatherCondition } from '../types';
import { StorageService, STORAGE_KEYS } from '../services/storage/storage.service';

interface UseWeatherReturn {
  weather: WeatherCondition | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useWeather(): UseWeatherReturn {
  const [weather, setWeather] = useState<WeatherCondition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = async (forceRefresh: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      // Clear cache if force refresh
      if (forceRefresh) {
        await StorageService.remove(STORAGE_KEYS.CACHED_WEATHER);
        console.log('Cache cleared for refresh');
      }

      // Get user's location
      const location = await LocationService.getLastKnownLocation();
      
      if (!location) {
        setError('Unable to get location');
        setLoading(false);
        return;
      }

      console.log('Fetching weather for location:', location);

      // Fetch weather for that location
      const weatherData = await FMIWeatherService.getCurrentWeather(
        location.latitude,
        location.longitude
      );

      setWeather(weatherData);
    } catch (err) {
      console.error('Weather fetch error:', err);
      setError('Failed to load weather data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch weather on mount
  useEffect(() => {
    fetchWeather(false);
  }, []);

  return {
    weather,
    loading,
    error,
    refresh: () => fetchWeather(true), // Force refresh
  };
}