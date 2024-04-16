// Import axios for making HTTP requests
import axios from "axios";

// Define a TypeScript type for the station data structure
export type StationData = {
  id: number;
  station_name: string;
  station_phone: string;
  latitude: number;
  longitude: number;
  street_address: string;
  ev_connector_types: string[];
  distance: number;
  averageRating: number; // Initially set as a number, but you might need to adjust based on actual data type (e.g., string if "There is no rating yet")
  ev_dc_fast_num: number | null; 
  ev_level2_evse_num: number | null;
  ev_pricing: string; 
  AC: number | null; // Placeholder for AC charging info, to be updated
  DC: number | null; // Placeholder for DC charging info, to be updated
  chargingCount: number; // Placeholder for the charging count, to be updated
};

// Asynchronously fetches station data based on a given location
export async function fetchStations(location: string): Promise<StationData[]> {
  // URL to the API endpoint
  const FUNCTION_URL = `https://final-back.azurewebsites.net/api/fetchstations`;

  try {
    // Make a POST request to the API endpoint with the location
    const response = await axios.post(FUNCTION_URL, { location });

    // Map through the fetched stations data to create an array of StationData objects
    let stations = response.data.fuel_stations.map((station: any) => ({
      // Map each property of the station to the StationData type
      id: station.id,
      station_name: station.station_name,
      station_phone: station.station_phone,
      latitude: station.latitude,
      longitude: station.longitude,
      street_address: station.street_address,
      ev_connector_types: station.ev_connector_types,
      distance: station.distance,
      averageRating: "There is no rating yet", // Initial placeholder for the rating
      ev_dc_fast_num: station.ev_dc_fast_num,
      ev_level2_evse_num: station.ev_level2_evse_num,
      ev_pricing: station.ev_pricing || "Not available", // Default to "Not available" if not provided
      AC: null, // Initialize as null, to be updated later
      DC: null, // Initialize as null, to be updated later
      chargingCount: 0, // Initialize as 0, to be updated later
    }));

    // Asynchronously enrich each station object with additional data (e.g., average rating)
    const enrichedStations = stations.map(async (station: any) => {
      // Attempt to fetch the average rating for each station
      try {
        const ratingResponse = await axios.post('https://final-back.azurewebsites.net/api/getrating', {
          stationId: station.id,
        });
        // Update the station's averageRating with the fetched data
        station.averageRating = ratingResponse.data.averageRating;
      } catch (error) {
        // Log the error if fetching the rating fails
        console.error(`Failed to fetch average rating for stationId ${station.id}:`, error);
      }

      // Return the updated station object
      return station;
    });

    // Wait for all station objects to be enriched and return the enriched stations array
    return await Promise.all(enrichedStations);
  } catch (error) {
    // Log and rethrow the error if the API request fails
    console.error('Failed to fetch station data:', error);
    throw error;
  }
}
