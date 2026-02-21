# Wellness - Fitness Tracking App

A React Native mobile application designed to help you track your outdoor activities, plan running routes, monitor daily steps, and stay updated with real-time weather conditions. Stay motivated, reach your goals, and explore your surroundings.

## Project video 

- Advanced Mobile Video
- 
[![Video thumbnail](https://img.youtube.com/vi/VBdp5gDnmTQ/0.jpg)](https://www.youtube.com/watch?v=VBdp5gDnmTQ)

- Project video (projekti esitys video)
- 
[![Video thumbnail](https://img.youtube.com/vi/OUYUatczlGM/0.jpg)](https://www.youtube.com/watch?v=OUYUatczlGM)

## Features

- 🏃 **Real-Time Workout Tracking** – Capture distance, duration, speed, and your exact route while exercising outdoors
- 🗺️ **Smart Route Planning** – Save your favorite running paths and routes for future use
- 👟 **Step Counter with Goals** – Track daily steps with customizable goals and receive notifications when you hit them
- 🌦️ **Live Weather Updates** – Stay informed with real-time weather data integrated directly into your workouts
- 🔐 **Secure Authentication** – Your data is protected with secure Firebase authentication
- 📊 **Detailed Activity Stats** – View your weekly and monthly progress with breakdown statistics
- 🌙 **Light & Dark Mode** – Customize the app appearance to match your preferences
- 📱 **Fully Offline Capable** – All your data syncs to the cloud, but works great offline too

## What's Built In

- **React Native + Expo** – Cross-platform mobile app framework
- **TypeScript** – Type-safe code development
- **Firebase Backend** – Secure cloud storage and authentication
- **GPS & Sensor Integration** – Real pedometer and location tracking, Accelerometer
- **Interactive Maps** – Built-in map visualization for your routes
- **Weather API Integration** – Finnish Meteorological Institute weather data
- **Local Data Caching** – Works offline with automatic cloud sync

## Getting Started

### Requirements
- Node.js 16 or newer
- Expo CLI installed (`npm install -g expo-cli`)
- An Android/iOS device or emulator
- Firebase project (sign up at firebase.google.com)

### Setup Instructions

1. **Clone this project:**
   ```bash
   git clone <repository-url>
   cd ryhma-19-project
   ```

2. **Install all dependencies:**
   ```bash
   npm install
   ```

3. **Create a `.env` file** with your Firebase credentials:
   ```
   FIREBASE_API_KEY=your_key_here
   FIREBASE_AUTH_DOMAIN=your_domain.firebaseapp.com
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_STORAGE_BUCKET=your_bucket.appspot.com
   FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   FIREBASE_APP_ID=your_app_id
   ```

## Running the App

**Start development:**
```bash
npm start
```
Scan the QR code with Expo Go app to test on your phone.

**Run on Android:**
```bash
npm run android
```

**Run on iOS (Mac only):**
```bash
npm run ios
```

## Project Layout

```
src/
├── components/           # UI building blocks
│   ├── common/          # Reusable cards and widgets
│   ├── map/             # Map components
│   └── routes/          # Route UI components
├── constants/           # App configuration and styling
├── contexts/            # Global state management
├── hooks/               # Custom React utilities
├── navigation/          # App routing setup
├── screens/             # Full page screens
├── services/            # API and data handling
│   ├── firebase/        # Backend integration
│   ├── location/        # GPS services
│   ├── motion/          # Speed and movement tracking
│   ├── steps/           # Step counting
│   └── weather/         # Weather data
├── types/               # TypeScript definitions
└── utils/               # Helper functions

App.tsx                  # Root app component
```

## Key Features Explained

### How Steps Tracking Works
The app uses your device's built-in pedometer to count steps throughout the day. Your daily count is saved locally and synced to our servers. Set a goal, and you'll get a notification when you hit it!

### Route Tracking & Maps
When you go for a run or walk, the app records your GPS path in real-time. These routes are saved so you can see exactly where you went, how far, and how long it took.

### Speed Monitoring
Using GPS technology, the app continuously monitors your current speed, calculates average speed, and tracks your fastest pace during any activity.

### Weather Integration
Real-time weather information is pulled from Finnish Meteorological Institute and displayed on your home screen so you can see if you need a jacket before heading out.

## Tips for Using the App

**Testing without Firebase?**
You can enable dev mode in `src/constants/config.ts` to skip login during development.

**Permissions**
Make sure to grant location and health/fitness permissions when the app first asks. This is required for tracking to work.

**Clear Your Data**
If you want to start fresh, you can clear all local data from the app settings.

**Faster Syncing**
Your activity data syncs to the cloud automatically, but you can also manually refresh by pulling down on the home screen.

## Troubleshooting

**App won't start?**
- Clear your cache: `npm start -- --clear`
- Reinstall dependencies: `rm -rf node_modules && npm install`

**Location/steps not tracking?**
- Check app permissions in your device settings
- Make sure location services are enabled
- Try restarting the app

**Firebase errors?**
- Verify your `.env` file has correct credentials
- Check that your Firebase project allows email/password auth
- Make sure Firestore is enabled in your Firebase console

## Project Team

Built by Group 19 as a group project.
By

-Veikka Koskinen

-Topias Perälä

-Niko Alaluusua

## License

This project is available for educational and personal use.
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
