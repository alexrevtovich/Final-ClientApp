import React, { useEffect, useRef, useState } from 'react';
import * as atlas from 'azure-maps-control';
import { useNavigate } from 'react-router-dom';

const Map: React.FC = () => {
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const userEmail = sessionStorage.getItem("userEmail");
  const [inputValue, setInputValue] = useState(''); // State for the input field

  useEffect(() => {
    if (!userEmail) {
      console.log('No user email found, redirecting to login...');
      navigate('/');
    }
  }, [navigate, userEmail]);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = new atlas.Map(mapRef.current, {
      authOptions: {
        authType: atlas.AuthenticationType.subscriptionKey,
        subscriptionKey: process.env.REACT_APP_AZURE_MAPS_SUBSCRIPTION_KEY || 'h72XWBttx4Tanjo1p5fNxyZPyzWi5UpgCL3yIe0K0Xs'
      },
      center: [-95.4028, 29.7174],
      zoom: 15,
      style: 'road'
    });

    return () => map.dispose();
  }, []);

  // Handler for input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // Handler for form submission
  const handleSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); // Prevent default form submission behavior
    // Here you can use inputValue to fetch data or update the map
    console.log(inputValue); // For demonstration
  };

  return (
    <>
      <div>
        <input type="text" value={inputValue} onChange={handleInputChange} placeholder="Enter location" />
        <button onClick={handleSubmit}>go</button>
      </div>
      <div ref={mapRef} style={{ width: '100%', height: '400px' }} />
    </>
  );
};

export default Map;
