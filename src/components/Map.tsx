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
import chargeCar from '../utils/chargeCar'; 
import { fetchStationsAlongRoute } from '../utils/trip';





const Map: React.FC = () => {
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<atlas.Map | null>(null);
  const datasourceRef = useRef<atlas.source.DataSource | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [stationData, setStationData] = useState<StationData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [myLocation, setMyLocation] = useState<[number, number]>([29.7174, -95.4028]);
  const [activeDetailPanel, setActiveDetailPanel] = useState<StationData | null>(null);
  const [currentRoute, setCurrentRoute] = useState<string | null>(null);
  const [isStationInfoVisible, setIsStationInfoVisible] = useState(true); // State to track visibility
  const [isDetailPanelVisible, setIsDetailPanelVisible] = useState(true); // State to track visibility

  const toggleVisibility = () => {
    const newVisibility = !isStationInfoVisible;
    setIsStationInfoVisible(newVisibility);
    
    // Ensure the detail panel visibility is linked to the station info container's visibility
    if (activeDetailPanel) {
      setIsDetailPanelVisible(newVisibility);
    }
  };


  const updateMyLocation = useCallback((value: [number, number] | ((prevState: [number, number]) => [number, number])) => {
    setMyLocation((currentLocation) => {
      const newLocation = typeof value === 'function' ? value(currentLocation) : value;

      if (typeof newLocation[0] === 'number' && typeof newLocation[1] === 'number') {
        return newLocation;
      } else {
        console.error('Tried to set invalid myLocation:', newLocation);
        return [29.7174, -95.4028];
      }
    });
  }, []);

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

        addPinsToMap(stationsData, mapInstanceRef.current, setActiveDetailPanel);
      } else {
        setError('No stations found for the provided location.');
      }
    } catch (error) {
      console.error('Error fetching stations:', error);
      setError('Failed to fetch station data. Please try again.');
    }
  }, []);

  useEffect(() => {
    getMyLocation(updateMyLocation);
  }, [updateMyLocation]);

  useEffect(() => {
    if (!sessionStorage.getItem('userEmail')) {
      console.log('No user email found, redirecting to login...');
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    const initializeMap = async () => {
      if (mapRef.current && !mapInstanceRef.current) {
        let initialLocation = myLocation || [29.7174, -95.4028];

        const map = new atlas.Map(mapRef.current, {
          authOptions: {
            authType: atlas.AuthenticationType.subscriptionKey,
            subscriptionKey: process.env.REACT_APP_AZURE_MAPS_SUBSCRIPTION_KEY,
          },
          center: initialLocation,
          zoom: 15,
          style: 'road',
        });

        map.events.add('ready', () => {
          mapInstanceRef.current = map;
          datasourceRef.current = new atlas.source.DataSource();
          map.sources.add(datasourceRef.current);
          
          const locationStr = `${initialLocation[0]},${initialLocation[1]}`;
          fetchAndDisplayStations(locationStr);
        });
      }
    };

    initializeMap();
  }, [myLocation, fetchAndDisplayStations]);

  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCamera({
        center: myLocation,
        zoom: 15,
      });
    }
  }, [myLocation]);

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

  const handleSubmit = (e: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent) => {
    e.preventDefault();
    const locationStr = inputValue ? inputValue : `${myLocation[0]},${myLocation[1]}`;
    fetchAndDisplayStations(locationStr);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const locationStr = inputValue ? inputValue : `${myLocation[0]},${myLocation[1]}`;
      fetchAndDisplayStations(locationStr);
    }
  };

  const handleStationSelect = async (station: StationData, currentLocation: [number, number]) => {
    if (!mapInstanceRef.current || !datasourceRef.current) {
      console.error("Map instance or datasource is not available");
      return;
    }

    try {
      const route = await getRouteDirections(currentLocation, [station.latitude, station.longitude]);
      datasourceRef.current.clear();
      renderRouteOnMap(route, mapInstanceRef.current, datasourceRef.current);
      //for the trip
      setCurrentRoute(`LINESTRING(${route.points.map(p => `${p.longitude} ${p.latitude}`).join(", ")})`);
    } catch (error) {
      console.error("Error fetching or rendering route:", error);
      setError("Failed to display route. Please try again.");
    }
  };

  const handleDetailsClick = (station: StationData) => {
    setActiveDetailPanel(station);
  };

  const handleChargeHereClick = () => {
    if (!activeDetailPanel) {
      console.error("No station selected.");
      return;
    }
  
    // Prepare payload for charging
    const payload = {
      charge: 80, // Dummy charge value for now
      usable_battery_size: 37.9, // Dummy usable_battery_size value for now
      ACMaxPower: 11.0, // Dummy ACMaxPower value for now
      DCCharger: true, // Assuming the car has DC charging capability
      station_DC: activeDetailPanel.ev_dc_fast_num !== null ? true : false // Determine station_DC based on the presence of DC fast chargers
    };
  
    // Call the chargeCar function
    chargeCar(payload);
  };

  const handleTripClick = async () => {
    if (!currentRoute) {
      console.log("No route selected.");
      return;
    }
  
    try {
      const stationsAlongRoute = await fetchStationsAlongRoute({
        linestring: currentRoute,
        distance: 5, // Set the distance as needed
      });
  
      setStationData(stationsAlongRoute);
      if (stationsAlongRoute.length > 0 && mapInstanceRef.current) {
        mapInstanceRef.current.setCamera({
          center: [stationsAlongRoute[0].longitude, stationsAlongRoute[0].latitude],
          zoom: 15,
        });
  
        addPinsToMap(stationsAlongRoute, mapInstanceRef.current, setActiveDetailPanel);
      } else {
        setError('No stations found along the selected route.');
      }
    } catch (error) {
      console.error('Error fetching stations along the route:', error);
      setError('Failed to fetch stations along the route. Please try again.');
    }
  };

  

  return (
    <>
      {/* Toggle Button */}
      <button onClick={toggleVisibility} className="toggle-station-info">
        {isStationInfoVisible ? 'Hide' : 'Show'}
      </button>

      <div className="search-container">
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

      {isStationInfoVisible && (
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
            </div>
          ))}
        </div>
      )}

      {isDetailPanelVisible && activeDetailPanel && (
      <div className="detail-panel">
          <div className="detail-panel-header">
            <h3 className="detail-panel-title">{activeDetailPanel.station_name}</h3>
            <button onClick={() => setActiveDetailPanel(null)} className="close-button">X</button>
          </div>
        <hr /> {/* Separation line */}
        <div>
          <p>Rating: {activeDetailPanel.averageRating === 0 ? "This station hasn't been rated yet" : activeDetailPanel.averageRating}</p>
          {activeDetailPanel.averageRating > 0 && <StarRating rating={activeDetailPanel.averageRating} />}
        </div>
        <p>Connector Types: {activeDetailPanel.ev_connector_types?.join(', ')}</p>
        <p>Distance: {activeDetailPanel.distance?.toFixed(2)} miles</p>
        <p>DC Fast Chargers: {activeDetailPanel.ev_dc_fast_num !== null ? activeDetailPanel.ev_dc_fast_num : "None"}</p>
        <p>Level 2 EVSE: {activeDetailPanel.ev_level2_evse_num !== null ? activeDetailPanel.ev_level2_evse_num : "None"}</p>
        <p>Pricing: {activeDetailPanel.ev_pricing}</p>
        <button onClick={() => handleStationSelect(activeDetailPanel, myLocation)}>Direction</button>
        
        <Review stationId={activeDetailPanel.id} userEmail={sessionStorage.getItem('userEmail') || 'fake_user'} />
        
        <button onClick={handleChargeHereClick}>Charge Here</button> {/* New "Charge Here" button */}
        <hr /> {/* Separation line */}
        <button onClick={handleTripClick}>Show stations along the route</button>


      </div>
    )}
    </>
  );
};

export default Map;
