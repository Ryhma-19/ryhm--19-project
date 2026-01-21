import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { LocationService, LocationCoords } from '../../services/location/location.service';
import { MAP_CONFIG } from '../../constants/mapConfig';
import { COLORS, SPACING } from '../../constants/theme';

interface MapViewComponentProps {
  onLocationUpdate?: (location: LocationCoords) => void;
  showUserLocation?: boolean;
}

export function MapViewComponent({ 
  onLocationUpdate, 
  showUserLocation = true 
}: MapViewComponentProps) {
  const [userLocation, setUserLocation] = useState<LocationCoords | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);

  // Get user location on mount
  useEffect(() => {
    getUserLocation();
  }, []);

  const getUserLocation = async () => {
    try {
      setLoading(true);
      setError(null);

      const location = await LocationService.getCurrentLocation();
      
      if (location) {
        console.log('Map: Got user location:', location);
        setUserLocation(location);
        
        if (onLocationUpdate) {
          onLocationUpdate(location);
        }

        // Center map on user
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.01, 
            longitudeDelta: 0.01,
          }, 1000);
        }
      } else {
        setError('Unable to get your location');
      }
    } catch (err) {
      console.error('Map location error:', err);
      setError('Failed to load location');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  // Determine initial region
  const initialRegion: Region = userLocation
  ? {
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      ...MAP_CONFIG.USER_LOCATION_DELTA,
    }
  : MAP_CONFIG.FALLBACK_REGION;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={showUserLocation}
        showsMyLocationButton={true}
        showsCompass={true}
        showsScale={true}
        mapType={MAP_CONFIG.MAP_TYPE}
      >
        {/* User location marker */}
        {userLocation && (
          <Marker
            coordinate={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            }}
            title="Your Location"
            description="Current position"
            pinColor={MAP_CONFIG.MARKER_COLOR}
          />
        )}
      </MapView>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
  },
  loadingText: {
    marginTop: SPACING.md,
    color: COLORS.text.secondary,
  },
  errorText: {
    color: COLORS.error,
    textAlign: 'center',
  },
});