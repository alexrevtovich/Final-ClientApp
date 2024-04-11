import { useEffect, useState } from 'react';

export const useTrackLocation = () => {
  const [location, setLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
    let watchId: number;

    const success = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      setLocation([latitude, longitude]);
    };

    const error = (error: GeolocationPositionError) => {
      console.error('Error watching position:', error);
      setLocation(null); // You could handle errors differently
    };

    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(success, error, {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 5000,
      });
    }

    // Cleanup function to stop watching location when the component unmounts
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  return location;
};

export default useTrackLocation;
