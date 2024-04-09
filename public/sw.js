// Name of the cache to store Azure Maps API responses and Azure functions data
const CACHE_NAME = 'api-response-cache-v1';

// Utility function to respond with cache first strategy
async function cacheFirst(req) {
    try {
        // Try to get the request from the cache
        const cachedResponse = await caches.match(req);
        if (cachedResponse) {
            // Return the cached response if found
            return cachedResponse;
        }
        // If not found in cache, fetch from the network, cache the fresh response, and return it
        const freshResponse = await fetch(req);
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, freshResponse.clone());
        return freshResponse;
    } catch (error) {
        // If the network request fails and no cache is found, throw the original error
        throw error;
    }
}

// Install event
self.addEventListener('install', (event) => {
    self.skipWaiting(); // Force the waiting service worker to become the active service worker
});

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.filter((cacheName) => cacheName !== CACHE_NAME)
                .map((cacheName) => caches.delete(cacheName))
            );
        })
    );
});

// Fetch event - Apply cache-first strategy for specific API requests
self.addEventListener('fetch', (event) => {
    const requestUrl = new URL(event.request.url);

    // Apply cache-first strategy to Azure Maps API requests and specific Azure functions
    if (requestUrl.hostname === 'atlas.microsoft.com' ||
        requestUrl.href.includes('s24-final-back.azurewebsites.net/api/fetchstations') ||
        requestUrl.href.includes('s24-final-back.azurewebsites.net/api/fetchstationsalongroute') ||
        requestUrl.href.includes('s24-final-back.azurewebsites.net/api/GetCars')) {
        event.respondWith(cacheFirst(event.request));
    }
});
