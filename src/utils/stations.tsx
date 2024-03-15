import axios from "axios";

export type StationData = {
  id: number;
  station_name: string;
  station_phone: string;
  latitude: number;
  longitude: number;
  street_address: string;
  ev_connector_types: string[];
  distance: number;
  averageRating: number;
  ev_dc_fast_num: number | null; 
  ev_level2_evse_num: number | null;
  ev_pricing: string; 
};

export async function fetchStations(location: string): Promise<StationData[]> {
  const API_URL = `https://developer.nrel.gov/api/alt-fuel-stations/v1/nearest.json`;
  const API_KEY = 'YRZ8wDuqPO3Ov5XeQhvKkaR6Zvw0afc7WlBNbdm6';

  try {
    const response = await axios.get(`${API_URL}?api_key=${API_KEY}&location=${location}`);
    let stations = response.data.fuel_stations.map((station: any) => ({
      id: station.id,
      station_name: station.station_name,
      station_phone: station.station_phone,
      latitude: station.latitude,
      longitude: station.longitude,
      street_address: station.street_address,
      ev_connector_types: station.ev_connector_types,
      distance: station.distance,
      averageRating: "There is no rating yet",
      ev_dc_fast_num: station.ev_dc_fast_num,
      ev_level2_evse_num: station.ev_level2_evse_num,
      ev_pricing: station.ev_pricing || "Not available", // Default value
    }));

    const ratingsPromises = stations.map(async (station: any) => {
      try {
        const ratingResponse = await axios.post('https://s24-final-back.azurewebsites.net/api/getrating', {
          stationId: station.id,
        });
        station.averageRating = ratingResponse.data.averageRating;
      } catch (error) {
        console.error(`Failed to fetch average rating for stationId ${station.id}:`, error);
      }
      return station;
    });

    stations = await Promise.all(ratingsPromises);

    return stations;
  } catch (error) {
    console.error('Failed to fetch station data:', error);
    throw error;
  }
}
