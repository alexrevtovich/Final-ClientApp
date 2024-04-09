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
// import chargeCar from '../utils/chargeCar';
import { fetchStationsAlongRoute } from '../utils/trip';
import axios from 'axios';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';




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
      
      console.log("Updating myLocation to:", newLocation[0], "Lat,", newLocation[1], "Long");
  
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
        const stationsWithChargingInfo = await Promise.all(stationsData.map(async (station) => {
            try {
                // Fetch sum of AC and DC values for the station
                const sumResponse = await axios.post('https://s24-final-back.azurewebsites.net/api/SumCharging', { StationId: station.id });
                station.AC = sumResponse.data.ac || 0; // Adjust to match the response structure
                station.DC = sumResponse.data.dc || 0;
                station.chargingCount = sumResponse.data.chargingCount || 0; // Assuming you have chargingCount in the response, otherwise remove
            } catch (error) {
                console.error(`Failed to fetch charging info for stationId ${station.id}:`, error);
                station.AC = 0; // Set default value if fetching fails
                station.DC = 0; // Set default value if fetching fails
                station.chargingCount = 0; // Assuming chargingCount is needed, otherwise remove
            }
            return station;
        }));
        setStationData(stationsWithChargingInfo);
        // Display stations on the map
        if (stationsWithChargingInfo.length > 0 && mapInstanceRef.current) {
            mapInstanceRef.current.setCamera({
                center: [stationsWithChargingInfo[0].longitude, stationsWithChargingInfo[0].latitude],
                zoom: 15,
            });

            addPinsToMap(stationsWithChargingInfo, mapInstanceRef.current, setActiveDetailPanel);
        } else {
            setError('No stations found for the provided location.');
        }
    } catch (error) {
        console.error('Error fetching stations:', error);
        setError('Failed to fetch station data. Please try again.');
    }
}, []);

