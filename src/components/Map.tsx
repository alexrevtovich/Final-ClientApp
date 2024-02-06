import React, { useEffect, useRef, useState } from 'react';
import * as atlas from 'azure-maps-control';
import 'azure-maps-control/dist/atlas.min.css'; // Import the CSS for Azure Maps Control
import { useNavigate } from 'react-router-dom';
import { fetchStations } from '../utils/stations';
import { addPinsToMap } from '../utils/pinsonmap';
import { StationData } from '../utils/stations';

const Map: React.FC = () => {
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<atlas.Map | null>(null); // Initialize the ref inside the component
  const userEmail = sessionStorage.getItem('userEmail');
  const [inputValue, setInputValue] = useState('');
  const [stationData, setStationData] = useState<StationData[]>([]);
  const [error, setError] = useState<string | null>(null);

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
      style: 'road',
    });

    // Store the map instance in the ref
    mapInstanceRef.current = map;
     // Add the 'ready' event listener
    map.events.add('ready', function () {
    // The map is fully loaded and ready, so pins can be added
       if (stationData.length > 0) {
        addPinsToMap(stationData, map); // Assuming stationData is available at this point
      }
  });

    // Cleanup function to dispose of the map instance when the component unmounts
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.dispose();
        mapInstanceRef.current = null;
      }
    };
  }, []); // The dependency array is empty, meaning this effect runs only once when the component mounts

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setError(null); // Reset error message before new API call
    try {
      const stationsData = await fetchStations(inputValue);
      setStationData(stationsData);
  
      // Ensure the map is ready and stations data is available
      if (mapInstanceRef.current && stationsData.length > 0) {
        // Use the first station's coordinates to set the map center
        const firstStation = stationsData[0];
        mapInstanceRef.current.setCamera({
          center: [firstStation.longitude, firstStation.latitude],
          zoom: 15 // You can adjust the zoom level as needed
        });
  
        addPinsToMap(stationsData, mapInstanceRef.current); // Add pins to the map
      }
    } catch (error) {
      console.error('Error fetching stations:', error);
      setError('Failed to fetch station data. Please try again.');
    }
  };
  

  return (
    <>
      <div>
        <input type="text" value={inputValue} onChange={handleInputChange} placeholder="Enter location" aria-label="Location Input" />
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
