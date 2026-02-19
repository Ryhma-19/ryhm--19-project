import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TrackingStackParamList } from '../../types/navigation';
import { WorkoutSession } from '../../types/workout';
import { WorkoutService } from '../../services/firebase/workout.service';
import { WorkoutCard } from '../../components/tracking/WorkoutCard';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';

type WorkoutListScreenProps = NativeStackScreenProps<TrackingStackParamList, 'WorkoutList'>;

type SortOption = 'date-desc' | 'date-asc' | 'distance-desc' | 'duration-desc';
type FilterOption = 'all' | 'running' | 'walking';

export const WorkoutListScreen: React.FC<WorkoutListScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [filteredWorkouts, setFilteredWorkouts] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');

  // Load from Firebase
  const loadWorkouts = useCallback(async () => {
    if (!user) return;

    try {
      const data = await WorkoutService.getUserWorkouts(user.id);
      setWorkouts(data);
    } catch (error) {
      console.error('Error loading workouts:', error);
      Alert.alert('Error', 'Failed to load workouts. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadWorkouts();
  }, [loadWorkouts]);

  // Filters and sorting
  useEffect(() => {
    let result = [...workouts];

    if (filterBy !== 'all') {
      result = result.filter(w => w.type === filterBy);
    }

    switch (sortBy) {
      case 'date-desc':
        result.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
        break;
      case 'date-asc':
        result.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
        break;
      case 'distance-desc':
        result.sort((a, b) => b.distance - a.distance);
        break;
      case 'duration-desc':
        result.sort((a, b) => b.duration - a.duration);
        break;
    }

    setFilteredWorkouts(result);
  }, [workouts, sortBy, filterBy]);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadWorkouts();
  }, [loadWorkouts]);

  const handleWorkoutPress = (workout: WorkoutSession) => {
    navigation.navigate('WorkoutDetail', { workoutId: workout.id });
  };

  const renderSortButton = (option: SortOption, label: string) => (
    <TouchableOpacity
      style={[styles.filterButton, sortBy === option && styles.filterButtonActive]}
      onPress={() => setSortBy(option)}
    >
      <Text style={[styles.filterButtonText, sortBy === option && styles.filterButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderFilterButton = (option: FilterOption, label: string) => (
    <TouchableOpacity
      style={[styles.filterButton, filterBy === option && styles.filterButtonActive]}
      onPress={() => setFilterBy(option)}
    >
      <Text style={[styles.filterButtonText, filterBy === option && styles.filterButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>🏃‍♂️</Text>
      <Text style={styles.emptyStateTitle}>No Workouts Yet</Text>
      <Text style={styles.emptyStateText}>
        Start your first workout from the Tracking tab to see it here!
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading workouts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{workouts.length}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {(workouts.reduce((sum, w) => sum + w.distance, 0) / 1000).toFixed(1)} km
          </Text>
          <Text style={styles.summaryLabel}>Distance</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {Math.floor(workouts.reduce((sum, w) => sum + w.duration, 0) / 3600)}h
          </Text>
          <Text style={styles.summaryLabel}>Time</Text>
        </View>
      </View>

      {/* Filter Controls */}
      <View style={styles.controlsContainer}>
        <View style={styles.controlSection}>
          <Text style={styles.controlLabel}>Filter:</Text>
          <View style={styles.buttonRow}>
            {renderFilterButton('all', 'All')}
            {renderFilterButton('running', '🏃 Run')}
            {renderFilterButton('walking', '🚶 Walk')}
          </View>
        </View>

        <View style={styles.controlSection}>
          <Text style={styles.controlLabel}>Sort:</Text>
          <View style={styles.buttonRow}>
            {renderSortButton('date-desc', 'Newest')}
            {renderSortButton('date-asc', 'Oldest')}
            {renderSortButton('distance-desc', 'Distance')}
            {renderSortButton('duration-desc', 'Duration')}
          </View>
        </View>
      </View>

      {/* Workout List */}
      <FlatList
        data={filteredWorkouts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <WorkoutCard workout={item} onPress={() => handleWorkoutPress(item)} />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.md,
    fontFamily: TYPOGRAPHY.fonts.medium,
    color: COLORS.text.secondary,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.lg,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontFamily: TYPOGRAPHY.fonts.bold,
    color: COLORS.primary,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontFamily: TYPOGRAPHY.fonts.regular,
    color: COLORS.text.secondary,
    textTransform: 'uppercase',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  },
  controlsContainer: {
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  controlSection: {
    marginBottom: SPACING.sm,
  },
  controlLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontFamily: TYPOGRAPHY.fonts.semiBold,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  filterButton: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterButtonText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontFamily: TYPOGRAPHY.fonts.medium,
    color: COLORS.text.secondary,
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xl,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xxl * 2,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  emptyStateTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontFamily: TYPOGRAPHY.fonts.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  emptyStateText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontFamily: TYPOGRAPHY.fonts.regular,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
