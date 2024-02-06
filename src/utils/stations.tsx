// Utils/stations.tsx
import axios from 'axios';

// Define the type for the station data for better type safety
export type StationData = {
  access_code: string;
  access_days_time: string;
  fuel_type_code: string;
  station_name: string;
  station_phone: string;
  latitude: number;
  longitude: number;
  street_address: string;
  zip: string;
  ev_connector_types: string[];
  ev_network: string;
  ev_network_web: string;
  ev_network_ids: object; // You might want to define this more precisely based on the actual data structure
  distance: number;
};

// Function to fetch and filter station data
export async function fetchStations(location: string): Promise<StationData[]> {
  const API_URL = `https://developer.nrel.gov/api/alt-fuel-stations/v1/nearest.json`;
  const API_KEY = 'YRZ8wDuqPO3Ov5XeQhvKkaR6Zvw0afc7WlBNbdm6';

  try {
    const response = await axios.get(`${API_URL}?api_key=${API_KEY}&location=${location}`);
    return response.data.fuel_stations.map((station: any) => ({
      access_code: station.access_code,
      access_days_time: station.access_days_time,
      fuel_type_code: station.fuel_type_code,
      station_name: station.station_name,
      station_phone: station.station_phone,
      latitude: station.latitude,
      longitude: station.longitude,
      street_address: station.street_address,
      zip: station.zip,
      ev_connector_types: station.ev_connector_types,
      ev_network: station.ev_network,
      ev_network_web: station.ev_network_web,
      ev_network_ids: station.ev_network_ids,
      distance: station.distance,
    }));
  } catch (error) {
    console.error('Failed to fetch station data:', error);
    throw error; // Rethrow the error to be handled by the caller
  }
}
