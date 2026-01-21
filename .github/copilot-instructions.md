# Copilot Instructions for Wellness App (React Native / Expo)

## Architecture Overview

**Tech Stack**: React Native with Expo, Firebase (Auth + Firestore), React Navigation, TypeScript

**Project Structure**:
- `App.tsx`: Root component providing auth and steps context
- `src/contexts/`: Global state (AuthContext, StepsContext)
- `src/services/`: Business logic layer (Firebase, steps tracking, weather, storage)
- `src/screens/`: UI components organized by feature
- `src/navigation/`: React Navigation setup (stack + tabs)
- `src/constants/`: Theme and config values

## Data Flow & State Management

**Auth Flow**: 
- `AuthContext` listens to `onAuthStateChanged` from Firebase
- `AuthService` handles sign-up/sign-in/sign-out with Firestore user profile creation
- User profile stored in Firestore at `users/{uid}`

**Steps Tracking** (dual persistence pattern):
- `StepsContext` watches device pedometer via `expo-sensors/Pedometer`
- Real-time steps synced locally to AsyncStorage AND to Firestore (subcollection `users/{uid}/steps/{dateKey}`)
- On app init: load local → load remote (if user logged in) → start pedometer listener
- On steps change: persist locally + sync to Firestore if authenticated
- `DailySteps` type: `{date: string (YYYY-MM-DD), steps: number, updatedAt: Date}`
- **Daily Goals**: Stored per-user (Firestore at `users/{uid}/goals/dailySteps`), with default of 8000 steps
- **Notifications**: Triggers when daily goal is reached (sent once per day via `expo-notifications`)
- **Weekly/Monthly Views**: Data fetched from Firestore subcollections, grouped by ISO week number and month

**Context Integration Pattern**:
- Both contexts wrap `App.tsx` → children inherit via `useAuth()` and `useSteps()` hooks
- `StepsContext` depends on `useAuth()` for user ID during sync

## Service Layer Conventions

**Firebase Setup** (`src/services/firebase/config.ts`):
- Environment variables via `react-native-dotenv` (`.env` file required)
- Exports: `auth`, `db` singletons initialized once

**Service Classes** (static methods):
- `AuthService`: static methods for auth operations + user profile CRUD
- `StepsService`: object with async methods (not class) - handles local + remote persistence
- All services handle error logging to console but throw errors up for context/component handling

**Error Handling**: Services throw descriptive errors; contexts/screens catch and manage UX

## Key Development Patterns

**Type Safety**:
- All data models in `src/types/index.ts` (User, Route, Coordinate, DailySteps, StepsGoal, WeeklyStepsData, MonthlyStepsData)
- React Navigation type: `MainTabParamList` for tab route typing
- Function components use `React.FC<Props>` pattern with explicit return types where needed

**Steps Screen Views**:
- Tabs toggle between Daily/Weekly/Monthly views (state: `viewType`)
- **Daily**: Current step count, progress bar, goal status, "Set Goal" button → modal with number input
- **Weekly**: ISO week data with bar chart for 7 days showing progression
- **Monthly**: Weeks grouped by month with daily step bars, total aggregates
- Goals are fetched from Firestore and cached locally; notifications require user permission (requested on app boot)

**Navigation**:
- Conditional rendering: `AuthNavigator` (stack: Login/Signup) vs `MainNavigator` (tabs: Home/Routes/Track/Steps/Profile)
- Tab icons use Ionicons with focused/unfocused variants
- `COLORS` from `src/constants/theme.ts` for consistent theming

**Async Dependencies**:
- Use `useEffect` cleanup for subscriptions (e.g., Pedometer, auth listeners)
- Check feature availability before use (e.g., `Pedometer.isAvailableAsync()`)
- Unsubscribe on unmount to prevent memory leaks

## Build & Run Commands

```bash
npm start          # Start Expo dev server
npm run android    # Build/run on Android emulator
npm run ios        # Build/run on iOS simulator
npm run web        # Run web version
```

## Testing & Debugging Tips

- Use `console.log()` for quick debugging (visible in Expo terminal)
- Check `StepsContext` logs: "Pedometer available:" + "Step event:" to verify sensor integration
- AsyncStorage inspection: `AsyncStorage.getItem('stepsToday')` in debug console
- Firebase rules must allow `users/{uid}` read/write and subcollections for steps sync

## Important Gotchas & Dependencies

1. **Pedometer requires Android 8+ or iOS 8+** - always check `isAvailableAsync()` before subscribing
2. **Date key format**: All step data uses `YYYY-MM-DD` string (ISO format slice 0-10), not timestamps
3. **Local persistence is mandatory** - even if Firestore sync fails, local steps remain available
4. **React Navigation stack/tab nesting**: Auth state determines which navigator renders; no nested auth routes
5. **Firebase Firestore path**: Steps are stored as subcollection, not top-level collection
6. **Expo-specific**: Use `@env` imports for env vars, not `process.env`

## Next Steps Template

When adding features, follow this checklist:
- [ ] Define types in `src/types/index.ts`
- [ ] Create service logic in `src/services/` (Firebase or local)
- [ ] Add context if global state needed (`src/contexts/`)
- [ ] Create screen in `src/screens/{feature}/` with hooks
- [ ] Register route in `AppNavigator.tsx` (tab/stack)
- [ ] Import theme colors from `src/constants/theme.ts`
