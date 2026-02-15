import React, { useMemo } from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { GPSPoint } from '../../types/workout';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/theme';

interface WorkoutMapProps {
  coordinates: GPSPoint[];
  showStartEnd?: boolean;
  height?: number;
}

export const WorkoutMap: React.FC<WorkoutMapProps> = ({ 
  coordinates, 
  showStartEnd = true,
  height = 300,
}) => {
  // Calculate map region from coordinates
  const region = useMemo(() => {
    if (coordinates.length === 0) {
      return {
        latitude: 0,
        longitude: 0,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }

    const lats = coordinates.map(c => c.latitude);
    const lngs = coordinates.map(c => c.longitude);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    const latDelta = (maxLat - minLat) * 1.5; // Add 50% padding
    const lngDelta = (maxLng - minLng) * 1.5;

    return {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: Math.max(latDelta, 0.01), // Minimum zoom
      longitudeDelta: Math.max(lngDelta, 0.01),
    };
  }, [coordinates]);

  // Convert GPSPoint to MapView coordinate format
  const polylineCoords = useMemo(() => {
    return coordinates.map(coord => ({
      latitude: coord.latitude,
      longitude: coord.longitude,
    }));
  }, [coordinates]);

  if (coordinates.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No GPS data available</Text>
        </View>
      </View>
    );
  }

  const startPoint = coordinates[0];
  const endPoint = coordinates[coordinates.length - 1];

  return (
    <View style={[styles.container, { height }]}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        scrollEnabled={true}
        zoomEnabled={true}
        pitchEnabled={false}
        rotateEnabled={false}
      >
        {/* GPS Track */}
        <Polyline
          coordinates={polylineCoords}
          strokeColor={COLORS.primary}
          strokeWidth={4}
          lineJoin="round"
          lineCap="round"
        />

        {/* Start Marker */}
        {showStartEnd && (
          <Marker
            coordinate={{
              latitude: startPoint.latitude,
              longitude: startPoint.longitude,
            }}
            title="Start"
            pinColor={COLORS.success}
          />
        )}

        {/* End Marker */}
        {showStartEnd && (
          <Marker
            coordinate={{
              latitude: endPoint.latitude,
              longitude: endPoint.longitude,
            }}
            title="Finish"
            pinColor={COLORS.error}
          />
        )}
      </MapView>

      {/* Distance Overlay */}
      <View style={styles.overlay}>
        <Text style={styles.overlayText}>
          {coordinates.length} GPS points
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  noDataText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontFamily: TYPOGRAPHY.fonts.regular,
    color: COLORS.text.secondary,
  },
  overlay: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: 8,
  },
  overlayText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontFamily: TYPOGRAPHY.fonts.medium,
    color: '#FFFFFF',
  },
});
