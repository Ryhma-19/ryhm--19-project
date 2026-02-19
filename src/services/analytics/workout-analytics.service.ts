import { WorkoutSession, WorkoutAnalytics, AchievementData } from '../../types/workout';

export class WorkoutAnalyticsService {
  // Calculate analytics
  static calculateAnalytics(
    workouts: WorkoutSession[],
    periodStart: Date,
    periodEnd: Date
  ): WorkoutAnalytics {
    if (workouts.length === 0) {
      return this.getEmptyAnalytics(periodStart, periodEnd);
    }

    // Totals
    const totalDistance = workouts.reduce((sum, w) => sum + w.distance, 0);
    const totalDuration = workouts.reduce((sum, w) => sum + w.duration, 0);
    const totalSteps = workouts.reduce((sum, w) => sum + (w.steps || 0), 0);
    const totalCalories = workouts.reduce((sum, w) => sum + (w.calories || 0), 0);

    // Averages
    const workoutsWithSteps = workouts.filter(w => w.steps && w.steps > 0);
    const workoutsWithCadence = workouts.filter(w => w.averageCadence && w.averageCadence > 0);

    const averageDistance = totalDistance / workouts.length;
    const averagePace = workouts.reduce((sum, w) => sum + w.averagePace, 0) / workouts.length;
    const averageCadence = workoutsWithCadence.length > 0
      ? workoutsWithCadence.reduce((sum, w) => sum + (w.averageCadence || 0), 0) / workoutsWithCadence.length
      : 0;

    // PBs
    const longestRun = workouts.reduce((best, w) => 
      w.distance > best.distance ? w : best
    );

    const fastestPace = workouts.reduce((best, w) => 
      w.averagePace < best.averagePace ? w : best
    );

    const mostSteps = workoutsWithSteps.reduce((best, w) => 
      (w.steps || 0) > (best.steps || 0) ? w : best
    , workouts[0]);

    const longestDuration = workouts.reduce((best, w) => 
      w.duration > best.duration ? w : best
    );

    return {
      totalWorkouts: workouts.length,
      totalDistance,
      totalDuration,
      totalSteps,
      totalCalories,
      averageDistance,
      averagePace,
      averageCadence,
      longestRun: {
        workoutId: longestRun.id,
        distance: longestRun.distance,
        date: longestRun.startTime,
      },
      fastestPace: {
        workoutId: fastestPace.id,
        pace: fastestPace.averagePace,
        date: fastestPace.startTime,
      },
      mostSteps: {
        workoutId: mostSteps.id,
        steps: mostSteps.steps || 0,
        date: mostSteps.startTime,
      },
      longestDuration: {
        workoutId: longestDuration.id,
        duration: longestDuration.duration,
        date: longestDuration.startTime,
      },
      periodStart,
      periodEnd,
    };
  }

  // Detect achievements comparing to previous entries
  static detectAchievements(
    newWorkout: WorkoutSession,
    previousWorkouts: WorkoutSession[]
  ): AchievementData[] {
    const achievements: AchievementData[] = [];

    // PB of distance
    const previousLongest = previousWorkouts.reduce(
      (max, w) => Math.max(max, w.distance), 
      0
    );
    if (newWorkout.distance > previousLongest && newWorkout.distance >= 1000) {
      achievements.push({
        workoutId: newWorkout.id,
        achievementType: 'personal_record',
        metric: 'distance',
        value: newWorkout.distance,
        previousBest: previousLongest,
        timestamp: newWorkout.endTime,
      });
    }

    // PB of pace
    const previousFastest = previousWorkouts.reduce(
      (min, w) => w.averagePace > 0 ? Math.min(min, w.averagePace) : min,
      Infinity
    );
    if (newWorkout.averagePace > 0 && newWorkout.averagePace < previousFastest && newWorkout.distance >= 1000) {
      achievements.push({
        workoutId: newWorkout.id,
        achievementType: 'personal_record',
        metric: 'pace',
        value: newWorkout.averagePace,
        previousBest: previousFastest,
        timestamp: newWorkout.endTime,
      });
    }

    // PB of steps
    if (newWorkout.steps) {
      const previousMostSteps = previousWorkouts.reduce(
        (max, w) => Math.max(max, w.steps || 0),
        0
      );
      if (newWorkout.steps > previousMostSteps && newWorkout.steps >= 1000) {
        achievements.push({
          workoutId: newWorkout.id,
          achievementType: 'personal_record',
          metric: 'steps',
          value: newWorkout.steps,
          previousBest: previousMostSteps,
          timestamp: newWorkout.endTime,
        });
      }
    }

    // PB of session duration
    const previousLongestDuration = previousWorkouts.reduce(
      (max, w) => Math.max(max, w.duration),
      0
    );
    if (newWorkout.duration > previousLongestDuration && newWorkout.duration >= 600) {
      achievements.push({
        workoutId: newWorkout.id,
        achievementType: 'personal_record',
        metric: 'duration',
        value: newWorkout.duration,
        previousBest: previousLongestDuration,
        timestamp: newWorkout.endTime,
      });
    }

    // Milestones
    const distanceKm = newWorkout.distance / 1000;
    const milestones = [5, 10, 15, 21.1, 25, 30, 42.2];
    milestones.forEach(milestone => {
      if (distanceKm >= milestone && distanceKm < milestone + 0.5) {
        // First timer check
        const previouslyHit = previousWorkouts.some(w => (w.distance / 1000) >= milestone);
        if (!previouslyHit) {
          achievements.push({
            workoutId: newWorkout.id,
            achievementType: 'milestone',
            metric: 'distance',
            value: milestone,
            timestamp: newWorkout.endTime,
          });
        }
      }
    });

    // Consistency checks for streaks
    const streak = this.calculateCurrentStreak([...previousWorkouts, newWorkout]);
    if (streak >= 3 && streak % 7 === 0) { // Weekly streak
      achievements.push({
        workoutId: newWorkout.id,
        achievementType: 'streak',
        metric: 'consistency',
        value: streak,
        timestamp: newWorkout.endTime,
      });
    }

    return achievements;
  }

