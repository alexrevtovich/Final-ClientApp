const reverseGeocode = async (coordinates: [number, number]): Promise<string> => {
  const [latitude, longitude] = coordinates;

  // Check for null values and return an empty string if found
  if (latitude === null || longitude === null) {
      console.error('Invalid coordinates: Latitude or Longitude is null.');
      return '';
  }

  const url = 'https://final-back.azurewebsites.net/api/reversegeocode';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Latitude: latitude,
        Longitude: longitude
      }),
    });

    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    const data = await response.json();

    // Assuming the Azure Function returns just the address as a string in the response body
    // If the structure is different, adjust the parsing accordingly
    if (data) {
      return data;
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
