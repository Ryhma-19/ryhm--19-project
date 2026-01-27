import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSteps } from '../../contexts/steps/StepsContext';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../constants/theme';

interface DailyStepsCardProps {
  onPress: () => void;
}

export const DailyStepsCard: React.FC<DailyStepsCardProps> = ({ onPress }) => {
  const { steps, dailyGoal, goalReached } = useSteps();

  const progressPercent = Math.min((steps / dailyGoal) * 100, 100);
  const remaining = Math.max(dailyGoal - steps, 0);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Daily Steps</Text>
          <Text style={styles.subtitle}>
            {goalReached ? '🎉 Goal reached!' : `${remaining} to go`}
          </Text>
        </View>
        <View style={styles.stepsBadge}>
          <Text style={styles.stepsValue}>{steps.toLocaleString()}</Text>
          <Text style={styles.stepsLabel}>steps</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progressPercent}%`,
                backgroundColor: goalReached ? COLORS.success : COLORS.primary,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {Math.round(progressPercent)}% of {dailyGoal.toLocaleString()}
        </Text>
      </View>

      {/* View Details Hint */}
      <View style={styles.footer}>
        <Text style={styles.hintText}>Tap for weekly & monthly stats</Text>
        <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '600' as const,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.text.secondary,
  },
  stepsBadge: {
    alignItems: 'center',
    backgroundColor: COLORS.primary + '15',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  stepsValue: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: '700' as const,
    color: COLORS.primary,
  },
  stepsLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.text.secondary,
  },
  progressContainer: {
    marginBottom: SPACING.lg,
  },
  progressBackground: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.sm,
  },
  progressText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.text.secondary,
    textAlign: 'right' as const,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  hintText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.primary,
  },
});
