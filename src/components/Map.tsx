import React, { useEffect, useRef, useState } from 'react';
import * as atlas from 'azure-maps-control';
import 'azure-maps-control/dist/atlas.min.css';
import { useNavigate } from 'react-router-dom';
import { fetchStations } from '../utils/stations';
import { addPinsToMap } from '../utils/pinsonmap';
import { StationData } from '../utils/stations';
import reverseGeocode from '../utils/reverse';
import { getRouteDirections, renderRouteOnMap } from '../utils/route';
import getMyLocation from '../utils/mylocation';

// Define defaultLocation as a tuple outside of the component
const defaultLocation: [number, number] = [29.7174, -95.4028];

const Map: React.FC = () => {
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<atlas.Map | null>(null);
  const datasourceRef = useRef<atlas.source.DataSource | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [stationData, setStationData] = useState<StationData[]>([]);
  const [error, setError] = useState<string | null>(null);
  // Use defaultLocation to initialize the myLocation state
  const [myLocation, setMyLocation] = useState<[number, number]>(defaultLocation);

  useEffect(() => {
    getMyLocation(setMyLocation); // This will update myLocation with the user's current coordinates
  }, []);

  useEffect(() => {
    if (!sessionStorage.getItem('userEmail')) {
      console.log('No user email found, redirecting to login...');
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) { // Check if map is not already initialized
      const map = new atlas.Map(mapRef.current, {
        authOptions: {
          authType: atlas.AuthenticationType.subscriptionKey,
        subscriptionKey: process.env.REACT_APP_AZURE_MAPS_SUBSCRIPTION_KEY || 'h72XWBttx4Tanjo1p5fNxyZPyzWi5UpgCL3yIe0K0Xs',
      },
      center: myLocation, // Initial center, will be updated when myLocation is fetched
        zoom: 15,
        style: 'road',
      });

      map.events.add('ready', async () => { // Mark this function as async
        mapInstanceRef.current = map;
        datasourceRef.current = new atlas.source.DataSource();
        map.sources.add(datasourceRef.current);
      
        //Async fetch stations around default location
        const myLocationStr = `${myLocation[0]},${myLocation[1]}`;
        await fetchAndDisplayStations(myLocationStr);
      });
    }
  }, [myLocation]); // Empty dependency array ensures this effect runs only once

  useEffect(() => {
    // This useEffect updates the map's center to myLocation once it's fetched
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCamera({
        center: myLocation,
        zoom: 15,
      });
      // Fetch and display stations only if myLocation is different from defaultLocation
      if (myLocation !== defaultLocation) {
        const myLocationStr = `${myLocation[0]},${myLocation[1]}`;
        fetchAndDisplayStations(myLocationStr);
      }
    }
  }, [myLocation]); // Depend on myLocation
  

  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCamera({
        center: myLocation,
        zoom: 15,
      });
    }
  }, [myLocation]); // This useEffect depends on myLocation

  useEffect(() => {
    const fetchAndSetAddress = async () => {
      const address = await reverseGeocode(myLocation);
      setInputValue(address);
    };

    fetchAndSetAddress();
  }, [myLocation]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const fetchAndDisplayStations = async (location: string) => {
    setError(null);
    try {
      const stationsData = await fetchStations(location);
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
    const locationStr = inputValue ? inputValue : `${myLocation[0]},${myLocation[1]}`;
    fetchAndDisplayStations(locationStr); // Pass the location string
  };
  

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const locationStr = inputValue ? inputValue : `${myLocation[0]},${myLocation[1]}`;
      fetchAndDisplayStations(locationStr); // Pass the location string
    }
  };
  

  const handleStationSelect = async (station: StationData) => {
    if (!mapInstanceRef.current || !datasourceRef.current) {
        console.error("Map instance or datasource is not available");
        return;
    }

    try {
        // Fetch route directions from myLocation to the selected station
        const route = await getRouteDirections(myLocation, [station.latitude, station.longitude]);


        // Clear existing data to remove previous routes
        datasourceRef.current.clear();

        // Render the fetched route on the map
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
            <p>Connector Types: {station.ev_connector_types?.join(', ')}</p> {/* Use optional chaining */}
            <p>Distance: {station.distance?.toFixed(2)} miles</p> {/* Use optional chaining */}
            <button onClick={() => handleStationSelect(station)}>Select</button>
          </div>
        ))}
      </div>
    </>
  );
  
};

export default Map;
