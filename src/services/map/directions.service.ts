import { GOOGLE_MAPS_API_KEY } from '@env';
import { Waypoint } from '../../types/route';

export interface DirectionsResponse {
  coordinates: { latitude: number; longitude: number }[];
  distance: number; 
  duration: number; 
}

export class DirectionsService {
  private static readonly BASE_URL = 'https://maps.googleapis.com/maps/api/directions/json';

  // Directions between waypoints
  static async getDirections(
    origin: Waypoint,
    destination: Waypoint,
    mode: 'walking' | 'bicycling' = 'walking'
  ): Promise<DirectionsResponse | null> {
    try {
      const params = new URLSearchParams({
        origin: `${origin.latitude},${origin.longitude}`,
        destination: `${destination.latitude},${destination.longitude}`,
        mode: mode,
        key: GOOGLE_MAPS_API_KEY,
      });

      const url = `${this.BASE_URL}?${params}`;
      console.log('Fetching directions...');

      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK') {
        console.error('Directions API error:', data.status, data.error_message);
        return null;
      }

      if (!data.routes || data.routes.length === 0) {
        console.error('No routes found');
        return null;
      }

      const route = data.routes[0];
      const leg = route.legs[0];

      // Decode polyline
      const coordinates = this.decodePolyline(route.overview_polyline.points);

      return {
        coordinates,
        distance: leg.distance.value,
        duration: leg.duration.value,
      };
    } catch (error) {
      console.error('Error fetching directions:', error);
      return null;
    }
  }

  // Complete route with all waypoints
  static async getCompleteRoute(
    waypoints: Waypoint[],
    mode: 'walking' | 'bicycling' = 'walking'
  ): Promise<DirectionsResponse | null> {
    if (waypoints.length < 2) {
      return null;
    }

    try {
      let allCoordinates: { latitude: number; longitude: number }[] = [];
      let totalDistance = 0;
      let totalDuration = 0;

      // Directions for each segment
      for (let i = 0; i < waypoints.length - 1; i++) {
        console.log(`Fetching segment ${i + 1}/${waypoints.length - 1}`);
        
        const segment = await this.getDirections(
          waypoints[i],
          waypoints[i + 1],
          mode
        );

        if (!segment) {
          console.error(`Failed to get directions for segment ${i + 1}`);
          return null;
        }

        if (i === 0) {
          allCoordinates = allCoordinates.concat(segment.coordinates);
        } else {
          allCoordinates = allCoordinates.concat(segment.coordinates.slice(1));
        }

        totalDistance += segment.distance;
        totalDuration += segment.duration;
      }

      return {
        coordinates: allCoordinates,
        distance: totalDistance,
        duration: totalDuration,
      };
    } catch (error) {
      console.error('Error building complete route:', error);
      return null;
    }
  }

  // Use Google's encoded polyline format based on https://developers.google.com/maps/documentation/utilities/polylinealgorithm

  private static decodePolyline(encoded: string): { latitude: number; longitude: number }[] {
    const coordinates: { latitude: number; longitude: number }[] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let b;
      let shift = 0;
      let result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      coordinates.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }

    return coordinates;
  }
}