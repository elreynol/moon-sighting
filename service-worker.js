/**
 * service-worker.js
 * 
 * Service worker for handling push notifications and background tasks
 * in the moon sighting application.
 */

// Cache name for storing moon data
const CACHE_NAME = 'moon-sighting-cache-v1';

// Files to cache for offline functionality
const CACHE_FILES = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/app.js',
  '/js/moonApi.js',
  '/js/locationManager.js',
  '/js/notificationManager.js',
  '/js/config.js',
  '/images/moon-icon.png'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(CACHE_FILES);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        
        // Clone the request
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then(
          response => {
            // Check if we received a valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
              
            return response;
          }
        );
      })
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', event => {
  if (!event.data) {
    console.log('Push event but no data');
    return;
  }
  
  try {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'Check for the new moon tonight!',
      icon: '/images/moon-icon.png',
      badge: '/images/moon-badge.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      },
      actions: [
        {
          action: 'explore',
          title: 'View Details',
          icon: '/images/checkmark.png'
        },
        {
          action: 'close',
          title: 'Close',
          icon: '/images/xmark.png'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Moon Sighting Alert', options)
    );
  } catch (error) {
    console.error('Error handling push event:', error);
  }
});

// Notification click event - handle user interaction
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'explore') {
    // Handle the explore action
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Background sync - handle offline moon data updates
self.addEventListener('sync', event => {
  if (event.tag === 'sync-moon-data') {
    event.waitUntil(syncMoonData());
  }
});

/**
 * Sync moon data in the background
 */
async function syncMoonData() {
  try {
    // Get the current location from IndexedDB
    const location = await getLocationFromIndexedDB();
    
    if (!location) {
      console.log('No location data available for sync');
      return;
    }
    
    // Fetch latest moon data
    const response = await fetch(`/api/moon/visibility?lat=${location.latitude}&lng=${location.longitude}`);
    const moonData = await response.json();
    
    // Store the updated data
    await storeMoonDataInIndexedDB(moonData);
    
    console.log('Moon data synced successfully');
  } catch (error) {
    console.error('Error syncing moon data:', error);
  }
}

/**
 * Get location from IndexedDB
 */
function getLocationFromIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('moonSightingDB', 1);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['locations'], 'readonly');
      const store = transaction.objectStore('locations');
      const getRequest = store.get('current');
      
      getRequest.onsuccess = () => resolve(getRequest.result);
      getRequest.onerror = () => reject(getRequest.error);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('locations')) {
        db.createObjectStore('locations');
      }
      if (!db.objectStoreNames.contains('moonData')) {
        db.createObjectStore('moonData');
      }
    };
  });
}

/**
 * Store moon data in IndexedDB
 */
function storeMoonDataInIndexedDB(moonData) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('moonSightingDB', 1);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['moonData'], 'readwrite');
      const store = transaction.objectStore('moonData');
      const putRequest = store.put(moonData, 'latest');
      
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('locations')) {
        db.createObjectStore('locations');
      }
      if (!db.objectStoreNames.contains('moonData')) {
        db.createObjectStore('moonData');
      }
    };
  });
} 