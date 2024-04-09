const getMyLocation = (setLocation: React.Dispatch<React.SetStateAction<[number, number]>>) => {
  const defaultLocation: [number, number] = [29.7174, -95.4028];

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Check explicitly for null values along with type check
        if (position.coords.latitude !== null && position.coords.longitude !== null && 
            typeof position.coords.latitude === 'number' && typeof position.coords.longitude === 'number') {
          setLocation([position.coords.latitude, position.coords.longitude]);
        } else {
          console.error('Invalid geolocation response: Received null coordinates.');
          setLocation(defaultLocation);
        }
      },
      (error) => {
        // Error callback for when obtaining the location fails
        console.error('Error getting location:', error);
        setLocation(defaultLocation);
      }
    );
  } else {
    // Fallback for when geolocation is not supported by the browser
    console.log('Geolocation is not supported by this browser.');
    setLocation(defaultLocation);
  }
};

export default getMyLocation;
