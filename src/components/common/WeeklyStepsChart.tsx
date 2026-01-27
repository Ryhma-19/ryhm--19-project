import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WeeklyStepsData } from '../../types/index';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../constants/theme';

interface WeeklyStepsChartProps {
  data: WeeklyStepsData;
  dailyGoal: number;
}

export const WeeklyStepsChart: React.FC<WeeklyStepsChartProps> = ({ data, dailyGoal }) => {
  // Sort days by date
  const sortedDays = [...data.days].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Get max value for scaling
  const maxSteps = Math.max(dailyGoal * 1.2, Math.max(...sortedDays.map(d => d.steps), 1));
  
  // Day labels (Mon, Tue, Wed, etc.)
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const getDayLabel = (date: string) => {
    const d = new Date(date);
    return dayLabels[d.getDay()];
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weekly Steps</Text>
      <Text style={styles.total}>Total: {data.total.toLocaleString()} steps</Text>

      <View style={styles.chartContainer}>
        {/* Y-axis labels */}
        <View style={styles.yAxis}>
          <Text style={styles.yAxisLabel}>{Math.round(maxSteps).toLocaleString()}</Text>
          <Text style={styles.yAxisLabel}>{Math.round(maxSteps / 2).toLocaleString()}</Text>
          <Text style={styles.yAxisLabel}>0</Text>
        </View>

        {/* Bars */}
        <View style={styles.barsContainer}>
          {sortedDays.map((day) => {
            const height = (day.steps / maxSteps) * 200; // 200 is max bar height
            const reachedGoal = day.steps >= dailyGoal;
            
            return (
              <View key={day.date} style={styles.barWrapper}>
                <View style={styles.barColumn}>
                  {/* Goal line indicator */}
                  <View
                    style={[
                      styles.goalLine,
                      { bottom: `${(dailyGoal / maxSteps) * 100}%` },
                    ]}
                  />
                  
                  {/* Bar */}
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${(day.steps / maxSteps) * 100}%`,
                        backgroundColor: reachedGoal ? COLORS.success : COLORS.primary,
                      },
                    ]}
                  />
                </View>
                
                {/* Label */}
                <Text style={styles.barLabel}>{getDayLabel(day.date)}</Text>
                <Text style={styles.barValue}>{day.steps}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.primary }]} />
          <Text style={styles.legendText}>Below Goal</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.success }]} />
          <Text style={styles.legendText}>Goal Reached</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.warning, width: 2, height: 8 }]} />
          <Text style={styles.legendText}>Daily Goal</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
  title: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '600' as const,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  total: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.text.secondary,
    marginBottom: SPACING.lg,
  },
  chartContainer: {
    flexDirection: 'row',
    height: 240,
    marginBottom: SPACING.lg,
  },
  yAxis: {
    width: 50,
    justifyContent: 'space-between',
    paddingRight: SPACING.sm,
    paddingTop: SPACING.sm,
  },
  yAxisLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.text.secondary,
    textAlign: 'right' as const,
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.sm,
  },
  barWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  barColumn: {
    width: '70%',
    maxWidth: 40,
    height: 200,
    justifyContent: 'flex-end',
    position: 'relative',
  },
  bar: {
    width: '100%',
    borderRadius: BORDER_RADIUS.sm,
  },
  goalLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: COLORS.warning,
    zIndex: 1,
  },
  barLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.text.primary,
    marginTop: SPACING.sm,
    fontWeight: '600' as const,
  },
  barValue: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.sm,
  },
  legendText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.text.secondary,
  },
});
