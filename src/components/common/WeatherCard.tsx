import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WeatherCondition } from '../../types';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../constants/theme';

interface WeatherCardProps {
  weather: WeatherCondition | null;
  loading: boolean;
  error: string | null;
}

export function WeatherCard({ weather, loading, error }: WeatherCardProps) {
  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading weather...</Text>
      </View>
    );
  }

  // Error state
  if (error || !weather) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Ionicons name="cloud-offline" size={48} color={COLORS.error} />
        <Text style={styles.errorText}>{error || 'Weather unavailable'}</Text>
      </View>
    );
  }

  // Get weather icon
  const getWeatherIcon = (icon: string): keyof typeof Ionicons.glyphMap => {
    const iconMap: { [key: string]: keyof typeof Ionicons.glyphMap } = {
      'sunny': 'sunny',
      'partly-sunny': 'partly-sunny',
      'cloudy': 'cloudy',
      'rainy': 'rainy',
      'snow': 'snow',
      'thunderstorm': 'thunderstorm',
    };
    return iconMap[icon] || 'cloudy';
  };

  // Weather warning
  const showWarning = weather.isExtreme;

  return (
    <View style={styles.container}>
      {/* Warning banner */}
      {showWarning && (
        <View style={styles.warningBanner}>
          <Ionicons name="warning" size={20} color={COLORS.warning} />
          <Text style={styles.warningText}>Extreme weather conditions</Text>
        </View>
      )}

      {/* Main weather display */}
      <View style={styles.mainContent}>
        <Ionicons 
          name={getWeatherIcon(weather.icon)} 
          size={64} 
          color={COLORS.primary} 
        />
        
        <View style={styles.temperatureSection}>
          <Text style={styles.temperature}>{Math.round(weather.temperature)}°C</Text>
          <Text style={styles.feelsLike}>
            Feels like {Math.round(weather.feelsLike)}°C
          </Text>
        </View>
      </View>

      {/* Weather details */}
      <View style={styles.detailsSection}>
        <Text style={styles.description}>{weather.description}</Text>
        
        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Ionicons name="water" size={20} color={COLORS.text.secondary} />
            <Text style={styles.detailText}>{weather.humidity}%</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="speedometer" size={20} color={COLORS.text.secondary} />
            <Text style={styles.detailText}>{Math.round(weather.windSpeed)} m/s</Text>
          </View>
        </View>
      </View>

      {/* Timestamp */}
      <Text style={styles.timestamp}>
        Updated: {new Date(weather.timestamp).toLocaleTimeString('fi-FI')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.error,
    textAlign: 'center',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning + '20', // opacity for style
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  warningText: {
    marginLeft: SPACING.sm,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.warning,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  mainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  temperatureSection: {
    marginLeft: SPACING.lg,
    flex: 1,
  },
  temperature: {
    fontSize: TYPOGRAPHY.sizes.xxl * 1.5,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.text.primary,
  },
  feelsLike: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
  },
  detailsSection: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.md,
  },
  description: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.text.primary,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginBottom: SPACING.sm,
    textTransform: 'capitalize',
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  detailText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.text.secondary,
  },
  timestamp: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.text.light,
    textAlign: 'center',
  },
});