const getMyLocation = (setLocation: React.Dispatch<React.SetStateAction<[number, number]>>) => {
  const defaultLocation: [number, number] = [29.7174, -95.4028];

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (typeof position.coords.latitude === 'number' && typeof position.coords.longitude === 'number') {
          setLocation([position.coords.latitude, position.coords.longitude]);
        } else {
          console.error('Invalid geolocation response');
          setLocation(defaultLocation);
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        setLocation(defaultLocation);
      }
    );
  } else {
    console.log('Geolocation is not supported by this browser.');
    setLocation(defaultLocation);
  }
};

  
  export default getMyLocation;
  