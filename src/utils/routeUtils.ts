import { Waypoint, RouteSegment } from '../types/route';

// Calculate distance between coordinates, uses Haversine formula
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// Calculate total route distance
export function calculateRouteDistance(waypoints: Waypoint[]): number {
  if (waypoints.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const distance = calculateDistance(
      waypoints[i].latitude,
      waypoints[i].longitude,
      waypoints[i + 1].latitude,
      waypoints[i + 1].longitude
    );
    totalDistance += distance;
  }

  return totalDistance;
}

// Calculate segments with distance
export function calculateRouteSegments(waypoints: Waypoint[]): RouteSegment[] {
  if (waypoints.length < 2) return [];

  const segments: RouteSegment[] = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    const distance = calculateDistance(
      waypoints[i].latitude,
      waypoints[i].longitude,
      waypoints[i + 1].latitude,
      waypoints[i + 1].longitude
    );
    segments.push({
      start: waypoints[i],
      end: waypoints[i + 1],
      distance,
    });
  }

  return segments;
}

// Format distance
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(2)}km`;
}

// Estimated route time, currently set to 6 min/km default pace
export function estimateRouteTime(
  distance: number,
  paceMinPerKm: number = 6
): number {
  const distanceKm = distance / 1000;
  return distanceKm * paceMinPerKm;
}

// Format to minutes
export function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);

  if (hours > 0) {
    return `${hours}h ${mins}min`;
  }
  return `${mins}min`;
}