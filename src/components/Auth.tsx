import React, { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
console.log("Using Client ID:", clientId);

const Auth: React.FC = () => {
  const navigate = useNavigate();

  // Memoize the handleCredentialResponse function to prevent it from being recreated on every render
  const handleCredentialResponse = useCallback((response: any) => {
    console.log("Encoded JWT ID token: " + response.credential);
    navigate('/account');
  }, [navigate]); // `navigate` is a dependency of this useCallback

  useEffect(() => {
    // Dynamically load the Google Identity Services library
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => {
      // Initialize the Google Identity Services library with the memoized callback
      window.google.accounts.id.initialize({
        client_id: clientId as string,
        callback: handleCredentialResponse, // Use the memoized callback here
      });
      // Render the Google sign-in button
      window.google.accounts.id.renderButton(
        document.getElementById('signInDiv'), // Ensure this div exists in the component's return statement
        { theme: 'outline', size: 'large' }  // Customization attributes
      );
    };
    document.body.appendChild(script);

    // Cleanup function to remove the script when the component unmounts
    return () => {
      document.body.removeChild(script);
    };
  }, [handleCredentialResponse]); // Depend on the memoized handleCredentialResponse function

  return (
    <div>
      <div id="signInDiv"></div> {/* Sign-in button will be rendered here */}
    </div>
  );
};

export default Auth;
