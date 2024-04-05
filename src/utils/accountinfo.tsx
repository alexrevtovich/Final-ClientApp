import axios from 'axios';

const fetchAccountInfo = async (email: string) => {
  try {
    const response = await axios.post('http://localhost:7071/api/accountinfo', {
      email
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching account info:', error);
    throw error;
  }
};

export default fetchAccountInfo;
