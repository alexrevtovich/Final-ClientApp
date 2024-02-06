// In src/types/global.d.ts
declare global {
  interface Window {
    google: any;
  }
}

// Declare module for azure-maps-control with basic structure
declare module 'azure-maps-control' {
  // Example of declaring a Map class with minimal type information
  export class Map {
    constructor(container: string | HTMLElement, options?: any);
    // Add methods and properties as needed
  }

  // add more exports here as needed, such as controls, layers, etc.
}

export {};
