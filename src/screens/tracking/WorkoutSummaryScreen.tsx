import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { WorkoutService } from '../../services/firebase/workout.service';
import { GPSPoint, WorkoutType } from '../../types/workout';
import { useAchievementDetector } from '../../hooks/useAchievementDetector';
import { saveDetectedBadges } from '../../utils/achievementBridge';
import {
  calculateTotalDistance,
  calculatePace,
  formatDuration,
  formatDistance,
  formatPace,
  estimateCalories,
  calculateSplits,
  calculateElevationGain,
  suggestWorkoutName,
} from '../../utils/workoutUtils';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS, getColors, COLORS } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';

interface WorkoutSummaryScreenProps {
  navigation: any;
  route: any;
}

type FeelingType = 'great' | 'good' | 'okay' | 'tired' | 'exhausted';

const FEELINGS: { value: FeelingType; label: string; icon: string; color: string }[] = [
  { value: 'great', label: 'Great', icon: 'happy', color: '#34C759' },
  { value: 'good', label: 'Good', icon: 'happy-outline', color: '#52C41A' },
  { value: 'okay', label: 'Okay', icon: 'remove-circle-outline', color: '#FAAD14' },
  { value: 'tired', label: 'Tired', icon: 'sad-outline', color: '#FF9500' },
  { value: 'exhausted', label: 'Exhausted', icon: 'sad', color: '#FF3B30' },
];

export default function WorkoutSummaryScreen({ navigation, route }: WorkoutSummaryScreenProps) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const styles = createStyles(colors);
  const { 
    workoutType,
    routeId,
    routeName,
    finalData,
    startTime,
  } = route.params as {
    workoutType: WorkoutType;
    routeId?: string;
    routeName?: string;
    finalData: {
      gpsPoints: GPSPoint[];
      duration: number;
      pausedDuration: number;
      steps?: number;
      averageCadence?: number;
      maxCadence?: number;
    };
    startTime: string;
  };

  console.log('WorkoutSummaryScreen mounted with:', {
    workoutType,
    gpsPoints: finalData.gpsPoints.length,
    duration: finalData.duration,
    startTime,
  });

  const [savedWorkoutId, setSavedWorkoutId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [feeling, setFeeling] = useState<FeelingType | undefined>();
  const [saving, setSaving] = useState(false);

  const gpsPointsWithDates = finalData.gpsPoints.map(point => ({
    ...point,
    timestamp: typeof point.timestamp === 'number' 
      ? new Date(point.timestamp) 
      : point.timestamp,
  }));

  // Calculate final stats using deserialized GPS points
  const distance = calculateTotalDistance(gpsPointsWithDates);
  const averagePace = calculatePace(distance, finalData.duration);
  const splits = calculateSplits(gpsPointsWithDates);
  const elevationGain = calculateElevationGain(gpsPointsWithDates);
  
  // Calculate max speed and handle empty array
  const maxSpeed = gpsPointsWithDates.length > 0
    ? gpsPointsWithDates.reduce((max, point) => Math.max(max, point.speed), 0)
    : 0;

  const calories = estimateCalories(distance, 70, averagePace);
  const workoutStartTime = typeof startTime === 'string' ? new Date(startTime) : startTime;
  const endTime = new Date(workoutStartTime.getTime() + (finalData.duration + finalData.pausedDuration) * 1000);
  const suggestedName = suggestWorkoutName(workoutType, workoutStartTime);

  // Debug logs
  console.log('Calculated values:', {
    distance: distance,
    distanceIsFinite: isFinite(distance),
    averagePace: averagePace,
    averagePaceIsFinite: isFinite(averagePace),
    calories: calories,
    caloriesIsFinite: isFinite(calories),
    elevationGain: elevationGain,
    elevationGainIsFinite: isFinite(elevationGain),
    maxSpeed: maxSpeed,
    maxSpeedIsFinite: isFinite(maxSpeed),
    suggestedName: suggestedName,
    suggestedNameType: typeof suggestedName,
    splitsCount: splits.length,
  });

  if (splits.length > 0) {
    console.log('Split paces:', splits.map((s, i) => ({
      km: i + 1,
      pace: s.pace,
      paceIsFinite: isFinite(s.pace),
    })));
  }

  const handleSave = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to save workouts.');
      return;
    }

    if (saving) return;

    setSaving(true);

    try {
      const workoutId = await WorkoutService.createWorkout(
        user.id,
        workoutType,
        workoutStartTime,
        endTime,
        finalData.duration,
        finalData.pausedDuration,
        distance,
        averagePace,
        maxSpeed,
        gpsPointsWithDates,
        splits,
        routeId || undefined,
        routeName || undefined,
        isFinite(calories) ? calories : 0,
        elevationGain > 0 ? elevationGain : undefined,
        notes.trim() || undefined,
        feeling,
        finalData.steps,
        finalData.averageCadence,
        finalData.maxCadence
      );

      console.log('Workout saved:', workoutId);
      setSavedWorkoutId(workoutId);

      // Navigate
      navigation.navigate('WorkoutDetail', { workoutId }); 
    } catch (error) {
      console.error('Error saving workout:', error);
      Alert.alert(
        'Error',
        'Failed to save workout. Please try again.',
        [{ text: 'OK' }]
      );
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    Alert.alert(
      'Discard Workout?',
      'Are you sure you want to discard this workout? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            navigation.navigate('TrackingHome');
          },
        },
      ]
    );
  };

  // Achievement detection
  const handleAchievementsDetected = useCallback((achievements: any[]) => {
  console.log('🏆 Achievements unlocked:', achievements);
  saveDetectedBadges(user?.id, achievements);
  }, [user?.id]);

  useAchievementDetector({
  userId: user?.id || '',
  newWorkoutId: savedWorkoutId,
  onAchievementsDetected: handleAchievementsDetected,
});

