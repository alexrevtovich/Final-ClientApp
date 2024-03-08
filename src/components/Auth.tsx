import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { DefaultAzureCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';


// Declare the global google variable provided by the Google Identity Services library
declare const google: any;

const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || '838062661118-ktim79hu56fe6ot7c8cj3spjf81oiec4.apps.googleusercontent.com';
const vaultUrl = 'https://s24-final.vault.azure.net/';
const secretName = 'testKeyVault';


const Auth: React.FC = () => {
  const navigate = useNavigate();

  const [secretValue, setSecretValue] = useState<string | undefined>();

  useEffect(() => {
    // Fetch secret from Azure Key Vault
    const getSecretFromKeyVault = async () => {
      const credential = new DefaultAzureCredential();
      const secretClient = new SecretClient(vaultUrl, credential);
      try {
        const secret = await secretClient.getSecret(secretName);
        setSecretValue(secret.value);
      } catch (error) {
        console.error('Error fetching secret from Azure Key Vault:', error);
      }
    };

    getSecretFromKeyVault();
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

   // TEST environment variable
   const testVariable = process.env.REACT_APP_TEST_STRING; // TEST .env

  return (
    <div className="auth-container">
       <p className="logo-text">EV Spotter</p>
       <p className="logo-text-small">Testing .env - Power Your Journey With Our Production Charging Stations Locator</p>
      <div className="logo-container">
        <img src={`${process.env.PUBLIC_URL}/EVSpotter_Logo_small.png`} alt="EVSpotter Small Logo" className="App-logo-small" />
        <img src={`${process.env.PUBLIC_URL}/EVSpotter_Logo.png`} alt="EVSpotter Logo" className="App-logo" />
      </div>
     
      
  
      <div id="signInDiv" className="google-signin-button"></div>
      <div>{testVariable}</div>
      <div>Secret from Key Vault: {secretValue}</div>
    </div>
  );
  
  
};

export default Auth;
