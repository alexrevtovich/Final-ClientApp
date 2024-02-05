import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Account: React.FC = () => {
  const navigate = useNavigate();
  const userEmail = sessionStorage.getItem("userEmail");

  useEffect(() => {
    // If userEmail is null or undefined, redirect to the login page
    if (!userEmail) {
      console.log('No user email found, redirecting to login...');
      navigate('/'); // Adjust this to point to your Auth component route if it's different
    }
  }, [navigate, userEmail]); // Depend on navigate and userEmail

  const logout = () => {
    sessionStorage.removeItem("userEmail");
    navigate('/'); // Redirect to the login page after logout
    console.log('User logged out');
  };

  // The component will still return the JSX, but the useEffect hook will redirect before it's rendered if userEmail is not found
  return (
    <div>
      <h2>Account Page</h2>
      <p>User Email: {userEmail || "No Email Found"}</p>
      <button onClick={logout} style={{ marginTop: '20px' }}>Logout</button>
    </div>
  );
};

export default Account;
