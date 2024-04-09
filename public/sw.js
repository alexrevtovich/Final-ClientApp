// Name of the cache to store responses and data
const CACHE_NAME = 'EV-SPOTTER-cache-v1';

// Utility function to respond with cache first strategy
async function cacheFirst(req) {
    if (req.method !== "GET") {
        // For non-GET requests, just fetch from the network without caching
        return fetch(req);
    }
    try {
        // Try to get the request from the cache
        const cachedResponse = await caches.match(req);
        if (cachedResponse) {
            // Return the cached response if found
            return cachedResponse;
        }
        // If not found in cache, fetch from the network
        const freshResponse = await fetch(req);
        // Open the cache and cache the fresh response for future requests
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, freshResponse.clone());
        return freshResponse;
    } catch (error) {
        // If the network request fails and no cache is found, throw the original error
        throw error;
    }
}

// Network first strategy, except for specific cache-first paths
async function networkFirst(req) {
    try {
        // For network first strategy, always try to fetch from the network first
        const freshResponse = await fetch(req);
        // Open the cache
        const cache = await caches.open(CACHE_NAME);
        // Check if the request method is GET to cache it
        if (req.method === "GET") {
            // Cache the fresh response for future requests
            cache.put(req, freshResponse.clone());
        }
        // Return the fresh network response
        return freshResponse;
    } catch (error) {
        // If the network request fails, try to serve the response from the cache
        const cachedResponse = await caches.match(req);
        if (cachedResponse) {
            return cachedResponse;
        }
        // If there is no cache match, throw the original error
        throw error;
    }
}

self.addEventListener('fetch', (event) => {
    const requestUrl = new URL(event.request.url);

    // Apply cache-first strategy only to specific Azure function
    if (requestUrl.href.includes('s24-final-back.azurewebsites.net/api/GetCars')) {
        event.respondWith(cacheFirst(event.request));
    } else {
        // Apply network-first strategy to all other requests
        event.respondWith(networkFirst(event.request));
    }
});
