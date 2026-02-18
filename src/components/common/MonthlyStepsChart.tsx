import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MonthlyStepsData } from '../../types/index';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../constants/theme';

interface MonthlyStepsChartProps {
  data: MonthlyStepsData;
  dailyGoal: number;
}

export const MonthlyStepsChart: React.FC<MonthlyStepsChartProps> = ({ data, dailyGoal }) => {
  // Flatten all days from all weeks into a lookup map
  const allDays = data.weeks.flatMap(w => w.days);
  const dayLookup: Record<string, number> = {};
  allDays.forEach(d => { dayLookup[d.date] = d.steps; });

  // Parse month (format: YYYY-MM) and build full month array (fill missing days with 0)
  const [yearStr, monthStr] = data.month.split('-');
  const year = Number(yearStr) || new Date().getFullYear();
  const month = Number(monthStr) || (new Date().getMonth() + 1);
  const daysInMonth = new Date(year, month, 0).getDate();

  const monthDays = Array.from({ length: daysInMonth }, (_, i) => {
    const dayNum = i + 1;
    const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    return { date: dateKey, steps: dayLookup[dateKey] ?? 0 };
  });

  // Scale against the largest daily value or goal
  const maxSteps = Math.max(dailyGoal * 1.2, Math.max(...monthDays.map(d => d.steps), 1));

  // Summary stats (use full month length so blanks count as 0)
  const total = monthDays.reduce((s, d) => s + d.steps, 0);
  const avgPerDay = Math.round(total / daysInMonth);
  const daysWithGoal = monthDays.filter(d => d.steps >= dailyGoal).length;
  const bestDay = monthDays.length > 0 ? Math.max(...monthDays.map(d => d.steps)) : 0;

  const getDayLabel = (date: string) => String(new Date(date).getDate());

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Monthly Steps</Text>
      <Text style={styles.total}>Total: {total.toLocaleString()} steps</Text>

      <View style={styles.chartContainer}>
        {/* Y-axis */}
        <View style={styles.yAxis}>
          <Text style={styles.yAxisLabel}>{Math.round(maxSteps).toLocaleString()}</Text>
          <Text style={styles.yAxisLabel}>{Math.round(maxSteps / 2).toLocaleString()}</Text>
          <Text style={styles.yAxisLabel}>0</Text>
        </View>

        {/* Daily bars — horizontally scrollable to accommodate ~28–31 bars */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.barsScroll}
        >
          {monthDays.map((day) => {
            const reachedGoal = day.steps >= dailyGoal;
            return (
              <View key={day.date} style={styles.barWrapper}>
                <View style={styles.barColumn}>
                  <View
                    style={[
                      styles.goalLine,
                      { bottom: `${(dailyGoal / maxSteps) * 100}%` },
                    ]}
                  />

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

                <Text style={styles.barLabel}>{getDayLabel(day.date)}</Text>
                <Text style={styles.barValue}>{day.steps.toLocaleString()}</Text>
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* Stats Summary */}
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Average per Day</Text>
          <Text style={styles.statValue}>{avgPerDay.toLocaleString()}</Text>
          <Text style={styles.statUnit}>steps</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Days with Goal</Text>
          <Text style={styles.statValue}>
            {daysWithGoal}
            <Text style={styles.statUnit}>/{daysInMonth}</Text>
          </Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Best Day</Text>
          <Text style={styles.statValue}>{bestDay.toLocaleString()}</Text>
          <Text style={styles.statUnit}>steps</Text>
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
    height: 260,
    marginBottom: SPACING.lg,
  },
  yAxis: {
    width: 60,
    justifyContent: 'space-between',
    paddingRight: SPACING.sm,
    paddingTop: SPACING.sm,
  },
  yAxisLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.text.secondary,
    textAlign: 'right' as const,
  },
  barsScroll: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  barWrapper: {
    alignItems: 'center',
    width: 28,
    marginHorizontal: SPACING.xs,
  },
  barColumn: {
    width: '100%',
    maxWidth: 28,
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
    marginTop: SPACING.xs,
    fontWeight: '600' as const,
  },
  barValue: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: SPACING.sm,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
  },
  statValue: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '700' as const,
    color: COLORS.primary,
  },
  statUnit: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.text.secondary,
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
