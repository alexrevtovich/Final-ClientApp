// In Types/global.d.ts
declare global {
    interface Window {
      gapi: any; // Existing declaration for gapi
      google: any; // Add this line to declare the google property
    }
  }
  
  export {}; // This ensures TypeScript treats this file as a module
  