import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { useSteps } from '../../contexts/steps/StepsContext';
import { useAuth } from '../../contexts/AuthContext';
import { StepsService } from '../../services/steps/stepsService';
import { WeeklyStepsChart } from '../../components/common/WeeklyStepsChart';
import { MonthlyStepsChart } from '../../components/common/MonthlyStepsChart';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../constants/theme';
import { WeeklyStepsData, MonthlyStepsData } from '../../types/index';

type ViewType = 'daily' | 'weekly' | 'monthly';

const StepsScreen: React.FC = () => {
  const { steps, today, loading, dailyGoal, setDailyGoal, goalReached } = useSteps();
  const { user } = useAuth();
  const [viewType, setViewType] = useState<ViewType>('daily');
  const [weeklyData, setWeeklyData] = useState<WeeklyStepsData | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyStepsData | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalInput, setGoalInput] = useState(String(dailyGoal));

  // Load weekly/monthly data when view changes
  useEffect(() => {
    if (viewType === 'daily' || !user?.id) return;

    const loadData = async () => {
      setLoadingData(true);
      try {
        if (viewType === 'weekly') {
          const data = await StepsService.getWeeklySteps(user.id);
          setWeeklyData(data);
        } else if (viewType === 'monthly') {
          const data = await StepsService.getMonthlySteps(user.id);
          setMonthlyData(data);
        }
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [viewType, user?.id]);

  const handleSetGoal = async () => {
    const goalNum = parseInt(goalInput, 10);
    if (isNaN(goalNum) || goalNum <= 0) {
      Alert.alert('Invalid Goal', 'Please enter a positive number');
      return;
    }
    try {
      await setDailyGoal(goalNum);
      Alert.alert('Success', `Daily goal set to ${goalNum} steps`);
      setShowGoalModal(false);
    } catch (err) {
      Alert.alert('Error', 'Failed to set goal');
      console.error(err);
    }
  };

  const progressPercent = (steps / dailyGoal) * 100;
  const displayPercent = Math.min(progressPercent, 100);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* View Type Selector */}
      <View style={styles.viewSelector}>
        {(['daily', 'weekly', 'monthly'] as ViewType[]).map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.viewButton, viewType === type && styles.viewButtonActive]}
            onPress={() => setViewType(type)}
          >
            <Text
              style={[
                styles.viewButtonText,
                viewType === type && styles.viewButtonTextActive,
              ]}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {viewType === 'daily' && (
        <>
          {/* Daily View */}
          <View style={styles.card}>
            <Text style={styles.date}>{today}</Text>
            <Text style={styles.label}>Daily Steps</Text>
            <Text style={styles.steps}>{steps}</Text>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${displayPercent}%`,
                      backgroundColor: goalReached ? COLORS.success : COLORS.primary,
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {displayPercent.toFixed(0)}% of {dailyGoal} steps
              </Text>
            </View>

            {/* Goal Reached Badge */}
            {goalReached && (
              <View style={styles.goalReachedBadge}>
                <Text style={styles.goalReachedText}>🎉 Goal Reached!</Text>
              </View>
            )}

            {/* Set Goal Button */}
            <TouchableOpacity
              style={styles.setGoalButton}
              onPress={() => {
                setGoalInput(String(dailyGoal));
                setShowGoalModal(true);
              }}
            >
              <Text style={styles.setGoalButtonText}>Set Daily Goal</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {viewType === 'weekly' && (
        <>
          {/* Weekly Chart */}
          {loadingData ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
          ) : weeklyData ? (
            <WeeklyStepsChart data={weeklyData} dailyGoal={dailyGoal} />
          ) : (
            <View style={styles.card}>
              <Text style={styles.emptyText}>No weekly data available</Text>
            </View>
          )}
        </>
      )}

      {viewType === 'monthly' && (
        <>
          {/* Monthly Chart */}
          {loadingData ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
          ) : monthlyData ? (
            <MonthlyStepsChart data={monthlyData} dailyGoal={dailyGoal} />
          ) : (
            <View style={styles.card}>
              <Text style={styles.emptyText}>No monthly data available</Text>
            </View>
          )}
        </>
      )}

      {/* Goal Setting Modal */}
      {showGoalModal && (
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Daily Goal</Text>
            <TextInput
              style={styles.goalInput}
              placeholder="Enter steps"
              keyboardType="number-pad"
              value={goalInput}
              onChangeText={setGoalInput}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowGoalModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleSetGoal}
              >
                <Text style={styles.confirmButtonText}>Set Goal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default StepsScreen;

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    padding: SPACING.md,
    backgroundColor: COLORS.background,
  },
  viewSelector: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  viewButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  viewButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  viewButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '500',
    color: COLORS.text.secondary,
  },
  viewButtonTextActive: {
    color: COLORS.surface,
    fontWeight: '600',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  date: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  steps: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.lg,
  },
  progressContainer: {
    marginBottom: SPACING.lg,
  },
  progressBar: {
    height: 12,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
  },
  progressText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.text.secondary,
  },
  goalReachedBadge: {
    backgroundColor: `${COLORS.success}20`,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  goalReachedText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '600',
    color: COLORS.success,
  },
  setGoalButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
  },
  setGoalButtonText: {
    color: COLORS.surface,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
  },
  periodTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  periodTotal: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.lg,
  },
  daysList: {
    gap: SPACING.md,
  },
  dayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  dayDate: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.text.secondary,
    width: 90,
  },
  dayBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  dayBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  daySteps: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '500',
    color: COLORS.text.primary,
    width: 50,
    textAlign: 'right',
  },
  weekSection: {
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  weekTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  weekTotal: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '500',
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },
  monthDayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  monthDayDate: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.text.secondary,
    width: 70,
  },
  monthDayBar: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  monthDaySteps: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '500',
    color: COLORS.text.primary,
    width: 45,
    textAlign: 'right',
  },
  loader: {
    marginVertical: SPACING.xl,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.text.secondary,
    textAlign: 'center',
    paddingVertical: SPACING.xl,
  },
  modal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  goalInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.md,
    marginBottom: SPACING.lg,
    color: COLORS.text.primary,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.border,
  },
  cancelButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
  },
  confirmButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
    color: COLORS.surface,
  },
});
