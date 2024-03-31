import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {jwtDecode} from 'jwt-decode'; // Ensure correct import for your use case

// Declare the global google variable provided by the Google Identity Services library
declare const google: any;

const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

const Auth: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    document.body.appendChild(script);

    const handleCredentialResponse = async (googleResponse: any) => {
      try {
        const decoded = jwtDecode(googleResponse.credential) as { email: string };
        const userEmail = decoded.email;
        sessionStorage.setItem("userEmail", userEmail);
    
        // Prepare the user data for database entry
        const userData = {
          email: userEmail,
          username: "good citizen", // Default username, adjust as needed
          maincar: "None", // Default main car value
          cars: [], // Assuming an empty array of cars initially
        };
    
        // Send the user data to your backend for processing
        const fetchResponse = await fetch('https://s24-final-back.azurewebsites.net/api/AddUser', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        });
    
        if (fetchResponse.ok) {
          console.log('User record created or updated successfully');
        } else {
          console.error('Failed to create or update user record:', await fetchResponse.text());
        }
    
        // Navigate to the account page after successful login and user data processing
        navigate('/account');
      } catch (error) {
        console.error('Error decoding JWT, handling user data, or navigating:', error);
      }
    };

    script.onload = () => {
      google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse
      });

      google.accounts.id.renderButton(
        document.getElementById('signInDiv'),
        { theme: 'outline', size: 'large' }
      );
    };

    return () => {
      document.body.removeChild(script);
      if (google.accounts && google.accounts.id && typeof google.accounts.id.cancel === 'function') {
        google.accounts.id.cancel();
      }
    };
  }, [navigate]);

  return (
    <div className="auth-container">
      <p className="logo-text">EV Spotter</p>
      <p className="logo-text-small">Power Up Your Journey</p>
      <div className="logo-container">
        <img src={`${process.env.PUBLIC_URL}/EVSpotter_Logo_small.png`} alt="EVSpotter Small Logo" className="App-logo-small" />
        <img src={`${process.env.PUBLIC_URL}/EVSpotter_Logo.png`} alt="EVSpotter Logo" className="App-logo" />
      </div>
      <div id="signInDiv" className="google-signin-button"></div>
    </div>
  );
};

export default Auth;
