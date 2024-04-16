// deleteCar.tsx
import axios from 'axios';

const deleteCar = async (carId: string) => {
  const payload = { _id: carId };
  console.log('Sending payload:', payload); // This helps to verify the structure

  try {
    const response = await axios.post('https://final-back.azurewebsites.net/api/deleteusercar', payload, {
      headers: {
        'Content-Type': 'application/json', // Explicitly set Content-Type
      },
    });
    console.log('Deletion successful:', response.data); // This can help to confirm the response structure
    return response.data;
  } catch (error) {
    console.error('Error deleting car:', error);
    throw error;
  }
};

export default deleteCar;
