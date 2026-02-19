import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { SPACING, TYPOGRAPHY, getColors } from '../../constants/theme';

export default function TrackingScreen({ navigation }: any) {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const styles = createStyles(colors);
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="fitness" size={80} color={colors.primary} />
        <Text style={styles.title}>Ready to Work Out?</Text>
        <Text style={styles.subtitle}>
          Track your runs and walks with GPS
        </Text>

        {/* History button */}
        <TouchableOpacity 
          style={styles.historyButton}
          onPress={() => navigation.navigate('WorkoutList')}
          activeOpacity={0.7}
        >
          <Ionicons name="list" size={24} color={COLORS.primary} />
          <Text style={styles.historyButtonText}>View History</Text>
        </TouchableOpacity>

        {/* Start button */}
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => navigation.navigate('WorkoutSetup')}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle" size={24} color="#fff" />
          <Text style={styles.startButtonText}>Start New Workout</Text>
        </TouchableOpacity>

        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            Your workout stats and progress be stored here
          </Text>
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof getColors>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontFamily: TYPOGRAPHY.fonts.bold,
    color: colors.text.primary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontFamily: TYPOGRAPHY.fonts.regular,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: 12,
    gap: SPACING.sm,
  },
  startButtonText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontFamily: TYPOGRAPHY.fonts.semiBold,
    color: '#fff',
  },
  historyButton: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: COLORS.surface,
  paddingVertical: SPACING.sm,
  paddingHorizontal: SPACING.lg,
  borderRadius: 12,
  gap: SPACING.xs,
  borderWidth: 1,
  borderColor: COLORS.border,
  marginBottom: SPACING.md,
},
historyButtonText: {
  fontSize: TYPOGRAPHY.sizes.md,
  fontFamily: TYPOGRAPHY.fonts.medium,
  color: COLORS.primary,
},
  placeholder: {
    marginTop: SPACING.xxl,
  },
  placeholderText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontFamily: TYPOGRAPHY.fonts.regular,
    color: colors.text.light,
  },
});