import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { BackgroundAccelerometerService } from '../../services/motion/backgroundAccelerometerService';
import { AccelerometerService, SpeedData } from '../../services/motion/accelerometerService';

interface MotionContextValue {
  currentSpeed: number; 
  speedData: SpeedData | null;
  loading: boolean;
}

const MotionContext = createContext<MotionContextValue>({
  currentSpeed: 0,
  speedData: null,
  loading: true,
});

export const useMotion = () => useContext(MotionContext);

export const MotionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [speedData, setSpeedData] = useState<SpeedData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Initialize accelerometer tracking
  useEffect(() => {
    const init = async () => {
      try {
        // Load existing data
        const localData = await AccelerometerService.loadLocalSpeedData();
        if (localData) {
          setSpeedData(localData);
          setCurrentSpeed(localData.currentSpeed);
        } else {
          setSpeedData(AccelerometerService.getInitialSpeedData());
        }

        // Start accelerometer tracking
        await BackgroundAccelerometerService.startTracking();

        setLoading(false);
      } catch (err) {
        console.error('Error initializing motion context:', err);
        setLoading(false);
      }
    };

    init();

    return () => {
      BackgroundAccelerometerService.stopTracking();
    };
  }, []);

  // Update speed display every 5sek
  useEffect(() => {
    const interval = setInterval(() => {
      const speed = BackgroundAccelerometerService.getCurrentSpeed();
      const data = BackgroundAccelerometerService.getSpeedData();
      
      setCurrentSpeed(speed);
      if (data) {
        setSpeedData(data);
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Sync to Firestore when user is logged in and data changes
  useEffect(() => {
    if (user && speedData) {
      const syncInterval = setInterval(() => {
        BackgroundAccelerometerService.syncData(user.id);
      }, 60000);

      return () => clearInterval(syncInterval);
    }
  }, [user, speedData]);

  return (
    <MotionContext.Provider value={{ currentSpeed, speedData, loading }}>
      {children}
    </MotionContext.Provider>
  );
};
