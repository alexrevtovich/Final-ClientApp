import React, { useEffect, useRef, useState } from 'react';
import * as atlas from 'azure-maps-control';
import 'azure-maps-control/dist/atlas.min.css';
import { useNavigate } from 'react-router-dom';
import { fetchStations } from '../utils/stations';
import { addPinsToMap } from '../utils/pinsonmap';
import { StationData } from '../utils/stations';

const Map: React.FC = () => {
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<atlas.Map | null>(null);
  const userEmail = sessionStorage.getItem('userEmail');
  const [inputValue, setInputValue] = useState('');
  const [stationData, setStationData] = useState<StationData[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Redirect if no user email found
  useEffect(() => {
    if (!userEmail) {
      console.log('No user email found, redirecting to login...');
      navigate('/');
    }
  }, [navigate, userEmail]);

  // Map Initialization
  useEffect(() => {
    if (!mapRef.current) return;

    const map = new atlas.Map(mapRef.current, {
      authOptions: {
        authType: atlas.AuthenticationType.subscriptionKey,
        subscriptionKey: process.env.REACT_APP_AZURE_MAPS_SUBSCRIPTION_KEY || 'h72XWBttx4Tanjo1p5fNxyZPyzWi5UpgCL3yIe0K0Xs',
      },
      center: [-95.4028, 29.7174],
      zoom: 15,
      style: 'road',
    });

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.dispose();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Adding Pins when stationData changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map && stationData.length > 0) {
      addPinsToMap(stationData, map);
    }
  }, [stationData]); // Re-run this effect when stationData changes

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent) => {
    e.preventDefault(); // Prevent the default form submission behavior
    setError(null); // Reset any previous error message
  
    try {
      const stationsData = await fetchStations(inputValue);
      setStationData(stationsData);
  
      if (stationsData.length > 0) {
        const firstStation = stationsData[0]; // Assume you want to center on the first station
  
        // Ensure the map instance is available and ready
        if (mapInstanceRef.current) {
          // Center the map on the coordinates of the first station
          mapInstanceRef.current.setCamera({
            center: [firstStation.longitude, firstStation.latitude],
            zoom: 15 // Adjust zoom level as needed
          });
  
          // Optionally, add pins to the map for each station
          addPinsToMap(stationsData, mapInstanceRef.current);
        }
      } else {
        setError('No stations found for the provided location.'); // Handle case where no stations are returned
      }
    } catch (error) {
      console.error('Error fetching stations:', error);
      setError('Failed to fetch station data. Please try again.');
    }
  };
  

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit(e as unknown as React.MouseEvent<HTMLButtonElement>); // Cast the event type to match handleSubmit's expected type
    }
  };

  return (
    <>
      <div>
        <input type="text" value={inputValue} onChange={handleInputChange} placeholder="Enter location" onKeyDown={handleKeyDown} aria-label="Location Input" />
        <button onClick={handleSubmit}>Go</button>
      </div>
      <div ref={mapRef} style={{ width: '100%', height: '400px' }} />
      {error && <p className="error-message">{error}</p>}
      <div>
        {stationData && <pre>{JSON.stringify(stationData, null, 2)}</pre>}
      </div>
    </>
  );
};

export default Map;
