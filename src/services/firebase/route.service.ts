import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from './config';
import { RouteData, Waypoint } from '../../types/route';

export class RouteService {
  private static readonly COLLECTION = 'routes';

  // Save new route
  static async createRoute(
    userId: string,
    name: string,
    waypoints: Waypoint[],
    distance: number,
    description?: string
  ): Promise<string> {
    try {
      const routeData = {
        userId,
        name,
        description: description || '',
        waypoints,
        distance,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        isFavorite: false,
      };

      const docRef = await addDoc(collection(db, this.COLLECTION), routeData);
      console.log('Route created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating route:', error);
      throw new Error('Failed to save route');
    }
  }

 // Get routes for user
  static async getUserRoutes(userId: string): Promise<RouteData[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const routes: RouteData[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        routes.push({
          id: doc.id,
          userId: data.userId,
          name: data.name,
          description: data.description,
          waypoints: data.waypoints,
          distance: data.distance,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          isFavorite: data.isFavorite || false,
        });
      });

      console.log(`Loaded ${routes.length} routes for user`);
      return routes;
    } catch (error) {
      console.error('Error loading routes:', error);
      throw new Error('Failed to load routes');
    }
  }

// Update existing route
  static async updateRoute(
    routeId: string,
    updates: {
      name?: string;
      description?: string;
      waypoints?: Waypoint[];
      distance?: number;
      isFavorite?: boolean;
    }
  ): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION, routeId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
      console.log('Route updated:', routeId);
    } catch (error) {
      console.error('Error updating route:', error);
      throw new Error('Failed to update route');
    }
  }

// Delete existing route
  static async deleteRoute(routeId: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION, routeId);
      await deleteDoc(docRef);
      console.log('Route deleted:', routeId);
    } catch (error) {
      console.error('Error deleting route:', error);
      throw new Error('Failed to delete route');
    }
  }

// Toggle favorite status
  static async toggleFavorite(routeId: string, isFavorite: boolean): Promise<void> {
    try {
      await this.updateRoute(routeId, { isFavorite });
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  }
}