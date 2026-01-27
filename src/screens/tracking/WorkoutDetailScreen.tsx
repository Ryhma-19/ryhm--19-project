import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TrackingStackParamList } from '../../types/navigation';
import { WorkoutSession } from '../../types/workout';
import { WorkoutService } from '../../services/firebase/workout.service';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';

type WorkoutDetailScreenProps = NativeStackScreenProps<TrackingStackParamList, 'WorkoutDetail'>;

export const WorkoutDetailScreen: React.FC<WorkoutDetailScreenProps> = ({ route, navigation }) => {
  const { workoutId } = route.params;
  const [workout, setWorkout] = useState<WorkoutSession | null>(null);
  const [loading, setLoading] = useState(true);

  // Load workout details
  useEffect(() => {
    const loadWorkout = async () => {
      try {
        const data = await WorkoutService.getWorkoutById(workoutId);
        if (data) {
          setWorkout(data);
        } else {
          Alert.alert('Error', 'Workout not found');
          navigation.goBack();
        }
      } catch (error) {
        console.error('Error loading workout:', error);
        Alert.alert('Error', 'Failed to load workout details');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    loadWorkout();
  }, [workoutId, navigation]);

  // Format helpers
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  const formatDistance = (meters: number) => {
    return `${(meters / 1000).toFixed(2)} km`;
  };

  const formatPace = (secondsPerKm: number) => {
    const minutes = Math.floor(secondsPerKm / 60);
    const seconds = Math.floor(secondsPerKm % 60);
    return `${minutes}:${String(seconds).padStart(2, '0')} /km`;
  };

  const formatSpeed = (metersPerSecond: number) => {
    const kmPerHour = metersPerSecond * 3.6;
    return `${kmPerHour.toFixed(1)} km/h`;
  };

  const getFeelingLabel = (feeling?: string) => {
    switch (feeling) {
      case 'great':
        return '🔥 Great';
      case 'good':
        return '😊 Good';
      case 'okay':
        return '😐 Okay';
      case 'tired':
        return '😓 Tired';
      case 'exhausted':
        return '😰 Exhausted';
      default:
        return 'Not recorded';
    }
  };

  // Delete workout
  const handleDelete = () => {
    Alert.alert(
      'Delete Workout',
      'Are you sure you want to delete this workout? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await WorkoutService.deleteWorkout(workoutId);
              Alert.alert('Success', 'Workout deleted successfully');
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting workout:', error);
              Alert.alert('Error', 'Failed to delete workout');
            }
          },
        },
      ]
    );
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!workout) {
    return null;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Card */}
      <View style={styles.headerCard}>
        <Text style={styles.workoutType}>
          {workout.type === 'running' ? '🏃‍♂️ Running' : '🚶‍♂️ Walking'}
        </Text>
        <Text style={styles.date}>{formatDate(workout.startTime)}</Text>
        <Text style={styles.time}>{formatTime(workout.startTime)}</Text>

        {workout.routeName && (
          <View style={styles.routeBadge}>
            <Text style={styles.routeBadgeText}>📍 {workout.routeName}</Text>
          </View>
        )}
      </View>

      {/* Main Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{formatDistance(workout.distance)}</Text>
          <Text style={styles.statLabel}>Distance</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{formatDuration(workout.duration)}</Text>
          <Text style={styles.statLabel}>Duration</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{formatPace(workout.averagePace)}</Text>
          <Text style={styles.statLabel}>Avg Pace</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{formatSpeed(workout.maxSpeed)}</Text>
          <Text style={styles.statLabel}>Max Speed</Text>
        </View>
      </View>

      {/* Additional Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Additional Metrics</Text>
        
        {workout.calories && (
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Calories Burned</Text>
            <Text style={styles.metricValue}>{Math.round(workout.calories)} cal</Text>
          </View>
        )}

        {workout.elevationGain !== undefined && workout.elevationGain > 0 && (
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Elevation Gain</Text>
            <Text style={styles.metricValue}>{Math.round(workout.elevationGain)} m</Text>
          </View>
        )}

        {workout.steps && workout.steps > 0 && (
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Steps</Text>
            <Text style={styles.metricValue}>{workout.steps.toLocaleString()}</Text>
          </View>
        )}

        {workout.averageCadence && workout.averageCadence > 0 && (
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Average Cadence</Text>
            <Text style={styles.metricValue}>{workout.averageCadence} spm</Text>
          </View>
        )}

        {workout.maxCadence && workout.maxCadence > 0 && (
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Max Cadence</Text>
            <Text style={styles.metricValue}>{workout.maxCadence} spm</Text>
          </View>
        )}

        {workout.pausedDuration > 0 && (
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Paused Duration</Text>
            <Text style={styles.metricValue}>{formatDuration(workout.pausedDuration)}</Text>
          </View>
        )}

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>GPS Points</Text>
          <Text style={styles.metricValue}>{workout.coordinates.length}</Text>
        </View>
      </View>

      {workout.speedData && (
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Pace Consistency</Text>
            <Text style={styles.metricValue}>
              {(workout.speedData.consistency * 100).toFixed(0)}%
            </Text>
          </View>
        )}

      {/* Splits */}
      {workout.splits.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Split Times</Text>
          {workout.splits.map((split, index) => (
            <View key={index} style={styles.splitRow}>
              <Text style={styles.splitLabel}>Km {index + 1}</Text>
              <Text style={styles.splitValue}>{formatPace(split.pace)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Feeling & Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Workout Feedback</Text>
        
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>How You Felt</Text>
          <Text style={styles.metricValue}>{getFeelingLabel(workout.feeling)}</Text>
        </View>

        {workout.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>Notes:</Text>
            <Text style={styles.notesText}>{workout.notes}</Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Delete Workout</Text>
        </TouchableOpacity>
      </View>

      {/* Map */}
      {/* Pace Graph*/}
      
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  headerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  workoutType: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontFamily: TYPOGRAPHY.fonts.bold,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  date: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontFamily: TYPOGRAPHY.fonts.semiBold,
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  time: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontFamily: TYPOGRAPHY.fonts.regular,
    color: COLORS.text.secondary,
  },
  routeBadge: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    marginTop: SPACING.sm,
  },
  routeBadgeText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontFamily: TYPOGRAPHY.fonts.medium,
    color: COLORS.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontFamily: TYPOGRAPHY.fonts.bold,
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontFamily: TYPOGRAPHY.fonts.regular,
    color: COLORS.text.secondary,
    textTransform: 'uppercase',
  },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontFamily: TYPOGRAPHY.fonts.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  metricLabel: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontFamily: TYPOGRAPHY.fonts.regular,
    color: COLORS.text.primary,
  },
  metricValue: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontFamily: TYPOGRAPHY.fonts.semiBold,
    color: COLORS.text.primary,
  },
  splitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  splitLabel: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontFamily: TYPOGRAPHY.fonts.medium,
    color: COLORS.text.primary,
  },
  splitValue: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontFamily: TYPOGRAPHY.fonts.semiBold,
    color: COLORS.primary,
  },
  notesContainer: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
  },
  notesLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontFamily: TYPOGRAPHY.fonts.semiBold,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
  },
  notesText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontFamily: TYPOGRAPHY.fonts.regular,
    color: COLORS.text.primary,
    lineHeight: 22,
  },
  actionsContainer: {
    marginTop: SPACING.md,
  },
  deleteButton: {
    backgroundColor: COLORS.error,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontFamily: TYPOGRAPHY.fonts.semiBold,
    color: '#FFFFFF',
  },
});
