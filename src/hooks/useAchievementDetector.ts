import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { WorkoutService } from '../services/firebase/workout.service';
import { WorkoutAnalyticsService } from '../services/analytics/workout-analytics.service';
import { AchievementData, WorkoutSession } from '../types/workout';

interface AchievementDetectorProps {
  userId: string;
  newWorkoutId: string | null;
  onAchievementsDetected?: (achievements: AchievementData[]) => void;
}

export const useAchievementDetector = ({
  userId,
  newWorkoutId,
  onAchievementsDetected,
}: AchievementDetectorProps) => {
  const hasChecked = useRef(false);

  useEffect(() => {
    if (!newWorkoutId || !userId || hasChecked.current) {
      return;
    }

    const detectAchievements = async () => {
      try {
        hasChecked.current = true;

        const allWorkouts: WorkoutSession[] = await WorkoutService.getUserWorkouts(userId);

        const newWorkout = allWorkouts.find((w: WorkoutSession) => w.id === newWorkoutId);
        if (!newWorkout) {
          console.warn('New workout not found for achievement detection');
          return;
        }

        const previousWorkouts = allWorkouts.filter((w: WorkoutSession) => w.id !== newWorkoutId);

        const achievements: AchievementData[] = WorkoutAnalyticsService.detectAchievements(
          newWorkout,
          previousWorkouts
        );

        if (achievements.length > 0) {
          console.log('Achievements detected:', achievements);

          if (onAchievementsDetected) {
            onAchievementsDetected(achievements);
          }

          showAchievementAlert(achievements);
        }
      } catch (error) {
        console.error('Error detecting achievements:', error);
      }
    };

    detectAchievements();
  }, [newWorkoutId, userId, onAchievementsDetected]);
};

function showAchievementAlert(achievements: AchievementData[]): void {
  if (achievements.length === 0) return;

  const messages = achievements
    .map((achievement: AchievementData) => {
      switch (achievement.achievementType) {
        case 'personal_record': return getPersonalRecordMessage(achievement);
        case 'milestone':       return getMilestoneMessage(achievement);
        case 'streak':          return getStreakMessage(achievement);
        default:                return null;
      }
    })
    .filter((msg): msg is string => msg !== null);

  Alert.alert(
    '🏆 Achievement Unlocked!',
    messages.join('\n\n'),
    [{ text: 'Awesome!', style: 'default' }]
  );
}

function getPersonalRecordMessage(achievement: AchievementData): string {
  const { metric, value, previousBest } = achievement;
  switch (metric) {
    case 'distance':
      return `🏃 New Distance Record!\n${(value / 1000).toFixed(2)} km (previous: ${((previousBest ?? 0) / 1000).toFixed(2)} km)`;
    case 'pace': {
      return `⚡ Fastest Pace!\n${formatPace(value)} (previous: ${formatPace(previousBest ?? 0)})`;
    }
    case 'steps':
      return `👟 Most Steps!\n${value.toLocaleString()} (previous: ${(previousBest ?? 0).toLocaleString()})`;
    case 'duration':
      return `⏱️ Longest Workout!\n${formatDuration(value)} (previous: ${formatDuration(previousBest ?? 0)})`;
    default:
      return `🎯 New Personal Record in ${metric}!`;
  }
}

function getMilestoneMessage(achievement: AchievementData): string {
  const { metric, value } = achievement;
  if (metric === 'distance') {
    if (value === 5)    return '🎉 First 5K Complete!';
    if (value === 10)   return '🎉 First 10K Complete!';
    if (value === 21.1) return '🎉 Half Marathon Complete!';
    if (value === 42.2) return '🎉 MARATHON COMPLETE!';
    return `🎉 ${value}km Milestone Reached!`;
  }
  return `🎉 Milestone: ${value} ${metric}!`;
}

function getStreakMessage(achievement: AchievementData): string {
  return `🔥 ${achievement.value}-Day Workout Streak!`;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function formatPace(secondsPerKm: number): string {
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.floor(secondsPerKm % 60);
  return `${minutes}:${String(seconds).padStart(2, '0')}/km`;
}

export function exportAchievementData(achievements: AchievementData[]): string {
  return JSON.stringify({
    achievements: achievements.map((a: AchievementData) => ({
      id: `${a.workoutId}_${a.achievementType}_${a.metric}`,
      workoutId: a.workoutId,
      type: a.achievementType,
      metric: a.metric,
      value: a.value,
      previousBest: a.previousBest,
      timestamp: a.timestamp.toISOString(),
    })),
    exportedAt: new Date().toISOString(),
  }, null, 2);
}
