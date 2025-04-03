const CACHE_NAME = 'moon-sighting-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/js/app.js',
    '/js/moonApi.js',
    '/js/locationManager.js',
    '/js/notificationManager.js',
    '/images/icon-192x192.png',
    '/images/icon-512x512.png',
    '/images/screenshot1.png',
    '/images/screenshot2.png',
    '/images/visibility.png',
    '/images/locations.png',
    '/manifest.json'
];

// Install event - cache all required assets
self.addEventListener('install', event => {
    console.log('Service Worker: Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Caching all required assets');
                return cache.addAll(urlsToCache)
                    .then(() => {
                        console.log('Service Worker: All assets cached successfully');
                        return self.skipWaiting();
                    });
            })
            .catch(error => {
                console.error('Service Worker: Cache installation failed:', error);
                throw error;
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('Service Worker: Activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('Service Worker: Clearing old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            ).then(() => {
                console.log('Service Worker: Activation completed');
                return self.clients.claim();
            });
        })
    );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Skip chrome-extension requests
    if (event.request.url.startsWith('chrome-extension://')) return;

    console.log('Service Worker: Fetching:', event.request.url);
    
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Return cached response if found
                if (response) {
                    console.log('Service Worker: Serving from cache:', event.request.url);
                    return response;
                }

                // Otherwise, fetch from network
                console.log('Service Worker: Fetching from network:', event.request.url);
                return fetch(event.request)
                    .then(response => {
                        // Check if we received a valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clone the response
                        const responseToCache = response.clone();

                        // Cache the new response
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                                console.log('Service Worker: Cached new response:', event.request.url);
                            });

                        return response;
                    })
                    .catch(error => {
                        console.error('Service Worker: Fetch failed:', error);
                        
                        // If the request is for a page, return the offline page
                        if (event.request.headers.get('accept').includes('text/html')) {
                            return caches.match('/index.html');
                        }
                        
                        // For other requests, return a custom offline response
                        return new Response('Offline', {
                            status: 503,
                            statusText: 'Service Unavailable',
                            headers: new Headers({
                                'Content-Type': 'text/plain'
                            })
                        });
                    });
            })
    );
});

// Push notification event
self.addEventListener('push', event => {
    console.log('Service Worker: Push notification received');
    
    const data = event.data ? event.data.json() : {};
    const options = {
        body: data.body || 'New moon sighting update available',
        icon: '/images/icon-192x192.png',
        badge: '/images/icon-192x192.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1,
            ...data
        }
    };

    event.waitUntil(
        self.registration.showNotification('Moon Sighting Update', options)
    );
});

// Notification click event
self.addEventListener('notificationclick', event => {
    console.log('Service Worker: Notification clicked');
    event.notification.close();
    
    event.waitUntil(
        clients.matchAll({ type: 'window' })
            .then(clientList => {
                // If a window is already open, focus it
                for (const client of clientList) {
                    if (client.url === '/' && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Otherwise open a new window
                if (clients.openWindow) {
                    return clients.openWindow('/');
                }
            })
    );
}); 