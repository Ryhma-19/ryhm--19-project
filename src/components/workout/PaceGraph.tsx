import React, { useMemo } from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import { VictoryLine, VictoryChart, VictoryAxis, VictoryTheme, VictoryScatter } from 'victory-native';
import { GPSPoint } from '../../types/workout';
import { calculateTotalDistance } from '../../utils/workoutUtils';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/theme';

interface PaceGraphProps {
  coordinates: GPSPoint[];
  height?: number;
}

export const PaceGraph: React.FC<PaceGraphProps> = ({ coordinates, height = 250 }) => {
  // Calculate pace at intervals
  const paceData = useMemo(() => {
    if (coordinates.length < 2) return [];

    const data: { distance: number; pace: number }[] = [];
    const intervalMeters = 100; // Interval set at 100m
    let cumulativeDistance = 0;
    let intervalStart = 0;

    for (let i = 1; i < coordinates.length; i++) {
      const prev = coordinates[i - 1];
      const curr = coordinates[i];

      const segmentDistance = getDistanceBetweenPoints(prev, curr);
      cumulativeDistance += segmentDistance;

      // Calculate pace on interval
      if (cumulativeDistance >= intervalMeters || i === coordinates.length - 1) {
        const timeDiff = (curr.timestamp.getTime() - coordinates[intervalStart].timestamp.getTime()) / 1000;
        
        if (timeDiff > 0 && cumulativeDistance > 0) {
          const pace = (timeDiff / cumulativeDistance) * 1000;
          
          // Filter out unrealistic paces
          if (pace > 0 && pace < 1200) {
            data.push({
              distance: getTotalDistanceUpToIndex(coordinates, i) / 1000,
              pace: pace / 60,
            });
          }
        }

        intervalStart = i;
        cumulativeDistance = 0;
      }
    }

    return data;
  }, [coordinates]);

  // Calculate domain for axes
  type Domain = { x: [number, number]; y: [number, number] };
    const domain = useMemo<Domain>(() => {
    if (paceData.length === 0) {
    return { x: [0, 1], y: [0, 10] };
    }
    
    const distances = paceData.map(d => d.distance);
    const paces = paceData.map(d => d.pace);

    return {
    x: [0, Math.max(...distances)],
    y: [
      Math.max(Math.floor(Math.min(...paces)) - 1, 0),
      Math.ceil(Math.max(...paces)) + 1,
    ],
    };
  }, [paceData]);

  // Calculate average pace for reference line
  const averagePace = useMemo(() => {
    if (paceData.length === 0) return 0;
    return paceData.reduce((sum, d) => sum + d.pace, 0) / paceData.length;
  }, [paceData]);

  if (paceData.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.noDataText}>Not enough data to show pace graph</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      <Text style={styles.title}>Pace Over Distance</Text>
      
      <VictoryChart
        width={Dimensions.get('window').width - SPACING.md * 2}
        height={height - 40}
        theme={VictoryTheme.material}
        domain={domain}
        padding={{ top: 20, bottom: 40, left: 50, right: 20 }}
      >
        {/* X Axis - Distance */}
        <VictoryAxis
          label="Distance (km)"
          style={{
            axisLabel: { fontSize: 12, padding: 30, fill: COLORS.text.secondary },
            tickLabels: { fontSize: 10, fill: COLORS.text.secondary },
            grid: { stroke: COLORS.border, strokeWidth: 0.5 },
          }}
        />

        {/* Y Axis - Pace (inverted) */}
        <VictoryAxis
          dependentAxis
          label="Pace (min/km)"
          invertAxis
          style={{
            axisLabel: { fontSize: 12, padding: 40, fill: COLORS.text.secondary },
            tickLabels: { fontSize: 10, fill: COLORS.text.secondary },
            grid: { stroke: COLORS.border, strokeWidth: 0.5 },
          }}
        />

        {/* Pace Line */}
        <VictoryLine
          data={paceData}
          x="distance"
          y="pace"
          style={{
            data: { 
              stroke: COLORS.primary, 
              strokeWidth: 3 
            },
          }}
          interpolation="monotoneX"
        />

        {/* Data Points */}
        <VictoryScatter
          data={paceData}
          x="distance"
          y="pace"
          size={3}
          style={{
            data: { fill: COLORS.primary },
          }}
        />
      </VictoryChart>

      {/* Average Pace Label */}
      <View style={styles.averageContainer}>
        <Text style={styles.averageLabel}>
          Average: {formatPace(averagePace)}
        </Text>
      </View>
    </View>
  );
};

// Helper calculating functions
function getDistanceBetweenPoints(point1: GPSPoint, point2: GPSPoint): number {
  const R = 6371000;
  const lat1 = point1.latitude * Math.PI / 180;
  const lat2 = point2.latitude * Math.PI / 180;
  const deltaLat = (point2.latitude - point1.latitude) * Math.PI / 180;
  const deltaLng = (point2.longitude - point1.longitude) * Math.PI / 180;

  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getTotalDistanceUpToIndex(coordinates: GPSPoint[], index: number): number {
  let distance = 0;
  for (let i = 1; i <= index; i++) {
    distance += getDistanceBetweenPoints(coordinates[i - 1], coordinates[i]);
  }
  return distance;
}

// Helper formatting function
function formatPace(paceMinutes: number): string {
  const minutes = Math.floor(paceMinutes);
  const seconds = Math.round((paceMinutes - minutes) * 60);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontFamily: TYPOGRAPHY.fonts.semiBold,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  noDataText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontFamily: TYPOGRAPHY.fonts.regular,
    color: COLORS.text.secondary,
    textAlign: 'center',
    paddingVertical: SPACING.xxl,
  },
  averageContainer: {
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  averageLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontFamily: TYPOGRAPHY.fonts.medium,
    color: COLORS.text.secondary,
  },
});
