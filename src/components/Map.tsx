import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as atlas from 'azure-maps-control';
import 'azure-maps-control/dist/atlas.min.css';
import { useNavigate } from 'react-router-dom';
import { fetchStations } from '../utils/stations';
import { addPinsToMap } from '../utils/pinsonmap';
import { StationData } from '../utils/stations';
import reverseGeocode from '../utils/reverse';
import { getRouteDirections, renderRouteOnMap } from '../utils/route';
import getMyLocation from '../utils/mylocation';

const Map: React.FC = () => {
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<atlas.Map | null>(null);
  const datasourceRef = useRef<atlas.source.DataSource | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [stationData, setStationData] = useState<StationData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [myLocation, setMyLocation] = useState<[number, number]>([29.7174, -95.4028]);
  const myLocationRef = useRef<[number, number]>(myLocation); // Ref to hold the current location

  // Define fetchAndDisplayStations function using useCallback
  const fetchAndDisplayStations = useCallback(async (location: string) => {
    setError(null);
    try {
      const stationsData = await fetchStations(location);
      setStationData(stationsData);

      if (stationsData.length > 0 && mapInstanceRef.current) {
        mapInstanceRef.current.setCamera({
          center: [stationsData[0].longitude, stationsData[0].latitude],
          zoom: 15,
        });

        // Pass the current location to addPinsToMap
        addPinsToMap(stationsData, mapInstanceRef.current, handleStationSelect, myLocationRef.current);
      } else {
        setError('No stations found for the provided location.');
      }
    } catch (error) {
      console.error('Error fetching stations:', error);
      setError('Failed to fetch station data. Please try again.');
    }
  }, []); // Remove myLocation from the dependency array



  // Fetch the user's location and set it to state
  useEffect(() => {
    getMyLocation((location) => {
      setMyLocation(location || [29.7174, -95.4028]); // Provide default location if location is null
    });
  }, []);

  // Redirect to login if user email is not found in session storage
  useEffect(() => {
    if (!sessionStorage.getItem('userEmail')) {
      console.log('No user email found, redirecting to login...');
      navigate('/');
    }
  }, [navigate]);

  // Initialize map and fetch stations data around the user's location
  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      // Create a new map instance
      const map = new atlas.Map(mapRef.current, {
        authOptions: {
          authType: atlas.AuthenticationType.subscriptionKey,
          subscriptionKey: process.env.REACT_APP_AZURE_MAPS_SUBSCRIPTION_KEY || 'h72XWBttx4Tanjo1p5fNxyZPyzWi5UpgCL3yIe0K0Xs',
        },
        center: myLocation,
        zoom: 15,
        style: 'road',
      });

      // Add event listener for when the map is ready
      map.events.add('ready', async () => {
        mapInstanceRef.current = map;
        datasourceRef.current = new atlas.source.DataSource();
        map.sources.add(datasourceRef.current);
      
        // Fetch and display stations data around the user's location
        // Async fetch stations around default location
        const myLocationStr = `${myLocation[0]},${myLocation[1]}`;
        await fetchAndDisplayStations(myLocationStr);
      });
    }
  }, [myLocation, fetchAndDisplayStations]);

  // Update map's camera when myLocation changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCamera({
        center: myLocation,
        zoom: 15,
      });
    }
  }, [myLocation]);

  // Fetch the user's address based on myLocation
  useEffect(() => {
    const fetchAndSetAddress = async () => {
      const address = await reverseGeocode(myLocation);
      setInputValue(address);
    };

    fetchAndSetAddress();
  }, [myLocation]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // Handle form submission
  const handleSubmit = (e: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent) => {
    e.preventDefault();
    const locationStr = inputValue ? inputValue : `${myLocation[0]},${myLocation[1]}`;
    fetchAndDisplayStations(locationStr);
  };

  // Handle key down event
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const locationStr = inputValue ? inputValue : `${myLocation[0]},${myLocation[1]}`;
      fetchAndDisplayStations(locationStr);
    }
  };

  // Handle station selection
  const handleStationSelect = async (station: StationData, currentLocation: [number, number]) => {
    if (!mapInstanceRef.current || !datasourceRef.current) {
      console.error("Map instance or datasource is not available");
      return;
    }

    try {
      const route = await getRouteDirections(currentLocation, [station.latitude, station.longitude]);
      datasourceRef.current.clear();
      renderRouteOnMap(route, mapInstanceRef.current, datasourceRef.current);
    } catch (error) {
      console.error("Error fetching or rendering route:", error);
      setError("Failed to display route. Please try again.");
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
      <div>
        {stationData.map((station, index) => (
          <div key={index} className="station-info">
            <p>Station Name: {station.station_name}</p>
            <p>Connector Types: {station.ev_connector_types?.join(', ')}</p>
            <p>Distance: {station.distance?.toFixed(2)} miles</p>
            {/* Pass myLocation as the second argument */}
            <button onClick={() => handleStationSelect(station, myLocation)}>Select</button>
          </div>
        ))}
      </div>
    </>
  );
};

export default Map;
