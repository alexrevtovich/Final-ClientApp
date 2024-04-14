import * as atlas from 'azure-maps-control';
import { StationData } from './stations';

// Update the signature of addPinsToMap to include setActiveDetailPanel
export const addPinsToMap = (
    stations: StationData[], 
    map: atlas.Map, 
    setActiveDetailPanel: (station: StationData | null) => void,
    fetchRestaurantsForStation: (station: StationData) => Promise<void> 
  ) => {
    const dataSource = new atlas.source.DataSource();
    map.sources.add(dataSource);
  
    stations.forEach(station => {
      const pin = new atlas.data.Feature(new atlas.data.Point([station.longitude, station.latitude]), {
        title: station.station_name,
        stationData: JSON.stringify(station), // Convert stationData to a string
      });
  
      dataSource.add(pin);
    });
  
    const pinsLayer = new atlas.layer.SymbolLayer(dataSource, undefined, {
      iconOptions: {
        image: 'pin-round-darkblue',
        anchor: 'center',
        allowOverlap: true,
      },
      textOptions: {
        textField: ['get', 'title'],
        offset: [0, -2],
      },
    });
  
    map.layers.add(pinsLayer);
  
    map.events.add('click', pinsLayer, (e) => {
        if (e.shapes && e.shapes.length > 0) {
            const firstShape = e.shapes[0] as any; // Type assertion to bypass TypeScript error
            const properties = firstShape.getProperties();
    
            // Assuming stationData is stored as a JSON string in properties
            if (properties && properties.stationData) {
                const stationData: StationData = JSON.parse(properties.stationData);
                setActiveDetailPanel(stationData);
                fetchRestaurantsForStation(stationData);
            }
        }
    });
  };
  