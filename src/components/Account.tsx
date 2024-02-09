import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import fetchAccountInfo from '../utils/accountinfo';
import getMyLocation from '../utils/mylocation';

const Account: React.FC = () => {
  const navigate = useNavigate();
  const userEmail = sessionStorage.getItem("userEmail");
  const [userInfo, setUserInfo] = useState({ username: '', email: '', zipcode: '' });
  const [myLocation, setMyLocation] = useState('Fetching location...');

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

  const logout = () => {
    sessionStorage.removeItem("userEmail");
    navigate('/');
    console.log('User logged out');
  };

  return (
    <div className="account-container">
      <h2>Account Page</h2>
      <div className="account-info">Hello {userInfo.username}</div>
      <div className="account-info">Your email is: {userInfo.email}</div>
      <div className="account-info">Your zipcode is: {userInfo.zipcode}</div>
      <div className="account-info">You are here: {myLocation}</div> 
      <button onClick={logout} className="logout-button">Logout</button>
    </div>
  );
};

export default Account;
