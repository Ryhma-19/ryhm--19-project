import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { WorkoutSession } from '../../types/workout';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';

interface WorkoutCardProps {
  workout: WorkoutSession;
  onPress: () => void;
}

// Formatting for data
export const WorkoutCard: React.FC<WorkoutCardProps> = ({ workout, onPress }) => {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  };

  const formatDistance = (meters: number) => {
    return `${(meters / 1000).toFixed(2)} km`;
  };

  const formatPace = (secondsPerKm: number) => {
    const minutes = Math.floor(secondsPerKm / 60);
    const seconds = Math.floor(secondsPerKm % 60);
    return `${minutes}:${String(seconds).padStart(2, '0')} /km`;
  };

  // Get emoji for feeling, currently set to very defaults that are subject to change
  const getFeelingEmoji = (feeling?: string) => {
    switch (feeling) {
      case 'great': return '🔥';
      case 'good': return '😊';
      case 'okay': return '😐';
      case 'tired': return '😓';
      case 'exhausted': return '😰';
      default: return null;
    }
  };

  // Get type tag label
  const getWorkoutTypeLabel = (type: string) => {
    return type === 'running' ? '🏃‍♂️ Running' : '🚶‍♂️ Walking';
  };

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.date}>{formatDate(workout.startTime)}</Text>
          <Text style={styles.time}>{formatTime(workout.startTime)}</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.workoutType}>{getWorkoutTypeLabel(workout.type)}</Text>
          {workout.feeling && (
            <Text style={styles.feeling}>{getFeelingEmoji(workout.feeling)}</Text>
          )}
        </View>
      </View>

      {/* Route name */}
      {workout.routeName && (
        <View style={styles.routeContainer}>
          <Text style={styles.routeLabel}>📍 {workout.routeName}</Text>
        </View>
      )}

      {/* Main Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatDistance(workout.distance)}</Text>
          <Text style={styles.statLabel}>Distance</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatDuration(workout.duration)}</Text>
          <Text style={styles.statLabel}>Duration</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatPace(workout.averagePace)}</Text>
          <Text style={styles.statLabel}>Avg Pace</Text>
        </View>
      </View>

      {/*  Calories */}
      {workout.calories && (
        <View style={styles.footer}>
          <Text style={styles.calories}>🔥 {Math.round(workout.calories)} cal</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  date: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontFamily: TYPOGRAPHY.fonts.semiBold,
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  time: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontFamily: TYPOGRAPHY.fonts.regular,
    color: COLORS.text.secondary,
  },
  workoutType: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontFamily: TYPOGRAPHY.fonts.medium,
    color: COLORS.text.secondary,
  },
  feeling: {
    fontSize: TYPOGRAPHY.sizes.lg,
  },
  routeContainer: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    marginBottom: SPACING.sm,
    alignSelf: 'flex-start',
  },
  routeLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontFamily: TYPOGRAPHY.fonts.medium,
    color: COLORS.primary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontFamily: TYPOGRAPHY.fonts.bold,
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontFamily: TYPOGRAPHY.fonts.regular,
    color: COLORS.text.secondary,
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
  },
  footer: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  calories: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontFamily: TYPOGRAPHY.fonts.medium,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
});
