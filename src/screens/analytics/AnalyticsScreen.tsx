import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { WorkoutService } from '../../services/firebase/workout.service';
import { WorkoutAnalyticsService } from '../../services/analytics/workout-analytics.service';
import { WorkoutSession } from '../../types/workout';
import { PeriodStatsCard } from '../../components/analytics/PeriodStatsCard';
import { TrendChart } from '../../components/analytics/TrendChart';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/theme';

type TimePeriod = 'week' | 'month' | 'all';

export default function AnalyticsScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('week');
  const [allWorkouts, setAllWorkouts] = useState<WorkoutSession[]>([]);

  useEffect(() => {
    if (user) {
      loadWorkouts();
    }
  }, [user]);

  const loadWorkouts = async () => {
    try {
      setLoading(true);
      if (user) {
        const workouts = await WorkoutService.getUserWorkouts(user.id);
        setAllWorkouts(workouts);
      }
    } catch (error) {
      console.error('Error loading workouts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter workouts by selected period
  const filteredWorkouts = useMemo(() => {
    const now = new Date();
    const startDate = new Date();

    switch (selectedPeriod) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setDate(now.getDate() - 30);
        break;
      case 'all':
        return allWorkouts;
    }

    return allWorkouts.filter(w => w.startTime >= startDate);
  }, [allWorkouts, selectedPeriod]);

  // Calculate analytics for selected period
  const analytics = useMemo(() => {
    if (filteredWorkouts.length === 0) return null;

    const now = new Date();
    const startDate = new Date();
    
    switch (selectedPeriod) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setDate(now.getDate() - 30);
        break;
      case 'all':
        startDate.setFullYear(2000); // Far in the past
        break;
    }

    return WorkoutAnalyticsService.calculateAnalytics(
      filteredWorkouts,
      startDate,
      now
    );
  }, [filteredWorkouts, selectedPeriod]);

  // Extract trend data
  const distanceTrend = useMemo(() => {
    return WorkoutAnalyticsService.extractMetricTimeSeries(
      filteredWorkouts,
      'distance'
    );
  }, [filteredWorkouts]);

  const paceTrend = useMemo(() => {
    return WorkoutAnalyticsService.extractMetricTimeSeries(
      filteredWorkouts,
      'pace'
    );
  }, [filteredWorkouts]);

  const stepsTrend = useMemo(() => {
    const data = WorkoutAnalyticsService.extractMetricTimeSeries(
      filteredWorkouts,
      'steps'
    );
    return data.filter(d => d.value > 0);
  }, [filteredWorkouts]);

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'week':
        return 'Last 7 Days';
      case 'month':
        return 'Last 30 Days';
      case 'all':
        return 'All Time';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (allWorkouts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No Workout Data</Text>
        <Text style={styles.emptyText}>
          Complete your first workout to see your analytics here!
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Period Selector */}
      <View style={styles.periodSelector}>
        <TouchableOpacity
          style={[
            styles.periodButton,
            selectedPeriod === 'week' && styles.periodButtonActive,
          ]}
          onPress={() => setSelectedPeriod('week')}
        >
          <Text
            style={[
              styles.periodButtonText,
              selectedPeriod === 'week' && styles.periodButtonTextActive,
            ]}
          >
            Week
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.periodButton,
            selectedPeriod === 'month' && styles.periodButtonActive,
          ]}
          onPress={() => setSelectedPeriod('month')}
        >
          <Text
            style={[
              styles.periodButtonText,
              selectedPeriod === 'month' && styles.periodButtonTextActive,
            ]}
          >
            Month
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.periodButton,
            selectedPeriod === 'all' && styles.periodButtonActive,
          ]}
          onPress={() => setSelectedPeriod('all')}
        >
          <Text
            style={[
              styles.periodButtonText,
              selectedPeriod === 'all' && styles.periodButtonTextActive,
            ]}
          >
            All Time
          </Text>
        </TouchableOpacity>
      </View>

      {/* Summary Stats */}
      {analytics && (
        <PeriodStatsCard
          analytics={analytics}
          periodLabel={getPeriodLabel()}
        />
      )}

      {/* No Data Message */}
      {filteredWorkouts.length === 0 && (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>
            No workouts in this time period
          </Text>
        </View>
      )}

      {/* Trend Charts */}
      {filteredWorkouts.length > 0 && (
        <>
          {/* Distance Trend */}
          {distanceTrend.length > 1 && (
            <TrendChart
              data={distanceTrend}
              title="Distance Over Time"
              yAxisLabel="Distance (km)"
              formatValue={(value) => `${value.toFixed(1)} km`}
              showArea={true}
            />
          )}

          {/* Pace Trend */}
          {paceTrend.length > 1 && (
            <TrendChart
              data={paceTrend}
              title="Pace Improvement"
              yAxisLabel="Pace (min/km)"
              formatValue={(value) => {
                const mins = Math.floor(value / 60);
                const secs = Math.floor(value % 60);
                return `${mins}:${String(secs).padStart(2, '0')}`;
              }}
            />
          )}

          {/* Steps Trend */}
          {stepsTrend.length > 1 && (
            <TrendChart
              data={stepsTrend}
              title="Steps Per Workout"
              yAxisLabel="Steps"
              formatValue={(value) => value.toLocaleString()}
              showArea={true}
            />
          )}

          {/* Weekly Aggregates */}
          {selectedPeriod !== 'week' && filteredWorkouts.length > 7 && (
            <WeeklyAggregatesSection workouts={filteredWorkouts} />
          )}
        </>
      )}
    </ScrollView>
  );
}

// Weekly Aggregates Section Component
function WeeklyAggregatesSection({ workouts }: { workouts: WorkoutSession[] }) {
  const weeklyData = useMemo(() => {
    return WorkoutAnalyticsService.getWeeklyAggregates(workouts);
  }, [workouts]);

  if (weeklyData.length === 0) return null;

  return (
    <View style={styles.weeklySection}>
      <Text style={styles.sectionTitle}>Weekly Summary</Text>
      {weeklyData.slice(-8).map((week) => (
        <View key={week.week} style={styles.weekRow}>
          <Text style={styles.weekLabel}>{week.week}</Text>
          <View style={styles.weekStats}>
            <Text style={styles.weekStat}>
              {week.totalWorkouts} workouts
            </Text>
            <Text style={styles.weekStat}>
              {(week.totalDistance / 1000).toFixed(1)} km
            </Text>
            <Text style={styles.weekStat}>
              {formatPace(week.averagePace)}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function formatPace(secondsPerKm: number): string {
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.floor(secondsPerKm % 60);
  return `${minutes}:${String(seconds).padStart(2, '0')}/km`;
}

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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.background,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontFamily: TYPOGRAPHY.fonts.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontFamily: TYPOGRAPHY.fonts.regular,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.xs,
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  periodButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: COLORS.primary,
  },
  periodButtonText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontFamily: TYPOGRAPHY.fonts.medium,
    color: COLORS.text.secondary,
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  noDataContainer: {
    backgroundColor: COLORS.surface,
    padding: SPACING.xl,
    borderRadius: 12,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontFamily: TYPOGRAPHY.fonts.regular,
    color: COLORS.text.secondary,
  },
  weeklySection: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontFamily: TYPOGRAPHY.fonts.semiBold,
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  weekLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontFamily: TYPOGRAPHY.fonts.medium,
    color: COLORS.text.primary,
  },
  weekStats: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  weekStat: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontFamily: TYPOGRAPHY.fonts.regular,
    color: COLORS.text.secondary,
  },
});
