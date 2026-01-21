import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { Waypoint } from '../../types/route';
import { calculateRouteDistance, formatDistance } from '../../utils/routeUtils';
import { DirectionsService, DirectionsResponse } from '../../services/map/directions.service';
import { RouteService } from '../../services/firebase/route.service';
import RouteNameModal from '../../components/routes/RouteNameModal';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../constants/theme';
import { MAP_CONFIG } from '../../constants/mapConfig';

interface RoutePlannerProps {
  initialRegion: Region;
  onSaveRoute: (waypoints: Waypoint[], distance: number, routeCoordinates: { latitude: number; longitude: number }[]) => void;
  hasUserLocation: boolean;
  initialWaypoints?: Waypoint[]; 
}

export function RoutePlanner({ initialRegion, onSaveRoute, initialWaypoints }: RoutePlannerProps) {
  const [waypoints, setWaypoints] = useState<Waypoint[]>(initialWaypoints || []);
  const [routeCoordinates, setRouteCoordinates] = useState<{ latitude: number; longitude: number }[]>([]);
  const [distance, setDistance] = useState(0);
  const [isPlanning, setIsPlanning] = useState(initialWaypoints && initialWaypoints.length > 0);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const mapRef = useRef<MapView>(null);

  // Fetch directions whenever waypoints change
  useEffect(() => {
    if (waypoints.length >= 2) {
      fetchCompleteRoute();
    } else {
      setRouteCoordinates([]);
      setDistance(0);
    }
  }, [waypoints]);

  const fetchCompleteRoute = async () => {
    setIsLoadingRoute(true);
    try {
      const result = await DirectionsService.getCompleteRoute(waypoints, 'walking');
      
      if (result) {
        setRouteCoordinates(result.coordinates);
        setDistance(result.distance);
        console.log(`Route updated: ${formatDistance(result.distance)}`);
      } else {
        // Fallback to straight lines if directions fail
        console.log('Using fallback straight-line route');
        const straightLineCoords = waypoints.map(wp => ({
          latitude: wp.latitude,
          longitude: wp.longitude,
        }));
        setRouteCoordinates(straightLineCoords);
        setDistance(calculateRouteDistance(waypoints));
      }
    } catch (error) {
      console.error('Error fetching route:', error);
      // Use straight lines as fallback
      const straightLineCoords = waypoints.map(wp => ({
        latitude: wp.latitude,
        longitude: wp.longitude,
      }));
      setRouteCoordinates(straightLineCoords);
      setDistance(calculateRouteDistance(waypoints));
    } finally {
      setIsLoadingRoute(false);
    }
  };

  // Handle map press to add waypoint
  const handleMapPress = (event: any) => {
    if (!isPlanning) return;

    const { latitude, longitude } = event.nativeEvent.coordinate;
    const newWaypoint: Waypoint = {
      latitude,
      longitude,
      order: waypoints.length,
    };

    setWaypoints([...waypoints, newWaypoint]);
  };

  // Remove last waypoint
  const handleUndo = () => {
    if (waypoints.length > 0) {
      setWaypoints(waypoints.slice(0, -1));
    }
  };

  // Clear all waypoints
  const handleClear = () => {
    Alert.alert(
      'Clear Route',
      'Are you sure you want to clear all waypoints?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setWaypoints([]);
            setRouteCoordinates([]);
            setDistance(0);
            setIsPlanning(false);
          },
        },
      ]
    );
  };

  // Save route
  const handleSave = () => {
    if (waypoints.length < 2) {
      Alert.alert('Not Enough Waypoints', 'Please add at least 2 waypoints to create a route.');
      return;
    }

    if (isLoadingRoute) {
      Alert.alert('Please Wait', 'Route is still loading...');
      return;
    }

    onSaveRoute(waypoints, distance, routeCoordinates);
    
    // Reset state
    setWaypoints([]);
    setRouteCoordinates([]);
    setDistance(0);
    setIsPlanning(false);
  };

  // Toggle planning mode
  const togglePlanning = () => {
    setIsPlanning(!isPlanning);
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={initialRegion}
        onPress={handleMapPress}
        mapType={MAP_CONFIG.MAP_TYPE}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        {/* Draw route line */}
        {routeCoordinates.length >= 2 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={MAP_CONFIG.ROUTE_COLOR}
            strokeWidth={MAP_CONFIG.ROUTE_WIDTH}
          />
        )}

        {/* Draw waypoint markers */}
        {waypoints.map((waypoint, index) => (
          <Marker
            key={index}
            coordinate={{
              latitude: waypoint.latitude,
              longitude: waypoint.longitude,
            }}
          >
            <View style={styles.markerContainer}>
              <View
                style={[
                  styles.marker,
                  index === 0 && styles.startMarker,
                  index === waypoints.length - 1 && styles.endMarker,
                ]}
              >
                <Text style={styles.markerText}>{index + 1}</Text>
              </View>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Loading Indicator */}
      {isLoadingRoute && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Calculating route...</Text>
          </View>
        </View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        {/* Distance Display */}
        {waypoints.length >= 2 && (
          <View style={styles.distanceCard}>
            <Text style={styles.distanceLabel}>Distance</Text>
            <Text style={styles.distanceValue}>
              {formatDistance(distance)}
            </Text>
            <Text style={styles.waypointCount}>
              {waypoints.length} waypoints
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          {!isPlanning ? (
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={togglePlanning}
            >
              <Ionicons name="add-circle" size={24} color="#FFF" />
              <Text style={styles.buttonText}>Plan Route</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={handleUndo}
                disabled={waypoints.length === 0}
              >
                <Ionicons name="arrow-undo" size={20} color={COLORS.text.primary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={handleClear}
                disabled={waypoints.length === 0}
              >
                <Ionicons name="trash" size={20} color={COLORS.error} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.successButton]}
                onPress={handleSave}
                disabled={waypoints.length < 2 || isLoadingRoute}
              >
                <Ionicons name="checkmark-circle" size={24} color="#FFF" />
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Instructions */}
        {isPlanning && waypoints.length === 0 && (
          <View style={styles.instructions}>
            <Text style={styles.instructionsText}>
              Tap on the map to add waypoints. Route will follow roads between points.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  loadingText: {
    marginTop: SPACING.md,
    color: COLORS.text.primary,
    fontSize: TYPOGRAPHY.sizes.md,
  },
  controls: {
    position: 'absolute',
    bottom: SPACING.lg,
    left: SPACING.md,
    right: SPACING.md,
  },
  distanceCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  distanceLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.text.secondary,
  },
  distanceValue: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.primary,
    marginVertical: SPACING.xs,
  },
  waypointCount: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.text.light,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: COLORS.surface,
    flex: 0,
    paddingHorizontal: SPACING.lg,
  },
  successButton: {
    backgroundColor: COLORS.success,
  },
  buttonText: {
    color: '#FFF',
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  instructions: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.primary + '20',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  instructionsText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.sizes.sm,
    textAlign: 'center',
  },
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  startMarker: {
    backgroundColor: COLORS.secondary,
  },
  endMarker: {
    backgroundColor: COLORS.accent,
  },
  markerText: {
    color: '#FFF',
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
});

// Screen wrapper component that handles navigation integration
export default function RoutePlanningScreen({ navigation, route }: any) {
  const { user } = useAuth();
  const [routeName, setRouteName] = useState('');
  const [hasUserLocation, setHasUserLocation] = useState(false);
  const [initialRegion, setInitialRegion] = useState<Region>({
    latitude: 65.0121,
    longitude: 25.4651,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  
  // Modal state
  const [showNameModal, setShowNameModal] = useState(false);
  const [pendingSaveData, setPendingSaveData] = useState<{
    waypoints: Waypoint[];
    distance: number;
    routeCoordinates: { latitude: number; longitude: number }[];
  } | null>(null);

  // Get edit route from navigation params
  const editRoute = route.params?.editRoute;

  useEffect(() => {
    // Set route name if editing
    if (editRoute) {
      setRouteName(editRoute.name);
    }

    // Get user location
    const getUserLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          setInitialRegion({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
          setHasUserLocation(true);
        }
      } catch (error) {
        console.error('Error getting location:', error);
      }
    };

    getUserLocation();
  }, [editRoute]);

  const handleSaveRoute = async (
    waypoints: Waypoint[],
    distance: number,
    routeCoordinates: { latitude: number; longitude: number }[]
  ) => {
    // Store the data and show modal
    setPendingSaveData({ waypoints, distance, routeCoordinates });
    setShowNameModal(true);
  };

  const handleConfirmSave = async (name: string) => {
    setShowNameModal(false);
    
    if (!pendingSaveData) return;

    if (!editRoute) {
      // Creating new route
      await saveRoute(name, pendingSaveData.waypoints, pendingSaveData.distance);
    } else {
      // Updating existing route
      await updateRoute(name, pendingSaveData.waypoints, pendingSaveData.distance);
    }
    
    setPendingSaveData(null);
  };

  const handleCancelSave = () => {
    setShowNameModal(false);
    setPendingSaveData(null);
  };

  const saveRoute = async (name: string, waypoints: Waypoint[], distance: number) => {
    if (!user) {
      Alert.alert('Error', 'User not authenticated.');
      return;
    }

    try {
      await RouteService.createRoute(user.id, name, waypoints, distance);
      Alert.alert('Success', 'Route saved successfully!');
      navigation.goBack();
    } catch (error) {
      console.error('Error saving route:', error);
      Alert.alert('Error', 'Failed to save route. Please try again.');
    }
  };

  const updateRoute = async (name: string, waypoints: Waypoint[], distance: number) => {
    try {
      // Update in Firestore
      await RouteService.updateRoute(editRoute.id, { name, waypoints, distance });
      Alert.alert('Success', 'Route updated successfully!');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating route:', error);
      Alert.alert('Error', 'Failed to update route. Please try again.');
    }
  };

  return (
    <>
      <RoutePlanner
        initialRegion={initialRegion}
        onSaveRoute={handleSaveRoute}
        hasUserLocation={hasUserLocation}
        initialWaypoints={editRoute?.waypoints}
      />
      
      <RouteNameModal
        visible={showNameModal}
        initialName={editRoute?.name || ''}
        title={editRoute ? 'Update Route' : 'Save Route'}
        confirmText={editRoute ? 'Update' : 'Save'}
        onConfirm={handleConfirmSave}
        onCancel={handleCancelSave}
      />
    </>
  );
}