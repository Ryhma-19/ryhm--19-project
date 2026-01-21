export interface Waypoint {
  latitude: number;
  longitude: number;
  order: number;
}

export interface RouteData {
  id: string;
  userId: string;
  name: string;
  description?: string;
  waypoints: Waypoint[];
  distance: number;
  createdAt: Date;
  updatedAt: Date;
  isFavorite: boolean;
}

export interface RouteSegment {
  start: Waypoint;
  end: Waypoint;
  distance: number;
}