import axios from 'axios';

const chargeCar = async (payload: any) => {
  try {
    // Make a POST request to the charging endpoint
    const response = await axios.post('https://final-back.azurewebsites.net/api/Charging', payload);
    console.log('Charging request successful:', response.data);
    // Handle success, e.g., display a success message to the user
    alert('Charging request sent successfully!');
  } catch (error) {
    console.error('Error charging the car:', error);
    // Handle error, e.g., display an error message to the user
    alert('Failed to charge the car. Please try again later.');
  }
};
export default chargeCar;