// Create menu when spreadsheet opens
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Calendar Events')
    .addItem('Initial Setup', 'initialSetup')
    .addItem('Create Events', 'taskScheduler')
    .addSeparator()
    .addItem('Update Astronomical Data', 'updateAstronomicalData')
    .addToUi();
}

// Modify error handling to use only logging
function handleError(error) {
  Logger.log("Error: " + error.toString());
  return false;
}

// Validate headers
function validateHeaders() {
  try {
    var sheet = SpreadsheetApp.getActiveSheet();
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    var requiredHeaders = ["Task", "Start date", "End date"];
    var missingHeaders = [];
    
    requiredHeaders.forEach(function(header) {
      if (headers.indexOf(header) === -1) {
        missingHeaders.push(header);
      }
    });
    
    if (missingHeaders.length > 0) {
      throw new Error("Missing required headers: " + missingHeaders.join(", "));
    }
    return true;
  } catch(e) {
    handleError(e);
    return false;
  }
}

// Add this function to verify calendar access
function verifyCalendarAccess() {
  try {
    var sheet = SpreadsheetApp.getActiveSheet();
    var calendarId = sheet.getRange("J1").getValue();
    
    if (!calendarId) {
      throw new Error("Calendar ID is missing in cell J1");
    }
    
    var calendar = CalendarApp.getCalendarById(calendarId);
    if (!calendar) {
      throw new Error("Could not access calendar with ID: " + calendarId);
    }
    
    Logger.log("Successfully connected to calendar: " + calendar.getName());
    return true;
    
  } catch(e) {
    Logger.log("Calendar Access Error: " + e.toString());
    return false;
  }
}

// Update config with all needed endpoints
function getConfig() {
  return {
    apiKey: 'cuM56RhONn02Gxuq870-Y',
    bodyPositionEndpoint: 'https://api.radiantdrift.com/body-position',
    riseSetEndpoint: 'https://api.radiantdrift.com/rise-transit-set/2025-01-01T07:00:00.000Z/2026-12-31T07:00:00.000Z'
  };
}

// Function to get rise/set times for a specific date
function getRiseSetTimes(date, latitude, longitude) {
  const config = getConfig();
  
  const options = {
    'method': 'get',
    'headers': {
      'Authorization': `ApiKey ${config.apiKey}`,
      'Content-Type': 'application/json'
    },
    'muteHttpExceptions': true,
    'payload': JSON.stringify({
      'date': date.toISOString().split('T')[0],
      'latitude': latitude,
      'longitude': longitude,
      'bodies': ['sun', 'moon']
    })
  };

  try {
    const response = UrlFetchApp.fetch(config.riseSetEndpoint, options);
    if (response.getResponseCode() === 200) {
      return JSON.parse(response.getContentText());
    } else {
      throw new Error(`Failed to get rise/set times: ${response.getContentText()}`);
    }
  } catch (e) {
    Logger.log("Error getting rise/set times: " + e.toString());
    throw e;
  }
}

// Function to get moon age
function getMoonAge(date) {
  const config = getConfig();
  
  const options = {
    'method': 'get',
    'headers': {
      'Authorization': `ApiKey ${config.apiKey}`,
      'Content-Type': 'application/json'
    },
    'muteHttpExceptions': true,
    'payload': JSON.stringify({
      'body': 'moon',
      'date': date.toISOString().split('T')[0]
    })
  };

  try {
    const response = UrlFetchApp.fetch(config.bodyPositionEndpoint, options);
    if (response.getResponseCode() === 200) {
      const result = JSON.parse(response.getContentText());
      // Calculate moon age from the phase data
      return result.phase; // This should return the moon's age in days
    } else {
      throw new Error(`Failed to get moon data: ${response.getContentText()}`);
    }
  } catch (e) {
    Logger.log("Error getting moon age: " + e.toString());
    throw e;
  }
}

// 1. First, add this function to store astronomical data daily
function updateAstronomicalData() {
  try {
    // Get the active spreadsheet
    var ss = SpreadsheetApp.getActive();
    
    // Check for latitude/longitude first
    var latitude = ss.getActiveSheet().getRange("K1").getValue();
    var longitude = ss.getActiveSheet().getRange("L1").getValue();
    
    if (!latitude || !longitude) {
      throw new Error("Latitude or Longitude missing in cells K1 and L1");
    }
    
    // Create or get the Astronomical Data sheet
    var dataSheet;
    try {
      dataSheet = ss.getSheetByName("Astronomical Data");
      if (!dataSheet) {
        dataSheet = ss.insertSheet("Astronomical Data");
        // Add headers
        dataSheet.getRange("A1:E1").setValues([["Date", "Moon Age", "Sunset", "Moonset", "Data JSON"]]);
        dataSheet.setFrozenRows(1); // Freeze header row
        Logger.log("Created new Astronomical Data sheet with headers");
      }
    } catch(e) {
      throw new Error("Failed to create/access Astronomical Data sheet: " + e.message);
    }
    
    // Get astronomical data
    var today = new Date();
    const riseSetData = getRiseSetTimes(today, latitude, longitude);
    const moonAge = getMoonAge(today);
    
    // Format the data
    var newRow = [
      today.toISOString().split('T')[0],
      moonAge,
      riseSetData.sun.set,
      riseSetData.moon.set,
      JSON.stringify(riseSetData)
    ];
    
    // Add new row of data
    dataSheet.appendRow(newRow);
    
    Logger.log("✓ Astronomical data updated successfully");
    return dataSheet;
    
  } catch(e) {
    Logger.log("❌ Error updating astronomical data: " + e.toString());
    throw e;
  }
}

