import { Pedometer } from 'expo-sensors';
import { StepsService } from './stepsService';
import AsyncStorage from '@react-native-async-storage/async-storage';

let BackgroundFetch: any = null;
let TaskManager: any = null;

// Try to load background fetch packages if available
try {
  BackgroundFetch = require('expo-background-fetch');
  TaskManager = require('expo-task-manager');
} catch (err) {
  console.warn('[BG] Background fetch modules not available, background syncing disabled');
}

const BACKGROUND_STEPS_TASK = 'BACKGROUND_STEPS_TASK';

// Register background task only if modules are available
if (BackgroundFetch && TaskManager) {
  TaskManager.defineTask(BACKGROUND_STEPS_TASK, async () => {
    try {
      const isAvailable = await Pedometer.isAvailableAsync();
      if (!isAvailable) {
        return BackgroundFetch.BackgroundFetchResult.NoData;
      }

      const startTime = new Date();
      startTime.setHours(0, 0, 0, 0); // Start of today

      const endTime = new Date();
      endTime.setHours(23, 59, 59, 999); // End of today

      // Get steps from pedometer for the current day
      const result = await Pedometer.getStepCountAsync(startTime, endTime);

      if (result.steps) {
        // Save locally
        await StepsService.saveLocalSteps(result.steps);

        // Sync to Firestore if user is logged in
        const userIdRaw = await AsyncStorage.getItem('userId');
        if (userIdRaw) {
          const userId = JSON.parse(userIdRaw);
          await StepsService.syncToFirestore(userId, result.steps);
        }

        console.log('[BG] Background steps synced:', result.steps);
      }

      return BackgroundFetch.BackgroundFetchResult.NewData;
    } catch (err) {
      console.error('[BG] Error in background steps task:', err);
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
  });
}

export const BackgroundStepsService = {
  // Register background task (call this on app startup)
  async registerBackgroundTask(): Promise<void> {
    if (!BackgroundFetch || !TaskManager) {
      console.log('[BG] Background fetch not available, skipping registration');
      return;
    }

    try {
      // Check if task is already registered
      const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_STEPS_TASK);
      if (isRegistered) {
        console.log('[BG] Background steps task already registered');
        return;
      }

      await BackgroundFetch.registerTaskAsync(BACKGROUND_STEPS_TASK, {
        minimumInterval: 60 * 15, // 15 minutes - minimum sync interval
        stopOnTerminate: false,
        startOnBoot: true,
      });

      console.log('[BG] Background steps task registered');
    } catch (err) {
      console.error('[BG] Error registering background task:', err);
    }
  },

  // Unregister background task (call on logout)
  async unregisterBackgroundTask(): Promise<void> {
    if (!BackgroundFetch || !TaskManager) {
      return;
    }

    try {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_STEPS_TASK);
      if (isRegistered) {
        await BackgroundFetch.unregisterTaskAsync(BACKGROUND_STEPS_TASK);
        console.log('[BG] Background steps task unregistered');
      }
    } catch (err) {
      console.error('[BG] Error unregistering background task:', err);
    }
  },
};
