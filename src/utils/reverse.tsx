const reverseGeocode = async (coordinates: [number, number]): Promise<string> => {
  const [latitude, longitude] = coordinates;

  // Check for null values and return an empty string if found
  if (latitude === null || longitude === null) {
      console.error('Invalid coordinates: Latitude or Longitude is null.');
      return '';
  }

  const subscriptionKey = process.env.REACT_APP_AZURE_MAPS_SUBSCRIPTION_KEY;
  const url = `https://atlas.microsoft.com/search/address/reverse/json?api-version=1.0&query=${latitude},${longitude}&subscription-key=${subscriptionKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.addresses && data.addresses.length > 0) {
      const address = data.addresses[0].address.freeformAddress;
      return address;
    } else {
      console.log('No address found for these coordinates.');
      return '';
    }
  } catch (error) {
    console.error('Error during reverse geocoding:', error);
    return '';
  }
};

export default reverseGeocode;
