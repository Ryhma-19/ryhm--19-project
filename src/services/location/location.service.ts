import * as Location from 'expo-location';
import { Alert } from 'react-native';

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export class LocationService {
  // Request location permissions
  static async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to show weather and track workouts.',
          [{ text: 'OK' }]
        );
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  }

  // Get current location with high accuracy
  static async getCurrentLocation(): Promise<LocationCoords | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      console.log('Getting current GPS location with high accuracy...');

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High, // High necessary for accuracy
      });

      console.log(`GPS Location: ${location.coords.latitude}, ${location.coords.longitude}`);
      console.log(`Accuracy: ${location.coords.accuracy}m`);

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('Get location error:', error);
      Alert.alert(
        'Location Error',
        'Unable to get your location. Please check your settings.',
        [{ text: 'OK' }]
      );
      return null;
    }
  }

  // Get last known location
  static async getLastKnownLocation(): Promise<LocationCoords | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      console.log('Fetching fresh location for weather...');
      return this.getCurrentLocation();
    } catch (error) {
      console.error('Get last location error:', error);
      return null;
    }
  }
}