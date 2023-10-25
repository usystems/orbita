const cacheName = 'v2';
const cacheFiles = [
    // './',
    './index.html'
    // './css/style.css',
    // './js/script.js'
]
self.addEventListener('install', event => {
    event.waitUntil(
	    caches.open(cacheName).then(cache => cache.addAll(cacheFiles))
	);
});

self.addEventListener('activate', event => {
    event.waitUntil(
		caches.keys().then(cacheKeys => {
			return Promise.all(cacheKeys
				.filter(cacheKey => cacheKey !== cacheName)
				.map(cacheKey => caches.delete(cacheKey))
			);
		})
	);
});

self.addEventListener('fetch', event => {
	event.respondWith(
		caches.match(event.request)
			.then(async response => {
				if (response) { // If the request is in the cache, return the cached version
					return response;

				} else {
					const requestClone = event.request.clone();
					const response = await fetch(requestClone);
					if (!response.ok) { // No valid response from fetch
						return response;
					}
					const responseClone = response.clone();
					const cache = await caches.open(cacheName) // Save the response to the cache
					if (!event.request.url.startsWith('chrome-extension://')) {
						await cache.put(event.request, responseClone);
					}
					return response;
				}
			})
	);
});