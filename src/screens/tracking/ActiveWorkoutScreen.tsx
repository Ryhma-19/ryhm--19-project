import React, { useState, useEffect, useRef } from 'react';
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
import { useWorkoutTrackingWithPedometer } from '../../hooks/useWorkoutTrackingWithPedometer';
import { useTheme } from '../../contexts/ThemeContext';
import { formatDuration, formatDistance, formatPace } from '../../utils/workoutUtils';
import { SPACING, TYPOGRAPHY, getColors } from '../../constants/theme';
import { WorkoutType } from '../../types/workout';

interface ActiveWorkoutScreenProps {
  navigation: any;
  route: any;
}

export default function ActiveWorkoutScreen({ navigation, route }: ActiveWorkoutScreenProps) {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const styles = createStyles(colors);
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
  } = useWorkoutTrackingWithPedometer();

  const [isStarted, setIsStarted] = useState(false);
  const startTimeRef = useRef<Date | null>(null);
  const isStopping = useRef(false);

  useEffect(() => {
    handleStartWorkout();
  }, []);

  // Handlers for starting, pausing and resuming
  const handleStartWorkout = async () => {
    console.log('Starting workout...');
    
    const started = await startTracking();
    
    if (started) {
      startTimeRef.current = new Date();
      setIsStarted(true);
      
      console.log('Workout started successfully');
      console.log('  - Start time:', startTimeRef.current.toISOString());
      console.log('  - Type:', workoutType);
      console.log('  - Route:', routeName || 'Free run');
    } else {
      console.error('Failed to start tracking');
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

  const handlePauseResume = () => {
    if (isPaused) {
      console.log('▶️ Resuming workout...');
      resumeTracking();
    } else {
      console.log('⏸️ Pausing workout...');
      pauseTracking();
    }
  };

  const handleFinishWorkout = () => {
    // Require minimum distance, currently set to 100m
    if (stats.distance < 100) {
      Alert.alert(
        'Workout Too Short',
        `You need at least 100m to save a workout.\nCurrent distance: ${Math.round(stats.distance)}m`,
        [
          { text: 'Continue Workout', style: 'default' },
          {
            text: 'Cancel Without Saving',
            style: 'destructive',
            onPress: handleCancelWorkout,
          },
        ]
      );
      return;
    }

    Alert.alert(
      'Finish Workout?',
      'Are you ready to complete your workout?',
      [
        { text: 'Not yet', style: 'cancel' },
        {
          text: 'Finish',
          style: 'default',
          onPress: async () => {
            if (isStopping.current) {
              console.warn('Already stopping, ignoring duplicate call');
              return;
            }

            isStopping.current = true;

            try {
              console.log('Stopping workout...');
              console.log('  - Current stats:', {
                distance: stats.distance,
                elapsedTime: stats.elapsedTime,
                coordinates: stats.coordinates.length,
                steps: stats.steps,
              });

              const finalData = await stopTracking();
              
              console.log('Final data received:', {
                gpsPoints: finalData.gpsPoints.length,
                duration: finalData.duration,
                pausedDuration: finalData.pausedDuration,
                steps: finalData.steps,
                averageCadence: finalData.averageCadence,
                maxCadence: finalData.maxCadence,
              });

              if (finalData.gpsPoints.length === 0 && finalData.duration === 0) {
                isStopping.current = false;
                Alert.alert(
                  'No Data Recorded',
                  'The workout completed but no GPS data was captured. This may be due to GPS signal issues.',
                  [
                    { text: 'Try Again', onPress: () => navigation.navigate('TrackingHome') },
                  ]
                );
                return;
              }

              if (!startTimeRef.current) {
                console.error('Start time not recorded! Using fallback...');
                startTimeRef.current = new Date(Date.now() - stats.elapsedTime * 1000);
              }

              console.log('Navigating to summary with start time:', startTimeRef.current.toISOString());
              const serializedFinalData = {
                ...finalData,
                gpsPoints: finalData.gpsPoints.map(point => ({
                  ...point,
                  timestamp: point.timestamp instanceof Date 
                    ? point.timestamp.getTime() 
                    : point.timestamp,
                })),
              };

              console.log('Navigation params:', {
                workoutType,
                routeId: routeId || 'none',
                routeName: routeName || 'none',
                gpsPoints: serializedFinalData.gpsPoints.length,
                duration: serializedFinalData.duration,
                startTimeISO: startTimeRef.current.toISOString(),
              });

              try {
                // Navigate to summary screen
                navigation.replace('WorkoutSummary', {
                  workoutType,
                  routeId,
                  routeName,
                  finalData: serializedFinalData,
                  startTime: startTimeRef.current.toISOString(),
                });
                
                console.log('Navigation.replace() called successfully');
              } catch (navError) {
                console.error('Navigation error:', navError);
                isStopping.current = false;
                Alert.alert(
                  'Navigation Error',
                  'Failed to navigate to summary. Error: ' + (navError instanceof Error ? navError.message : String(navError)),
                  [{ text: 'OK' }]
                );
              }
            } catch (error) {
              isStopping.current = false;
              console.error('Error finishing workout:', error);
              Alert.alert('Error', 'Failed to finish workout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleCancelWorkout = () => {
    const distanceKm = (stats.distance / 1000).toFixed(2);
    const canSave = stats.distance >= 100;

    if (canSave) {
      Alert.alert(
        'Cancel Workout?',
        `You've completed ${distanceKm} km. Do you want to save this workout or discard it?`,
        [
          { text: 'Keep Going', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: async () => {
              console.log('🗑️ Discarding workout...');
              await stopTracking();
              navigation.navigate('TrackingHome');
            },
          },
          {
            text: 'Save & Finish',
            style: 'default',
            onPress: handleFinishWorkout,
          },
        ]
      );
    } else {
      // Workout too short so confirm discarding instead
      Alert.alert(
        'Cancel Workout?',
        `This workout is too short to save (${Math.round(stats.distance)}m).\nExit without recording?`,
        [
          { text: 'Keep Going', style: 'cancel' },
          {
            text: 'Yes, Cancel',
            style: 'destructive',
            onPress: async () => {
              console.log('Cancelling short workout...');
              await stopTracking();
              navigation.navigate('TrackingHome');
            },
          },
        ]
      );
    }
  };

  // Prevent accidental navigation
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      console.log('beforeRemove event fired:', {
        isTracking,
        isStopping: isStopping.current,
        willBlock: isTracking && !isStopping.current,
      });

      if (!isTracking || isStopping.current) {
        console.log('Allowing navigation (legitimate finish)');
        return;
      }

      // Block accidental navigation and prompt user
      console.log('Blocking navigation (accidental back press)');
      e.preventDefault();

      handleCancelWorkout();
    });

    return unsubscribe;
  }, [navigation, isTracking]);

  // Log for debug
  useEffect(() => {
    if (isStarted && stats.coordinates.length > 0) {
      console.log('GPS update:', {
        points: stats.coordinates.length,
        distance: Math.round(stats.distance),
        elapsedTime: stats.elapsedTime,
      });
    }
  }, [stats.coordinates.length, stats.distance, stats.elapsedTime]);

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

        {/* Button Row: Cancel and Finish */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelWorkout}
            activeOpacity={0.8}
          >
            <Ionicons name="close-circle" size={20} color={colors.error} />
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.finishButton}
            onPress={handleFinishWorkout}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
            <Text style={styles.finishButtonText}>Finish</Text>
          </TouchableOpacity>
        </View>
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

const createStyles = (colors: ReturnType<typeof getColors>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
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
    backgroundColor: colors.success,
  },
  mainButtonText: {
    fontSize: TYPOGRAPHY.sizes.xl,
    color: '#fff',
    fontFamily: TYPOGRAPHY.fonts.semiBold,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: 12,
    backgroundColor: '#fff',
    gap: SPACING.xs,
  },
  cancelButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: colors.error,
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
    color: colors.primary,
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
    backgroundColor: colors.success,
  },
  gpsText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: 'rgba(255, 255, 255, 0.5)',
    fontFamily: TYPOGRAPHY.fonts.regular,
  },
});
