import axios from 'axios';
import { StationData } from './stations'; // Adjust the import path as necessary
import simplify from 'simplify-js';

interface FetchStationsAlongRouteParams {
  linestring: string;
  distance: number;
}

export const fetchStationsAlongRoute = async ({
  linestring,
  distance,
}: FetchStationsAlongRouteParams): Promise<StationData[]> => {
  const API_URL = `https://developer.nrel.gov/api/alt-fuel-stations/v1/nearby-route.json`;
  const API_KEY = 'YRZ8wDuqPO3Ov5XeQhvKkaR6Zvw0afc7WlBNbdm6';

  // Convert the LINESTRING into an array of points for simplification
  const points = linestring.slice(11, -1).split(', ').map(pair => {
    const [x, y] = pair.split(' ').map(Number);
    return { x, y };
  });

  // Simplify the points
  const tolerance = 0.01; // This is the tolerance for simplification, adjust as needed
  const highQuality = true; // Whether to use a slightly slower algorithm for better quality
  const simplifiedPoints = simplify(points, tolerance, highQuality);

  // Convert back to LINESTRING format
  const simplifiedLinestring = `LINESTRING(${simplifiedPoints.map(p => `${p.x} ${p.y}`).join(", ")})`;
  const routeQueryParam = encodeURIComponent(simplifiedLinestring);

  try {
    const response = await axios.get(`${API_URL}?api_key=${API_KEY}&route=${routeQueryParam}&distance=${distance}`);

    // Map the response to match the StationData type
    let stations: StationData[] = response.data.fuel_stations.map((station: any) => ({
      id: station.id,
      station_name: station.station_name,
      station_phone: station.station_phone,
      latitude: station.latitude,
      longitude: station.longitude,
      street_address: station.street_address,
      ev_connector_types: station.ev_connector_types,
      distance: station.distance,
      averageRating: 0, // Placeholder, assuming you'll fetch ratings similarly to how it's done in stations.tsx
      ev_dc_fast_num: station.ev_dc_fast_num,
      ev_level2_evse_num: station.ev_level2_evse_num,
      ev_pricing: station.ev_pricing || "Not available",
    }));

    return stations;
  } catch (error) {
    console.error('Failed to fetch stations along the route:', error);
    throw error;
  }
};
