import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // Incorrect import causing the issue

// Declare the global google variable provided by the Google Identity Services library
declare const google: any;
// Define the Google client ID, either from environment variables or hardcoded
const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || '838062661118-ktim79hu56fe6ot7c8cj3spjf81oiec4.apps.googleusercontent.com';

const Auth: React.FC = () => {
  const navigate = useNavigate(); // Hook to navigate between routes

  useEffect(() => {
    console.log('Initializing Google Identity Services...');
    const script = document.createElement('script'); // Create a new script element
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    document.body.appendChild(script);

    const handleCredentialResponse = (response: any) => {
      console.log('Google Identity Services response received:', response);
      try {
        const decoded = jwtDecode(response.credential) as { email: string };
        console.log('Decoded JWT:', decoded);
        const userEmail = decoded.email;
        sessionStorage.setItem("userEmail", userEmail); // Store the email in sessionStorage for later use
        console.log('User email set in sessionStorage:', userEmail);
        navigate('/account'); // Navigate to the account page after successful login
      } catch (error) {
        console.error('Error decoding JWT or navigating:', error);
      }
    };

    script.onload = () => {
      console.log('Google Identity Services script loaded, initializing button...');
      try {
        google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse
        });

        google.accounts.id.renderButton(
          document.getElementById('signInDiv'), // Specify the div where the button should be rendered
          { theme: 'outline', size: 'large' } // Button customization options
        );
        console.log('Google sign-in button rendered.');
      } catch (error) {
        console.error('Error initializing Google sign-in button:', error);
      }
    };

    return () => {
      console.log('Cleaning up Google Identity Services...');
      document.body.removeChild(script); // Remove the script element from the document
      if (google.accounts && google.accounts.id && typeof google.accounts.id.cancel === 'function') {
        google.accounts.id.cancel(); // Cancel the Google Identity Services to clean up resources
        console.log('Google Identity Services cleaned up.');
      }
    };
  }, [navigate]); // Dependency array for useEffect, to re-run if navigate changes

  return (
    <div>
      <div id="signInDiv"></div> {/* Div container for Google sign-in button */}
    </div>
  );
};

export default Auth; // Export the Auth component for use in other application components
