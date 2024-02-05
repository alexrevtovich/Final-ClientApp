import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';


declare const google: any;

const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || 'your-client-id.apps.googleusercontent.com';

const Auth: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    document.body.appendChild(script);

    const handleCredentialResponse = (response: any) => {
        const decoded = jwtDecode(response.credential) as { email: string }; // Assert the type
        const userEmail = decoded.email;
        sessionStorage.setItem("userEmail", userEmail);
        navigate('/account');
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
    <div>
      <div id="signInDiv"></div>
    </div>
  );
};

export default Auth;
