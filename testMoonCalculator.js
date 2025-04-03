/**
 * testMoonCalculator.js
 * 
 * Test script for the moon calculation module.
 * This script demonstrates how to use the moonCalculator module to get new moon information.
 */

const moonCalculator = require('./moonCalculator');

// Configuration
const config = {
    latitude: 37.7749,  // San Francisco coordinates
    longitude: -122.4194,
    count: 3  // Number of new moons to find
};

/**
 * Format a date for display
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
    });
}

/**
 * Calculate Julian Date (for testing purposes)
 * @param {Date} date - JavaScript Date object
 * @returns {number} Julian Date
 */
function getJulianDate(date) {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    const hour = date.getUTCHours();
    const minute = date.getUTCMinutes();
    const second = date.getUTCSeconds();
    
    // Algorithm from Jean Meeus, "Astronomical Algorithms", 2nd edition
    let jd = 367 * year - Math.floor(7 * (year + Math.floor((month + 9) / 12)) / 4) + 
             Math.floor(275 * month / 9) + day + 1721013.5;
    
    // Add time component
    jd += (hour + minute / 60.0 + second / 3600.0) / 24.0;
    
    return jd;
}

/**
 * Main function to test the moon calculation module
 */
async function main() {
    try {
        console.log('Testing Moon Calculation Module');
        console.log('================================');
        console.log(`Location: ${config.latitude}, ${config.longitude}`);
        console.log(`Finding next ${config.count} new moons...\n`);
        
        // Get new moon information
        const moonInfo = await moonCalculator.getNewMoonInformation(
            config.count,
            config.latitude,
            config.longitude
        );
        
        // Display results
        moonInfo.forEach((info, index) => {
            console.log(`New Moon #${index + 1}:`);
            console.log(`  Date: ${formatDate(info.newMoonDate)}`);
            console.log(`  Time: ${info.newMoonTime.formatted12Hour}`);
            console.log(`  Sunset: ${info.sunset.formatted12Hour}`);
            console.log(`  Moonset: ${info.moonset.formatted12Hour}`);
            console.log(`  Moon Age at Sunset: ${info.moonAgeAtSunset.toFixed(1)} hours`);
            console.log(`  Visibility: ${info.visibility.visible ? 'Potentially visible' : 'Likely not visible'}`);
            console.log(`  Confidence: ${info.visibility.confidence}`);
            console.log(`  Details: ${info.visibility.details}`);
            console.log('');
        });
        
        // Test the moon position calculation
        console.log('Testing Moon Position Calculation');
        console.log('================================');
        const today = new Date();
        const jd = getJulianDate(today);
        const moonPos = moonCalculator.calculateMoonPosition(jd);
        
        console.log(`Today's Moon Phase: ${(moonPos.phase * 100).toFixed(1)}%`);
        console.log(`Moon's Mean Longitude: ${moonPos.L.toFixed(2)}°`);
        console.log(`Sun's Mean Anomaly: ${moonPos.M.toFixed(2)}°`);
        console.log(`Moon's Argument of Latitude: ${moonPos.F.toFixed(2)}°`);
        console.log(`Moon's Mean Elongation: ${moonPos.D.toFixed(2)}°`);
        console.log(`Moon's Ascending Node: ${moonPos.Omega.toFixed(2)}°`);
        
        console.log('\nTest completed successfully!');
    } catch (error) {
        console.error('Error testing moon calculation module:', error);
    }
}

// Run the test
main(); 