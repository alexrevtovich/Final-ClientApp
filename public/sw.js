// Name of the cache to store Azure Maps API responses
const AZURE_MAPS_CACHE_NAME = 'azure-maps-api-cache-v1';

// Utility function to respond with network first strategy
async function networkFirst(req) {
    try {
        // Try to fetch the request from the network
        const freshResponse = await fetch(req);
        // If the request is successful, clone the response, cache it, and return the response
        const cache = await caches.open(AZURE_MAPS_CACHE_NAME);
        cache.put(req, freshResponse.clone());
        return freshResponse;
    } catch (error) {
        // If the network request fails, try to get the request from the cache
        const cachedResponse = await caches.match(req);
        if (cachedResponse) {
            return cachedResponse;
        }
        // If not found in cache, throw the original error
        throw error;
    }
}

// Install event
self.addEventListener('install', (event) => {
    self.skipWaiting(); // Immediately replace the currently active service worker
});

// Activate event
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.filter((cacheName) => cacheName !== AZURE_MAPS_CACHE_NAME)
                .map((cacheName) => caches.delete(cacheName))
            );
        })
    );
});

// Fetch event - caching Azure Maps API requests
self.addEventListener('fetch', (event) => {
    // Check if the request URL is for the Azure Maps API
    if (event.request.url.includes('atlas.microsoft.com')) {
        event.respondWith(networkFirst(event.request));
    }
});
