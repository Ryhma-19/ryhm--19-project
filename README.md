# Wellness - Fitness Tracking App

A React Native mobile application that helps users track their outdoor activities, plan routes, monitor steps, and stay informed about weather conditions.

## Features

- 🏃 **Workout Tracking** – Track distance, duration, speed, and route coordinates during outdoor activities
- 🗺️ **Route Planning & Management** – Create, save, and revisit favorite running/walking routes
- 👟 **Step Counter** – Real-time step counting with daily goals and notifications
- 🌦️ **Weather Integration** – Real-time weather updates via Finnish Meteorological Institute (FMI) API
- 🔐 **User Authentication** – Secure sign-up and login with Firebase
- 📊 **Fitness Stats** – View cumulative workouts, distance, streaks, and achievements
- 🌙 **Dark Mode Support** – Customizable theme preferences
- 📱 **Offline Support** – Local caching for routes and step data

## Tech Stack

- **Framework:** React Native (Expo)
- **Language:** TypeScript
- **State Management:** React Context API
- **Navigation:** React Navigation (Stack & Tab navigators)
- **Backend:** Firebase (Authentication + Firestore)
- **Location & Sensors:** Expo Location, Expo Sensors (Pedometer)
- **Maps:** React Native Maps
- **Weather API:** Finnish Meteorological Institute (FMI) WFS API
- **Local Storage:** AsyncStorage
- **Notifications:** Expo Notifications
- **Package Manager:** npm

## Prerequisites

- Node.js 16+ and npm
- Expo CLI: `npm install -g expo-cli`
- Android emulator or physical Android device (for Android builds)
- Xcode 14+ (for iOS builds on macOS)
- Firebase project with authentication and Firestore enabled
- FMI API access (public – no auth required)

## Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd ryhma-19-project
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the project root with your Firebase credentials:
   ```
   FIREBASE_API_KEY=your_api_key
   FIREBASE_AUTH_DOMAIN=your_auth_domain
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_STORAGE_BUCKET=your_storage_bucket
   FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   FIREBASE_APP_ID=your_app_id
   ```

## Running the App

### Development Server
```bash
npm start
```
This starts the Expo development server. Scan the QR code with Expo Go app (iOS/Android).

### Android
```bash
npm run android
```
Builds and runs the app on Android emulator or connected device.

### iOS (macOS only)
```bash
npm run ios
```
Builds and runs the app on iOS simulator or connected device.

### Web (Preview)
```bash
npm run web
```
Runs the app in a web browser (limited functionality for mobile-specific features).

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── common/          # Shared components (WeatherCard, etc.)
│   ├── map/             # Map-related components (MapView, RoutePlanner)
│   └── routes/          # Route-specific components (RouteCard, RouteNameModal)
├── constants/           # Configuration and theme constants
│   ├── config.ts        # App configuration (API URLs, timings, milestones)
│   ├── theme.ts         # Colors and typography
│   └── mapConfig.ts     # Map-specific defaults
├── contexts/            # React Context for state management
│   ├── AuthContext.tsx  # Authentication and user state
│   └── steps/           # Step tracking context
├── hooks/               # Custom React hooks
│   └── useWeather.ts    # Weather fetching hook
├── navigation/          # React Navigation setup
│   └── AppNavigator.tsx # Stack and tab navigation configuration
├── screens/             # Full-screen components (one per route)
│   ├── auth/            # Login and signup screens
│   ├── home/            # Home dashboard
│   ├── profile/         # User profile and settings
│   ├── routes/          # Route listing and planning
│   ├── steps/           # Step counter and daily goals
│   └── tracking/        # Active workout tracking
├── services/            # Business logic and external API integration
│   ├── firebase/        # Firebase auth, Firestore, routing
│   ├── location/        # GPS and location services
│   ├── map/             # Direction and mapping utilities
│   ├── steps/           # Pedometer and step persistence
│   ├── storage/         # AsyncStorage management
│   └── weather/         # FMI API weather service
├── types/               # TypeScript type definitions
│   ├── index.ts         # Core types (User, Route, Workout, etc.)
│   ├── navigation.ts    # React Navigation param lists
│   └── env.d.ts         # Environment variable types
└── utils/               # Utility functions
    └── routeUtils.ts    # Route calculation helpers

App.tsx                  # Root component with Context providers
app.config.js            # Expo app configuration
package.json             # Dependencies and scripts
tsconfig.json            # TypeScript configuration
babel.config.js          # Babel configuration for Expo
```

## Key Concepts

### Authentication Flow
1. User signs up/logs in via Firebase
2. AuthContext manages global user state
3. Protected screens render only when `user !== null`
4. DEV_AUTH_BYPASS flag allows testing without Firebase

### Step Tracking
- Real-time pedometer updates via `Pedometer.watchStepCount()`
- Daily steps stored locally (AsyncStorage) and in Firestore
- Goal notifications sent once per day when target reached
- Syncs across devices when user logs in

### Route Management
- Routes stored as coordinate arrays in Firestore
- RoutePlanning screen captures live GPS coordinates
- Directions service calculates total distance and duration
- Offline support via route caching

### Weather Integration
- FMI API returns XML with temperature, humidity, wind speed
- 30-minute cache to reduce API calls
- Fallback to bounding box query if point query fails
- Weather snapshot saved with each workout

## Development Tips

### Bypass Authentication Locally
In [src/constants/config.ts](src/constants/config.ts), set `DEV_AUTH_BYPASS: true` to skip Firebase login during development.

### Permission Testing
- Location and Pedometer permissions must be granted manually on device
- iOS: Settings → App Name → enable Location, Health
- Android: Settings → Apps → App Name → Permissions

### Debugging
- Use `console.log()` statements; view logs via `npm start` terminal
- React DevTools available in Expo Go app settings
- Network requests to FMI API are logged before execution

### Clearing Cache
```javascript
// In code or React DevTools console
import { StorageService } from './src/services/storage/storage.service';
StorageService.clearAll();
```

## Configuration

All app-wide settings are in [src/constants/config.ts](src/constants/config.ts):
- API endpoints and endpoints
- Location tracking intervals
- Workout notification thresholds
- Achievement distance/streak milestones
- Cache expiration times

Modify these without changing business logic files.

## Contributing

1. Create a feature branch from `main`: `git checkout -b feature/your-feature`
2. Make changes following the [Copilot Instructions](.github/copilot-instructions.md)
3. Test on Android/iOS before pushing
4. Submit a pull request with a clear description
5. Ensure all types pass TypeScript checks: `npx tsc --noEmit`

## Troubleshooting

### App Won't Start
- Clear cache: `npm start` → press `c`
- Delete node_modules: `rm -rf node_modules && npm install`
- Check Firebase credentials in `.env`

### Permissions Denied
- Restart app and grant permissions when prompted
- iOS: Settings → Privacy → grant Location and Health permissions
- Android: Settings → Apps → Wellness → Permissions

### Location/Weather Not Working
- Ensure location permissions are granted
- Check device GPS is enabled
- Verify FMI API is accessible (test with curl)
- Check `.env` Firebase configuration

### Map Not Rendering
- Verify `react-native-maps` is properly installed
- On Android, ensure Google Play Services are installed
- Restart the app and clear cache if needed

## License

This project is part of the Ryhma-19 group project.

## Support

For issues or questions, contact the development team or create an issue in the repository.
