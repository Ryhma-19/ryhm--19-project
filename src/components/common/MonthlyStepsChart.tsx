import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MonthlyStepsData } from '../../types/index';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../constants/theme';

interface MonthlyStepsChartProps {
  data: MonthlyStepsData;
  dailyGoal: number;
}

export const MonthlyStepsChart: React.FC<MonthlyStepsChartProps> = ({ data, dailyGoal }) => {
  // Sort weeks by their week number
  const sortedWeeks = [...data.weeks].sort(
    (a, b) => a.week.localeCompare(b.week)
  );

  // Get max value for scaling
  const maxSteps = Math.max(dailyGoal * 1.2 * 7, Math.max(...sortedWeeks.map(w => w.total), 1));

  const getWeekLabel = (week: string) => {
    // Extract week number from YYYY-W## format
    const match = week.match(/W(\d+)/);
    return match ? `W${match[1]}` : week;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Monthly Steps</Text>
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
          {sortedWeeks.map((week) => {
            const weekGoal = dailyGoal * 7; // Goal for entire week
            const reachedGoal = week.total >= weekGoal;
            
            return (
              <View key={week.week} style={styles.barWrapper}>
                <View style={styles.barColumn}>
                  {/* Goal line indicator */}
                  <View
                    style={[
                      styles.goalLine,
                      { bottom: `${(weekGoal / maxSteps) * 100}%` },
                    ]}
                  />
                  
                  {/* Bar */}
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${(week.total / maxSteps) * 100}%`,
                        backgroundColor: reachedGoal ? COLORS.success : COLORS.primary,
                      },
                    ]}
                  />
                </View>
                
                {/* Label */}
                <Text style={styles.barLabel}>{getWeekLabel(week.week)}</Text>
                <Text style={styles.barValue}>{week.total.toLocaleString()}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Stats Summary */}
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Average per Week</Text>
          <Text style={styles.statValue}>
            {data.weeks.length > 0
              ? Math.round(data.total / data.weeks.length).toLocaleString()
              : 0}
          </Text>
          <Text style={styles.statUnit}>steps</Text>
        </View>
        
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Weeks with Goal</Text>
          <Text style={styles.statValue}>
            {data.weeks.filter(w => w.total >= dailyGoal * 7).length}
            <Text style={styles.statUnit}>/{data.weeks.length}</Text>
          </Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Best Week</Text>
          <Text style={styles.statValue}>
            {data.weeks.length > 0
              ? Math.max(...data.weeks.map(w => w.total)).toLocaleString()
              : 0}
          </Text>
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
          <Text style={styles.legendText}>Weekly Goal</Text>
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
    maxWidth: 45,
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
