import { GOOGLE_MAPS_API_KEY } from '@env';

export const MAP_CONFIG = {
  GOOGLE_MAPS_API_KEY,
  
  // Fallback Finland zoomed out
  FALLBACK_REGION: {
    latitude: 64.0,
    longitude: 26.0,
    latitudeDelta: 8.0,
    longitudeDelta: 8.0,
  },

   // User location zoomed in
  USER_LOCATION_DELTA: {
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  },
  
  // Map styling
  MARKER_COLOR: '#4A90E2',
  ROUTE_COLOR: '#4A90E2',
  ROUTE_WIDTH: 4,
  
  // Map type uses standard for now
  MAP_TYPE: 'standard' as const,
};