import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Text,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { RouteService } from '../../services/firebase/route.service';
import { RouteData } from '../../types/route';
import { RouteCard } from '../../components/routes/RouteCard';
import EmptyRoutes from '../../components/routes/EmptyRoutes';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';

export default function RoutesScreen({ navigation }: any) {
  const { user } = useAuth();
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load routes from Firestore
  const loadRoutes = useCallback(async () => {
    if (!user) return;

    try {
      const userRoutes = await RouteService.getUserRoutes(user.id);
      setRoutes(userRoutes);
    } catch (error) {
      console.error('Error loading routes:', error);
      Alert.alert('Error', 'Failed to load routes. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  // Load routes on mount
  useEffect(() => {
    loadRoutes();
  }, [loadRoutes]);

  // Handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadRoutes();
  }, [loadRoutes]);

  // Handle route deletion
  const handleDeleteRoute = useCallback(async (routeId: string) => {
    Alert.alert(
      'Delete Route',
      'Are you sure you want to delete this route?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await RouteService.deleteRoute(routeId);
              // Remove from local state
              setRoutes((prev) => prev.filter((r) => r.id !== routeId));
            } catch (error) {
              console.error('Error deleting route:', error);
              Alert.alert('Error', 'Failed to delete route. Please try again.');
            }
          },
        },
      ]
    );
  }, []);

  // Handle favorite toggle
  const handleToggleFavorite = useCallback(async (routeId: string, currentFavorite: boolean) => {
    try {
      await RouteService.toggleFavorite(routeId, !currentFavorite);
      // Update state
      setRoutes((prev) =>
        prev.map((r) =>
          r.id === routeId ? { ...r, isFavorite: !currentFavorite } : r
        )
      );
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorite status.');
    }
  }, []);

  // Handle route edit navigation
  const handleEditRoute = useCallback((route: RouteData) => {
    // needs implementation
    navigation.navigate('RoutePlanning', { editRoute: route });
  }, [navigation]);

  // Handle route view navigation
  const handleViewRoute = useCallback((route: RouteData) => {
    // Future: Navigate to RouteDetailsScreen
    console.log('View route:', route.name);
    Alert.alert('Coming Soon', 'Route details view will be implemented next!');
  }, []);

  // Navigate to route planning screen
  const handleCreateRoute = useCallback(() => {
    // needs implementation
    navigation.navigate('RoutePlanning');
  }, [navigation]);

  // Render individual route card
  const renderRoute = useCallback(
    ({ item }: { item: RouteData }) => (
      <RouteCard
        route={item}
        onPress={() => handleViewRoute(item)}
        onEdit={() => handleEditRoute(item)}
        onDelete={() => handleDeleteRoute(item.id)}
        onToggleFavorite={() => handleToggleFavorite(item.id, item.isFavorite)}
      />
    ),
    [handleViewRoute, handleEditRoute, handleDeleteRoute, handleToggleFavorite]
  );

  // Show loading state
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading routes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={routes}
        renderItem={renderRoute}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          routes.length === 0 ? styles.emptyContainer : styles.listContent
        }
        ListEmptyComponent={<EmptyRoutes onCreateRoute={handleCreateRoute} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Action Button */}
      {routes.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={handleCreateRoute}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    fontFamily: TYPOGRAPHY.fonts.regular,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80, // Space for FAB
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});



