import * as atlas from 'azure-maps-control';

type Coordinates = [number, number];

interface RouteSegment {
    summary: {
        lengthInMeters: number;
        travelTimeInSeconds: number;
    };
    points: { latitude: number; longitude: number }[];
}

// Update to fix TypeScript implicit any error
export const getRouteDirections = async (startCoords: Coordinates, endCoords: Coordinates): Promise<RouteSegment> => {
    const response = await fetch('https://final-back.azurewebsites.net/api/getroutedirections', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ Start: startCoords.join(','), End: endCoords.join(',') }),
    });

    if (!response.ok) {
        throw new Error('Network response was not ok.');
    }

    const jsonResponse = await response.json();

    // Assuming the first route and first leg is the desired one
    const firstRoute = jsonResponse.routes[0];
    const firstLeg = firstRoute.legs[0];

    // Transform to the expected RouteSegment format
    const routeSegment: RouteSegment = {
        summary: firstLeg.summary,
        points: firstLeg.points.map((point: any) => ({ latitude: point.latitude, longitude: point.longitude })),
    };

    return routeSegment;
};


export const renderRouteOnMap = (routeSegment: RouteSegment, map: atlas.Map, dataSource: atlas.source.DataSource): void => {
    dataSource.clear();
    
    if (routeSegment.points.length === 0) {
        console.error('No points to render.');
        return;
    }

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

    map.setCamera({
        bounds: atlas.data.BoundingBox.fromData(lineString),
        padding: 20
    });
};
