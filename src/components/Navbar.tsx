// components/Navbar.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Navbar: React.FC = () => {
  const navigate = useNavigate();

  const logout = () => {
    sessionStorage.removeItem("userEmail");
    navigate('/'); // Redirects to the Auth component for login
    console.log('User logged out');
  };

  return (
    <nav className="navbar">
      <button className="nav-button" onClick={() => navigate('/map')}>Map</button>
      <button className="nav-button" onClick={() => navigate('/account')}>Account</button>
      <button className="nav-button" onClick={logout}>Logout</button>
    </nav>
  );
};

export default Navbar;
