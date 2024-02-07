// route.tsx
import * as atlas from 'azure-maps-control';
import 'azure-maps-control/dist/atlas.min.css';

export const calculateAndDisplayRoute = async (map: atlas.Map, origin: [number, number], destination: [number, number]) => {
  // Construct the URL for the Azure Maps Route Directions API
  const routeUrl = `https://atlas.microsoft.com/route/directions/json?api-version=1.0&subscription-key=${process.env.REACT_APP_AZURE_MAPS_SUBSCRIPTION_KEY}&query=${origin[1]},${origin[0]}:${destination[1]},${destination[0]}`;

  
};
