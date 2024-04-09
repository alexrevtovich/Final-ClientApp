import React from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import Auth from './components/Auth';
import Account from './components/Account';
import Navbar from './components/Navbar';
import Map from './components/Map';
import './App.css';

const AppWithNavbar: React.FC = () => {
  const location = useLocation(); // Get the current location
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Public URL:', process.env.PUBLIC_URL);


  return (
    <>
      {location.pathname !== '/' && <Navbar />} {/* Conditionally render Navbar */}
      <Routes>
        <Route path="/account" element={<Account />} />
        <Route path="/" element={<Auth />} />
        <Route path="/map" element={<Map />} />
      </Routes>
    </>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppWithNavbar /> {/* Wrap Routes and Navbar inside a new component */}
    </Router>
  );
};

export default App;
