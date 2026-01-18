export const CONFIG = {
  // API endpoints
  FMI_API_BASE_URL: 'https://opendata.fmi.fi/wfs',

  DEV_AUTH_BYPASS: __DEV__,
  
  // Map configuration
  MAP: {
    DEFAULT_LATITUDE: 60.1699, // Helsinki
    DEFAULT_LONGITUDE: 24.9384,
    DEFAULT_ZOOM: 13,
    ROUTE_LINE_COLOR: '#4A90E2',
    ROUTE_LINE_WIDTH: 4,
  },
  
  // Location tracking
  LOCATION: {
    ACCURACY: 'high' as const,
    UPDATE_INTERVAL: 5000, // 5 seconds
    MIN_DISTANCE: 10, // 10 meters
  },
  
  // Workout tracking
  WORKOUT: {
    MIN_DURATION_SECONDS: 60, // Minimum 1 minute to save
    NOTIFICATION_INTERVALS: [1000, 2000, 5000], // Notify at 1km, 2km, 5km
  },
  
  // Cache settings
  CACHE: {
    WEATHER_EXPIRY_MS: 1800000, // 30 minutes
    MAX_CACHED_ROUTES: 10,
  },
  
  // Achievements
  ACHIEVEMENTS: {
    DISTANCES: [1, 5, 10, 21, 42], // km milestones
    STREAK_DAYS: [3, 7, 14, 30, 100],
  },
};