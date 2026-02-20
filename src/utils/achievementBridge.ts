import { AchievementData } from '../types/workout';
import { BadgeService } from '../services/badges/badge.service';

const BADGE_IDS = {
  personal_record: {
    distance: 'longest run',
    duration: 'longest workout',
    // no badges implemented
    pace:     'fastest pace',
    steps:    'most steps in a session',
    cadence:  'steps per minute',
  },

  // no badges implemented
  milestone: {
    5:    '5k finisher',
    10:   '10k runner',
    15:   '15k challenger',
    21.1: 'half marathon hero',
    25:   '25k crusher',
    30:   '30k endurance beast',
    42.2: 'marathon finisher',
  } as Record<number, string | null>,

  // no badges implemented
  streak: {
    1: '1 streak',
    7:  '7 streak',
    14: '14 streak',
    21: '21 streak',
    30: '30 streak',
  } as Record<number, string | null>,
} as const;


export async function saveDetectedBadges(
  userId: string | undefined,
  achievements: AchievementData[]
): Promise<void> {
  if (!userId || achievements.length === 0) {
    console.log('No badges to save (no userId or no achievements)');
    return;
  }

  console.log(`Processing ${achievements.length} achievement(s) for user ${userId}`);

  const savePromises = achievements
    .map((achievement: AchievementData) => {
      const badgeId = resolveBadgeId(achievement);
      if (!badgeId) {
        console.warn(
          `No Firestore badge for ${achievement.achievementType}/${achievement.metric}`,
          `(value: ${achievement.value}) - skipping`
        );
        return null;
      }
      return { badgeId, achievement };
    })
    .filter((item): item is { badgeId: string; achievement: AchievementData } => item !== null)
    .map(({ badgeId, achievement }) => {
      console.log(
        `Saving badge "${badgeId}" for ${achievement.achievementType}/${achievement.metric}`,
        `(value: ${achievement.value})`
      );
      return BadgeService.saveBadgeToUser(userId, badgeId, achievement.value).catch((error: unknown) => {
        console.error(`Failed to save badge "${badgeId}":`, error);
      });
    });

  if (savePromises.length === 0) {
    console.log('No badges matched Firestore structure - none saved');
    return;
  }

  await Promise.allSettled(savePromises);
  console.log(`Badge save complete (${savePromises.length} attempted)`);
}


function resolveBadgeId(achievement: AchievementData): string | null {
  switch (achievement.achievementType) {
    case 'personal_record': {
      const metric = achievement.metric as keyof typeof BADGE_IDS.personal_record;
      const badgeId = BADGE_IDS.personal_record[metric];
      return badgeId ?? null;
    }

    case 'milestone': {
      if (achievement.metric === 'distance') {
        const badgeId = BADGE_IDS.milestone[achievement.value];
        return badgeId ?? null;
      }
      return null;
    }

    case 'streak': {
      const tiers = Object.keys(BADGE_IDS.streak)
        .map(Number)
        .sort((a, b) => b - a);

      const matchingTier = tiers.find((tier) => achievement.value >= tier);
      if (matchingTier === undefined) return null;

      return BADGE_IDS.streak[matchingTier] ?? null;
    }

    default:
      return null;
  }
}