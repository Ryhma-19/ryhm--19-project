import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, ActivityIndicator, Image } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { SPACING, TYPOGRAPHY, getColors } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import BadgeCard from './badges/BadgeCard';
import { Achievement } from '../../types';
import { BadgeService } from '../../services/badges/badge.service';


export default function ProfileScreen({navigation}: any) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const styles = createStyles(colors);
  const [badges, setBadges] = useState<Achievement[]>()
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    if (!user?.id) return

    const unsubscribe = BadgeService.getUserProfileBadges(
    user.id,
    (data) => {
      setBadges(data)
      setLoading(false)
    }
  )

  return () => unsubscribe()
  }, [user?.id])

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 40 }} />
  }

  return (
    <View style={styles.container}>
      <View style={styles.topRightCorner}>

        <Pressable
        onPress={() => navigation.navigate('UserBadges')}
        >
          <View>
            <Ionicons name="ribbon" size={32} />
          </View>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('UserSettings')}>
          <Ionicons name="settings-sharp" size={32}/>
        </Pressable>
      </View>

      <View style={styles.ProfileContainer}>
        <Image
          source={require("../../images/user_icon.png")}
          style={styles.avatar}
        />
        <Text style={styles.title}>{user?.displayName}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.badgeSection}>
          <FlatList
          data={badges}
          numColumns={3}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <BadgeCard badge={item} variant='profile' />}
        />
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
  ProfileContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.sm,
    margin: SPACING.sm,

  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: colors.text.primary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: colors.text.secondary,
    marginBottom: SPACING.xs,
  },
  email: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: colors.text.light,
    marginBottom: SPACING.xl,
  },
  button: {
    backgroundColor: colors.error,
    borderRadius: 8,
    padding: SPACING.md,
    paddingHorizontal: SPACING.xl,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  topRightCorner: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  BadgesButton: {
    backgroundColor: '#59b159',
    borderRadius: 16,
    padding: 8,
  },
  badgeSection: {
    width: '100%',
    height: 150,
    padding: SPACING.md,
    backgroundColor: colors.surface,
    borderRadius: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    marginBottom: SPACING.md,
  }
});