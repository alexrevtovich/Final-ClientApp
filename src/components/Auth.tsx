import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // Incorrect import causing the issue

// Declare the global google variable provided by the Google Identity Services library
declare const google: any;

const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || 'Your-Google-Client-ID-Here';

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

  // Logout function
  const logout = () => {
    // Clear user session data
    sessionStorage.removeItem("userEmail");
    
    // Use Google's API to sign the user out
    google.accounts.id.disableAutoSelect();

    // Redirect or perform some action after logout
    navigate('/');
    console.log('User logged out');
  };

  return (
    <div>
      <div id="signInDiv"></div> {/* Google sign-in button */}
     
    </div>
  );
};

export default Auth;
