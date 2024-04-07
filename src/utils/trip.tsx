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
  const FUNCTION_URL = `https://s24-final-back.azurewebsites.net/api/fetchstationsalongroute`;

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

  try {
    // Making POST request to your Azure Function
    const response = await axios.post(FUNCTION_URL, {
      linestring: simplifiedLinestring,
      distance: distance.toString(),
    });

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
      averageRating: 0, // Assuming you will handle ratings separately
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
