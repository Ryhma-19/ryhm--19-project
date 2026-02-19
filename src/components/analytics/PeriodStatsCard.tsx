import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutAnalytics } from '../../types/workout';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/theme';

interface PeriodStatsCardProps {
  analytics: WorkoutAnalytics;
  periodLabel: string;
  onViewDetails?: () => void;
}

export const PeriodStatsCard: React.FC<PeriodStatsCardProps> = ({
  analytics,
  periodLabel,
  onViewDetails,
}) => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{periodLabel}</Text>
        {onViewDetails && (
          <TouchableOpacity onPress={onViewDetails}>
            <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Main Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Ionicons name="calendar" size={20} color={COLORS.primary} />
          <Text style={styles.statValue}>{analytics.totalWorkouts}</Text>
          <Text style={styles.statLabel}>Workouts</Text>
        </View>

        <View style={styles.statBox}>
          <Ionicons name="navigate" size={20} color={COLORS.primary} />
          <Text style={styles.statValue}>
            {(analytics.totalDistance / 1000).toFixed(1)}
          </Text>
          <Text style={styles.statLabel}>km Total</Text>
        </View>

        <View style={styles.statBox}>
          <Ionicons name="time" size={20} color={COLORS.primary} />
          <Text style={styles.statValue}>
            {formatTotalTime(analytics.totalDuration)}
          </Text>
          <Text style={styles.statLabel}>Total Time</Text>
        </View>

        {analytics.totalSteps > 0 && (
          <View style={styles.statBox}>
            <Ionicons name="footsteps" size={20} color={COLORS.primary} />
            <Text style={styles.statValue}>
              {(analytics.totalSteps / 1000).toFixed(1)}k
            </Text>
            <Text style={styles.statLabel}>Steps</Text>
          </View>
        )}
      </View>

      {/* Averages Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Averages</Text>
        <View style={styles.averagesGrid}>
          <View style={styles.averageItem}>
            <Text style={styles.averageLabel}>Distance</Text>
            <Text style={styles.averageValue}>
              {(analytics.averageDistance / 1000).toFixed(2)} km
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.averageItem}>
            <Text style={styles.averageLabel}>Pace</Text>
            <Text style={styles.averageValue}>
              {formatPace(analytics.averagePace)}
            </Text>
          </View>
          {analytics.averageCadence > 0 && (
            <>
              <View style={styles.divider} />
              <View style={styles.averageItem}>
                <Text style={styles.averageLabel}>Cadence</Text>
                <Text style={styles.averageValue}>
                  {Math.round(analytics.averageCadence)} spm
                </Text>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Personal Bests */}
      {analytics.totalWorkouts > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Bests</Text>
          
          <View style={styles.bestItem}>
            <View style={styles.bestLabel}>
              <Ionicons name="trophy" size={16} color={COLORS.warning} />
              <Text style={styles.bestText}>Longest Run</Text>
            </View>
            <Text style={styles.bestValue}>
              {(analytics.longestRun.distance / 1000).toFixed(2)} km
            </Text>
          </View>

          <View style={styles.bestItem}>
            <View style={styles.bestLabel}>
              <Ionicons name="flash" size={16} color={COLORS.warning} />
              <Text style={styles.bestText}>Fastest Pace</Text>
            </View>
            <Text style={styles.bestValue}>
              {formatPace(analytics.fastestPace.pace)}
            </Text>
          </View>

          {analytics.mostSteps.steps > 0 && (
            <View style={styles.bestItem}>
              <View style={styles.bestLabel}>
                <Ionicons name="footsteps" size={16} color={COLORS.warning} />
                <Text style={styles.bestText}>Most Steps</Text>
              </View>
              <Text style={styles.bestValue}>
                {analytics.mostSteps.steps.toLocaleString()}
              </Text>
            </View>
          )}

          <View style={styles.bestItem}>
            <View style={styles.bestLabel}>
              <Ionicons name="timer" size={16} color={COLORS.warning} />
              <Text style={styles.bestText}>Longest Duration</Text>
            </View>
            <Text style={styles.bestValue}>
              {formatTotalTime(analytics.longestDuration.duration)}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

// Helper Functions
function formatTotalTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function formatPace(secondsPerKm: number): string {
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.floor(secondsPerKm % 60);
  return `${minutes}:${String(seconds).padStart(2, '0')}/km`;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontFamily: TYPOGRAPHY.fonts.bold,
    color: COLORS.text.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontFamily: TYPOGRAPHY.fonts.bold,
    color: COLORS.text.primary,
    marginTop: SPACING.xs,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontFamily: TYPOGRAPHY.fonts.regular,
    color: COLORS.text.secondary,
    marginTop: 4,
  },
  section: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontFamily: TYPOGRAPHY.fonts.semiBold,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  averagesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  averageItem: {
    alignItems: 'center',
    flex: 1,
  },
  averageLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontFamily: TYPOGRAPHY.fonts.regular,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  averageValue: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontFamily: TYPOGRAPHY.fonts.semiBold,
    color: COLORS.text.primary,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  },
  bestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  bestLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  bestText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontFamily: TYPOGRAPHY.fonts.regular,
    color: COLORS.text.primary,
  },
  bestValue: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontFamily: TYPOGRAPHY.fonts.semiBold,
    color: COLORS.primary,
  },
});
