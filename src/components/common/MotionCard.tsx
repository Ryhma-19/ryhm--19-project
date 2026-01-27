// src/components/common/MotionCard.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useMotion } from '../../contexts/motion/MotionContext';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../constants/theme';

export const MotionCard: React.FC = () => {
  const { currentSpeed, speedData, loading } = useMotion();

  if (loading || !speedData) {
    return (
      <View style={styles.card}>
        <Text style={styles.loading}>Loading motion data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>🏃 Motion & Speed</Text>
      
      <View style={styles.content}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Current Speed</Text>
          <Text style={styles.statValue}>{currentSpeed.toFixed(2)}</Text>
          <Text style={styles.statUnit}>m/s</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Max Speed</Text>
          <Text style={styles.statValue}>{speedData.maxSpeed.toFixed(2)}</Text>
          <Text style={styles.statUnit}>m/s</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Avg Speed</Text>
          <Text style={styles.statValue}>{speedData.avgSpeed.toFixed(2)}</Text>
          <Text style={styles.statUnit}>m/s</Text>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Distance:</Text>
          <Text style={styles.detailValue}>{(speedData.totalDistance / 1000).toFixed(2)} km</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Duration:</Text>
          <Text style={styles.detailValue}>{Math.floor(speedData.duration / 60)} min</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginVertical: SPACING.sm,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  loading: {
    color: COLORS.text.primary,
    textAlign: 'center' as const,
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.md,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.text.secondary,
    marginBottom: SPACING.sm,
  },
  statValue: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statUnit: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
  },
  details: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: SPACING.xs,
  },
  detailLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.text.secondary,
  },
  detailValue: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
});