// Logs for testing
console.log('Rendering, checking all text values:', {
  'formatDuration(duration)': formatDuration(finalData.duration || 0),
  'formatDistance(distance)': formatDistance(distance || 0),
  'formatPace(averagePace)': averagePace > 0 && isFinite(averagePace) ? formatPace(averagePace) : '--:--/km',
  'suggestedName': suggestedName || 'Workout',
  'notes.length': notes.length,
  'saving': saving,
});


  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="checkmark-circle" size={64} color={colors.success} />
          <Text style={styles.headerTitle}>Workout Complete!</Text>
          <Text style={styles.headerSubtitle}>{suggestedName || 'Workout'}</Text>
        </View>

        {/* Main Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statRow}>
            <View style={styles.statBox}>
              <Ionicons name="time" size={24} color={COLORS.primary} />
              <Text style={styles.statValue}>{formatDuration(finalData.duration || 0)}</Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statBox}>
              <Ionicons name="trending-up" size={24} color={COLORS.primary} />
              <Text style={styles.statValue}>{formatDistance(distance || 0)}</Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statBox}>
              <Ionicons name="speedometer" size={24} color={COLORS.primary} />
              <Text style={styles.statValue}>
                {averagePace > 0 && isFinite(averagePace) ? formatPace(averagePace) : '--:--/km'}
              </Text>
              <Text style={styles.statLabel}>Avg Pace</Text>
            </View>
          </View>
        </View>

        {/* Additional Stats */}
        <View style={styles.additionalStats}>
          <View style={styles.additionalStatItem}>
            <Text style={styles.additionalStatLabel}>Calories Burned</Text>
            <Text style={styles.additionalStatValue}>
              ~{isFinite(calories) ? Math.round(calories) : 0} kcal
            </Text>
          </View>

          {elevationGain > 0 && (
            <View style={styles.additionalStatItem}>
              <Text style={styles.additionalStatLabel}>Elevation Gain</Text>
              <Text style={styles.additionalStatValue}>
                +{isFinite(elevationGain) ? Math.round(elevationGain) : 0}m
              </Text>
            </View>
          )}

          {finalData.pausedDuration > 0 && (
            <View style={styles.additionalStatItem}>
              <Text style={styles.additionalStatLabel}>Paused Time</Text>
              <Text style={styles.additionalStatValue}>
                {formatDuration(finalData.pausedDuration || 0)}
              </Text>
            </View>
          )}

          {/* Show steps */}
          {(finalData.steps ?? 0) > 0 && (
          <View style={styles.additionalStatItem}>
          <Text style={styles.additionalStatLabel}>Steps</Text>
          <Text style={styles.additionalStatValue}>
          {finalData.steps!.toLocaleString()}
          </Text>
          </View>
          )}

          {/* Show cadence */}
          {(finalData.averageCadence ?? 0) > 0 && (
          <View style={styles.additionalStatItem}>
          <Text style={styles.additionalStatLabel}>Avg Cadence</Text>
          <Text style={styles.additionalStatValue}>
          {Math.round(finalData.averageCadence!)} spm
          </Text>
          </View>
          )}

          <View style={styles.additionalStatItem}>
            <Text style={styles.additionalStatLabel}>GPS Points</Text>
            <Text style={styles.additionalStatValue}>{gpsPointsWithDates.length || 0}</Text>
          </View>
        </View>

        {/* Splits */}
        {splits.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Split Times</Text>
            <View style={styles.splitsContainer}>
              {splits.map((split, index) => (
                <View key={index} style={styles.splitItem}>
                  <Text style={styles.splitKm}>Km {index + 1}</Text>
                  <Text style={styles.splitPace}>
                    {split.pace > 0 && isFinite(split.pace) ? formatPace(split.pace) : '--:--/km'}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* How did you feel? */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How did you feel?</Text>
          <View style={styles.feelingsRow}>
            {FEELINGS.map((feelingOption) => (
              <TouchableOpacity
                key={feelingOption.value}
                style={[
                  styles.feelingButton,
                  feeling === feelingOption.value && styles.feelingButtonSelected,
                  feeling === feelingOption.value && { borderColor: feelingOption.color },
                ]}
                onPress={() => setFeeling(feelingOption.value)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={feelingOption.icon as any}
                  size={32}
                  color={feeling === feelingOption.value ? feelingOption.color : COLORS.text.secondary}
                />
                <Text
                  style={[
                    styles.feelingLabel,
                    feeling === feelingOption.value && { color: feelingOption.color },
                  ]}
                >
                  {feelingOption.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="How was your workout? Any thoughts?"
            placeholderTextColor={colors.text.light}
            multiline
            numberOfLines={4}
            value={notes}
            onChangeText={setNotes}
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={styles.characterCount}>{notes.length}/500</Text>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.discardButton}
          onPress={handleDiscard}
          disabled={saving}
          activeOpacity={0.7}
        >
          <Text style={styles.discardButtonText}>Discard</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark" size={24} color="#fff" />
              <Text style={styles.saveButtonText}>Save Workout</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof getColors>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.lg,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontFamily: TYPOGRAPHY.fonts.bold,
    color: colors.text.primary,
    marginTop: SPACING.md,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontFamily: TYPOGRAPHY.fonts.regular,
    color: colors.text.secondary,
    marginTop: SPACING.xs,
  },
  statsCard: {
    backgroundColor: colors.surface,
    borderRadius: SPACING.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statRow: {
    flexDirection: 'row',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontFamily: TYPOGRAPHY.fonts.bold,
    color: colors.text.primary,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontFamily: TYPOGRAPHY.fonts.regular,
    color: colors.text.secondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: SPACING.sm,
  },
  additionalStats: {
    backgroundColor: colors.surface,
    borderRadius: SPACING.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  additionalStatItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  additionalStatLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontFamily: TYPOGRAPHY.fonts.regular,
    color: colors.text.secondary,
  },
  additionalStatValue: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontFamily: TYPOGRAPHY.fonts.semiBold,
    color: colors.text.primary,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontFamily: TYPOGRAPHY.fonts.semiBold,
    color: colors.text.primary,
    marginBottom: SPACING.md,
  },
  splitsContainer: {
    backgroundColor: colors.surface,
    borderRadius: SPACING.md,
    overflow: 'hidden',
  },
  splitItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  splitKm: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontFamily: TYPOGRAPHY.fonts.medium,
    color: colors.text.primary,
  },
  splitPace: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontFamily: TYPOGRAPHY.fonts.semiBold,
    color: colors.primary,
  },
  feelingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.xs,
  },
  feelingButton: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.sm,
    backgroundColor: colors.surface,
    borderRadius: SPACING.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  feelingButtonSelected: {
    backgroundColor: COLORS.surface,
  },
  feelingLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontFamily: TYPOGRAPHY.fonts.medium,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
  },
  notesInput: {
    backgroundColor: COLORS.surface,
    borderRadius: SPACING.md,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.md,
    fontFamily: TYPOGRAPHY.fonts.regular,
    color: COLORS.text.primary,
    minHeight: 100,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  characterCount: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontFamily: TYPOGRAPHY.fonts.regular,
    color: COLORS.text.light,
    marginTop: SPACING.xs,
    textAlign: 'right',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.md,
  },
  discardButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: SPACING.md,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discardButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontFamily: TYPOGRAPHY.fonts.semiBold,
    color: COLORS.text.secondary,
  },
  saveButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: SPACING.md,
    backgroundColor: COLORS.primary,
    gap: SPACING.sm,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  saveButtonText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontFamily: TYPOGRAPHY.fonts.bold,
    color: '#fff',
  },
});