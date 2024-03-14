import * as atlas from 'azure-maps-control';
import { StationData } from './stations';

export const addPinsToMap = (
  stations: StationData[],
  map: atlas.Map,
  onPinSelect: (station: StationData, currentLocation: [number, number]) => void,
  currentLocation: [number, number],
  setActiveDetailPanel: (station: StationData | null) => void // Assuming this function is passed to handle pin clicks
) => {
  // Create a data source and add it to the map.
  const dataSource = new atlas.source.DataSource();
  map.sources.add(dataSource);

  // Add a pin for each station to the data source.
  stations.forEach(station => {
    const pin = new atlas.data.Feature(new atlas.data.Point([station.longitude, station.latitude]), {
      // Include station data directly in the properties
      properties: {
        title: station.station_name,
        stationData: JSON.stringify(station), // Convert stationData to a string to store in properties
      }
    });

    dataSource.add(pin);
  });

  // Create a symbol layer using the data source and add it to the map.
  const resultLayer = new atlas.layer.SymbolLayer(dataSource, undefined, {
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

  // Check if a layer with the same ID already exists to avoid duplicates.
  if (!map.layers.getLayerById('resultLayer')) {
    map.layers.add(resultLayer, 'resultLayer');
  }

  // Attach click event to the layer
  map.events.add('click', resultLayer, (e) => {
    if (e.shapes && e.shapes.length > 0) {
      const clickedItem = e.shapes[0];
  
      // Define a variable to hold the properties
      let properties;
  
      // Check if the clicked item is a Shape and use getProperties if it is
      if (clickedItem instanceof atlas.Shape) {
        properties = clickedItem.getProperties();
      } else if (clickedItem.type === 'Feature') {
        // If it's a Feature, directly access the properties field
        properties = clickedItem.properties;
      }
  
      // Now that we have the properties, proceed as before
      if (properties && properties.hasOwnProperty('stationData')) {
        // Assuming stationData is stored as a JSON string
        const stationData = JSON.parse(properties['stationData']);
        setActiveDetailPanel(stationData);
      }
    }
  });
  
};
