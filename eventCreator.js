/**
 * New Moon Event Calendar Creator with Moon Phase Calculation
 * 
 * This script creates calendar events for new moon viewings using astronomical calculations
 * to get accurate moon phase and timing data.
 */

// Import the moon calculation module
const moonCalculator = require('./moonCalculator');

// Configuration constants
const CALENDAR_ID = '20cdf8ca111bc04ec5e6bb153acce7a2124d65583069b1903870eabab4a43423@group.calendar.google.com'; // Replace with your calendar ID
const MONTHS_AHEAD = 12; // How many months to create events for
const EVENT_DURATION_HOURS = 1;
const DEFAULT_LOCATION = 'Your Location'; // Update with your viewing location
const LATITUDE = 37.7749; // Replace with your latitude
const LONGITUDE = -122.4194; // Replace with your longitude

/**
 * Main function to create new moon events
 */
async function createNewMoonEvents() {
  try {
    const calendar = CalendarApp.getCalendarById(CALENDAR_ID);
    if (!calendar) {
      throw new Error('Could not access calendar. Check the calendar ID.');
    }

    // Calculate date range
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + MONTHS_AHEAD);

    // Get new moon data using our calculation module
    const newMoonData = await moonCalculator.getNewMoonInformation(MONTHS_AHEAD, LATITUDE, LONGITUDE);
    
    // Create events for each new moon
    createEvents(calendar, newMoonData);
    
    Logger.log('Successfully created new moon events');
  } catch (error) {
    Logger.log('Error: ' + error.toString());
  }
}

/**
 * Create calendar events for new moons
 */
function createEvents(calendar, newMoonData) {
  newMoonData.forEach(moonInfo => {
    const newMoonDate = moonInfo.newMoonDate;
    const sunsetTime = moonInfo.sunset.time;
    const moonsetTime = moonInfo.moonset.time;
    const moonAge = moonInfo.moonAgeAtSunset;
    
    // Set event start time to sunset
    const startTime = sunsetTime;
    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + EVENT_DURATION_HOURS);
    
    // Create event description
    const description = `Join us for new moon viewing!

Moon Details:
• New Moon Time: ${moonInfo.newMoonTime.formatted12Hour} (${moonInfo.newMoonTime.formatted24Hour})
• Moonset: ${moonInfo.moonset.formatted12Hour} (${moonInfo.moonset.formatted24Hour})
• Sunset: ${moonInfo.sunset.formatted12Hour} (${moonInfo.sunset.formatted24Hour})
• Moon Age at Sunset: ${moonAge} hours
• Time between Sunset and Moonset: ${moonInfo.timeBetweenSunsetAndMoonset} minutes

Visibility Assessment:
${moonInfo.visibility.reason}
Confidence: ${moonInfo.visibility.confidence}

What to bring:
• Prayer rug
• Telescope or binoculars (optional)
• Warm clothes
• Chair or blanket
• Red flashlight (optional)

Please RSVP to help us plan the gathering.`;

    // Create the calendar event
    const event = calendar.createEvent(
      `New Moon Viewing - ${newMoonDate.toLocaleString('default', { month: 'long' })}`,
      startTime,
      endTime,
      {
        description: description,
        location: DEFAULT_LOCATION
      }
    );
    
    // Configure event settings
    event.setGuestsCanSeeGuests(true);
    event.setGuestsCanInviteOthers(true);
  });
}

// Export the main function for use in other modules
module.exports = {
  createNewMoonEvents
};
