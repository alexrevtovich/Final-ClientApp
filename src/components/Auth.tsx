import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

declare global {
  interface Window {
    gapi: any;
  }
}

const clientId = "YOUR_CLIENT_ID.apps.googleusercontent.com";

const Auth: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const initClient = () => {
      window.gapi.client.init({
        clientId: clientId,
        scope: 'email',
      }).then(() => {
        window.gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
        updateSigninStatus(window.gapi.auth2.getAuthInstance().isSignedIn.get());
      });
    };

    window.gapi.load('client:auth2', initClient);

    const updateSigninStatus = (isSignedIn: boolean) => {
      if (isSignedIn) {
        const profile = window.gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile();
        sessionStorage.setItem("userEmail", profile.getEmail());
        navigate('/account');
      }
    };
  }, [navigate]);

  const handleSignInClick = () => {
    window.gapi.auth2.getAuthInstance().signIn();
  };

  return (
    <div>
      <button onClick={handleSignInClick}>Login with Google</button>
    </div>
  );
};

export default Auth;
