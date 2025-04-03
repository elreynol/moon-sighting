/**
 * Moonsighting Event Creator - Backend Script
 * 
 * This script handles form submissions from the Moonsighting Event Creator
 * and generates calendar events for new moon viewing based on user settings.
 */

// Web app configuration
let config = {};

/**
 * Process the form submission and create calendar events
 */
function doPost(e) {
  try {
    // Parse form data
    const formData = JSON.parse(e.postData.contents);
    
    // Set up configuration
    config = {
      communityName: formData.communityName,
      organizerName: formData.organizerName,
      email: formData.email,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      location: formData.address,
      eventDuration: parseInt(formData.eventDuration),
      timeAdjustment: parseInt(formData.timeAdjustment),
      monthsToCreate: parseInt(formData.monthsToCreate),
      eventDescription: formData.eventDescription
    };
    
    // Calculate start and end dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + config.monthsToCreate);
    
    // Get new moon events from public calendar
    const newMoonEvents = getNewMoonEvents(startDate, endDate);
    
    // Create events in user's calendar
    const calendarId = createMoonsightingCalendar();
    const createdEvents = createViewingEvents(newMoonEvents, calendarId);
    
    // Generate calendar sharing link
    const sharingInfo = {
      calendarId: calendarId,
      link: `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(calendarId)}`,
      icsLink: `https://calendar.google.com/calendar/ical/${encodeURIComponent(calendarId)}/public/basic.ics`
    };
    
    // Send email confirmation
    sendConfirmationEmail(createdEvents, sharingInfo);
    
    // Return success response
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      events: createdEvents.length,
      sharing: sharingInfo
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    // Return error response
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Create a new calendar for moonsighting events
 */
function createMoonsightingCalendar() {
  try {
    const calendarName = `${config.communityName} Moonsighting Events`;
    
    // Check if calendar already exists
    const calendars = CalendarApp.getAllOwnedCalendars();
    for (let i = 0; i < calendars.length; i++) {
      if (calendars[i].getName() === calendarName) {
        return calendars[i].getId();
      }
    }
    
    // Create new calendar
    const newCalendar = CalendarApp.createCalendar(calendarName, {
      summary: `Monthly new moon viewing events for ${config.communityName}`,
      timeZone: CalendarApp.getDefaultCalendar().getTimeZone(),
      color: "#2952a3" // Deep blue color
    });
    
    // Make calendar public
    const calendarId = newCalendar.getId();
    makeCalendarPublic(calendarId);
    
    return calendarId;
  } catch (error) {
    Logger.log(`Error creating calendar: ${error}`);
    // Fall back to default calendar if there's an error
    return CalendarApp.getDefaultCalendar().getId();
  }
}

/**
 * Make calendar public for sharing
 * Note: This requires advanced Calendar API
 */
function makeCalendarPublic(calendarId) {
  try {
    const calendar = Calendar.Calendars.get(calendarId);
    
    Calendar.Calendars.update({
      'summary': calendar.summary,
      'description': calendar.description,
      'timeZone': calendar.timeZone,
      'hidden': false,
      'selected': true,
      'accessRole': 'reader'
    }, calendarId);
    
    Calendar.Acl.insert({
      'role': 'reader',
      'scope': {
        'type': 'default'
      }
    }, calendarId);
    
  } catch (error) {
    Logger.log(`Error making calendar public: ${error}`);
    // Continue execution even if this fails
  }
}

/**
 * Get all new moon events from the public astronomical calendar
 */
function getNewMoonEvents(startDate, endDate) {
  const PUBLIC_CALENDAR_ID = 'ht3jlfaac5lfd6263ulfh4tql8@group.calendar.google.com';
  
  try {
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
  } catch (error) {
    Logger.log(`Error getting new moon events: ${error}`);
    throw new Error(`Unable to access astronomical calendar: ${error.message}`);
  }
}

/**
 * Get sunset time using SunriseSunset.io API
 */
function getSunsetTimeFromAPI(date) {
  // Format date as YYYY-MM-DD
  const dateString = Utilities.formatDate(date, "UTC", "yyyy-MM-dd");
  
  // Construct API URL
  const url = `https://api.sunrisesunset.io/json?lat=${config.latitude}&lng=${config.longitude}&date=${dateString}`;
  
  try {
    // Make API request
    const response = UrlFetchApp.fetch(url);
    const data = JSON.parse(response.getContentText());
    
    if (data.status === "OK") {
      // Parse sunset time
      const sunsetTimeStr = data.results.sunset;
      const sunsetDateTime = parseTimeString(sunsetTimeStr, date);
      
      // Add time adjustment (in minutes)
      sunsetDateTime.setMinutes(sunsetDateTime.getMinutes() + config.timeAdjustment);
      
      return sunsetDateTime;
    } else {
      throw new Error("API returned non-OK status");
    }
  } catch (error) {
    Logger.log(`API error: ${error}. Falling back to calculation.`);
    // Fall back to calculation method if API fails
    return calculateSunsetTime(date, config.latitude, config.longitude);
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
 * Fallback sunset calculation if API fails
 */
function calculateSunsetTime(date, latitude, longitude) {
  // Simplified sunset calculation for fallback
  // This is a basic approximation
  const januarySunset = 17; // 5 PM
  const juneSunset = 20; // 8 PM
  const month = date.getMonth();
  
  // Simple sinusoidal approximation of sunset times through the year
  const hourOffset = (Math.sin(((month - 3) / 12) * 2 * Math.PI) * (juneSunset - januarySunset) / 2);
  const sunsetHour = Math.floor((januarySunset + juneSunset) / 2 + hourOffset);
  const sunsetMinute = 0;
  
  const result = new Date(date);
  result.setHours(sunsetHour, sunsetMinute, 0);
  
  // Add time adjustment (in minutes)
  result.setMinutes(result.getMinutes() + config.timeAdjustment);
  
  return result;
}

/**
 * Create viewing events in user's calendar based on new moon dates
 */
function createViewing