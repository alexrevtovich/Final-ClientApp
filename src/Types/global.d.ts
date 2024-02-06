// In src/types/global.d.ts
declare global {
  interface Window {
    google: any; // Existing declaration for Google
    map: atlas.Map; // Add this line to declare a 'map' property of type 'atlas.Map'
  }
}

declare module 'azure-maps-control' {
  export class Map {
    constructor(container: string | HTMLElement, options?: any);
  }
  export namespace control {
  }

  export namespace layer {
  }

  // Include any other exports as needed here
}

export {};
