/**
 * locationManager.js
 * 
 * Manages location selection and storage for the moon sighting application.
 */

// Location Manager for handling location selection and management
class LocationManager {
    /**
     * Create a new Location Manager
     */
    constructor() {
        this.currentLocation = null;
        this.savedLocations = [];
        this.init();
    }
    
    async init() {
        this.loadSavedLocations();
        if (!this.currentLocation) {
            try {
                this.currentLocation = await this.getCurrentLocation();
            } catch (error) {
                console.error('Error getting current location:', error);
                this.currentLocation = {
                    name: 'San Francisco',
                    latitude: 37.7749,
                    longitude: -122.4194
                };
            }
        }
    }
    
    /**
     * Load saved locations from localStorage
     */
    loadSavedLocations() {
        try {
            const saved = localStorage.getItem('savedLocations');
            const current = localStorage.getItem('currentLocation');
            
            this.savedLocations = saved ? JSON.parse(saved) : [];
            this.currentLocation = current ? JSON.parse(current) : null;
        } catch (error) {
            console.error('Error loading locations:', error);
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
            localStorage.setItem('currentLocation', JSON.stringify(this.currentLocation));
        } catch (error) {
            console.error('Error saving locations:', error);
        }
    }
    
    /**
     * Get the current location
     * @returns {Promise<Object>} Promise that resolves to the current location
     */
    getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by your browser'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        const { latitude, longitude } = position.coords;
                        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                        const data = await response.json();
                        
                        resolve({
                            name: data.display_name || 'Current Location',
                            latitude,
                            longitude
                        });
                    } catch (error) {
                        reject(error);
                    }
                },
                (error) => reject(error)
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
     * @param {Object} location - Location to add
     */
    addLocation(location) {
        if (!this.savedLocations.some(loc => 
            loc.latitude === location.latitude && 
            loc.longitude === location.longitude
        )) {
            this.savedLocations.push(location);
            this.saveLocations();
        }
    }
    
    /**
     * Remove a location
     * @param {string} name - Name of the location to remove
     */
    removeLocation(locationName) {
        this.savedLocations = this.savedLocations.filter(loc => loc.name !== locationName);
        if (this.currentLocation?.name === locationName) {
            this.currentLocation = this.savedLocations[0] || null;
        }
        this.saveLocations();
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

// Export for module compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LocationManager;
} else {
    window.LocationManager = LocationManager;
} 