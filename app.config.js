import 'dotenv/config';

const required = [
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_MESSAGING_SENDER_ID',
  'FIREBASE_APP_ID',
  'GOOGLE_MAPS_API_KEY',
];

function requireEnv(name) {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(
      `Missing required environment variable: ${name}\n` +
      `Add it to your .env file (local dev) or EAS secrets (cloud builds)\n` +
      `Check the project documentation for setup instructions`
    );
  }
  return value;
}

export default ({ config }) => {
  // Validate all required environment variables on startup
  required.forEach(requireEnv);

  return {
    ...config,
  "expo": {
    "name": "wellness",
    "slug": "wellness",
    "version": "1.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "light",

    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },

    "assetBundlePatterns": [
      "**/*"
    ],

    "extra": {
      "eas": {
        "projectId": "6ee678f7-c05b-4815-a9bd-3c5e4fd3e208"
      },
       firebase: {
          apiKey: process.env.FIREBASE_API_KEY,
          authDomain: process.env.FIREBASE_AUTH_DOMAIN,
          projectId: process.env.FIREBASE_PROJECT_ID,
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.FIREBASE_APP_ID,
        },
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
      },

    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourname.wellness",
      "config": {
        "googleMapsApiKey": process.env.GOOGLE_MAPS_API_KEY
      },
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "We need your location to track your workouts and show nearby routes.",
        "NSLocationAlwaysAndWhenInUseUsageDescription": "We need your location to track your workouts in the background.",
        "NSMotionUsageDescription": "We need access to your motion data to count steps during workouts."
      }
    },

    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.yourname.wellness",
      "config": {
        "googleMaps": {
          "apiKey": process.env.GOOGLE_MAPS_API_KEY
        }
      },
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION",
        "ACTIVITY_RECOGNITION"
      ]
    },

    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow Wellness to use your location to track workouts."
        }
      ],
      "expo-font"
    ]
  }
};
};
