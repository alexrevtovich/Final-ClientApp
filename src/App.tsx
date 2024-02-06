// App.tsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Auth from './components/Auth'; // Import Auth component
import Account from './components/Account'; // Import Account component
import Navbar from './components/Navbar'; // Import Navbar component
import Map from './components/Map'; // Import Maps component
import './App.css';


const App: React.FC = () => {
  return (
    <Router>
      <Navbar /> {/* Include Navbar at the top level within Router */}
      <Routes>
        <Route path="/account" element={<Account />} />
        <Route path="/" element={<Auth />} />
        <Route path="/map" element={<Map />} /> 
      </Routes>
    </Router>
  );
};

export default App;
