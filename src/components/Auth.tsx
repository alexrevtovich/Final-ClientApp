import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // Incorrect import causing the issue


// Declare the global google variable provided by the Google Identity Services library
declare const google: any;

const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || '838062661118-ktim79hu56fe6ot7c8cj3spjf81oiec4.apps.googleusercontent.com';

const Auth: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    document.body.appendChild(script);

    const handleCredentialResponse = (response: any) => {
      try {
        const decoded = jwtDecode(response.credential) as { email: string };
        const userEmail = decoded.email;
        sessionStorage.setItem("userEmail", userEmail);
        navigate('/account');
      } catch (error) {
        console.error('Error decoding JWT or navigating:', error);
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
      <div className="logo-container">
        <img src={`${process.env.PUBLIC_URL}/EVSpotter_Logo_small.png`} alt="EVSpotter Small Logo" className="App-logo-small" />
        <img src={`${process.env.PUBLIC_URL}/EVSpotter_Logo.png`} alt="EVSpotter Logo" className="App-logo" />
      </div>
  
      <div id="signInDiv" className="google-signin-button"></div>
    </div>
  );
  
  
};

export default Auth;
