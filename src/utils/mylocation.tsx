const getMyLocation = (setLocation: React.Dispatch<React.SetStateAction<string>>) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = `Latitude: ${position.coords.latitude}, Longitude: ${position.coords.longitude}`;
          setLocation(location);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocation('Unable to retrieve location');
        }
      );
    } else {
      console.log('Geolocation is not supported by this browser.');
      setLocation('Geolocation not supported');
    }
  };
  
  export default getMyLocation;
  