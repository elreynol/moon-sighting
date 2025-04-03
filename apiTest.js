/**
 * Test script for Moon Information
 * This script calculates new moon dates and related visibility information
 */

// Test configuration
const LATITUDE = 37.7749;  // San Francisco coordinates
const LONGITUDE = -122.4194;

/**
 * Calculate Julian Date
 */
function getJulianDate(date) {
    const time = date.getTime();
    return (time / 86400000) + 2440587.5;
}

/**
 * Calculate moon phase (0 = new moon, 0.5 = full moon)
 */
function getMoonPhase(date) {
    const julianDate = getJulianDate(date);
    const baseDate = getJulianDate(new Date(2000, 0, 6, 18, 14, 0));
    const phase = ((julianDate - baseDate) % 29.530588853) / 29.530588853;
    return phase;
}

/**
 * Find next new moon date from a given date
 */
function findNextNewMoon(startDate) {
    const date = new Date(startDate);
    let phase = getMoonPhase(date);
    
    // Increment by hours until we find the new moon
    while (phase > 0.01 && phase < 0.99) {
        date.setHours(date.getHours() + 1);
        phase = getMoonPhase(date);
    }
    
    // Fine-tune to the exact minute
    while (phase > 0.001 && phase < 0.999) {
        date.setMinutes(date.getMinutes() + 1);
        phase = getMoonPhase(date);
    }
    
    return date;
}

/**
 * Format time in 12-hour format with AM/PM
 */
function formatTime12Hour(date) {
    return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: true 
    });
}

/**
 * Format time in 24-hour format
 */
function formatTime24Hour(date) {
    return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false 
    });
}

/**
 * Get and display new moon information
 */
async function getNewMoonInfo() {
    try {
        console.log('\nCalculating New Moon dates and visibility information...');
        
        // Find the next 3 new moons
        let currentDate = new Date();
        const newMoons = [];
        
        for (let i = 0; i < 3; i++) {
            const newMoonDate = findNextNewMoon(currentDate);
            newMoons.push(newMoonDate);
            currentDate = new Date(newMoonDate.getTime() + 24 * 60 * 60 * 1000); // Start searching from next day
        }
        
        // Get visibility information for each new moon
        for (const moonDate of newMoons) {
            console.log('\nNew Moon Information:');
            console.log('=====================');
            console.log('New Moon Date:', moonDate.toLocaleDateString());
            console.log('New Moon Time:', formatTime12Hour(moonDate), `(${formatTime24Hour(moonDate)})`);
            
            // Get sunset data for this date
            const sunUrl = `https://api.sunrise-sunset.org/json?lat=${LATITUDE}&lng=${LONGITUDE}&date=${formatDate(moonDate)}&formatted=0`;
            console.log('Fetching sun data...');
            
            const sunResponse = await fetch(sunUrl);
            const sunData = await sunResponse.json();
            
            if (sunData && sunData.results) {
                const sunset = new Date(sunData.results.sunset);
                const moonset = new Date(sunData.results.civil_twilight_end); // Approximate moonset
                
                // Calculate moon age at sunset
                const moonAge = ((sunset - moonDate) / (1000 * 60 * 60)).toFixed(1); // Age in hours
                
                console.log('\nTiming Information:');
                console.log('-------------------');
                console.log('Sunset Time:', formatTime12Hour(sunset), `(${formatTime24Hour(sunset)})`);
                console.log('Approximate Moonset:', formatTime12Hour(moonset), `(${formatTime24Hour(moonset)})`);
                console.log('Time between Sunset and Moonset:', 
                    ((moonset - sunset) / (1000 * 60)).toFixed(1), 'minutes');
                
                console.log('\nMoon Information:');
                console.log('-----------------');
                console.log('Moon Age at Sunset:', moonAge, 'hours');
                
                // Add visibility assessment
                const isVisible = moonAge > 15 && moonAge < 24;
                console.log('Visibility Assessment:', isVisible ? 'Potentially visible' : 'Likely not visible');
                console.log('---------------------');
            }
        }

    } catch (error) {
        console.error('Error calculating moon information:', error);
        console.error('Error details:', error.message);
        if (error.stack) {
            console.error('Stack trace:', error.stack);
        }
    }
}

/**
 * Helper function to format date for API
 */
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

// Run the calculations
console.log('Starting Moon Calculations...\n');
getNewMoonInfo(); 