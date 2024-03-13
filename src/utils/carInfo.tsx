import axios from 'axios';

const fetchCarInfo = async (uniqueId: string) => {
  try {
    const response = await axios.post('https://s24-final-back.azurewebsites.net/api/GetCarByID', {
      unique_id: uniqueId 
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching car info:', error);
    throw error;
  }
};

export default fetchCarInfo;
