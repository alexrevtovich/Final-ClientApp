import * as atlas from 'azure-maps-control';
import { StationData } from './stations';

export const addPinsToMap = (stations: StationData[], map: atlas.Map, onPinSelect: (station: StationData, currentLocation: [number, number]) => void, currentLocation: [number, number]) => {
  // Create a data source and add it to the map.
  const dataSource = new atlas.source.DataSource();
  map.sources.add(dataSource);

  // Add a pin for each station to the data source.
  stations.forEach(station => {
      const pin = new atlas.data.Feature(new atlas.data.Point([station.longitude, station.latitude]), {
          title: station.station_name,
          stationData: station,
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
};
