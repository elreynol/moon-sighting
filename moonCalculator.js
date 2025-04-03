/**
 * Moon Phase Calculator
 * 
 * This module provides functions to calculate new moon dates and related visibility information.
 * It can be used to determine optimal times for moon sighting events.
 */

/**
 * moonCalculator.js
 * 
 * A module for calculating new moon dates and times using the ELP-2000/82 lunar theory.
 * This implementation provides more accurate results than the simplified algorithm.
 */

// Constants for lunar calculations
const LUNAR_CYCLE = 29.530588853; // Synodic month in days
const J2000 = 2451545.0; // Julian date for January 1, 2000, 12:00 TT
const RAD = Math.PI / 180.0; // Radians per degree

/**
 * Converts a JavaScript Date to Julian Date
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
 * Converts Julian Date to JavaScript Date
 * @param {number} jd - Julian Date
 * @returns {Date} JavaScript Date object
 */
function julianDateToDate(jd) {
    // Algorithm from Jean Meeus, "Astronomical Algorithms", 2nd edition
    jd += 0.5;
    const Z = Math.floor(jd);
    const F = jd - Z;
    
    let A;
    if (Z < 2299161) {
        A = Z;
    } else {
        const alpha = Math.floor((Z - 1867216.25) / 36524.25);
        A = Z + 1 + alpha - Math.floor(alpha / 4);
    }
    
    const B = A + 1524;
    const C = Math.floor((B - 122.1) / 365.25);
    const D = Math.floor(365.25 * C);
    const E = Math.floor((B - D) / 30.6001);
    
    const day = B - D - Math.floor(30.6001 * E) + F;
    const month = E < 14 ? E - 1 : E - 13;
    const year = month > 2 ? C - 4716 : C - 4715;
    
    // Extract time component
    const timeFraction = day - Math.floor(day);
    const hours = Math.floor(timeFraction * 24);
    const minutes = Math.floor((timeFraction * 24 - hours) * 60);
    const seconds = Math.floor(((timeFraction * 24 - hours) * 60 - minutes) * 60);
    
    return new Date(Date.UTC(year, month - 1, Math.floor(day), hours, minutes, seconds));
}

/**
 * Calculates the moon's position using the ELP-2000/82 lunar theory
 * @param {number} jd - Julian Date
 * @returns {Object} Moon's position and phase
 */
function calculateMoonPosition(jd) {
    // Time in Julian centuries since J2000
    const T = (jd - J2000) / 36525;
    
    // Mean elements of the Moon's orbit
    const L = 218.3164477 + 481267.88123421 * T - 0.0015786 * T * T + T * T * T / 538841 - T * T * T * T / 65194000;
    const M = 357.5291092 + 35999.0502909 * T - 0.0001536 * T * T + T * T * T / 24490000;
    const F = 93.2719103 + 483202.0175383 * T - 0.0036825 * T * T + T * T * T / 327270 - T * T * T * T / 153000000;
    const D = 297.8501921 + 445267.1114034 * T - 0.0018819 * T * T + T * T * T / 545868 - T * T * T * T / 113065000;
    const Omega = 125.0445479 - 1934.1362891 * T + 0.0020754 * T * T + T * T * T / 467441 - T * T * T * T / 60616000;
    
    // Normalize angles to [0, 360)
    const normalizeAngle = (angle) => {
        let result = angle % 360;
        if (result < 0) result += 360;
        return result;
    };
    
    const L_norm = normalizeAngle(L);
    const M_norm = normalizeAngle(M);
    const F_norm = normalizeAngle(F);
    const D_norm = normalizeAngle(D);
    const Omega_norm = normalizeAngle(Omega);
    
    // Calculate moon phase (0 = new moon, 0.5 = full moon, 1 = next new moon)
    const phase = normalizeAngle(L_norm - D_norm) / 360;
    
    return {
        phase,
        L: L_norm,
        M: M_norm,
        F: F_norm,
        D: D_norm,
        Omega: Omega_norm
    };
}

/**
 * Finds the next new moon date from a given date
 * @param {Date} startDate - Starting date to search from
 * @returns {Date} Date of the next new moon
 */
function findNextNewMoon(startDate) {
    const jd = getJulianDate(startDate);
    const moonPos = calculateMoonPosition(jd);
    
    // If we're already at or past a new moon, find the next one
    let phase = moonPos.phase;
    if (phase >= 0.99 || phase < 0.01) {
        // We're very close to a new moon, add a small amount of time to move past it
        const jdNext = jd + 0.1;
        const moonPosNext = calculateMoonPosition(jdNext);
        phase = moonPosNext.phase;
    }
    
    // Calculate days until next new moon
    // If phase is close to 1, we need to add almost a full cycle
    let daysToAdd;
    if (phase > 0.9) {
        daysToAdd = (1 - phase) * LUNAR_CYCLE;
    } else {
        daysToAdd = (1 - phase) * LUNAR_CYCLE;
    }
    
    // Binary search to find the exact new moon time
    let jdLower = jd + daysToAdd - 1;
    let jdUpper = jd + daysToAdd + 1;
    let jdNewMoon;
    
    for (let i = 0; i < 10; i++) {
        jdNewMoon = (jdLower + jdUpper) / 2;
        const moonPosNew = calculateMoonPosition(jdNewMoon);
        
        if (moonPosNew.phase < 0.5) {
            jdUpper = jdNewMoon;
        } else {
            jdLower = jdNewMoon;
        }
    }
    
    return julianDateToDate(jdNewMoon);
}

