import React, { useMemo } from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import { VictoryBar, VictoryChart, VictoryAxis, VictoryTheme } from 'victory-native';
import { SplitTime } from '../../types/workout';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/theme';

interface SplitsChartProps {
  splits: SplitTime[];
  height?: number;
}

export const SplitsChart: React.FC<SplitsChartProps> = ({ splits, height = 250 }) => {
  // Prepare data
  const chartData = useMemo(() => {
    return splits.map((split, index) => ({
      km: `${index + 1}`,
      pace: split.pace / 60,
      fill: split.pace / 60,
    }));
  }, [splits]);

  // Calculate avg
  const averagePace = useMemo(() => {
    if (splits.length === 0) return 0;
    const total = splits.reduce((sum, split) => sum + split.pace, 0);
    return (total / splits.length) / 60;
  }, [splits]);

  // Calculate domain
  type DomainY = { y: [number, number] };
    const domain = useMemo<DomainY>(() => {
    if (chartData.length === 0) return { y: [0, 10] };
    
    const paces = chartData.map(d => d.pace);
    return {
        y: [
        Math.max(Math.floor(Math.min(...paces)) - 1, 0),
        Math.ceil(Math.max(...paces)) + 1,
    ],
    };
    }, [chartData]);


  // Color scale
  const getBarColor = (pace: number) => {
    if (!averagePace) return COLORS.primary;
    const ratio = pace / averagePace;
    if (ratio < 0.95) return COLORS.success;
    if (ratio > 1.05) return COLORS.warning;
    return COLORS.primary;
  };

  if (splits.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.noDataText}>No split data available</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      <Text style={styles.title}>Split Times</Text>
      
      <VictoryChart
        width={Dimensions.get('window').width - SPACING.md * 2}
        height={height - 40}
        theme={VictoryTheme.material}
        domainPadding={{ x: 20 }}
        domain={domain}
        padding={{ top: 20, bottom: 40, left: 50, right: 20 }}
      >
        {/* X Axis - Kilometer */}
        <VictoryAxis
          label="Kilometer"
          style={{
            axisLabel: { fontSize: 12, padding: 30, fill: COLORS.text.secondary },
            tickLabels: { fontSize: 10, fill: COLORS.text.secondary },
          }}
        />

        {/* Y Axis - Pace */}
        <VictoryAxis
          dependentAxis
          label="Pace (min/km)"
          invertAxis
          style={{
            axisLabel: { fontSize: 12, padding: 40, fill: COLORS.text.secondary },
            tickLabels: { fontSize: 10, fill: COLORS.text.secondary },
            grid: { stroke: COLORS.border, strokeWidth: 0.5 },
          }}
        />

        {/* Bars */}
        <VictoryBar
          data={chartData}
          x="km"
          y="pace"
          style={{
            data: {
              fill: ({ datum }) => getBarColor(datum.pace),
              width: 20,
            },
          }}
          cornerRadius={{ top: 4 }}
        />
      </VictoryChart>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: COLORS.success }]} />
          <Text style={styles.legendText}>Faster than avg</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: COLORS.primary }]} />
          <Text style={styles.legendText}>Around avg</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: COLORS.warning }]} />
          <Text style={styles.legendText}>Slower than avg</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Fastest</Text>
          <Text style={styles.statValue}>
            {formatPace(Math.min(...chartData.map(d => d.pace)))}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Average</Text>
          <Text style={styles.statValue}>{formatPace(averagePace)}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Slowest</Text>
          <Text style={styles.statValue}>
            {formatPace(Math.max(...chartData.map(d => d.pace)))}
          </Text>
        </View>
      </View>
    </View>
  );
};

// Helper function for formatting
function formatPace(paceMinutes: number): string {
  const minutes = Math.floor(paceMinutes);
  const seconds = Math.round((paceMinutes - minutes) * 60);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontFamily: TYPOGRAPHY.fonts.semiBold,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  noDataText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontFamily: TYPOGRAPHY.fonts.regular,
    color: COLORS.text.secondary,
    textAlign: 'center',
    paddingVertical: SPACING.xxl,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.md,
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontFamily: TYPOGRAPHY.fonts.regular,
    color: COLORS.text.secondary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontFamily: TYPOGRAPHY.fonts.regular,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontFamily: TYPOGRAPHY.fonts.semiBold,
    color: COLORS.text.primary,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
  },
});
