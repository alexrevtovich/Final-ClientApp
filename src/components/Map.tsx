import React, { useEffect, useRef, useState } from 'react';
import * as atlas from 'azure-maps-control';
import 'azure-maps-control/dist/atlas.min.css';
import { useNavigate } from 'react-router-dom';
import { fetchStations } from '../utils/stations';
import { addPinsToMap } from '../utils/pinsonmap';
import { StationData } from '../utils/stations';
import reverseGeocode from '../utils/reverse'; // Ensure this path is correct
import { calculateAndDisplayRoute } from '../utils/route';

const Map: React.FC = () => {
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<atlas.Map | null>(null);
  const userEmail = sessionStorage.getItem('userEmail');
  const [inputValue, setInputValue] = useState('');
  const [stationData, setStationData] = useState<StationData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const myLocation: [number, number] = [-95.4028, 29.7174]; // Rice OEDK coordinates for now

  useEffect(() => {
    if (!userEmail) {
      console.log('No user email found, redirecting to login...');
      navigate('/');
    }
  }, [navigate, userEmail]);

  useEffect(() => {
    const map = new atlas.Map(mapRef.current!, {
      authOptions: {
        authType: atlas.AuthenticationType.subscriptionKey,
        subscriptionKey: process.env.REACT_APP_AZURE_MAPS_SUBSCRIPTION_KEY || 'h72XWBttx4Tanjo1p5fNxyZPyzWi5UpgCL3yIe0K0Xs',
      },
      center: myLocation,
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

  useEffect(() => {
    const fetchAddress = async () => {
      const address = await reverseGeocode(myLocation);
      setInputValue(address);
    };

    fetchAddress();
  }, []); // This useEffect will run once on component mount to perform reverse geocoding

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map && stationData.length > 0) {
      addPinsToMap(stationData, map);
    }
  }, [stationData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const stationsData = await fetchStations(inputValue);
      setStationData(stationsData);

      if (stationsData.length > 0) {
        const firstStation = stationsData[0];
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setCamera({
            center: [firstStation.longitude, firstStation.latitude],
            zoom: 15,
          });

          addPinsToMap(stationsData, mapInstanceRef.current);
        }
      } else {
        setError('No stations found for the provided location.');
      }
    } catch (error) {
      console.error('Error fetching stations:', error);
      setError('Failed to fetch station data. Please try again.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit(e as unknown as React.MouseEvent<HTMLButtonElement>);
    }
  };

  return (
    <>
      <div>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder="Enter location"
          onKeyDown={handleKeyDown}
          aria-label="Location Input"
        />
        <button onClick={handleSubmit}>Go</button>
      </div>
      <div ref={mapRef} className="map-container" />
      {error && <p className="error-message">{error}</p>}
      <div>{stationData && <pre>{JSON.stringify(stationData, null, 2)}</pre>}</div>
    </>
  );
};

export default Map;
