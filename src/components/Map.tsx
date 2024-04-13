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
import trackLocation from '../utils/trackLocation'
// import chargeCar from '../utils/chargeCar';
import { fetchStationsAlongRoute } from '../utils/trip';
import axios from 'axios';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';




const Map: React.FC = () => {
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<atlas.Map | null>(null);
  const datasourceRef = useRef<atlas.source.DataSource | null>(null);
  const userLocationPinRef = useRef<atlas.HtmlMarker | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [stationData, setStationData] = useState<StationData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [myLocation, setMyLocation] = useState<[number, number]>([29.7174, -95.4028]);
  const [activeDetailPanel, setActiveDetailPanel] = useState<StationData | null>(null);
  const [currentRoute, setCurrentRoute] = useState<string | null>(null);
  const [isStationInfoVisible, setIsStationInfoVisible] = useState(true); // State to track visibility
  const [isDetailPanelVisible, setIsDetailPanelVisible] = useState(true); // State to track visibility
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isRestaurantListVisible, setIsRestaurantListVisible] = useState(false);
  const [distanceInput, setDistanceInput] = useState('5');
  // Using trackLocation to get the real-time location
  const trackedLocation = trackLocation();
  
  interface Restaurant {
    name: string;
    address: string;
    phone: string;
    dist: number;
  }
  


  const toggleRestaurantListVisibility = () => {
    setIsRestaurantListVisible(prevState => !prevState);
  };  

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
        // Determine the new location based on whether `value` is a function or directly coordinates
        const newLocation = typeof value === 'function' ? value(currentLocation) : value;
        
        // Log the attempted update for debugging
        console.log("Attempting to update myLocation to:", newLocation[0], "Lat,", newLocation[1], "Long");

        // Validate the new location to ensure it contains numbers and not null
        if (newLocation[0] != null && newLocation[1] != null &&
            !isNaN(newLocation[0]) && !isNaN(newLocation[1])) {
            return newLocation;
        } else {
            console.error('Invalid location received, maintaining current location:', currentLocation);
            // Return the current location if the new one is invalid, ensuring no update to null
            return currentLocation;
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



  
  // Effect hook to update the user's location pin in real-time
  useEffect(() => {
    if (trackedLocation && mapInstanceRef.current) {
      const [lat, lon] = trackedLocation;

      // If the pin doesn't exist, create it
      if (!userLocationPinRef.current) {
        userLocationPinRef.current = new atlas.HtmlMarker({
          position: [lon, lat],
          color: 'red', // Specify pin color
          text: 'You ', // Text to display
          secondaryText: ' ', // Helpful to ensure text does not overlap with pin
          popup: new atlas.Popup({
            content: '<div>You are here</div>', // Optional: Define popup content for additional information
            pixelOffset: [0, -22] // Adjust vertically to show above the pin
          })
        });
        mapInstanceRef.current.markers.add(userLocationPinRef.current);
      } else {
        // If the pin exists, just update its position
        userLocationPinRef.current.setOptions({
          position: [lon, lat],
        });
      }

      // Optionally, center the map on the new location
      // mapInstanceRef.current.setCamera({ center: [lon, lat] });
    }
}, [trackedLocation]);


  

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
      // Keep the default initial location for map initialization
      const initialLocation = [29.7174, -95.4028];
      if (mapRef.current && !mapInstanceRef.current) {
        try {
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
            
            const locationStr = `${initialLocation[0]},${initialLocation[1]}`;
            await fetchAndDisplayStations(locationStr);
          });
        } catch (error) {
          console.error('Map initialization error:', error);
        }
      }
    };
  
    initializeMap();
  }, [fetchAndDisplayStations]); // Dependencies to re-initialize if these values change
  

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
      // Existing code for fetching station details
      const sumResponse = await axios.post('https://s24-final-back.azurewebsites.net/api/sumcharging', {
        StationId: station.id,
      });
      const { ac, dc } = sumResponse.data;
      station.AC = ac || 0;
      station.DC = dc || 0;
  
      // New code to fetch restaurants
      const restaurantsResponse = await axios.post('https://s24-final-back.azurewebsites.net/api/GetPOIs', {
        Latitude: station.latitude,
        Longitude: station.longitude,
      });
  
      setRestaurants(restaurantsResponse.data); // Update the restaurants state with the fetched data
  
      setActiveDetailPanel(station); // This remains unchanged
    } catch (error) {
      console.error('Failed to fetch additional info for station:', error);
      // Handle errors for both station details and restaurant fetching
      station.AC = 0;
      station.DC = 0;
      setActiveDetailPanel(station); // You may still want to show the panel even if some data fetches failed
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


  const handleDistanceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Ensure only digits 1-9 are accepted
    const value = e.target.value;
    if (/^[1-9]$/.test(value) || value === '') {
      setDistanceInput(value);
    }
  };


  const handleTripClick = async () => {
    // Convert distanceInput to a number, default to 5 if empty
    const distance = distanceInput ? parseInt(distanceInput, 10) : 5;
    if (!currentRoute) {
      console.log("No route selected.");
      return;
    }
  
    try {
      const stationsAlongRoute = await fetchStationsAlongRoute({
        linestring: currentRoute,
        distance, // Set the distance as needed
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
        <p>Show stations along the route:</p>
        <input
        type="text"
        value={distanceInput}
        onChange={handleDistanceInputChange}
        placeholder="miles"
        maxLength={1} // Limit input length to 1 character
        style={{ width: '30px', marginRight: '10px' }} // Adjust styling as needed
      />
      <button className="base-button" onClick={handleTripClick}>Show stations</button>
        <hr /> {/* Separation line */}
        
        
        {/* Restaurants Nearby Section */}
        <div className="restaurants-nearby-section">
          
          <button onClick={toggleRestaurantListVisibility} className="base-button">
            {isRestaurantListVisible ? 'Hide Restaurants Nearby:' : 'Show Restaurants Nearby:'}
          </button>
          <hr />
          {isRestaurantListVisible && (
            restaurants.length > 0 ? (
              <ul className="restaurant-list">
                {restaurants.map((restaurant, index) => (
                  <li key={index} className="restaurant-item">
                    <p><strong>{restaurant.name}</strong></p>
                    <p>Address: {restaurant.address}</p>
                    <p>Phone: {restaurant.phone}</p>
                    <p>Distance: {restaurant.dist} meters away</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No restaurants found.</p>
            )
          )}
        </div>



      </div>
    )}
    </>
  );
};

export default Map;