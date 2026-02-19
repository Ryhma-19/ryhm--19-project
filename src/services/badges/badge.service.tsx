import { doc, getDocs, collection, Timestamp, setDoc, updateDoc, getDoc, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { Achievement, BadgeType, AchievementStats } from "../../types";


export class BadgeService {
  static async getAllBadges(userId: string, callback: (badges: Achievement[]) => void) {
    try {
      const allBadgesSnap = await getDocs(collection(db, "badges"))

      const unlockedBadgesRef = collection(db, "users", userId, "badges")

      const unsubscribe = onSnapshot(unlockedBadgesRef, snapshot => {
        const unlockedMap = new Map(
          snapshot.docs.map(doc => [doc.id, doc.data()])
        )

        const badges: Achievement[] = allBadgesSnap.docs.map(doc => {
          const data = doc.data()
          const userData = unlockedMap.get(doc.id)

          return {
            id: doc.id,
            ...(data as Omit<Achievement, "id" | "progress" | "isUnlocked" | "unlockedAt" | "isProfile">),
            progress: userData?.progress,
            isUnlocked: !!userData,
            unlockedAt: userData?.unlockedAt?.toDate?.(),
            isProfile: userData?.isProfile
          }
        })
        callback(badges)
      })

      return unsubscribe;
    } catch (error) {
      console.error("Error", error)
      throw error
    }
  }

  static getUserProfileBadges(userId: string, callback: (badges: Achievement[]) => void) {
    try {
      const q = query(
        collection(db, "users", userId, "badges"),
        where("isProfile", "==", true)
      );

      const unsubscribe = onSnapshot(q, snapshot => {
        const badges: Achievement[] = snapshot.docs.map((doc) => {
          const data = doc.data();

          return {
            id: doc.id,
            type: data.type as BadgeType,
            title: data.title as string,
            milestones: (data.milestones ?? null) as number[] | null,
            progress: data.progress ?? 0,
            isUnlocked: data.isUnlocked ?? true,
            unlockedAt: data.unlockedAt?.toDate?.() ?? new Date(0),
            isProfile: true,
            rarity: data.rarity,
          };
        });

      callback(badges)
    })

      return unsubscribe;
    } catch (error) {
      console.error("Error", error)
      throw error
    }

  }

  static async saveBadgeToUser(userId: string | undefined, badgeId: string) {
    try {
      const badgeRef = doc(db, "badges", badgeId);
      const badgeSnap = await getDoc(badgeRef);

      if (!badgeSnap.exists()) {
        throw new Error("Badge does not exist");
      }

      const badgeData = badgeSnap.data();

      if (!userId) {
        throw new Error("user id is missing");
      }
      const userBadgeRef = doc(db, "users", userId, "badges", badgeId);

      await setDoc(userBadgeRef, {
        badgeId,
        progress: 10,
        milestones: badgeData.milestones ?? [],
        title: badgeData.title,
        type: badgeData.type,
        unlockedAt: Timestamp.now(),
        isProfile: false,
      });
    } catch (error) {
      console.error("Error", error)
      throw error
    } 
  }

  static async updateUserBadge(userId: string | undefined, badgeId: string, progress: number) {
    try {
      if (!userId) {
        throw new Error("user id is missing");
      }

      const badgeRef = doc(db, "users", userId, "badges", badgeId);

      const badgeSnap = await getDoc(badgeRef)

      if (!badgeSnap.exists()) {
        throw new Error("Badge does not exist");
      }
      
      await updateDoc(badgeRef, {
        progress: progress,
      });
    } catch (error) {
      console.error("Error", error);
      throw error;
    }
  }

  static async checkForNewBadgeUnlocks(userId: string | undefined, stats: AchievementStats) {
    try {
      if (!userId) {
        throw new Error("user id is missing");
      }
      
      const badgesSnap = await getDocs(collection(db, "badges"))

      const statMap: Record<string, number> = {
        amount: stats.amount,
        distance: stats.distance,
        steps: stats.steps,
        duration: stats.duration,
        average_pace: stats.averagePace,
        longest_run: stats.longestRun,
        streak: stats.currentStreak,
        longest_streak: stats.longestStreak,
      }

      for (const badgeDoc of badgesSnap.docs) {
        const badgeId = badgeDoc.id
        const badgeData = badgeDoc.data()
        const type = badgeData.type as string

        const progress = statMap[type] ?? 0

        if (progress <= 0) continue

        const userBadgeRef = doc(db, "users", userId, "badges", badgeId)

        const existing = await getDoc(userBadgeRef)

        if (existing.exists()) {
          // Update progress if it's already unlocked
          await setDoc(
            userBadgeRef,
            {
              progress,
            },
            { merge: true }
          )
        } else {
          // Unlock new badge
          await setDoc(userBadgeRef, {
            ...badgeData,
            progress,
            unlockedAt: new Date(),
            isProfile: false,
          })
        }
      }
    } catch (error) {
      console.error("Error checking badges:", error)
      throw error
    }
  }

  static async changeProfileBadgeStatus(userId: string | undefined, badgeId: string, status: boolean) {
    try {
      if (!userId) {
        throw new Error("User ID is required");
      }

      const q = query(
        collection(db, "users", userId, "badges"),
        where("isProfile", "==", true)
      );

      const snap = await getDocs(q);


      if (status === true && snap.docs.length >= 3) {
        console.log("we are here")
        throw new Error("User can't have more than 3 badges displayed on profile");
      }

      const badgeRef = doc(db, "users", userId, "badges", badgeId);

      await updateDoc(badgeRef, {
        isProfile: status,
      });
    } catch (error) {
      console.error("Error", error);
      throw error;
    }
  }
}