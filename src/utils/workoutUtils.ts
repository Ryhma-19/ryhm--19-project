import { GPSPoint, SplitTime } from '../types/workout';

// Calculate distance between two points using Haversine formula
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

  return R * c;
}

// Calculate total distance 
export function calculateTotalDistance(points: GPSPoint[]): number {
  if (points.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 1; i < points.length; i++) {
    const segmentDistance = calculateDistance(
      points[i - 1].latitude,
      points[i - 1].longitude,
      points[i].latitude,
      points[i].longitude
    );
    totalDistance += segmentDistance;
  }

  return totalDistance;
}

// Calculate pace
export function calculatePace(
  distanceMeters: number,
  durationSeconds: number
): number {
  if (distanceMeters === 0) return 0;
  const kilometers = distanceMeters / 1000;
  return durationSeconds / kilometers;
}

// Formatting
export function formatPace(secondsPerKm: number): string {
  if (!secondsPerKm || secondsPerKm === 0) return '--:--/km';
  
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.floor(secondsPerKm % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}/km`;
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function formatDistance(meters: number): string {
  const km = meters / 1000;
  return `${km.toFixed(2)} km`;
}

// Estimate calories burned
export function estimateCalories(
  distanceMeters: number,
  userWeightKg: number = 70,
  avgPaceSecondsPerKm: number
): number {
  const distanceKm = distanceMeters / 1000;
  
  // Metabolic Equivalent (MET) values based on pace
  let met: number;
  const paceMinPerKm = avgPaceSecondsPerKm / 60;
  
  if (paceMinPerKm < 5) {
    met = 12.0; // Fast running pace
  } else if (paceMinPerKm < 6) {
    met = 10.0; // Moderate running pace
  } else if (paceMinPerKm < 7) {
    met = 8.0; // Jogging pace
  } else if (paceMinPerKm < 9) {
    met = 6.0; // Fast walking pace
  } else {
    met = 4.0; // Walking pace
  }
  
  const durationHours = (distanceKm * paceMinPerKm) / 60;
  
  // Calories = MET × weight × duration
  return Math.round(met * userWeightKg * durationHours);
}

// Calculate splits
export function calculateSplits(gpsPoints: GPSPoint[]): SplitTime[] {
  if (gpsPoints.length < 2) return [];

  const splits: SplitTime[] = [];
  let totalDistance = 0;
  let lastSplitTime = gpsPoints[0].timestamp.getTime();
  let lastSplitDistance = 0;

  for (let i = 1; i < gpsPoints.length; i++) {
    const segmentDistance = calculateDistance(
      gpsPoints[i - 1].latitude,
      gpsPoints[i - 1].longitude,
      gpsPoints[i].latitude,
      gpsPoints[i].longitude
    );

    totalDistance += segmentDistance;

    const completedKilometers = Math.floor(totalDistance / 1000);
    if (completedKilometers > splits.length) {
      const splitDistance = 500;
      const currentTime = gpsPoints[i].timestamp.getTime();
      const splitDuration = (currentTime - lastSplitTime) / 1000;
      
      const pace = (splitDuration / splitDistance) * 1000;

      splits.push({
        distance: (splits.length + 1) * 1000,
        time: (currentTime - gpsPoints[0].timestamp.getTime()) / 1000,
        pace,
      });

      lastSplitTime = currentTime;
      lastSplitDistance = totalDistance;
    }
  }

  return splits;
}

// Filter GPS points in case of incorrect readings
export function filterGPSPoints(points: GPSPoint[]): GPSPoint[] {
  return points.filter((point) => {
    // Reject low accuracy enties
    if (point.accuracy > 50) return false;

    // Reject impossible pace
    if (point.speed > 15) return false;

    return true;
  });
}

// Calculate elevation gain
export function calculateElevationGain(points: GPSPoint[]): number {
  if (points.length < 2) return 0;

  let elevationGain = 0;
  for (let i = 1; i < points.length; i++) {
    if (points[i].altitude && points[i - 1].altitude) {
      const altitudeDiff = points[i].altitude! - points[i - 1].altitude!;
      if (altitudeDiff > 0) {
        elevationGain += altitudeDiff;
      }
    }
  }

  return elevationGain;
}

// Get workout name suggestion based on type and time

export function suggestWorkoutName(type: 'running' | 'walking', startTime: Date): string {
  const hour = startTime.getHours();
  
  let timeOfDay: string;
  if (hour < 6) {
    timeOfDay = 'Early Morning';
  } else if (hour < 12) {
    timeOfDay = 'Morning';
  } else if (hour < 17) {
    timeOfDay = 'Afternoon';
  } else if (hour < 21) {
    timeOfDay = 'Evening';
  } else {
    timeOfDay = 'Night';
  }

  const activityName = type === 'running' ? 'Run' : 'Walk';
  return `${timeOfDay} ${activityName}`;
}
