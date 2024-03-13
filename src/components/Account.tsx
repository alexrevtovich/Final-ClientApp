// Account.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import fetchAccountInfo from '../utils/accountinfo';
import getMyLocation from '../utils/mylocation';
import reverseGeocode from '../utils/reverse';
import AddCar from '../utils/addCar';
import fetchCarInfo from '../utils/carInfo';

const Account: React.FC = () => {
  const navigate = useNavigate();
  const userEmail = sessionStorage.getItem("userEmail");
  const [userInfo, setUserInfo] = useState({ username: '', email: '', mainCar: '' });
  const [carInfo, setCarInfo] = useState<{ brand: string, model: string, releaseYear: number, charge: number } | null>(null);
  const [myLocation, setMyLocation] = useState<[number, number]>([0, 0]);
  const [address, setAddress] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!userEmail) {
      console.log('No user email found, redirecting to login...');
      navigate('/');
    } else {
      (async () => {
        try {
          const accountInfo = await fetchAccountInfo(userEmail);
          setUserInfo(accountInfo); // Adjusted to store the entire account info response

          // Fetch car info based on user's main car unique ID
          if (accountInfo.mainCar) {
            const carInfo = await fetchCarInfo(accountInfo.mainCar);
            setCarInfo(carInfo);
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

  const toggleModal = () => setShowModal(!showModal);

  const handleUpdateCar = () => {
    setShowModal(false);
    // Logic to handle updating car information
  };

  return (
    <div className="account-container">
      <h2>Account Page</h2>
      <div className="account-info">Hello {userInfo.username}</div>
      <div className="account-info">Your email is: {userInfo.email}</div>
      <div className="account-info">Main Car ID: {userInfo.mainCar || "None"}</div>
      <div className="account-info">
        Your car is: {carInfo ? `${carInfo.brand} ${carInfo.model} (${carInfo.releaseYear}) - ${carInfo.charge}%` : 'No car info'} 
        <button onClick={toggleModal}>Add Car</button>
      </div>
      <div className="account-info">
        You are here: {address || 'Fetching your address...'}
      </div>
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
