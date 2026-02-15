import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { WorkoutService } from '../../services/firebase/workout.service';
import { WorkoutAnalyticsService } from '../../services/analytics/workout-analytics.service';
import { AchievementData } from '../../types/workout';

interface AchievementDetectorProps {
  userId: string;
  newWorkoutId: string | null;
  onAchievementsDetected?: (achievements: AchievementData[]) => void;
}

// Detect achievements
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

        const allWorkouts = await WorkoutService.getUserWorkouts(userId);
        
        // Find the new workout
        const newWorkout = allWorkouts.find(w => w.id === newWorkoutId);
        if (!newWorkout) {
          console.warn('New workout not found for achievement detection');
          return;
        }

        const previousWorkouts = allWorkouts.filter(w => w.id !== newWorkoutId);

        const achievements = WorkoutAnalyticsService.detectAchievements(
          newWorkout,
          previousWorkouts
        );

        if (achievements.length > 0) {
          console.log('Achievements detected:', achievements);
          
          // Update workout with achievement markers
          const achievementTypes = achievements.map(a => 
            `${a.achievementType}_${a.metric}`
          );
          
          // Link to Firestore?
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

// Achievement alert
function showAchievementAlert(achievements: AchievementData[]) {
  if (achievements.length === 0) return;

  const messages: string[] = [];

  achievements.forEach(achievement => {
    switch (achievement.achievementType) {
      case 'personal_record':
        messages.push(getPersonalRecordMessage(achievement));
        break;
      case 'milestone':
        messages.push(getMilestoneMessage(achievement));
        break;
      case 'streak':
        messages.push(getStreakMessage(achievement));
        break;
    }
  });

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
      return `🏃 New Distance Record!\n${(value / 1000).toFixed(2)} km (previous: ${((previousBest || 0) / 1000).toFixed(2)} km)`;
    
    case 'pace':
      const newPace = formatPace(value);
      const oldPace = formatPace(previousBest || 0);
      return `⚡ Fastest Pace!\n${newPace} (previous: ${oldPace})`;
    
    case 'steps':
      return `👟 Most Steps!\n${value.toLocaleString()} steps (previous: ${(previousBest || 0).toLocaleString()})`;
    
    case 'duration':
      return `⏱️ Longest Workout!\n${formatDuration(value)} (previous: ${formatDuration(previousBest || 0)})`;
    
    default:
      return `🎯 New Personal Record in ${metric}!`;
  }
}

function getMilestoneMessage(achievement: AchievementData): string {
  const { metric, value } = achievement;

  if (metric === 'distance') {
    const km = value;
    if (km === 5) return '🎉 First 5K Complete!';
    if (km === 10) return '🎉 First 10K Complete!';
    if (km === 21.1) return '🎉 Half Marathon Complete!';
    if (km === 42.2) return '🎉 MARATHON COMPLETE!';
    return `🎉 ${km}km Milestone Reached!`;
  }

  return `🎉 Milestone: ${value} ${metric}!`;
}

function getStreakMessage(achievement: AchievementData): string {
  const { value } = achievement;
  return `🔥 ${value}-Day Workout Streak!`;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function formatPace(secondsPerKm: number): string {
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.floor(secondsPerKm % 60);
  return `${minutes}:${String(seconds).padStart(2, '0')}/km`;
}

// Exporting achievement data
export function exportAchievementData(achievements: AchievementData[]): string {
  return JSON.stringify({
    achievements: achievements.map(a => ({
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
