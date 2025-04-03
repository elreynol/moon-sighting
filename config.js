/**
 * Moon Sighting Application Configuration
 * Simplified configuration with essential settings only
 */

const config = {
  // API Configuration
  api: {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
    endpoints: {
      moonVisibility: '/api/moon-visibility',
      notifications: '/api/notifications'
    }
  },

  // Moon Visibility Settings
  moonVisibility: {
    minAge: 12, // hours
    optimalAge: 24, // hours
    maxAge: 48, // hours
    confidenceLevels: {
      high: 0.8,
      medium: 0.6,
      low: 0.4
    }
  },

  // Location Settings
  location: {
    default: {
      name: 'San Francisco',
      latitude: 37.7749,
      longitude: -122.4194
    },
    maxSavedLocations: 5
  },

  // Notification Settings
  notifications: {
    checkTime: '19:00', // 7 PM
    reminderMinutes: 30,
    defaultTitle: 'Moon Sighting Alert',
    defaultBody: 'The moon may be visible tonight. Check the sky!'
  },

  // Feature Flags
  features: {
    pushNotifications: true,
    offlineSupport: true,
    communitySightings: false,
    customLocations: true
  },

  // Debug Settings
  debug: {
    enabled: process.env.NODE_ENV !== 'production',
    logLevel: process.env.LOG_LEVEL || 'info'
  }
};

// Freeze the configuration to prevent modifications
Object.freeze(config);

// Export for module compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = config;
} 