/**
 * app.js
 * 
 * Main application file for the moon sighting application.
 */

// Register service worker first
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New content is available; please refresh.');
            }
          });
        });
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
        showError('Service Worker registration failed. Some features may not work offline.');
      });
  });
}

// Main application script
document.addEventListener('DOMContentLoaded', () => {
  // Initialize managers
  const locationManager = new LocationManager();
  const notificationManager = new NotificationManager();
  const moonApi = new MoonAPI();

  // DOM Elements
  const locationSelect = document.getElementById('location-select');
  const notificationToggle = document.getElementById('notification-toggle');
  const moonDisplay = document.getElementById('moon-display');
  const visibilityInfo = document.getElementById('visibility-info');

  // Initialize the application
  async function initializeApp() {
    try {
      // Load saved locations
      const locations = locationManager.getSavedLocations();
      locations.forEach(location => {
        const option = document.createElement('option');
        option.value = location.name;
        option.textContent = location.name;
        locationSelect.appendChild(option);
      });

      // Set up event listeners
      locationSelect.addEventListener('change', handleLocationChange);
      notificationToggle.addEventListener('click', handleNotificationToggle);

      // Initial data update
      await updateMoonData();
    } catch (error) {
      console.error('Error initializing app:', error);
      showError('Failed to initialize application');
    }
  }

  // Update moon data
  async function updateMoonData() {
    try {
      const location = locationManager.currentLocation;
      if (!location) return;

      const visibility = await moonApi.getMoonVisibility(
        location.latitude,
        location.longitude
      );

      updateMoonDisplay(visibility);
      updateVisibilityInfo(visibility);
    } catch (error) {
      console.error('Error updating moon data:', error);
      showError('Failed to update moon data');
    }
  }

  // Update moon display
  function updateMoonDisplay(visibility) {
    if (!moonDisplay) return;
    
    const phase = determineMoonPhase(visibility.moonAge);
    moonDisplay.innerHTML = `
      <div class="moon-phase ${phase}">
        <div class="moon-phase-text">${phase}</div>
      </div>
    `;
  }

  // Update visibility information
  function updateVisibilityInfo(visibility) {
    if (!visibilityInfo) return;
    
    visibilityInfo.innerHTML = `
      <h3>Visibility: ${visibility.visibility}</h3>
      <p>Confidence: ${Math.round(visibility.confidence * 100)}%</p>
      <p>Sunset: ${formatTime(visibility.sunsetTime)}</p>
      <p>Moonset: ${formatTime(visibility.moonsetTime)}</p>
    `;
  }

  // Handle location change
  async function handleLocationChange(event) {
    try {
      const locationName = event.target.value;
      const location = locationManager.getSavedLocations()
        .find(loc => loc.name === locationName);
      
      if (location) {
        locationManager.setCurrentLocation(location);
        await updateMoonData();
      }
    } catch (error) {
      console.error('Error handling location change:', error);
      showError('Failed to change location');
    }
  }

  // Handle notification toggle
  async function handleNotificationToggle() {
    try {
      if (notificationManager.isSubscribed()) {
        await notificationManager.unsubscribe();
      } else {
        await notificationManager.subscribe();
      }
      notificationManager.updateUI();
    } catch (error) {
      console.error('Error toggling notifications:', error);
      showError('Failed to toggle notifications');
    }
  }

  // Helper functions
  function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function determineMoonPhase(moonAge) {
    if (moonAge < 7) return 'new';
    if (moonAge < 14) return 'waxing-crescent';
    if (moonAge < 21) return 'full';
    if (moonAge < 28) return 'waning-crescent';
    return 'new';
  }

  function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
  }

  // Start the application
  initializeApp();
}); 