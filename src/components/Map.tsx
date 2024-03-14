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
import Review from '../utils/review'; 
import StarRating from '../utils/starRating';

const Map: React.FC = () => {
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<atlas.Map | null>(null);
  const datasourceRef = useRef<atlas.source.DataSource | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [stationData, setStationData] = useState<StationData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [myLocation, setMyLocation] = useState<[number, number]>([29.7174, -95.4028]); //default value that is valid for sure
  const myLocationRef = useRef<[number, number]>(myLocation); // Ref to hold the current location
  const [activeDetailPanel, setActiveDetailPanel] = useState<StationData | null>(null);

  // Memoize updateMyLocation using useCallback 
  //check myLocation later
  const updateMyLocation = useCallback((value: [number, number] | ((prevState: [number, number]) => [number, number])) => {
    // Directly use setMyLocation since it's stable and doesn't change
    setMyLocation((currentLocation) => {
      const newLocation = typeof value === 'function' ? value(currentLocation) : value;

      if (typeof newLocation[0] === 'number' && typeof newLocation[1] === 'number') {
        return newLocation; // Return newLocation directly
      } else {
        console.error('Tried to set invalid myLocation:', newLocation);
        return [29.7174, -95.4028]; // Return default location
      }
    });
  }, []);
  

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
      
        // Pass only stationsData and mapInstanceRef.current to addPinsToMap
        addPinsToMap(stationsData, mapInstanceRef.current, setActiveDetailPanel);

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
    getMyLocation(updateMyLocation); // Pass updateMyLocation to getMyLocation
  }, [updateMyLocation]);


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
      const initializeMap = async () => {
        let initialLocation = myLocation; // Use myLocation directly
  
        if (mapRef.current) {
          const map = new atlas.Map(mapRef.current, {
            authOptions: {
              authType: atlas.AuthenticationType.subscriptionKey,
              subscriptionKey: process.env.REACT_APP_AZURE_MAPS_SUBSCRIPTION_KEY,
            },
            center: initialLocation,
            zoom: 15,
            style: 'road',
          });
  
          map.events.add('ready', async () => {
            mapInstanceRef.current = map;
            datasourceRef.current = new atlas.source.DataSource();
            map.sources.add(datasourceRef.current);
  
            // Instead of awaiting, directly call the function
            // Also ensure fetchAndDisplayStations can handle awaiting internally if necessary
            fetchAndDisplayStations(`${initialLocation[0]},${initialLocation[1]}`).then(() => {
              // Only after stations are fetched and displayed, add pins to the map
              // Now include setActiveDetailPanel as a parameter to handle pin clicks
              if (stationData.length > 0) {
                addPinsToMap(stationData, map, setActiveDetailPanel);
              }
            });
          });
        } else {
          console.error("Map container div not found");
        }
      };
  
      initializeMap();
    }
  }, [myLocation]); // Removed fetchAndDisplayStations from dependencies to avoid confusion, ensure it's correctly used within useEffect
  

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

  const handleDetailsClick = (station: StationData) => {
    setActiveDetailPanel(station);
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
        <button onClick={handleSubmit}>Find</button>
      </div>
      <div ref={mapRef} className="map-container" />
      {error && <p className="error-message">{error}</p>}
      <div className="station-info-container">
          {stationData.map((station, index) => (
      <div key={index} className="station-info">
        <p>Station Name: {station.station_name}</p>
        <div>
          <p>Rating: {station.averageRating === 0 ? "This station hasn't been rated yet" : station.averageRating}</p>
          {station.averageRating > 0 && <StarRating rating={station.averageRating} />}
        </div>
        <p>Connector Types: {station.ev_connector_types?.join(', ')}</p>
        <p>Distance: {station.distance?.toFixed(2)} miles</p>

        <button onClick={() => handleDetailsClick(station)}>Details</button>

        <button onClick={() => handleStationSelect(station, myLocation)}>Select</button>
        <Review stationId={station.id} userEmail={sessionStorage.getItem('userEmail') || 'fake_user'} />
      </div>
    ))}
      </div>

      {/* Second side panel, similar to the first one but uses the activeDetailPanel state */}
      {activeDetailPanel && (
        <div className="detail-panel">
          <h3>{activeDetailPanel.station_name}</h3>
          {/* Include more detailed information here */}
          <button onClick={() => setActiveDetailPanel(null)}>Close</button>
        </div>
      )}
    </>
  );
};

export default Map;
