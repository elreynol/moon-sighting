/**
 * Moon Sighting Application Server
 * Simplified server with essential functionality
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const config = require('./config');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(compression()); // Compress responses
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(morgan('dev')); // Logging

// Serve static files
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1d',
  etag: true,
  lastModified: true
}));

// API Routes
app.get('/api/moon-visibility', (req, res) => {
  try {
    // Get latitude and longitude from query parameters
    const { lat, lng, date } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }
    
    // Calculate moon visibility (simplified)
    const moonVisibility = calculateMoonVisibility(lat, lng, date);
    
    res.json(moonVisibility);
  } catch (error) {
    console.error('Error calculating moon visibility:', error);
    res.status(500).json({ error: 'Failed to calculate moon visibility' });
  }
});

// Notification endpoints (simplified)
app.post('/api/notifications/subscribe', (req, res) => {
  // In a real app, you would save the subscription to a database
  res.status(200).json({ message: 'Subscription saved successfully' });
});

app.delete('/api/notifications/unsubscribe', (req, res) => {
  // In a real app, you would remove the subscription from a database
  res.status(200).json({ message: 'Subscription removed successfully' });
});

// Serve the main application
app.get('*', (req, res) => {
  // Check if the request is for a static file
  if (req.path.match(/\.(js|css|html|png|jpg|jpeg|gif|ico|svg|json)$/)) {
    return res.status(404).send('Not found');
  }
  
  // Otherwise serve the main application
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start the server (only if not running in Vercel)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

// Export the Express app for Vercel
module.exports = app;

/**
 * Calculate moon visibility based on location and date
 * This is a simplified version - in a real app, you would use a proper astronomical library
 */
function calculateMoonVisibility(latitude, longitude, date = new Date()) {
  // Convert parameters to numbers
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  
  // Get current date if not provided
  const targetDate = date ? new Date(date) : new Date();
  
  // Simplified calculation - in a real app, you would use proper astronomical calculations
  const moonAge = calculateMoonAge(targetDate);
  const sunsetTime = calculateSunsetTime(lat, lng, targetDate);
  const moonsetTime = calculateMoonsetTime(lat, lng, targetDate);
  
  // Determine visibility based on moon age
  let visibility = 'low';
  if (moonAge >= config.moonVisibility.optimalAge) {
    visibility = 'high';
  } else if (moonAge >= config.moonVisibility.minAge) {
    visibility = 'medium';
  }
  
  return {
    date: targetDate.toISOString(),
    location: {
      latitude: lat,
      longitude: lng
    },
    moonAge: moonAge,
    sunsetTime: sunsetTime,
    moonsetTime: moonsetTime,
    visibility: visibility,
    confidence: config.moonVisibility.confidenceLevels[visibility]
  };
}

/**
 * Calculate moon age in hours (simplified)
 */
function calculateMoonAge(date) {
  // This is a very simplified calculation
  // In a real app, you would use a proper astronomical library
  const lunarMonth = 29.53058867; // days
  const epoch = new Date('2000-01-06T18:14:00Z');
  
  const daysSinceEpoch = (date - epoch) / (1000 * 60 * 60 * 24);
  const daysInCurrentCycle = daysSinceEpoch % lunarMonth;
  
  return daysInCurrentCycle * 24; // Convert to hours
}

/**
 * Calculate sunset time (simplified)
 */
function calculateSunsetTime(latitude, longitude, date) {
  // This is a very simplified calculation
  // In a real app, you would use a proper astronomical library
  const hour = 19; // 7 PM
  const minute = 0;
  
  const sunset = new Date(date);
  sunset.setHours(hour, minute, 0, 0);
  
  return sunset.toISOString();
}

/**
 * Calculate moonset time (simplified)
 */
function calculateMoonsetTime(latitude, longitude, date) {
  // This is a very simplified calculation
  // In a real app, you would use a proper astronomical library
  const hour = 22; // 10 PM
  const minute = 0;
  
  const moonset = new Date(date);
  moonset.setHours(hour, minute, 0, 0);
  
  return moonset.toISOString();
} 