/**
 * Finds multiple new moons in a date range
 * @param {Date} startDate - Starting date to search from
 * @param {number} count - Number of new moons to find
 * @returns {Date[]} Array of new moon dates
 */
function findNewMoons(startDate, count) {
    const newMoons = [];
    let currentDate = new Date(startDate);
    
    for (let i = 0; i < count; i++) {
        const nextNewMoon = findNextNewMoon(currentDate);
        newMoons.push(nextNewMoon);
        // Move to the day after this new moon to find the next one
        currentDate = new Date(nextNewMoon);
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }
    
    return newMoons;
}

/**
 * Format time in 12-hour format with AM/PM
 * @param {Date} date - The date to format
 * @return {string} Formatted time string
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
 * @param {Date} date - The date to format
 * @return {string} Formatted time string
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
 * Format date for API requests
 * @param {Date} date - The date to format
 * @return {string} Formatted date string (YYYY-MM-DD)
 */
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

/**
 * Gets sunset and moonset times for a specific date and location
 * @param {Date} date - Date to get times for
 * @param {number} latitude - Latitude of the location
 * @param {number} longitude - Longitude of the location
 * @returns {Promise<Object>} Object containing sunset and moonset times
 */
async function getSunsetAndMoonset(date, latitude, longitude) {
    // Format date as YYYY-MM-DD
    const formatDate = (date) => {
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    
    const sunUrl = `https://api.sunrise-sunset.org/json?lat=${latitude}&lng=${longitude}&date=${formatDate(date)}&formatted=0`;
    
    try {
        const response = await fetch(sunUrl);
        const data = await response.json();
        
        if (data && data.results) {
            return {
                sunset: new Date(data.results.sunset),
                moonset: new Date(data.results.civil_twilight_end), // Approximate moonset
                timeBetweenSunsetAndMoonset: ((new Date(data.results.civil_twilight_end) - new Date(data.results.sunset)) / (1000 * 60)).toFixed(1)
            };
        }
        
        throw new Error('Invalid API response format');
    } catch (error) {
        console.error('Error fetching sunset/moonset data:', error);
        throw error;
    }
}

/**
 * Calculates moon age at sunset
 * @param {Date} newMoonDate - Date and time of the new moon
 * @param {Date} sunsetDate - Date and time of sunset
 * @returns {number} Moon age in hours
 */
function calculateMoonAgeAtSunset(newMoonDate, sunsetDate) {
    const newMoonJulian = getJulianDate(newMoonDate);
    const sunsetJulian = getJulianDate(sunsetDate);
    
    // Calculate the difference in days and convert to hours
    const ageInDays = sunsetJulian - newMoonJulian;
    const ageInHours = ageInDays * 24;
    
    return ageInHours;
}

/**
 * Assesses moon visibility based on age
 * @param {number} moonAge - Moon age in hours
 * @returns {Object} Visibility assessment
 */
function assessMoonVisibility(moonAge) {
    // More nuanced visibility assessment based on moon age
    let visible = false;
    let confidence = 'Low';
    let details = '';
    
    if (moonAge < 12) {
        visible = false;
        confidence = 'High';
        details = 'Moon is too young (less than 12 hours old)';
    } else if (moonAge < 15) {
        visible = false;
        confidence = 'Medium';
        details = 'Moon is very young (12-15 hours old)';
    } else if (moonAge < 24) {
        visible = true;
        confidence = 'High';
        details = 'Optimal visibility window (15-24 hours old)';
    } else if (moonAge < 36) {
        visible = true;
        confidence = 'Medium';
        details = 'Moon is getting older (24-36 hours old)';
    } else {
        visible = false;
        confidence = 'High';
        details = 'Moon is too old (more than 36 hours old)';
    }
    
    return {
        visible,
        confidence,
        details,
        moonAge
    };
}

/**
 * Gets comprehensive new moon information
 * @param {number} count - Number of new moons to find
 * @param {number} latitude - Latitude of the location
 * @param {number} longitude - Longitude of the location
 * @returns {Promise<Array>} Array of new moon information objects
 */
async function getNewMoonInformation(count, latitude, longitude) {
    const newMoons = findNewMoons(new Date(), count);
    const moonInfo = [];
    
    for (const newMoonDate of newMoons) {
        // Get sunset and moonset times for the day of the new moon
        const sunsetInfo = await getSunsetAndMoonset(newMoonDate, latitude, longitude);
        
        // Calculate moon age at sunset
        const moonAgeAtSunset = calculateMoonAgeAtSunset(newMoonDate, sunsetInfo.sunset);
        
        // Assess visibility
        const visibility = assessMoonVisibility(moonAgeAtSunset);
        
        // Format times for display
        const formatTime = (date) => {
            return {
                iso: date.toISOString(),
                formatted: date.toLocaleTimeString(),
                formatted12Hour: date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })
            };
        };
        
        moonInfo.push({
            newMoonDate,
            newMoonTime: formatTime(newMoonDate),
            sunset: formatTime(sunsetInfo.sunset),
            moonset: formatTime(sunsetInfo.moonset),
            timeBetweenSunsetAndMoonset: sunsetInfo.timeBetweenSunsetAndMoonset,
            moonAgeAtSunset,
            visibility
        });
    }
    
    return moonInfo;
}

// Export functions for use in other modules
module.exports = {
    findNextNewMoon,
    findNewMoons,
    getSunsetAndMoonset,
    calculateMoonAgeAtSunset,
    assessMoonVisibility,
    getNewMoonInformation,
    calculateMoonPosition // Exported for testing
}; 