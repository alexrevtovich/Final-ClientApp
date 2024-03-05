// Map.tsx
import React, { useEffect, useRef } from 'react';
import { addAdvancedMarker } from '../utils/advMarker'; // Adjust the path as necessary

const Map: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Function to dynamically load the Google Maps script
    const loadScript = (src: string, callback: () => void) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      document.head.appendChild(script);
      script.onload = callback;
    };

    loadScript(`https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`, () => {
      if (mapRef.current) {
        // Map initialization
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: 29.7174, lng: -95.4028 },
          zoom: 10,
        });

        // Example usage of the advanced marker
        addAdvancedMarker(map);
      }
    });
  }, []);

  return <div ref={mapRef} style={{ height: '100vh', width: '100%' }} />;
};

export default Map;
