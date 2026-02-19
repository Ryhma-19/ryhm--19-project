import { View, Text, StyleSheet, Modal, Pressable } from "react-native"
import { useEffect, useState, useMemo } from "react";
import { Achievement, AchievementStats, ICONS } from "../../../types"
import { BadgeService } from "../../../services/badges/badge.service";
import { useAuth } from "../../../contexts/AuthContext";

const badge_rarity = {
  noRarity: {
    color: "#f5f5f5"
  },
  bronze: {
    color: "#CE8946"
  },
  silver: {
    color: "#C4C4C4"
  },
  gold: {
    color: "#EFBF04"
  },
  platinum: {
    color: "#4c6ba5"
  }
}


type rarityKey = keyof typeof badge_rarity;

export default function BadgeCard({ badge, variant = 'collection' }: { badge: Achievement, variant?: 'collection' | 'profile' }) {
  const { user } = useAuth()
  const [modalVisible, setModalVisible] = useState(false);
  const [nextMilestone, setNextMilestone] = useState<number | null>(null);
  const [progressPercent, setProgressPercent] = useState<number | null>(null);

  const rarity: rarityKey = useMemo(() => {
    if (!badge.milestones) {
      return "noRarity"
    }

    const index = badge.milestones
    .map((value, index) => (badge.progress >= value ? index : -1))
    .filter(index => index !== -1)
    .pop()

    if (index === undefined || 0) return 'noRarity'
    if (index <= 1) return 'bronze'
    if (index === 2) return 'silver'
    if (index === 3) return 'gold'
    return 'platinum'
  }, [badge.progress, badge.milestones])

  useEffect(() => {
    if (!badge.milestones?.length) {
      setNextMilestone(null)
      setProgressPercent(null)
      return
    }

    const next = badge.milestones.find(num => badge.progress < num) ?? null

    setNextMilestone(next)

    if (next === null || next === 0) {
      setProgressPercent(null)
      return
    }

    const percent = Math.min((badge.progress / next) * 100, 100)

    setProgressPercent(percent)
  }, [badge.progress, badge.milestones])

  function formatDuration(seconds: number) {
    if (seconds < 60) {
      return `${seconds}s`
    }

    if (seconds < 3600) {
      const minutes = Math.round(seconds / 60)
      return `${minutes}m`
    }

    const hours = Math.round(seconds / 3600)
    const minutes = Math.round((seconds % 3600) / 60)

    return `${hours}h ${minutes}m`
  }

  function formatDistance(meters: number) {
    if (meters < 1000) {
      return `${meters} m`
    }

    const kilometers = (meters / 1000).toFixed(1)

    return `${kilometers} km`
  }

  const formatterMap: Partial<
  Record<keyof AchievementStats, (value: number) => string>> = {
    duration: formatDuration,
    distance: formatDistance,
    averagePace: (v) => `${v} min/km`,
    longestRun: formatDistance,
    currentStreak: (v) => `${v} days`,
    longestStreak: (v) => `${v} days`,
  }


  function formatBadgeProgress(type: keyof AchievementStats, progress: number) {
    const formatter = formatterMap[type]

    return formatter ? formatter(progress) : `${progress}`
  }

  return (
    <View>
      <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(false);
        }}>
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
        <View style={styles.modalCard}>
          <View style={[styles.modalScreen, {backgroundColor: badge_rarity[rarity].color}, !badge.isUnlocked && styles.locked]}>
            <Text style={styles.modalIcon}>{ICONS[badge.type] ?? ''}</Text>
          </View>

          <Text style={styles.modalTitle}>{badge.title}</Text>

          {badge.isUnlocked && badge.progress && (
            <Text style={styles.modalProgress}>{formatBadgeProgress(badge.type as keyof AchievementStats, badge.progress)}</Text>
          )}

          {badge.isUnlocked && progressPercent && progressPercent > 0 && (
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
            </View>
          )}

          {badge.isUnlocked && nextMilestone && (
            <Text style={styles.desc}>Next milestone: {nextMilestone}</Text>
          )}

          {badge.isUnlocked && badge.unlockedAt && (
            <Text style={styles.desc}>Unlocked at: {badge.unlockedAt.toDateString()}</Text>
          )}
          {badge.isUnlocked && (
            <Pressable
              style={styles.modalButton}
              onPress={() => BadgeService.changeProfileBadgeStatus(user?.id, badge.id, !badge.isProfile)}
            >
            <Text style={styles.modalButtonText}>
            {badge.isProfile ? 'Remove from profile' : 'Add to profile'}
            </Text>
            </Pressable>
            )}
          </View>
        </Pressable>
      </Modal>

      <Pressable
      onPress={() => setModalVisible(!modalVisible)}
      >
        <View style={[styles.card, !badge.isUnlocked && styles.locked]}>
          <View style={[styles.background, {backgroundColor: badge_rarity[rarity].color}]}>
            <Text style={styles.icon}>{ICONS[badge.type] ?? ''}</Text>
          </View>

          <Text style={styles.badgeTitle} numberOfLines={2}>{badge.title}</Text>

          {badge.progress && (
            <Text>{formatBadgeProgress(badge.type as keyof AchievementStats, badge.progress)}</Text>
          )}
      
        </View>
      </Pressable>
    </View>
    
  )
}

const styles = StyleSheet.create({
    
  card: {
    width: 100,
    alignItems: "center",
  },
  locked: {
    opacity: 0.5,
  },
  icon: {
    fontSize: 40,
    marginBottom: 6,
  },
  badgeTitle: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  desc: {
    fontSize: 16,
    color: "#ffffff",
    textAlign: "center",
    marginVertical: 6,
  },
  background: {
    backgroundColor: '#fcfcfc',
    borderRadius: 40,
    padding: 4,
    marginTop: 10,
    width: 68,
    alignItems: 'center',
    shadowColor: '#2e2f00',
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.81)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalScreen: {
    height: '25%',
    width: '50%',
    backgroundColor: '#a5ffef',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
    marginBottom: 16,
  },
  modalCard: {
    width: '80%',
    height: '75%',
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
    textAlign: 'center',
  },
  modalProgress: {
    fontSize: 32,
    fontWeight: "600",
    color: '#ffff',
  },
  modalIcon: {
    fontSize: 80,
  },
  progressBar: {
    width: "85%",
    height: 10,
    backgroundColor: "#E2E8F0",
    borderRadius: 6,
    marginTop: 15,
    marginBottom: 2,
  },
    progressFill: {
    height: "100%",
    backgroundColor: "#22C55E",
    borderRadius: 6,
  },
  modalButton: {
    marginTop: 20,
    backgroundColor: '#22C55E',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  modalButtonText: {
    fontWeight: 700,
  }
})