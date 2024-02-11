import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { StationData } from '../utils/fullStationsList';

declare const google: any;

const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || '838062661118-ktim79hu56fe6ot7c8cj3spjf81oiec4.apps.googleusercontent.com';

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const [stationData, setStationData] = useState<StationData[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [stationsPerPage] = useState<number>(1000);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    document.body.appendChild(script);

    const handleCredentialResponse = (response: any) => {
      try {
        const decoded = jwtDecode(response.credential) as { email: string };
        const userEmail = decoded.email;
        sessionStorage.setItem("userEmail", userEmail);
        navigate('/account');
      } catch (error) {
        console.error('Error decoding JWT or navigating:', error);
      }
    };

    script.onload = () => {
      google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse
      });

      google.accounts.id.renderButton(
        document.getElementById('signInDiv'),
        { theme: 'outline', size: 'large' }
      );
    };

    return () => {
      document.body.removeChild(script);
      if (google.accounts && google.accounts.id && typeof google.accounts.id.cancel === 'function') {
        google.accounts.id.cancel();
      }
    };
  }, [navigate]);

  useEffect(() => {
    async function fetchStationsData() {
      try {
        const API_URL = 'https://developer.nrel.gov/api/alt-fuel-stations/v1.json';
        const API_KEY = 'YRZ8wDuqPO3Ov5XeQhvKkaR6Zvw0afc7WlBNbdm6';

        const response = await axios.get(`${API_URL}?api_key=${API_KEY}`);
        const fullStationsList: StationData[] = response.data.fuel_stations.map((station: any) => ({
          station_name: station.station_name,
          station_phone: station.station_phone,
          latitude: station.latitude,
          longitude: station.longitude,
          street_address: station.street_address,
          zip: station.zip,
          ev_connector_types: station.ev_connector_types,
          distance: station.distance,
        }));
        
        setStationData(fullStationsList);
      } catch (error) {
        console.error('Failed to fetch station data:', error);
      }
    }

    fetchStationsData();
  }, []);

  // Get current stations
  const indexOfLastStation = currentPage * stationsPerPage;
  const indexOfFirstStation = indexOfLastStation - stationsPerPage;
  const currentStations = stationData.slice(indexOfFirstStation, indexOfLastStation);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div>
      <div id="signInDiv"></div>
      
      <div>
        <h2>Station Data</h2>
        <ul>
          {currentStations.map((station, index) => (
            <li key={index}>
              <strong>Name:</strong> {station.station_name}, 
              <strong>Phone:</strong> {station.station_phone}, 
              <strong>Latitude:</strong> {station.latitude}, 
              <strong>Longitude:</strong> {station.longitude}, 
              <strong>Address:</strong> {station.street_address}, 
              <strong>Zip:</strong> {station.zip}, 
              <strong>Connectors:</strong> {station.ev_connector_types?.join(', ')}, 
              <strong>Distance:</strong> {station.distance}
            </li>
          ))}
        </ul>
      </div>
      <Pagination
        itemsPerPage={stationsPerPage}
        totalItems={stationData.length}
        paginate={paginate}
      />
    </div>
  );
};

export default Auth;

// Pagination Component
interface PaginationProps {
  itemsPerPage: number;
  totalItems: number;
  paginate: (pageNumber: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ itemsPerPage, totalItems, paginate }) => {
  const pageNumbers = [];

  for (let i = 1; i <= Math.ceil(totalItems / itemsPerPage); i++) {
    pageNumbers.push(i);
  }

  return (
    <nav>
      <ul className='pagination'>
        {pageNumbers.map((number) => (
          <li key={number} className='page-item'>
            <a onClick={() => paginate(number)} href='!#' className='page-link'>
              {number}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};
