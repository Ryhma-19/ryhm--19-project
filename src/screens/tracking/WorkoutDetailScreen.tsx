import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TrackingStackParamList } from '../../types/navigation';
import { WorkoutSession, FeelingType } from '../../types/workout';
import { WorkoutService } from '../../services/firebase/workout.service';
import { WorkoutMap } from '../../components/workout/WorkoutMap';
import { PaceGraph } from '../../components/workout/PaceGraph';
import { SplitsChart } from '../../components/workout/SplitsChart';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/theme';

type Props = NativeStackScreenProps<TrackingStackParamList, 'WorkoutDetail'>;

export default function WorkoutDetailScreen({ route, navigation }: Props) {
  const { workoutId } = route.params;
  const [workout, setWorkout] = useState<WorkoutSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editNotes, setEditNotes] = useState('');
  const [editFeeling, setEditFeeling] = useState<FeelingType | undefined>();

  useEffect(() => {
    loadWorkout();
  }, [workoutId]);

  const loadWorkout = async () => {
    try {
      setLoading(true);
      const data = await WorkoutService.getWorkoutById(workoutId);
      if (data) {
        setWorkout(data);
        setEditNotes(data.notes || '');
        setEditFeeling(data.feeling);
      } else {
        Alert.alert('Error', 'Workout not found');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading workout:', error);
      Alert.alert('Error', 'Failed to load workout details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Workout',
      'Are you sure you want to delete this workout? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await WorkoutService.deleteWorkout(workoutId);
              Alert.alert('Success', 'Workout deleted', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete workout');
            }
          },
        },
      ]
    );
  };

  const handleSaveEdit = async () => {
    try {
      await WorkoutService.updateWorkout(workoutId, {
        notes: editNotes.trim() || undefined,
        feeling: editFeeling,
      });
      
      // Refresh workout data
      await loadWorkout();
      setEditModalVisible(false);
      Alert.alert('Success', 'Workout updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to update workout');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!workout) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Workout not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.workoutType}>
              {workout.type === 'running' ? '🏃 Running' : '🚶 Walking'}
            </Text>
            <Text style={styles.date}>{formatDate(workout.startTime)}</Text>
            <Text style={styles.time}>{formatTime(workout.startTime)}</Text>
          </View>
          {workout.routeName && (
            <View style={styles.routeBadge}>
              <Ionicons name="map" size={14} color={COLORS.primary} />
              <Text style={styles.routeName}>{workout.routeName}</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setEditModalVisible(true)}
          >
            <Ionicons name="create-outline" size={20} color={COLORS.primary} />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={20} color={COLORS.error} />
            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Distance</Text>
          <Text style={styles.statValue}>{formatDistance(workout.distance)}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Duration</Text>
          <Text style={styles.statValue}>{formatDuration(workout.duration)}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Avg Pace</Text>
          <Text style={styles.statValue}>{formatPace(workout.averagePace)}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Max Speed</Text>
          <Text style={styles.statValue}>{(workout.maxSpeed * 3.6).toFixed(1)} km/h</Text>
        </View>
      </View>

      {/* GPS Track Map */}
      {workout.coordinates.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Route Map</Text>
          <WorkoutMap coordinates={workout.coordinates} height={300} />
        </View>
      )}

      {/* Pace Graph */}
      {workout.coordinates.length > 10 && (
        <View style={styles.section}>
          <PaceGraph coordinates={workout.coordinates} />
        </View>
      )}

      {/* Splits Chart */}
      {workout.splits.length > 0 && (
        <View style={styles.section}>
          <SplitsChart splits={workout.splits} />
        </View>
      )}

      {/* Additional Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Additional Metrics</Text>
        
        {workout.calories && (
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>🔥 Calories Burned</Text>
            <Text style={styles.metricValue}>{Math.round(workout.calories)} cal</Text>
          </View>
        )}

        {workout.elevationGain !== undefined && workout.elevationGain > 0 && (
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>⛰️ Elevation Gain</Text>
            <Text style={styles.metricValue}>{Math.round(workout.elevationGain)} m</Text>
          </View>
        )}

        {workout.steps && workout.steps > 0 && (
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>👟 Steps</Text>
            <Text style={styles.metricValue}>{workout.steps.toLocaleString()}</Text>
          </View>
        )}

        {workout.averageCadence && workout.averageCadence > 0 && (
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>📊 Average Cadence</Text>
            <Text style={styles.metricValue}>{workout.averageCadence} spm</Text>
          </View>
        )}

        {workout.maxCadence && workout.maxCadence > 0 && (
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>⚡ Max Cadence</Text>
            <Text style={styles.metricValue}>{workout.maxCadence} spm</Text>
          </View>
        )}

        {workout.pausedDuration > 0 && (
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>⏸️ Paused Duration</Text>
            <Text style={styles.metricValue}>{formatDuration(workout.pausedDuration)}</Text>
          </View>
        )}

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>📍 GPS Points</Text>
          <Text style={styles.metricValue}>{workout.coordinates.length}</Text>
        </View>

        {workout.speedData && (
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>🎯 Pace Consistency</Text>
            <Text style={styles.metricValue}>
              {(workout.speedData.consistency * 100).toFixed(0)}%
            </Text>
          </View>
        )}
      </View>

      {/* Workout Feedback */}
      {(workout.feeling || workout.notes) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Workout Feedback</Text>
          
          {workout.feeling && (
            <View style={styles.feedbackRow}>
              <Text style={styles.feedbackLabel}>How did it feel?</Text>
              <Text style={styles.feelingBadge}>{getFeelingEmoji(workout.feeling)}</Text>
            </View>
          )}

          {workout.notes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Notes:</Text>
              <Text style={styles.notesText}>{workout.notes}</Text>
            </View>
          )}
        </View>
      )}

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Workout</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text.primary} />
              </TouchableOpacity>
            </View>

            {/* Feeling Selector */}
            <Text style={styles.inputLabel}>How did it feel?</Text>
            <View style={styles.feelingSelector}>
              {(['great', 'good', 'okay', 'tired', 'exhausted'] as FeelingType[]).map((feeling) => (
                <TouchableOpacity
                  key={feeling}
                  style={[
                    styles.feelingOption,
                    editFeeling === feeling && styles.feelingOptionSelected,
                  ]}
                  onPress={() => setEditFeeling(feeling)}
                >
                  <Text style={styles.feelingEmoji}>{getFeelingEmoji(feeling)}</Text>
                  <Text style={styles.feelingText}>{feeling}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Notes Input */}
            <Text style={styles.inputLabel}>Notes (optional)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Add notes about your workout..."
              placeholderTextColor={COLORS.text.secondary}
              value={editNotes}
              onChangeText={setEditNotes}
              multiline
              numberOfLines={4}
            />

            {/* Save Button */}
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveEdit}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// Helper Functions
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDistance(meters: number): string {
  const km = meters / 1000;
  return `${km.toFixed(2)} km`;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}

function formatPace(secondsPerKm: number): string {
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.floor(secondsPerKm % 60);
  return `${minutes}:${String(seconds).padStart(2, '0')}/km`;
}

function getFeelingEmoji(feeling: FeelingType): string {
  const emojis = {
    great: '🤩',
    good: '😊',
    okay: '😐',
    tired: '😓',
    exhausted: '😫',
  };
  return emojis[feeling];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingBottom: SPACING.xxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  errorText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontFamily: TYPOGRAPHY.fonts.regular,
    color: COLORS.text.secondary,
  },
  header: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  workoutType: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontFamily: TYPOGRAPHY.fonts.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  date: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontFamily: TYPOGRAPHY.fonts.medium,
    color: COLORS.text.primary,
  },
  time: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontFamily: TYPOGRAPHY.fonts.regular,
    color: COLORS.text.secondary,
  },
  routeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
  },
  routeName: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontFamily: TYPOGRAPHY.fonts.medium,
    color: COLORS.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionButtonText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontFamily: TYPOGRAPHY.fonts.medium,
    color: COLORS.primary,
  },
  deleteButton: {
    borderColor: COLORS.error,
  },
  deleteButtonText: {
    color: COLORS.error,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: SPACING.sm,
    gap: SPACING.sm,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontFamily: TYPOGRAPHY.fonts.regular,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontFamily: TYPOGRAPHY.fonts.bold,
    color: COLORS.text.primary,
  },
  section: {
    padding: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontFamily: TYPOGRAPHY.fonts.semiBold,
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
  feedbackRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  feedbackLabel: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontFamily: TYPOGRAPHY.fonts.medium,
    color: COLORS.text.primary,
  },
  feelingBadge: {
    fontSize: 32,
  },
  notesContainer: {
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontFamily: TYPOGRAPHY.fonts.medium,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
  },
  notesText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontFamily: TYPOGRAPHY.fonts.regular,
    color: COLORS.text.primary,
    lineHeight: 22,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: SPACING.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontFamily: TYPOGRAPHY.fonts.bold,
    color: COLORS.text.primary,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontFamily: TYPOGRAPHY.fonts.medium,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  feelingSelector: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  feelingOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  feelingOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}10`,
  },
  feelingEmoji: {
    fontSize: 24,
    marginBottom: SPACING.xs,
  },
  feelingText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontFamily: TYPOGRAPHY.fonts.medium,
    color: COLORS.text.primary,
    textTransform: 'capitalize',
  },
  notesInput: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.md,
    fontFamily: TYPOGRAPHY.fonts.regular,
    color: COLORS.text.primary,
    textAlignVertical: 'top',
    minHeight: 100,
    marginBottom: SPACING.lg,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontFamily: TYPOGRAPHY.fonts.semiBold,
    color: '#FFFFFF',
  },
});
