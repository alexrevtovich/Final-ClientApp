import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import fetchAccountInfo from '../utils/accountinfo';
import getMyLocation from '../utils/mylocation';
import reverseGeocode from '../utils/reverse';
import AddCar from '../utils/addCar';
import fetchCarInfo from '../utils/carInfo';
import deleteCar from '../utils/deleteCar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashAlt } from '@fortawesome/free-solid-svg-icons';


interface CarDetail {
  uniqueId: string; // Updated to match the backend response
  brand: string;
  model: string;
  releaseYear: number;
  charge?: number;
}


const Account: React.FC = () => {
  const navigate = useNavigate();
  const userEmail = sessionStorage.getItem("userEmail");
  const [userInfo, setUserInfo] = useState({ username: '', email: '', mainCar: '', cars: [] });
  const [carInfo, setCarInfo] = useState<CarDetail | null>(null);
  const [carsInfo, setCarsInfo] = useState<CarDetail[]>([]);
  const [myLocation, setMyLocation] = useState<[number, number]>([0, 0]);
  const [address, setAddress] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showCarsList, setShowCarsList] = useState(false);

  useEffect(() => {
    if (!userEmail) {
      console.log('No user email found, redirecting to login...');
      navigate('/');
    } else {
      (async () => {
        try {
          const accountInfo = await fetchAccountInfo(userEmail);
          setUserInfo(accountInfo);

          if (accountInfo.mainCar && accountInfo.mainCar !== "None") {
            const mainCarInfo = await fetchCarInfo(accountInfo.mainCar);
            setCarInfo(mainCarInfo);
          }
        } catch (error) {
          console.error('Failed to fetch account info:', error);
        }
      })();
    }
    getMyLocation(setMyLocation);
  }, [navigate, userEmail]);

  useEffect(() => {
    (async () => {
      if (myLocation[0] !== 0 || myLocation[1] !== 0) {
        const fetchedAddress = await reverseGeocode(myLocation);
        setAddress(fetchedAddress);
      }
    })();
  }, [myLocation]);

  useEffect(() => {
    const fetchCarsInfo = async () => {
      const carsDetailsPromises = userInfo.cars.map(carId => fetchCarInfo(carId));
      try {
        const carsDetails = await Promise.all(carsDetailsPromises);
        console.log(carsDetails);
        setCarsInfo(carsDetails.filter(car => car !== null));
      } catch (error) {
        console.error('Error fetching cars details:', error);
      }
    };

    if (userInfo.cars.length > 0) {
      fetchCarsInfo();
    }
  }, [userInfo.cars]);

  const toggleModal = () => setShowModal(!showModal);

  const handleUpdateCar = () => {
    setShowModal(false);
    // Logic to handle updating car information
  };

  const toggleCarsList = () => setShowCarsList(!showCarsList);

  const handleDeleteCar = async (uniqueId: string) => {
    if (!uniqueId) {
      console.error('Unique ID is undefined, cannot delete.');
      return;
    }
    try {
      await deleteCar(uniqueId);
      // Update carsInfo state to remove the deleted car
      const updatedCarsInfo = carsInfo.filter(car => car.uniqueId !== uniqueId);
      setCarsInfo(updatedCarsInfo);
  
      // Check if the deleted car was the main car
      if (userInfo.mainCar === uniqueId) {
        // Update userInfo with a new main car or set to '' if no cars left
        const newMainCar = updatedCarsInfo.length > 0 ? updatedCarsInfo[0].uniqueId : '';
        setUserInfo({
          ...userInfo,
          mainCar: newMainCar
        });
  
        // Update carInfo with details of the new main car or set to null if no cars left
        if (newMainCar) {
          const newMainCarInfo = await fetchCarInfo(newMainCar);
          setCarInfo(newMainCarInfo);
        } else {
          setCarInfo(null); // Set carInfo to null to indicate "No car info"
        }
      }
    } catch (error) {
      console.error('Failed to delete car:', error);
    }
  };
  
  
  

  return (
    <div className="account-container">
      <h2>Account Page</h2>
      <div className="account-info">Hello {userInfo.username}</div>
      <div className="account-info">Your email is: {userInfo.email}</div>
      <div className="account-info">
        You are here: {address || 'Fetching your address...'}
      </div>
      <div className="account-info">
        Your car is: {carInfo ? `${carInfo.brand} ${carInfo.model} (${carInfo.releaseYear}) - ${carInfo.charge}%` : 'No car info'} 
        
      </div>
      
      <button onClick={toggleCarsList}>{showCarsList ? 'Hide' : 'Show'} My Garage</button>
      {showCarsList && (
        <div className="cars-list">
          <ul>
          {carsInfo.map((car, index) => (
            <li key={index}>
              {`${car.brand} ${car.model} (${car.releaseYear})`}
              <button 
                onClick={() => handleDeleteCar(car.uniqueId)} 
                className="delete-btn">
                <FontAwesomeIcon icon={faTrashAlt} className="delete-icon"/>
              </button>
            </li>
          ))}




          </ul>
          <button onClick={toggleModal}>Add Car</button>
        </div>
      )}
      {showModal && (
        <div className="modal">
          <button className="close-modal" onClick={toggleModal}>X</button>
          <AddCar onUpdateCar={handleUpdateCar} />
        </div>
      )}
    </div>
  );
};

export default Account;
