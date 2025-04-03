/**
 * New Moon Event Calendar Creator with Sunset Calculation
 * 
 * This script extracts new moon events from a public astronomical calendar
 * and creates corresponding events in your own calendar for moon viewing gatherings.
 * Events are scheduled to begin at sunset on the day of the new moon.
 */

// Configuration - adjust these values
const PUBLIC_CALENDAR_ID = 'ht3jlfaac5lfd6263ulfh4tql8@group.calendar.google.com';
const YOUR_CALENDAR_ID = '20cdf8ca111bc04ec5e6bb153acce7a2124d65583069b1903870eabab4a43423@group.calendar.google.com'; // Replace with your calendar ID
const MONTHS_TO_PROCESS = 12; // How many months ahead to create events
const EVENT_DURATION_HOURS = 2; // Duration of your new moon viewing events
const DEFAULT_LOCATION = 'Houge Park'; // Update with your location
const EVENT_DESCRIPTION = 'Join us to observe the new moon at Houge Park! If we do not spot the new moon we can still enjoy some stargazing.\n\nSuggested items to bring:\n- Prayer rug \n- Telescope or binoculars (optional)\n- Red flashlight (optional)\n- Warm clothes\n- Blanket or chair\n- Hot drinks\n\nPlease RSVP so we know how many people to expect.';

// Location coordinates for sunset calculation (example: San Francisco)
// Replace with your own coordinates
const LATITUDE = 37.2575; // Positive for North, negative for South
const LONGITUDE = -121.9423; // Positive for East, negative for West

/**
 * Main function to run the calendar sync
 */
function createNewMoonEvents() {
  try {
    // Calculate date range
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + MONTHS_TO_PROCESS);
    
    // Get new moon events from public calendar
    const newMoonEvents = getNewMoonEvents(startDate, endDate);
    
    // Create events in your calendar
    createViewingEvents(newMoonEvents);
    
    Logger.log(`Successfully processed ${newMoonEvents.length} new moon events`);
  } catch (error) {
    Logger.log(`Error: ${error.toString()}`);
  }
}

/**
 * Get all new moon events from the public calendar
 */
function getNewMoonEvents(startDate, endDate) {
  const publicCal = CalendarApp.getCalendarById(PUBLIC_CALENDAR_ID);
  if (!publicCal) {
    throw new Error('Could not access the public calendar. Check the calendar ID.');
  }
  
  // Get all events in the date range
  const allEvents = publicCal.getEvents(startDate, endDate);
  
  // Filter for new moon events
  const newMoonEvents = allEvents.filter(event => {
    const title = event.getTitle().toLowerCase();
    return title.includes('new moon');
  });
  
  Logger.log(`Found ${newMoonEvents.length} new moon events in the public calendar`);
  return newMoonEvents;
}

/**
 * Get sunset time using SunriseSunset.io API
 * @param {Date} date - The date to get sunset for
 * @return {Date} Date object set to sunset time
 */
function getSunsetTimeFromAPI(date) {
  // Format date as YYYY-MM-DD
  const dateString = Utilities.formatDate(date, "UTC", "yyyy-MM-dd");
  
  // Construct API URL
  const url = `https://api.sunrisesunset.io/json?lat=${LATITUDE}&lng=${LONGITUDE}&date=${dateString}`;
  
  try {
    // Make API request
    const response = UrlFetchApp.fetch(url);
    const data = JSON.parse(response.getContentText());
    
    if (data.status === "OK") {
      // Parse sunset time
      const sunsetTimeStr = data.results.sunset;
      const sunsetDateTime = parseTimeString(sunsetTimeStr, date);
      return sunsetDateTime;
    } else {
      throw new Error("API returned non-OK status");
    }
  } catch (error) {
    Logger.log(`API error: ${error}. Falling back to calculation.`);
    // Fall back to calculation method if API fails
    return calculateSunsetTime(date, LATITUDE, LONGITUDE);
  }
}

/**
 * Parse time string like "7:30:15 PM" into a Date object
 */
function parseTimeString(timeStr, date) {
  const [timePart, ampm] = timeStr.split(' ');
  let [hours, minutes, seconds] = timePart.split(':').map(Number);
  
  // Convert to 24-hour format
  if (ampm === "PM" && hours < 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;
  
  const result = new Date(date);
  result.setHours(hours, minutes, seconds || 0);
  return result;
}
/**
 * Create viewing events in your calendar based on new moon dates
 */
function createViewingEvents(newMoonEvents) {
  const yourCal = CalendarApp.getCalendarById(YOUR_CALENDAR_ID);
  if (!yourCal) {
    throw new Error('Could not access your calendar. Check the calendar ID.');
  }
  
  let eventsCreated = 0;
  
  newMoonEvents.forEach(newMoonEvent => {
    // Get date of the new moon
    const newMoonDate = newMoonEvent.getStartTime();
    
// Get sunset time from API for the new moon date
const viewingStart = getSunsetTimeFromAPI(newMoonDate);

    // Set end time
    const viewingEnd = new Date(viewingStart);
    viewingEnd.setHours(viewingStart.getHours() + EVENT_DURATION_HOURS);
    
    // Create event title
    const month = viewingStart.toLocaleString('default', { month: 'long' });
    const title = `New Moon Viewing - ${month}`;
    
    // Check if event already exists (avoid duplicates)
    const existingEvents = yourCal.getEvents(
      viewingStart, 
      viewingEnd,
      {search: title}
    );
    
    if (existingEvents.length === 0) {
      // Create the event
      const event = yourCal.createEvent(
        title,
        viewingStart,
        viewingEnd,
        {
          location: DEFAULT_LOCATION,
          description: EVENT_DESCRIPTION
        }
      );
      
      // Set event to allow guests and modify event
      event.setGuestsCanSeeGuests(true);
      event.setGuestsCanInviteOthers(true);
      
      eventsCreated++;
      Logger.log(`Created event: ${title} on ${viewingStart.toDateString()} at ${viewingStart.toLocaleTimeString()}`);
    } else {
      Logger.log(`Event already exists: ${title} on ${viewingStart.toDateString()}`);
    }
  });
  
  Logger.log(`Created ${eventsCreated} new viewing events`);
}

/**
 * Deletes all future new moon viewing events from your calendar
 * Useful if you need to reset and regenerate events
 */
function clearFutureEvents() {
  const yourCal = CalendarApp.getCalendarById(YOUR_CALENDAR_ID);
  if (!yourCal) {
    throw new Error('Could not access your calendar. Check the calendar ID.');
  }
  
  const now = new Date();
  const sixMonthsLater = new Date();
  sixMonthsLater.setMonth(sixMonthsLater.getMonth() + MONTHS_TO_PROCESS);
  
  const events = yourCal.getEvents(now, sixMonthsLater);
  
  let deletedCount = 0;
  events.forEach(event => {
    if (event.getTitle().includes('New Moon Viewing')) {
      event.deleteEvent();
      deletedCount++;
    }
  });
  
  Logger.log(`Deleted ${deletedCount} future new moon viewing events`);
}