//SignalR
useEffect(() => {
  // Establish the connection using HubConnectionBuilder
  const connection = new HubConnectionBuilder()
    .withUrl("https://s24-final-back.azurewebsites.net/api", { // Correct endpoint
      // Add any required configuration options here
    })
    .configureLogging(LogLevel.Information)
    .withAutomaticReconnect()
    .build(); // Correctly terminates the builder chain

  // Define the event handler for "chargingUpdate" events
  const onChargingUpdate = (data: any) => {
    console.log("Charging data updated:", data);

    // Update station data based on the incoming data
    setStationData(currentStations => currentStations.map(station => {
      if (station.id === data.StationId) {
        return { ...station, AC: data.AC, DC: data.DC }; // Update with new AC/DC values
      }
      return station; // Return unchanged if not the updated station
    }));

    // Additionally, update activeDetailPanel if it's showing the updated station
    if (activeDetailPanel && activeDetailPanel.id === data.StationId) {
      setActiveDetailPanel(prevDetailPanel => prevDetailPanel ? { ...prevDetailPanel, AC: data.AC, DC: data.DC } : null);
    }
  };

  // Attach the event handler to the "chargingUpdate" event
  connection.on("chargingUpdate", onChargingUpdate);

  // Start the SignalR connection
  connection.start()
    .then(() => console.log("Connected to SignalR hub"))
    .catch(err => console.error("SignalR Connection Error: ", err));

  // Define the cleanup function to stop the connection and remove the event handler
  return () => {
    connection.stop();
    connection.off("chargingUpdate", onChargingUpdate); // Remove the event handler
  };
}, [activeDetailPanel]); // Dependencies array



  
  

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

  const handleDetailsClick = async (station: StationData) => {
    try {
      // Corrected to use POST request to the /api/SumCharging endpoint
      const sumResponse = await axios.post('https://s24-final-back.azurewebsites.net/api/sumcharging', {
        StationId: station.id,
      });
      // Assuming the response structure has 'ac', 'dc', and optionally 'chargingCount'
      const { ac, dc } = sumResponse.data;
      station.AC = ac || 0; // Adjust to match the response structure
      station.DC = dc || 0;
      setActiveDetailPanel(station);
     
    } catch (error) {
      console.error(`Failed to fetch charging info for stationId ${station.id}:`, error);
      // If fetching fails, consider how you want to handle this. For now, let's log and move on.
      station.AC = 0; // Setting default values as a fallback
      station.DC = 0;
      setActiveDetailPanel(station); // You may decide to still set the active detail panel or handle differently
    }
  };
  
  
  

  const handleChargeHereClick = async () => {
    if (!activeDetailPanel) {
      console.error("No station selected.");
      return;
    }
  
    try {
      const payload = {
        StationId: activeDetailPanel.id,
        Email: sessionStorage.getItem('userEmail') || 'fake_user',
        AC: activeDetailPanel.DC !== null ? 0 : 1,
        DC: activeDetailPanel.DC !== null ? 1 : 0
      };
  
      const response = await axios.post('https://s24-final-back.azurewebsites.net/api/startcharging', payload);
  
      console.log('Charging request successful:', response.data);
      // Display AC and DC values returned from the API
      
    } catch (error) {
      console.error('Error charging the car:', error);
      // Handle error, e.g., display an error message to the user
      alert('Failed to charge the car. Please try again later.');
    }
  };
  
  

  const handleStopChargingClick = async () => {
    try {
      if (!activeDetailPanel) {
        console.error("No station selected.");
        return;
      }
  
      const payload = {
        StationId: activeDetailPanel.id,
        Email: sessionStorage.getItem('userEmail') || 'fake_user',
      };
  
      const response = await axios.post('https://s24-final-back.azurewebsites.net/api/StopCharging', payload);
  
      console.log('Stop charging request successful:', response.data);
  
      
    } catch (error) {
      console.error('Error stopping charging:', error);
      // Handle error, e.g., display an error message to the user
      alert('Failed to stop charging. Please try again later.');
    }
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
        {isStationInfoVisible ? '↓↓↓' : '↑↑↑'}
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
            <button className="base-button" onClick={() => handleDetailsClick(station)}>Details</button>
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
          <p className="rating-text">
            Rating: {activeDetailPanel.averageRating === 0 ? "This station hasn't been rated yet" : activeDetailPanel.averageRating}
          </p>
          {activeDetailPanel.averageRating > 0 && <StarRating rating={activeDetailPanel.averageRating} />}
        </div>
        <p>Connector Types: {activeDetailPanel.ev_connector_types?.join(', ')}</p>
        <p>Distance: {activeDetailPanel.distance?.toFixed(2)} miles</p>
        <p>DC Fast Chargers: {activeDetailPanel.ev_dc_fast_num !== null ? activeDetailPanel.ev_dc_fast_num : "None"}</p>
        <p>Level 2 EVSE: {activeDetailPanel.ev_level2_evse_num !== null ? activeDetailPanel.ev_level2_evse_num : "None"}</p>
        <p>Pricing: {activeDetailPanel.ev_pricing}</p>
        {/*<p>AC: {activeDetailPanel.AC}</p>  Display AC value */} 
        <p>People here: {activeDetailPanel.DC}</p> {/* Display DC value */}
        <button className="base-button" onClick={() => handleStationSelect(activeDetailPanel, myLocation)}>Direction</button>

        <Review stationId={activeDetailPanel.id} userEmail={sessionStorage.getItem('userEmail') || 'fake_user'} />
        
        <button className="base-button" onClick={handleChargeHereClick}>Charge Here</button>
        <button className="base-button" onClick={handleStopChargingClick}>Stop Charging</button> {/* New "Stop Charging" button */}
        
        <hr /> {/* Separation line */}
        <button className="base-button" onClick={handleTripClick}>Show stations along the route</button>


      </div>
    )}
    </>
  );
};

export default Map;