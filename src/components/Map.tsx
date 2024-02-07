import React, { useEffect, useRef, useState } from 'react';
import * as atlas from 'azure-maps-control';
import 'azure-maps-control/dist/atlas.min.css';
import { useNavigate } from 'react-router-dom';
import { fetchStations } from '../utils/stations';
import { addPinsToMap } from '../utils/pinsonmap';
import { StationData } from '../utils/stations';
import reverseGeocode from '../utils/reverse';

const Map: React.FC = () => {
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<atlas.Map | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [stationData, setStationData] = useState<StationData[]>([]);
  const [error, setError] = useState<string | null>(null);

  // my location is hardcoded for now
  const myLocation = useRef<[number, number]>([-95.4028, 29.7174]);

  useEffect(() => {
    if (!sessionStorage.getItem('userEmail')) {
      console.log('No user email found, redirecting to login...');
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = new atlas.Map(mapRef.current, {
      authOptions: {
        authType: atlas.AuthenticationType.subscriptionKey,
        subscriptionKey: process.env.REACT_APP_AZURE_MAPS_SUBSCRIPTION_KEY || 'h72XWBttx4Tanjo1p5fNxyZPyzWi5UpgCL3yIe0K0Xs',
      },
      center: myLocation.current,
      zoom: 15,
      style: 'road',
    });

    mapInstanceRef.current = map;

    return () => {
      mapInstanceRef.current?.dispose();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const fetchAndSetAddress = async () => {
      const address = await reverseGeocode(myLocation.current);
      setInputValue(address);
    };

    fetchAndSetAddress();
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map && stationData.length > 0) {
      addPinsToMap(stationData, map);
    }
  }, [stationData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const fetchAndDisplayStations = async () => {
    setError(null);
    try {
      const stationsData = await fetchStations(inputValue);
      setStationData(stationsData);
  
      if (stationsData.length > 0 && mapInstanceRef.current) { 
        mapInstanceRef.current.setCamera({
          center: [stationsData[0].longitude, stationsData[0].latitude],
          zoom: 15,
        });
  
        addPinsToMap(stationsData, mapInstanceRef.current);
      } else {
        setError('No stations found for the provided location.');
      }
    } catch (error) {
      console.error('Error fetching stations:', error);
      setError('Failed to fetch station data. Please try again.');
    }
  };
  

  const handleSubmit = (e: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent) => {
    e.preventDefault();
    fetchAndDisplayStations();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      fetchAndDisplayStations();
    }
  };

  const handleStationSelect = (station: StationData) => {
    // Placeholder for whatever action you want to take when a station is selected.
    console.log(station.station_name + " selected");
    // For example, you might navigate to a station detail page or set selected station in state.
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
      <div>
        {stationData.map((station, index) => (
          <div key={index} className="station-info">
            <p>Station Name: {station.station_name}</p>
            <p>Connector Types: {station.ev_connector_types.join(', ')}</p>
            <p>Distance: {station.distance.toFixed(2)} miles</p>
            <button onClick={() => handleStationSelect(station)}>Select</button>
          </div>
        ))}
      </div>
    </>
  );
  
};

export default Map;
