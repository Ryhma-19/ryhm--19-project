import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { RouteService } from '../../services/firebase/route.service';
import { RouteData } from '../../types/route';
import { WorkoutType } from '../../types/workout';
import { formatDistance } from '../../utils/routeUtils';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../constants/theme';

interface WorkoutSetupScreenProps {
  navigation: any;
}

export default function WorkoutSetupScreen({ navigation }: WorkoutSetupScreenProps) {
  const { user } = useAuth();
  const [workoutType, setWorkoutType] = useState<WorkoutType>('running');
  const [selectedRoute, setSelectedRoute] = useState<RouteData | null>(null);
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [loading, setLoading] = useState(true);

  // Load user's routes
  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    if (!user) return;

    try {
      const userRoutes = await RouteService.getUserRoutes(user.id);
      setRoutes(userRoutes);
    } catch (error) {
      console.error('Error loading routes:', error);
      Alert.alert('Error', 'Failed to load routes.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartWorkout = () => {
    navigation.navigate('ActiveWorkout', {
      workoutType,
      routeId: selectedRoute?.id,
      routeName: selectedRoute?.name,
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Workout Type Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Workout Type</Text>
        
        <View style={styles.typeRow}>
          <TouchableOpacity
            style={[
              styles.typeCard,
              workoutType === 'running' && styles.typeCardSelected,
            ]}
            onPress={() => setWorkoutType('running')}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="fitness" 
              size={32} 
              color={workoutType === 'running' ? COLORS.primary : COLORS.text.secondary} 
            />
            <Text style={[
              styles.typeLabel,
              workoutType === 'running' && styles.typeLabelSelected,
            ]}>
              Running
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeCard,
              workoutType === 'walking' && styles.typeCardSelected,
            ]}
            onPress={() => setWorkoutType('walking')}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="walk" 
              size={32} 
              color={workoutType === 'walking' ? COLORS.primary : COLORS.text.secondary} 
            />
            <Text style={[
              styles.typeLabel,
              workoutType === 'walking' && styles.typeLabelSelected,
            ]}>
              Walking
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Route Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Route (Optional)</Text>
        <Text style={styles.sectionSubtitle}>
          Choose a saved route or do a free run
        </Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : routes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="map-outline" size={48} color={COLORS.text.light} />
            <Text style={styles.emptyText}>No saved routes yet</Text>
            <Text style={styles.emptySubtext}>
              Create routes in the Routes tab to use them for workouts
            </Text>
          </View>
        ) : (
          <>
            {/* Free Run Option */}
            <TouchableOpacity
              style={[
                styles.routeCard,
                !selectedRoute && styles.routeCardSelected,
              ]}
              onPress={() => setSelectedRoute(null)}
              activeOpacity={0.7}
            >
              <View style={styles.routeIcon}>
                <Ionicons name="navigate" size={24} color={COLORS.primary} />
              </View>
              <View style={styles.routeInfo}>
                <Text style={styles.routeName}>Free Run</Text>
                <Text style={styles.routeDescription}>
                  Run anywhere without following a route
                </Text>
              </View>
              {!selectedRoute && (
                <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
              )}
            </TouchableOpacity>

            {/* User's Routes */}
            {routes.map((route) => (
              <TouchableOpacity
                key={route.id}
                style={[
                  styles.routeCard,
                  selectedRoute?.id === route.id && styles.routeCardSelected,
                ]}
                onPress={() => setSelectedRoute(route)}
                activeOpacity={0.7}
              >
                <View style={styles.routeIcon}>
                  <Ionicons name="map" size={24} color={COLORS.primary} />
                </View>
                <View style={styles.routeInfo}>
                  <Text style={styles.routeName}>{route.name}</Text>
                  <Text style={styles.routeStats}>
                    {formatDistance(route.distance)} • {route.waypoints.length} waypoints
                  </Text>
                </View>
                {selectedRoute?.id === route.id && (
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            ))}
          </>
        )}
      </View>

      {/* Start Button */}
      <TouchableOpacity
        style={styles.startButton}
        onPress={handleStartWorkout}
        activeOpacity={0.8}
      >
        <Ionicons name="play-circle" size={28} color="#fff" />
        <Text style={styles.startButtonText}>Start Workout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontFamily: TYPOGRAPHY.fonts.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  sectionSubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontFamily: TYPOGRAPHY.fonts.regular,
    color: COLORS.text.secondary,
    marginBottom: SPACING.md,
  },
  typeRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  typeCard: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  typeLabel: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontFamily: TYPOGRAPHY.fonts.semiBold,
    color: COLORS.text.secondary,
    marginTop: SPACING.sm,
  },
  typeLabelSelected: {
    color: COLORS.primary,
  },
  loadingContainer: {
    padding: SPACING.xxl,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: SPACING.xxl,
  alignItems: 'center',
},
  emptyText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontFamily: TYPOGRAPHY.fonts.semiBold,
    color: COLORS.text.secondary,
    marginTop: SPACING.md,
  },
  emptySubtext: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontFamily: TYPOGRAPHY.fonts.regular,
    color: COLORS.text.light,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  routeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: SPACING.sm,
  },
  routeCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  routeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  routeInfo: {
    flex: 1,
  },
  routeName: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontFamily: TYPOGRAPHY.fonts.semiBold,
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  routeDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontFamily: TYPOGRAPHY.fonts.regular,
    color: COLORS.text.secondary,
  },
  routeStats: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontFamily: TYPOGRAPHY.fonts.regular,
    color: COLORS.text.secondary,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    marginTop: SPACING.lg,
  },
  startButtonText: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontFamily: TYPOGRAPHY.fonts.bold,
    color: '#fff',
  },
});
