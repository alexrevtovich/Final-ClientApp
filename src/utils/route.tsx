import * as atlas from 'azure-maps-control';

type Coordinates = [number, number];

interface RouteSegment {
    summary: {
        lengthInMeters: number;
        travelTimeInSeconds: number;
    };
    points: { latitude: number; longitude: number }[];
}

export const getRouteDirections = async (startCoords: Coordinates, endCoords: Coordinates): Promise<RouteSegment> => {
    const subscriptionKey = process.env.REACT_APP_AZURE_MAPS_SUBSCRIPTION_KEY;
    const startQuery = encodeURIComponent(`${startCoords[0]},${startCoords[1]}`); 
    const endQuery = encodeURIComponent(`${endCoords[0]},${endCoords[1]}`); 
    const routeUrl = `https://atlas.microsoft.com/route/directions/json?api-version=1.0&subscription-key=${subscriptionKey}&query=${startQuery}:${endQuery}`;
    console.log(`Requesting route for ${startQuery} to ${endQuery}`);

    try {
        const response = await fetch(routeUrl);
        if (!response.ok) {
    const errorText = await response.text();
    console.error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
}

        const data = await response.json();
        return data.routes[0].legs[0]; // Assuming the first route and first leg is the desired one
    } catch (error) {
        console.error("Error fetching route directions:", error);
        throw error;
    }
};

export const renderRouteOnMap = (routeSegment: RouteSegment, map: atlas.Map, dataSource: atlas.source.DataSource): void => {
    // Clear previous data
    dataSource.clear();

    const coordinates: atlas.data.Position[] = routeSegment.points.map(point => [point.longitude, point.latitude]);

    const lineString = new atlas.data.LineString(coordinates);
    dataSource.add(new atlas.data.Feature(lineString));

    if (!map.layers.getLayerById("routeLayer")) {
        const lineLayer = new atlas.layer.LineLayer(dataSource, "routeLayer", {
            strokeColor: 'blue',
            strokeWidth: 3,
            lineJoin: 'round',
            lineCap: 'round',
        });
        map.layers.add(lineLayer);
    }

    // Fit the map view to the route
    map.setCamera({
        bounds: atlas.data.BoundingBox.fromData(lineString),
        padding: 20
    });
};
