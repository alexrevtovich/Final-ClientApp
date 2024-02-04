import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Auth from './components/Auth';
import Account from './components/Account';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/account" element={<Account />} />
        <Route path="/" element={<Auth />} />
      </Routes>
    </Router>
  );
};

export default App;
