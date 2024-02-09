const getMyLocation = (setLocation: React.Dispatch<React.SetStateAction<[number, number]>>) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error('Error getting location:', error);
          // You might want to set a default location or handle the error differently here
        }
      );
    } else {
      console.log('Geolocation is not supported by this browser.');
      // Handle the case where geolocation is not supported
    }
  };
  
  export default getMyLocation;
  