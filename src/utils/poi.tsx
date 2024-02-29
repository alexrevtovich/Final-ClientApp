import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { StationData } from '../utils/stations';

interface Props {
  station: StationData;
}

const POI: React.FC<Props> = ({ station }) => {
  const [restaurants, setRestaurants] = useState<any[]>([]); // Assuming restaurant data structure
  

  useEffect(() => {
    const fetchRestaurantsData = async () => {
      try {
        const response = await axios.get(`https://atlas.microsoft.com/search/poi/json`, {
          params: {
            'api-version': '1.0',
            query: 'restaurants',
            lat: station.latitude,
            lon: station.longitude,
            radius: 300,
            limit: 8,
            categorySet: 'eat-drink',
            subscriptionKey: process.env.REACT_APP_AZURE_MAPS_SUBSCRIPTION_KEY || 'h72XWBttx4Tanjo1p5fNxyZPyzWi5UpgCL3yIe0K0Xs',
          },
        });
        setRestaurants(response.data.results); // Assuming restaurant data is in `results` field
      } catch (error) {
        console.error('Error fetching restaurants:', error);
      }
    };

    fetchRestaurantsData();

    // Cleanup function
    return () => {
      // Cleanup code if needed
    };
  }, [station]);

  return (
    <div>
      <h2>{station.station_name}</h2>
      {/* Display station details here */}
      <ul>
        {restaurants.map((restaurant: any, index: number) => (
          <li key={index}>{restaurant.name}</li> // Display restaurant name or other details
        ))}
      </ul>
    </div>
  );
};

export default POI;
