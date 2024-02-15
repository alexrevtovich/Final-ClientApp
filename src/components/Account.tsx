import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import fetchAccountInfo from '../utils/accountinfo';
import getMyLocation from '../utils/mylocation';
import reverseGeocode from '../utils/reverse'; 

const Account: React.FC = () => {
  const navigate = useNavigate();
  const userEmail = sessionStorage.getItem("userEmail");
  const [userInfo, setUserInfo] = useState({ username: '', email: '', zipcode: '' });
  const [myLocation, setMyLocation] = useState<[number, number]>([0, 0]);
  const [address, setAddress] = useState(''); // State to hold the address

  useEffect(() => {
    if (!userEmail) {
      console.log('No user email found, redirecting to login...');
      navigate('/');
    } else {
      (async () => {
        try {
          const accountInfo = await fetchAccountInfo(userEmail);
          setUserInfo({ username: accountInfo.username, email: accountInfo.email, zipcode: accountInfo.zipcode });
        } catch (error) {
          console.error('Failed to fetch account info:', error);
        }
      })();
    }
  
    // Pass setMyLocation directly to getMyLocation
    getMyLocation(setMyLocation);
  }, [navigate, userEmail, setMyLocation]);
  
  // Use an effect to perform reverse geocoding whenever myLocation changes
  useEffect(() => {
    (async () => {
      if (myLocation[0] !== 0 || myLocation[1] !== 0) { // Assuming [0, 0] is the default state you want to exclude
        const fetchedAddress = await reverseGeocode(myLocation);
        setAddress(fetchedAddress);
      }
    })();
  }, [myLocation]); // Depend on myLocation
  
  
  

  return (
    <div className="account-container">
      <h2>Account Page</h2>
      <div className="account-info">Hello {userInfo.username}</div>
      <div className="account-info">Your email is: {userInfo.email}</div>
      <div className="account-info">Your zipcode is: {userInfo.zipcode}</div>
      <div className="account-info">
        You are here: {address || 'Fetching your address...'}
      </div>
    </div>
  );
};

export default Account;
