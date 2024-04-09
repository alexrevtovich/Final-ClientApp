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
  AC: number | null;
  DC: number | null;
  chargingCount: number; 
};

export async function fetchStations(location: string): Promise<StationData[]> {
  const FUNCTION_URL = `https://s24-final-back.azurewebsites.net/api/fetchstations`;

  try {
    const response = await axios.post(FUNCTION_URL, { location });

    let stations = response.data.fuel_stations.map((station: any) => ({
      id: station.id,
      station_name: station.station_name,
      station_phone: station.station_phone,
      latitude: station.latitude,
      longitude: station.longitude,
      street_address: station.street_address,
      ev_connector_types: station.ev_connector_types,
      distance: station.distance,
      averageRating: "There is no rating yet", // Placeholder until ratings are fetched
      ev_dc_fast_num: station.ev_dc_fast_num,
      ev_level2_evse_num: station.ev_level2_evse_num,
      ev_pricing: station.ev_pricing || "Not available",
      AC: null, // Will be updated after fetching AC/DC counts
      DC: null, // Will be updated after fetching AC/DC counts
      chargingCount: 0, // Placeholder until counts are fetched
    }));

    // Simultaneously fetch ratings, AC, and DC counts for each station
    const enrichedStations = stations.map(async (station: any) => {
      // Additional logic for fetching ratings and AC/DC counts
      // Assume this logic remains the same, or adjust as necessary to match your backend
      // Fetch average rating
      try {
        const ratingResponse = await axios.post('https://s24-final-back.azurewebsites.net/api/getrating', {
          stationId: station.id,
        });
        station.averageRating = ratingResponse.data.averageRating;
      } catch (error) {
        console.error(`Failed to fetch average rating for stationId ${station.id}:`, error);
        // Optionally handle this error, e.g., by leaving the default rating or setting a specific error value
      }

      return station; // This is the station data enriched with the additional details
    });

    return await Promise.all(enrichedStations);
  } catch (error) {
    console.error('Failed to fetch station data:', error);
    throw error;
  }
}
