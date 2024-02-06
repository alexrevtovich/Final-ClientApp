import React, { useEffect, useRef } from 'react';
import * as atlas from 'azure-maps-control';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const Map: React.FC = () => {
  const navigate = useNavigate(); // Initialize useNavigate
  const mapRef = useRef<HTMLDivElement>(null); // Reference to the map container
  const userEmail = sessionStorage.getItem("userEmail"); // Get userEmail from sessionStorage

  // Redirect to login if not logged in
  useEffect(() => {
    if (!userEmail) {
      console.log('No user email found, redirecting to login...');
      navigate('/'); // Adjust as needed to point to your Auth component route
    }
  }, [navigate, userEmail]); // Depend on navigate and userEmail

  useEffect(() => {
    if (!mapRef.current) return;

    const map = new atlas.Map(mapRef.current, {
      authOptions: {
        authType: atlas.AuthenticationType.subscriptionKey,
        subscriptionKey: process.env.REACT_APP_AZURE_MAPS_SUBSCRIPTION_KEY
      },
      center: [-95.4028, 29.7174], // Coordinates for Rice OEDK, Houston, Texas
      zoom: 15, // Adjust zoom level as needed
      style: 'road' // Choose a map style as needed
    });

    // Clean up the map instance on component unmount
    return () => map.dispose();
  }, []); // Empty dependency array ensures this effect runs only once after the component mounts

  return <div ref={mapRef} style={{ width: '100%', height: '400px' }} />;
};

export default Map;
