// Utils/stations.tsx
import axios from 'axios';

// Define the type for the station data for better type safety
export type StationData = {
  id: number;
  station_name: string;
  station_phone: string;
  latitude: number;
  longitude: number;
  street_address: string;
  zip: string;
  ev_connector_types: string[];
  distance: number;
};

// Function to fetch and filter station data
export async function fetchStations(location: string): Promise<StationData[]> {
  const API_URL = `https://developer.nrel.gov/api/alt-fuel-stations/v1/nearest.json`;
  const API_KEY = 'YRZ8wDuqPO3Ov5XeQhvKkaR6Zvw0afc7WlBNbdm6';

  try {
    const response = await axios.get(`${API_URL}?api_key=${API_KEY}&location=${location}`);
    return response.data.fuel_stations.map((station: any) => ({
      
      id: station.id,
      station_name: station.station_name,
      station_phone: station.station_phone,
      latitude: station.latitude,
      longitude: station.longitude,
      street_address: station.street_address,
      zip: station.zip,
      ev_connector_types: station.ev_connector_types,

      distance: station.distance,
    }));
  } catch (error) {
    console.error('Failed to fetch station data:', error);
    throw error; // Rethrow the error to be handled by the caller
  }
}
