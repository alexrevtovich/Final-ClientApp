import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // Import jwtDecode function for decoding JWT tokens

// Declare the global google variable provided by the Google Identity Services library
declare const google: any; 
// Define the Google client ID, either from environment variables or hardcoded
const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || 'your-client-id.apps.googleusercontent.com'; 

const Auth: React.FC = () => {
  const navigate = useNavigate(); // Hook to navigate between routes

  useEffect(() => {
    const script = document.createElement('script'); // Create a new script element
    // Set the source to the Google Identity Services library
    script.src = 'https://accounts.google.com/gsi/client'; 
    script.async = true; // Script should be loaded Asynchronously
    // Append the script to the body of the document to load it
    document.body.appendChild(script); 

    // npm install --save-dev @types/jwt-decode
    // Decode the JWT ID token and assert its structure to include an email field
    const handleCredentialResponse = (response: any) => {
      const decoded = jwtDecode(response.credential) as { email: string }; 
      const userEmail = decoded.email; // Extract the email from the decoded token
      sessionStorage.setItem("userEmail", userEmail); // Store the email in sessionStorage for later use
      navigate('/account'); // Navigate to the account page after successful login
    };

    // Right after script is loaded that will happen:
    script.onload = () => { 
      google.accounts.id.initialize({ // Initialize the Google Identity Services library with the client ID and callback function
        client_id: clientId,
        callback: handleCredentialResponse
      });
      
      // Google sign-in button
      google.accounts.id.renderButton( 
        document.getElementById('signInDiv'), // Specify the div where the button should be rendered
        { theme: 'outline', size: 'large' } // Button customization options
      );
    };

    // Cleanup function that runs when the component unmounts
    return () => { 
      document.body.removeChild(script); // Remove the script element from the document
      if (google.accounts && google.accounts.id && typeof google.accounts.id.cancel === 'function') { // Check if the cancel method is available
        google.accounts.id.cancel(); // Cancel the Google Identity Services to clean up resources
      }
    };
  }, [navigate]); // useEffect dependency array with navigate to ensure it re-runs if navigate changes

  return (
    <div>
      <div id="signInDiv"></div> {/* Div container for Google sign-in button */}
    </div>
  );
};

export default Auth; // Export the Auth component for use in other application components
