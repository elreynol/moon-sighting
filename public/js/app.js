/**
 * app.js
 * 
 * Main application file for the moon sighting application.
 */

// Initialize managers
const locationManager = new LocationManager();
const notificationManager = new NotificationManager();
const moonApi = new MoonAPI();

// DOM Elements
const moonCanvas = document.getElementById('moonCanvas');
const moonPhase = document.getElementById('moonPhase');
const moonAge = document.getElementById('moonAge');
const sunsetTime = document.getElementById('sunsetTime');
const moonsetTime = document.getElementById('moonsetTime');
const visibilityText = document.getElementById('visibilityText');
const confidenceText = document.getElementById('confidenceText');
const coordinates = document.getElementById('coordinates');
const locationsList = document.getElementById('locationsList');
const locationBtn = document.getElementById('locationBtn');
const notificationBtn = document.getElementById('notificationBtn');

// Initialize the application
async function initializeApp() {
    try {
        // Load saved locations
        await locationManager.loadSavedLocations();
        updateLocationsList();

        // Set up location button
        locationBtn.addEventListener('click', handleLocationChange);

        // Set up notification button
        notificationBtn.addEventListener('click', handleNotificationToggle);

        // Load initial moon data
        await updateMoonData();

        // Set up periodic updates
        setInterval(updateMoonData, 60000); // Update every minute
    } catch (error) {
        console.error('Error initializing app:', error);
        showError('Failed to initialize application');
    }
}

// Update moon data
async function updateMoonData() {
    try {
        const currentLocation = locationManager.getCurrentLocation();
        const moonData = await moonApi.getMoonVisibility(
            currentLocation.latitude,
            currentLocation.longitude
        );

        updateMoonDisplay(moonData);
        updateVisibilityInfo(moonData);
        updateCoordinates(currentLocation);
    } catch (error) {
        console.error('Error updating moon data:', error);
        showError('Failed to update moon data');
    }
}

// Update moon display
function updateMoonDisplay(moonData) {
    const ctx = moonCanvas.getContext('2d');
    const centerX = moonCanvas.width / 2;
    const centerY = moonCanvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;

    // Clear canvas
    ctx.clearRect(0, 0, moonCanvas.width, moonCanvas.height);

    // Draw moon
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#f1c40f';
    ctx.fill();

    // Draw shadow based on moon age
    const shadowWidth = (moonData.moonAge / 24) * radius * 2;
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(centerX - radius, centerY - radius, shadowWidth, radius * 2);

    // Update text
    moonPhase.textContent = getMoonPhaseText(moonData.moonAge);
    moonAge.textContent = `Age: ${moonData.moonAge.toFixed(1)} hours`;
}

// Update visibility information
function updateVisibilityInfo(moonData) {
    sunsetTime.textContent = formatTime(moonData.sunset);
    moonsetTime.textContent = formatTime(moonData.moonset);
    
    visibilityText.textContent = moonData.visible ? 'Potentially Visible' : 'Likely Not Visible';
    visibilityText.className = moonData.visible ? 'visible' : 'not-visible';
    
    confidenceText.textContent = moonData.confidence;
    confidenceText.className = getConfidenceClass(moonData.confidence);
}

// Update coordinates display
function updateCoordinates(location) {
    coordinates.textContent = `Latitude: ${location.latitude.toFixed(4)}, Longitude: ${location.longitude.toFixed(4)}`;
}

// Update locations list
function updateLocationsList() {
    const locations = locationManager.getSavedLocations();
    locationsList.innerHTML = '';

    locations.forEach(location => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${location.name}</span>
            <div>
                <button onclick="selectLocation('${location.name}')">Select</button>
                <button onclick="removeLocation('${location.name}')">Remove</button>
            </div>
        `;
        locationsList.appendChild(li);
    });
}

// Handle location change
async function handleLocationChange() {
    try {
        const location = await locationManager.getCurrentLocation();
        await locationManager.addLocation(location);
        await updateMoonData();
        updateLocationsList();
    } catch (error) {
        console.error('Error changing location:', error);
        showError('Failed to change location');
    }
}

// Handle notification toggle
async function handleNotificationToggle() {
    try {
        if (notificationManager.isSubscribed()) {
            await notificationManager.unsubscribe();
            notificationBtn.textContent = 'Enable Notifications';
        } else {
            await notificationManager.subscribe();
            notificationBtn.textContent = 'Disable Notifications';
        }
    } catch (error) {
        console.error('Error toggling notifications:', error);
        showError('Failed to toggle notifications');
    }
}

// Helper functions
function formatTime(date) {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getMoonPhaseText(moonAge) {
    if (moonAge < 1) return 'New Moon';
    if (moonAge < 7) return 'Waxing Crescent';
    if (moonAge < 14) return 'First Quarter';
    if (moonAge < 21) return 'Waxing Gibbous';
    if (moonAge < 28) return 'Full Moon';
    if (moonAge < 35) return 'Waning Gibbous';
    if (moonAge < 42) return 'Last Quarter';
    return 'Waning Crescent';
}

function getConfidenceClass(confidence) {
    switch (confidence.toLowerCase()) {
        case 'high': return 'visible';
        case 'medium': return 'uncertain';
        case 'low': return 'not-visible';
        default: return '';
    }
}

function showError(message) {
    // Implement error display logic
    console.error(message);
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp); 