  // Calculate current streak
  static calculateCurrentStreak(workouts: WorkoutSession[]): number {
    if (workouts.length === 0) return 0;

    // Sorting date desc.
    const sorted = [...workouts].sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const workout of sorted) {
      const workoutDate = new Date(workout.startTime);
      workoutDate.setHours(0, 0, 0, 0);

      const dayDiff = Math.floor((currentDate.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24));

      if (dayDiff === streak) {
        streak++;
      } else if (dayDiff > streak) {
        break; // Streak broken
      }
    }

    return streak;
  }

  // Template for data over a period of time
  static extractMetricTimeSeries(
    workouts: WorkoutSession[],
    metric: 'distance' | 'pace' | 'steps' | 'cadence' | 'duration' | 'calories'
  ): { date: Date; value: number }[] {
    return workouts
      .map(w => {
        let value = 0;
        switch (metric) {
          case 'distance':
            value = w.distance / 1000;
            break;
          case 'pace':
            value = w.averagePace;
            break;
          case 'steps':
            value = w.steps || 0;
            break;
          case 'cadence':
            value = w.averageCadence || 0;
            break;
          case 'duration':
            value = w.duration / 60;
            break;
          case 'calories':
            value = w.calories || 0;
            break;
        }
        return { date: w.startTime, value };
      })
      .filter(item => item.value > 0)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  // Weekly aggregates
  static getWeeklyAggregates(workouts: WorkoutSession[]): {
    week: string;
    totalDistance: number;
    totalWorkouts: number;
    averagePace: number;
    totalSteps: number;
  }[] {
    const weekMap = new Map<string, WorkoutSession[]>();

    // Grouping by week
    workouts.forEach(workout => {
      const weekKey = this.getWeekKey(workout.startTime);
      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, []);
      }
      weekMap.get(weekKey)!.push(workout);
    });

    // Calculate aggregates for a set week
    return Array.from(weekMap.entries()).map(([week, workouts]) => ({
      week,
      totalDistance: workouts.reduce((sum, w) => sum + w.distance, 0),
      totalWorkouts: workouts.length,
      averagePace: workouts.reduce((sum, w) => sum + w.averagePace, 0) / workouts.length,
      totalSteps: workouts.reduce((sum, w) => sum + (w.steps || 0), 0),
    })).sort((a, b) => a.week.localeCompare(b.week));
  }

  // Helper for week key for sorting
  private static getWeekKey(date: Date): string {
    const year = date.getFullYear();
    const onejan = new Date(year, 0, 1);
    const week = Math.ceil((((date.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
    return `${year}-W${String(week).padStart(2, '0')}`;
  }

  // Helper for empty entries
  private static getEmptyAnalytics(periodStart: Date, periodEnd: Date): WorkoutAnalytics {
    const emptyDate = new Date(0);
    return {
      totalWorkouts: 0,
      totalDistance: 0,
      totalDuration: 0,
      totalSteps: 0,
      totalCalories: 0,
      averageDistance: 0,
      averagePace: 0,
      averageCadence: 0,
      longestRun: { workoutId: '', distance: 0, date: emptyDate },
      fastestPace: { workoutId: '', pace: 0, date: emptyDate },
      mostSteps: { workoutId: '', steps: 0, date: emptyDate },
      longestDuration: { workoutId: '', duration: 0, date: emptyDate },
      periodStart,
      periodEnd,
    };
  }
}