// 2. Simplified event creation function
function createCalendarEvent(event) {
  try {
    var calendar = CalendarApp.getCalendarById(
      SpreadsheetApp.getActiveSheet().getRange("J1").getValue()
    );
    
    if (!calendar) {
      throw new Error("Could not access calendar. Please check the Calendar ID in cell J1");
    }

    // Get stored astronomical data
    var dataSheet = SpreadsheetApp.getActive().getSheetByName("Astronomical Data");
    var lastRow = dataSheet.getLastRow();
    var todayData = dataSheet.getRange(lastRow, 1, 1, 5).getValues()[0];
    
    const astronomicalInfo = [
      "Astronomical Information:",
      `Moon Age: ${todayData[1]} days`,
      `Sunset: ${todayData[2]}`,
      `Moonset: ${todayData[3]}`
    ].join("\n");

    const fullDescription = `${event.description}\n\n${astronomicalInfo}`;

    const createdEvent = calendar.createAllDayEvent(
      event.title,
      new Date(event.start_date),
      new Date(event.end_date),
      {description: fullDescription}
    );
    
    Logger.log("Event created successfully");
    return createdEvent;
  } catch (e) {
    Logger.log("Error creating event: " + e.toString());
    throw e;
  }
}

// 3. Set up a daily trigger for astronomical data
function setupDailyTrigger() {
  // Delete any existing triggers
  var triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));
  
  // Create new daily trigger
  ScriptApp.newTrigger('updateAstronomicalData')
    .timeBased()
    .everyDays(1)
    .atHour(1) // Run at 1 AM
    .create();
    
  // Run it once immediately
  updateAstronomicalData();
}

// Modify your taskScheduler function
function taskScheduler() {
  try {
    var sheet = SpreadsheetApp.getActiveSheet();
    var values = sheet.getDataRange().getValues();
    var headers = values[0];
    
    var TaskCol = headers.indexOf("Task");
    var startCol = headers.indexOf("Start date");
    var endCol = headers.indexOf("End date");
    
    if (TaskCol === -1 || startCol === -1 || endCol === -1) {
      throw new Error("Required columns missing");
    }

    for (var x = 1; x < values.length; x++) {
      var row = values[x];
      if (!row[TaskCol]) continue;

      var event = {
        'title': row[TaskCol],
        'start_date': new Date(row[startCol]),
        'end_date': new Date(row[endCol]),
        'description': createDescription(row, headers, TaskCol, startCol, endCol)
      };

      createCalendarEvent(event);
    }
  } catch(e) {
    Logger.log("Error: " + e.toString());
    throw e;
  }
}

// Helper function to create event description
function createDescription(row, headers, TaskCol, startCol, endCol) {
  var description = [];
  
  headers.forEach((header, index) => {
    if (index !== TaskCol && 
        index !== startCol && 
        index !== endCol && 
        row[index]) {
      description.push(`${header}: ${row[index]}`);
    }
  });
  
  return description.join("\n");
}

// Add a test function specifically for RadiantDrift

function initialSetup() {
  var sheet = SpreadsheetApp.getActiveSheet();
  
  // Set up configuration cells
  sheet.getRange("J1").setValue("20cdf8ca111bc04ec5e6bb153acce7a2124d65583069b1903870eabab4a43423@group.calendar.google.com");
  sheet.getRange("K1").setValue(40.7128); // Replace with your latitude
  sheet.getRange("L1").setValue(-74.0060); // Replace with your longitude
  
  // Create headers
  sheet.getRange("J1:L1").setValues([["Calendar ID", "Latitude", "Longitude"]]);
  
  // Set up daily trigger
  setupDailyTrigger();
}

// 1. Main setup and test
function fullSetupAndTest() {
  try {
    Logger.log("=== Starting Full System Test ===");
    
    // Run initial setup
    initialSetup();
    
    // Test calendar access
    var calendarId = SpreadsheetApp.getActiveSheet().getRange("J1").getValue();
    var calendar = CalendarApp.getCalendarById(calendarId);
    Logger.log("Calendar access: " + (calendar ? "✓" : "❌"));
    
    // Test astronomical data
    updateAstronomicalData();
    
    // Verify the sheet exists
    var sheet = SpreadsheetApp.getActive().getSheetByName("Astronomical Data");
    Logger.log("Astronomical Data sheet: " + (sheet ? "✓" : "❌"));
    
    Logger.log("=== Setup Complete ===");
  } catch(e) {
    Logger.log("❌ Error: " + e.toString());
    throw e;
  }
}

// 2. Test single event creation
function testSingleEvent() {
  try {
    const testEvent = {
      'title': 'Test Event',
      'start_date': new Date().toISOString().split('T')[0],
      'end_date': new Date(Date.now() + 86400000).toISOString().split('T')[0],
      'description': 'Test event'
    };
    
    createCalendarEvent(testEvent);
  } catch(e) {
    Logger.log("Test failed: " + e.toString());
  }
}