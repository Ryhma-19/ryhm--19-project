import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { VictoryLine, VictoryChart, VictoryAxis, VictoryTheme, VictoryScatter, VictoryArea } from 'victory-native';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/theme';

interface DataPoint {
  date: Date;
  value: number;
}

interface TrendChartProps {
  data: DataPoint[];
  title: string;
  yAxisLabel: string;
  formatValue: (value: number) => string;
  height?: number;
  showArea?: boolean;
}

export const TrendChart: React.FC<TrendChartProps> = ({
  data,
  title,
  yAxisLabel,
  formatValue,
  height = 250,
  showArea = false,
}) => {
  // Transform data
  const chartData = useMemo(() => {
    return data.map((point, index) => ({
      x: index,
      y: point.value,
      label: formatValue(point.value),
    }));
  }, [data, formatValue]);

  // Calculate domain
  type Domain = { x: [number, number]; y: [number, number] };
    const domain = useMemo<Domain>(() => {
    if (chartData.length === 0) {
    return { x: [0, 1], y: [0, 10] };
    }
    const values = chartData.map(d => d.y);
    const minY = Math.min(...values);
    const maxY = Math.max(...values);
    const padding = (maxY - minY) * 0.1 || 1;
    
    return {
    x: [0, chartData.length - 1],
    y: [Math.max(0, minY - padding), maxY + padding],
    };
    }, [chartData]);


  // Calculate tick values for x-axis
  const xTickValues = useMemo(() => {
    if (data.length <= 7) {
      return data.map((_, i) => i);
    }
    const step = Math.floor(data.length / 5);
    return Array.from({ length: 5 }, (_, i) => i * step);
  }, [data]);

  // Format x-axis tick labels
  const formatXTick = (index: number) => {
    if (index < 0 || index >= data.length) return '';
    const date = data[index].date;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (chartData.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.noDataText}>Not enough data to show trends</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      <Text style={styles.title}>{title}</Text>
      
      <VictoryChart
        width={Dimensions.get('window').width - SPACING.md * 2}
        height={height - 40}
        theme={VictoryTheme.material}
        domain={domain}
        padding={{ top: 20, bottom: 40, left: 60, right: 20 }}
      >
        {/* X Axis - Dates */}
        <VictoryAxis
          tickValues={xTickValues}
          tickFormat={formatXTick}
          style={{
            tickLabels: { fontSize: 9, fill: COLORS.text.secondary, angle: -45, textAnchor: 'end' },
            grid: { stroke: COLORS.border, strokeWidth: 0.5, strokeDasharray: '2,2' },
          }}
        />

        {/* Y Axis - Values */}
        <VictoryAxis
          dependentAxis
          label={yAxisLabel}
          style={{
            axisLabel: { fontSize: 12, padding: 45, fill: COLORS.text.secondary },
            tickLabels: { fontSize: 10, fill: COLORS.text.secondary },
            grid: { stroke: COLORS.border, strokeWidth: 0.5 },
          }}
          tickFormat={(value) => formatValue(value)}
        />

        {/* Area Fill */}
        {showArea && (
          <VictoryArea
            data={chartData}
            x="x"
            y="y"
            style={{
              data: {
                fill: `${COLORS.primary}30`,
                stroke: 'none',
              },
            }}
            interpolation="monotoneX"
          />
        )}

        {/* Trend Line */}
        <VictoryLine
          data={chartData}
          x="x"
          y="y"
          style={{
            data: {
              stroke: COLORS.primary,
              strokeWidth: 3,
            },
          }}
          interpolation="monotoneX"
        />

        {/* Data Points */}
        <VictoryScatter
          data={chartData}
          x="x"
          y="y"
          size={4}
          style={{
            data: { fill: COLORS.primary },
          }}
        />
      </VictoryChart>

      {/* Summary Stats */}
      {chartData.length > 0 && (
        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Average</Text>
            <Text style={styles.summaryValue}>
              {formatValue(chartData.reduce((sum, d) => sum + d.y, 0) / chartData.length)}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Best</Text>
            <Text style={styles.summaryValue}>
              {formatValue(Math.max(...chartData.map(d => d.y)))}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Data Points</Text>
            <Text style={styles.summaryValue}>{chartData.length}</Text>
          </View>
        </View>
      )}
    </View>
  );
};

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
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontFamily: TYPOGRAPHY.fonts.regular,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontFamily: TYPOGRAPHY.fonts.semiBold,
    color: COLORS.text.primary,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: COLORS.border,
  },
});
