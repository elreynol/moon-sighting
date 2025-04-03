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
        this.currentLocation = null;
        this.savedLocations = [];
        this.init();
    }
    
    async init() {
        try {
            // Load saved locations from localStorage
            this.loadSavedLocations();

            // If no current location is set, try to get the user's location
            if (!this.currentLocation) {
                await this.getCurrentLocation();
            }
        } catch (error) {
            console.error('Error initializing location manager:', error);
        }
    }
    
    /**
     * Load saved locations from localStorage
     * @returns {Array} Array of saved locations
     */
    loadSavedLocations() {
        try {
            const savedLocationsJson = localStorage.getItem('savedLocations');
            const currentLocationJson = localStorage.getItem('currentLocation');

            if (savedLocationsJson) {
                this.savedLocations = JSON.parse(savedLocationsJson);
            }

            if (currentLocationJson) {
                this.currentLocation = JSON.parse(currentLocationJson);
            }
        } catch (error) {
            console.error('Error loading saved locations:', error);
            this.savedLocations = [];
            this.currentLocation = null;
        }
    }
    
    /**
     * Save locations to localStorage
     */
    saveLocations() {
        try {
            localStorage.setItem('savedLocations', JSON.stringify(this.savedLocations));
            if (this.currentLocation) {
                localStorage.setItem('currentLocation', JSON.stringify(this.currentLocation));
            }
        } catch (error) {
            console.error('Error saving locations:', error);
        }
    }
    
    /**
     * Get the current location
     * @returns {Object} Current location
     */
    getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by your browser'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const location = {
                        name: 'Current Location',
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    };

                    // Try to get the location name using reverse geocoding
                    try {
                        const response = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.latitude}&lon=${location.longitude}`
                        );
                        const data = await response.json();
                        location.name = data.display_name.split(',')[0];
                    } catch (error) {
                        console.warn('Error getting location name:', error);
                    }

                    this.currentLocation = location;
                    this.saveLocations();
                    resolve(location);
                },
                (error) => {
                    console.error('Error getting current location:', error);
                    reject(error);
                }
            );
        });
    }
    
    /**
     * Set the current location
     * @param {Object} location - Location to set as current
     */
    setCurrentLocation(location) {
        this.currentLocation = location;
        this.saveLocations();
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
    async addLocation(location) {
        // Check if location already exists
        const existingLocation = this.savedLocations.find(
            loc => loc.latitude === location.latitude && loc.longitude === location.longitude
        );

        if (!existingLocation) {
            this.savedLocations.push(location);
            this.saveLocations();
        }

        return location;
    }
    
    /**
     * Remove a location
     * @param {string} name - Name of the location to remove
     * @returns {boolean} True if location was removed, false otherwise
     */
    removeLocation(locationName) {
        this.savedLocations = this.savedLocations.filter(loc => loc.name !== locationName);
        
        // If the removed location was the current location, set a new current location
        if (this.currentLocation && this.currentLocation.name === locationName) {
            this.currentLocation = this.savedLocations[0] || null;
        }
        
        this.saveLocations();
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

    // Helper function to calculate distance between two locations
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of the earth in km
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c; // Distance in km
        return distance;
    }

    deg2rad(deg) {
        return deg * (Math.PI/180);
    }
}

// Export the LocationManager class
module.exports = LocationManager; 