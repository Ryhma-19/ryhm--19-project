// screens/BadgeScreen.tsx
import React, { useEffect, useMemo, useState } from "react"
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from "react-native"
import { Achievement } from "../../../types"
import { useAuth } from "../../../contexts/AuthContext"
import { useTheme } from "../../../contexts/ThemeContext"
import { SPACING, TYPOGRAPHY, getColors } from "../../../constants/theme"
import BadgeCard from "./BadgeCard"
import { BadgeService } from "../../../services/badges/badge.service"


export default function BadgeScreen() {
  const { user } = useAuth()
  const { theme } = useTheme()
  const colors = getColors(theme)
  const styles = createStyles(colors)
  const [badges, setBadges] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return

    let unsubscribe: any

    const loadBadges = async () => {
      unsubscribe = await BadgeService.getAllBadges(
        user.id,
        (data) => {
          setBadges(data)
          setLoading(false)
        }
      )
      setLoading(false)
    }

    loadBadges()

    return () => unsubscribe?.()
  }, [user?.id])

  const sortedBadges = useMemo(() => {
    return [...badges].sort((a, b) => {
      if (a.isUnlocked !== b.isUnlocked) {
        return a.isUnlocked ? -1 : 1;
      }
      return 0
    });
  }, [badges]);


  if (loading) {
    return <ActivityIndicator style={{ marginTop: 40 }} />
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Badges</Text>

      <FlatList
        data={sortedBadges}
        numColumns={3}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <BadgeCard badge={item} />}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ gap: 12 }}
      />
    </View>
  )
}

const createStyles = (colors: ReturnType<typeof getColors>) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 16,
    color: colors.text.primary,
  },
})
