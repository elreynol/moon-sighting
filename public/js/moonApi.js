/**
 * moonApi.js
 * 
 * Abstraction layer for moon calculations that allows for future migration
 * from JavaScript to Python implementation.
 */

// Import the current JavaScript implementation
const moonCalculator = require('./moonCalculator');

/**
 * MoonAPI class that abstracts the implementation details
 */
class MoonAPI {
    /**
     * Create a new MoonAPI instance
     * @param {string} implementation - The implementation to use ('javascript' or 'python')
     */
    constructor(implementation = 'javascript') {
        this.implementation = implementation;
        this.api = implementation === 'python' 
            ? new PythonMoonAPI() 
            : new JavaScriptMoonAPI();
    }
    
    /**
     * Get information about upcoming new moons
     * @param {number} count - Number of new moons to find
     * @param {number} latitude - Latitude of the location
     * @param {number} longitude - Longitude of the location
     * @returns {Promise<Array>} Array of new moon information objects
     */
    async getNewMoonInformation(count, latitude, longitude) {
        return this.api.getNewMoonInformation(count, latitude, longitude);
    }
    
    /**
     * Get moon visibility for a specific date and location
     * @param {Date} date - Date to check visibility for
     * @param {number} latitude - Latitude of the location
     * @param {number} longitude - Longitude of the location
     * @returns {Promise<Object>} Visibility assessment
     */
    async getMoonVisibility(date, latitude, longitude) {
        return this.api.getMoonVisibility(date, latitude, longitude);
    }
    
    /**
     * Get sunset and moonset times for a specific date and location
     * @param {Date} date - Date to get times for
     * @param {number} latitude - Latitude of the location
     * @param {number} longitude - Longitude of the location
     * @returns {Promise<Object>} Sunset and moonset times
     */
    async getSunsetAndMoonset(date, latitude, longitude) {
        return this.api.getSunsetAndMoonset(date, latitude, longitude);
    }
    
    /**
     * Calculate moon age at sunset
     * @param {Date} newMoonDate - Date and time of the new moon
     * @param {Date} sunsetDate - Date and time of sunset
     * @returns {number} Moon age in hours
     */
    calculateMoonAgeAtSunset(newMoonDate, sunsetDate) {
        return this.api.calculateMoonAgeAtSunset(newMoonDate, sunsetDate);
    }
    
    /**
     * Assess moon visibility based on age
     * @param {number} moonAge - Moon age in hours
     * @returns {Object} Visibility assessment
     */
    assessMoonVisibility(moonAge) {
        return this.api.assessMoonVisibility(moonAge);
    }
}

/**
 * JavaScript implementation of the moon API
 */
class JavaScriptMoonAPI {
    /**
     * Get information about upcoming new moons
     * @param {number} count - Number of new moons to find
     * @param {number} latitude - Latitude of the location
     * @param {number} longitude - Longitude of the location
     * @returns {Promise<Array>} Array of new moon information objects
     */
    async getNewMoonInformation(count, latitude, longitude) {
        return moonCalculator.getNewMoonInformation(count, latitude, longitude);
    }
    
    /**
     * Get moon visibility for a specific date and location
     * @param {Date} date - Date to check visibility for
     * @param {number} latitude - Latitude of the location
     * @param {number} longitude - Longitude of the location
     * @returns {Promise<Object>} Visibility assessment
     */
    async getMoonVisibility(date, latitude, longitude) {
        // Find the most recent new moon before the given date
        const newMoons = await moonCalculator.findNewMoons(
            new Date(date.getTime() - 30 * 24 * 60 * 60 * 1000), // Start 30 days before
            1
        );
        
        if (newMoons.length === 0) {
            throw new Error('Could not find a new moon date');
        }
        
        const newMoonDate = newMoons[0];
        
        // Get sunset time for the given date
        const sunsetInfo = await moonCalculator.getSunsetAndMoonset(date, latitude, longitude);
        
        // Calculate moon age at sunset
        const moonAge = moonCalculator.calculateMoonAgeAtSunset(newMoonDate, sunsetInfo.sunset);
        
        // Assess visibility
        const visibility = moonCalculator.assessMoonVisibility(moonAge);
        
        return {
            ...visibility,
            moonAge,
            newMoonDate,
            sunset: sunsetInfo.sunset
        };
    }
    
