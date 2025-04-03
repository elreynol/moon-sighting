/**
 * locationManager.js
 * 
 * Manages location selection and storage for the moon sighting application.
 */

const config = require('./config');

/**
 * Location Manager class
 */
class LocationManager {
    /**
     * Create a new Location Manager
     * @param {Object} moonApi - The moon API instance
     */
    constructor(moonApi) {
        this.moonApi = moonApi;
        this.savedLocations = this.loadSavedLocations();
        this.currentLocation = this.loadCurrentLocation();
    }
    
    /**
     * Load saved locations from localStorage
     * @returns {Array} Array of saved locations
     */
    loadSavedLocations() {
        try {
            const savedLocationsJson = localStorage.getItem('savedLocations');
            if (savedLocationsJson) {
                return JSON.parse(savedLocationsJson);
            }
        } catch (error) {
            console.error('Error loading saved locations:', error);
        }
        
        // Return default locations if loading fails
        return config.savedLocations;
    }
    
    /**
     * Load current location from localStorage
     * @returns {Object} Current location
     */
    loadCurrentLocation() {
        try {
            const currentLocationJson = localStorage.getItem('currentLocation');
            if (currentLocationJson) {
                return JSON.parse(currentLocationJson);
            }
        } catch (error) {
            console.error('Error loading current location:', error);
        }
        
        // Return default location if loading fails
        return config.defaultLocation;
    }
    
    /**
     * Save locations to localStorage
     */
    saveLocations() {
        try {
            localStorage.setItem('savedLocations', JSON.stringify(this.savedLocations));
        } catch (error) {
            console.error('Error saving locations:', error);
        }
    }
    
    /**
     * Save current location to localStorage
     */
    saveCurrentLocation() {
        try {
            localStorage.setItem('currentLocation', JSON.stringify(this.currentLocation));
        } catch (error) {
            console.error('Error saving current location:', error);
        }
    }
    
    /**
     * Get the current location
     * @returns {Object} Current location
     */
    getCurrentLocation() {
        return this.currentLocation;
    }
    
    /**
     * Set the current location
     * @param {Object} location - Location to set as current
     */
    setCurrentLocation(location) {
        this.currentLocation = location;
        this.saveCurrentLocation();
    }
    
    /**
     * Get all saved locations
     * @returns {Array} Array of saved locations
     */
    getSavedLocations() {
        return this.savedLocations;
    }
    
    /**
     * Add a new location
     * @param {string} name - Location name
     * @param {number} latitude - Location latitude
     * @param {number} longitude - Location longitude
     * @returns {Object} The added location
     */
    addLocation(name, latitude, longitude) {
        const newLocation = { name, latitude, longitude };
        this.savedLocations.push(newLocation);
        this.saveLocations();
        return newLocation;
    }
    
    /**
     * Remove a location
     * @param {string} name - Name of the location to remove
     * @returns {boolean} True if location was removed, false otherwise
     */
    removeLocation(name) {
        const initialLength = this.savedLocations.length;
        this.savedLocations = this.savedLocations.filter(loc => loc.name !== name);
        this.saveLocations();
        return this.savedLocations.length < initialLength;
    }
    
    /**
     * Get the user's current geolocation
     * @returns {Promise<Object>} Promise that resolves to the user's location
     */
    getUserGeolocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by your browser'));
                return;
            }
            
            navigator.geolocation.getCurrentPosition(
                position => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        name: 'My Location'
                    });
                },
                error => {
                    reject(error);
                }
            );
        });
    }
    
    /**
     * Get moon information for the current location
     * @param {number} count - Number of new moons to find
     * @returns {Promise<Array>} Array of new moon information objects
     */
    async getMoonInfoForCurrentLocation(count = 3) {
        return this.moonApi.getNewMoonInformation(
            count,
            this.currentLocation.latitude,
            this.currentLocation.longitude
        );
    }
    
    /**
     * Get moon information for a specific location
     * @param {Object} location - Location to get moon info for
     * @param {number} count - Number of new moons to find
     * @returns {Promise<Array>} Array of new moon information objects
     */
    async getMoonInfoForLocation(location, count = 3) {
        return this.moonApi.getNewMoonInformation(
            count,
            location.latitude,
            location.longitude
        );
    }
}

// Export the LocationManager class
module.exports = LocationManager; 