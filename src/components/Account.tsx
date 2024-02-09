import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import fetchAccountInfo from '../utils/accountinfo';
import getMyLocation from '../utils/mylocation';

const Account: React.FC = () => {
  const navigate = useNavigate();
  const userEmail = sessionStorage.getItem("userEmail");
  const [userInfo, setUserInfo] = useState({ username: '', email: '', zipcode: '' });
  // Initialize myLocation as a tuple with a default location OEDK
  const [myLocation, setMyLocation] = useState<[number, number]>([0, 0]); // Use a sensible default like [0, 0]


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

    getMyLocation(setMyLocation); // Fetch user's location
  }, [navigate, userEmail]);

  
  return (
    <div className="account-container">
      <h2>Account Page</h2>
      <div className="account-info">Hello {userInfo.username}</div>
      <div className="account-info">Your email is: {userInfo.email}</div>
      <div className="account-info">Your zipcode is: {userInfo.zipcode}</div>
      <div className="account-info">
        You are here: Latitude: {myLocation[0]}, Longitude: {myLocation[1]}
      </div>
    </div>
  );
};

export default Account;