    /**
     * Get sunset and moonset times for a specific date and location
     * @param {Date} date - Date to get times for
     * @param {number} latitude - Latitude of the location
     * @param {number} longitude - Longitude of the location
     * @returns {Promise<Object>} Sunset and moonset times
     */
    async getSunsetAndMoonset(date, latitude, longitude) {
        return moonCalculator.getSunsetAndMoonset(date, latitude, longitude);
    }
    
    /**
     * Calculate moon age at sunset
     * @param {Date} newMoonDate - Date and time of the new moon
     * @param {Date} sunsetDate - Date and time of sunset
     * @returns {number} Moon age in hours
     */
    calculateMoonAgeAtSunset(newMoonDate, sunsetDate) {
        return moonCalculator.calculateMoonAgeAtSunset(newMoonDate, sunsetDate);
    }
    
    /**
     * Assess moon visibility based on age
     * @param {number} moonAge - Moon age in hours
     * @returns {Object} Visibility assessment
     */
    assessMoonVisibility(moonAge) {
        return moonCalculator.assessMoonVisibility(moonAge);
    }
}

/**
 * Python implementation of the moon API (for future use)
 */
class PythonMoonAPI {
    constructor() {
        // This would connect to your Python backend
        this.baseUrl = '/api/python-moon';
    }
    
    /**
     * Get information about upcoming new moons
     * @param {number} count - Number of new moons to find
     * @param {number} latitude - Latitude of the location
     * @param {number} longitude - Longitude of the location
     * @returns {Promise<Array>} Array of new moon information objects
     */
    async getNewMoonInformation(count, latitude, longitude) {
        const response = await fetch(`${this.baseUrl}/new-moons`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ count, latitude, longitude })
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        return response.json();
    }
    
    /**
     * Get moon visibility for a specific date and location
     * @param {Date} date - Date to check visibility for
     * @param {number} latitude - Latitude of the location
     * @param {number} longitude - Longitude of the location
     * @returns {Promise<Object>} Visibility assessment
     */
    async getMoonVisibility(date, latitude, longitude) {
        const response = await fetch(`${this.baseUrl}/visibility`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                date: date.toISOString(),
                latitude, 
                longitude 
            })
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        return response.json();
    }
    
    /**
     * Get sunset and moonset times for a specific date and location
     * @param {Date} date - Date to get times for
     * @param {number} latitude - Latitude of the location
     * @param {number} longitude - Longitude of the location
     * @returns {Promise<Object>} Sunset and moonset times
     */
    async getSunsetAndMoonset(date, latitude, longitude) {
        const response = await fetch(`${this.baseUrl}/sunset-moonset`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                date: date.toISOString(),
                latitude, 
                longitude 
            })
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        return response.json();
    }
    
    /**
     * Calculate moon age at sunset
     * @param {Date} newMoonDate - Date and time of the new moon
     * @param {Date} sunsetDate - Date and time of sunset
     * @returns {number} Moon age in hours
     */
    calculateMoonAgeAtSunset(newMoonDate, sunsetDate) {
        // This would be a client-side calculation for now
        // In the future, it could be a server-side calculation
        return moonCalculator.calculateMoonAgeAtSunset(newMoonDate, sunsetDate);
    }
    
    /**
     * Assess moon visibility based on age
     * @param {number} moonAge - Moon age in hours
     * @returns {Object} Visibility assessment
     */
    assessMoonVisibility(moonAge) {
        // This would be a client-side calculation for now
        // In the future, it could be a server-side calculation
        return moonCalculator.assessMoonVisibility(moonAge);
    }
}

// Export the MoonAPI class
module.exports = MoonAPI; 