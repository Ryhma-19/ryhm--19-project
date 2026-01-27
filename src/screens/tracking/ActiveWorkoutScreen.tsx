import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWorkoutTracking } from '../../hooks/useWorkoutTracking';
import { formatDuration, formatDistance, formatPace } from '../../utils/workoutUtils';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { WorkoutType } from '../../types/workout';

interface ActiveWorkoutScreenProps {
  navigation: any;
  route: any;
}

export default function ActiveWorkoutScreen({ navigation, route }: ActiveWorkoutScreenProps) {
  const { 
    workoutType, 
    routeId, 
    routeName 
  } = route.params as {
    workoutType: WorkoutType;
    routeId?: string;
    routeName?: string;
  };

  const {
    stats,
    isTracking,
    isPaused,
    startTracking,
    pauseTracking,
    resumeTracking,
    stopTracking,
  } = useWorkoutTracking();

  const [isStarted, setIsStarted] = useState(false);

  // Auto-start tracking on mount
  useEffect(() => {
    handleStartWorkout();
  }, []);

  // Handle starting the workout
  const handleStartWorkout = async () => {
    const started = await startTracking();
    if (started) {
      setIsStarted(true);
      console.log('Workout started:', { workoutType, routeId, routeName });
    } else {
      Alert.alert(
        'Unable to Start',
        'Could not start workout tracking. Please check your location permissions.',
        [
          {
            text: 'Go Back',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }
  };

  // Handle pause/resume
  const handlePauseResume = () => {
    if (isPaused) {
      resumeTracking();
    } else {
      pauseTracking();
    }
  };

  // Handle finish workout
  const handleFinishWorkout = () => {
    // Require minimum distance, currently set to 100m
    if (stats.distance < 100) {
      Alert.alert(
        'Workout Too Short',
        'Please complete at least 100 meters before finishing.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Finish Workout?',
      'Are you ready to complete your workout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Finish',
          style: 'default',
          onPress: async () => {
            try {
              const finalData = await stopTracking();
              
              // Navi to summary screen
              navigation.replace('WorkoutSummary', {
                workoutType,
                routeId,
                routeName,
                finalData,
                startTime: new Date(Date.now() - stats.elapsedTime * 1000),
              });
            } catch (error) {
              console.error('Error finishing workout:', error);
              Alert.alert('Error', 'Failed to finish workout. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Prevent accidental back navigation
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      if (!isTracking) {
        return;
      }

      // Prevent default navigation
      e.preventDefault();

      // Show confirmation
      Alert.alert(
        'Discard Workout?',
        'Are you sure you want to discard this workout?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: async () => {
              await stopTracking();
              navigation.dispatch(e.data.action);
            },
          },
        ]
      );
    });

    return unsubscribe;
  }, [navigation, isTracking, stopTracking]);

  if (!isStarted) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Starting workout...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.workoutType}>
          {workoutType === 'running' ? '🏃 Running' : '🚶 Walking'}
        </Text>
        {routeName && (
          <Text style={styles.routeName}>{routeName}</Text>
        )}
      </View>

      {/* Main Stats Display */}
      <View style={styles.statsContainer}>
        {/* Large Timer */}
        <View style={styles.timerContainer}>
          <Text style={styles.timerLabel}>TIME</Text>
          <Text style={styles.timerValue}>
            {formatDuration(stats.elapsedTime)}
          </Text>
        </View>

        {/* Distance and Pace */}
        <View style={styles.metricsRow}>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>DISTANCE</Text>
            <Text style={styles.metricValue}>
              {(stats.distance / 1000).toFixed(2)}
            </Text>
            <Text style={styles.metricUnit}>km</Text>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>AVG PACE</Text>
            <Text style={styles.metricValue}>
              {stats.averagePace > 0 
                ? formatPace(stats.averagePace).replace('/km', '') 
                : '--:--'}
            </Text>
            <Text style={styles.metricUnit}>/km</Text>
          </View>
        </View>

        {/* Current Pace */}
        <View style={styles.currentPaceContainer}>
          <Text style={styles.currentPaceLabel}>Current Pace</Text>
          <Text style={styles.currentPaceValue}>
            {stats.currentPace > 0 
              ? formatPace(stats.currentPace) 
              : '--:--/km'}
          </Text>
        </View>
      </View>

      {/* Pause Indicator */}
      {isPaused && (
        <View style={styles.pausedBanner}>
          <Ionicons name="pause-circle" size={20} color="#fff" />
          <Text style={styles.pausedText}>Workout Paused</Text>
        </View>
      )}

      {/* Controls */}
      <View style={styles.controlsContainer}>
        {/* Pause/Resume Button */}
        <TouchableOpacity
          style={[
            styles.mainButton,
            isPaused ? styles.resumeButton : styles.pauseButton,
          ]}
          onPress={handlePauseResume}
          activeOpacity={0.8}
        >
          <Ionicons 
            name={isPaused ? 'play' : 'pause'} 
            size={32} 
            color="#fff" 
          />
          <Text style={styles.mainButtonText}>
            {isPaused ? 'Resume' : 'Pause'}
          </Text>
        </TouchableOpacity>

        {/* Finish Button */}
        <TouchableOpacity
          style={styles.finishButton}
          onPress={handleFinishWorkout}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
          <Text style={styles.finishButtonText}>Finish Workout</Text>
        </TouchableOpacity>
      </View>

      {/* GPS Status */}
      <View style={styles.gpsIndicator}>
        <View style={[styles.gpsCircle, isTracking && !isPaused && styles.gpsActive]} />
        <Text style={styles.gpsText}>
          {stats.coordinates.length} GPS points
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: '#fff',
    fontFamily: TYPOGRAPHY.fonts.medium,
  },
  header: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  workoutType: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: '#fff',
    fontFamily: TYPOGRAPHY.fonts.semiBold,
    marginBottom: SPACING.xs,
  },
  routeName: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: TYPOGRAPHY.fonts.regular,
  },
  statsContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  timerLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: TYPOGRAPHY.fonts.medium,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  timerValue: {
    fontSize: 72,
    color: '#fff',
    fontFamily: TYPOGRAPHY.fonts.bold,
    fontVariant: ['tabular-nums'],
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.xl,
  },
  metricBox: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: TYPOGRAPHY.fonts.medium,
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },
  metricValue: {
    fontSize: 48,
    color: '#fff',
    fontFamily: TYPOGRAPHY.fonts.bold,
    fontVariant: ['tabular-nums'],
  },
  metricUnit: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: TYPOGRAPHY.fonts.regular,
  },
  metricDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: SPACING.md,
  },
  currentPaceContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
  },
  currentPaceLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: TYPOGRAPHY.fonts.regular,
    marginBottom: SPACING.xs,
  },
  currentPaceValue: {
    fontSize: TYPOGRAPHY.sizes.xl,
    color: '#fff',
    fontFamily: TYPOGRAPHY.fonts.semiBold,
  },
  pausedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  pausedText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: '#fff',
    fontFamily: TYPOGRAPHY.fonts.semiBold,
  },
  controlsContainer: {
    padding: SPACING.xl,
    paddingBottom: SPACING.xxl,
  },
  mainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    borderRadius: 16,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  pauseButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  resumeButton: {
    backgroundColor: COLORS.success,
  },
  mainButtonText: {
    fontSize: TYPOGRAPHY.sizes.xl,
    color: '#fff',
    fontFamily: TYPOGRAPHY.fonts.semiBold,
  },
  finishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: 12,
    backgroundColor: '#fff',
    gap: SPACING.sm,
  },
  finishButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.primary,
    fontFamily: TYPOGRAPHY.fonts.semiBold,
  },
  gpsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  gpsCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  gpsActive: {
    backgroundColor: COLORS.success,
  },
  gpsText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: 'rgba(255, 255, 255, 0.5)',
    fontFamily: TYPOGRAPHY .fonts.regular,
  },
});
