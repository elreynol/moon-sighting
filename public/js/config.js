/**
 * config.js
 * 
 * Configuration settings for the moon sighting application.
 * This file centralizes all configuration options and feature flags.
 */

const config = {
    // API Configuration
    api: {
        baseUrl: '/api',
        endpoints: {
            moonVisibility: '/moon/visibility',
            notifications: {
                subscribe: '/notifications/subscribe',
                unsubscribe: '/notifications/unsubscribe',
                send: '/notifications/send',
                publicKey: '/notifications/public-key'
            }
        }
    },

    // Moon Visibility Settings
    moonVisibility: {
        minAge: 15, // hours
        optimalAge: 20, // hours
        maxAge: 24, // hours
        confidenceLevels: {
            high: 'High',
            medium: 'Medium',
            low: 'Low'
        }
    },

    // Location Settings
    location: {
        defaultLocation: {
            name: 'San Francisco',
            latitude: 37.7749,
            longitude: -122.4194
        },
        maxSavedLocations: 10,
        geocodingApi: 'https://nominatim.openstreetmap.org/reverse'
    },

    // Notification Settings
    notifications: {
        checkTime: '19:00', // 7 PM
        reminderMinutes: 30,
        defaultTitle: 'Moon Visibility Alert',
        defaultBody: 'The moon may be visible tonight after sunset.'
    },

    // UI Settings
    ui: {
        updateInterval: 60000, // 1 minute
        moonCanvasSize: 200,
        theme: {
            primary: '#2c3e50',
            secondary: '#3498db',
            background: '#f5f6fa',
            text: '#2c3e50',
            border: '#dcdde1',
            success: '#27ae60',
            warning: '#f1c40f',
            error: '#e74c3c'
        }
    },

    // Feature Flags
    features: {
        pushNotifications: true,
        locationManagement: true,
        moonVisualization: true,
        offlineSupport: true
    },

    // Debug Settings
    debug: {
        enabled: false,
        logLevel: 'info' // 'debug' | 'info' | 'warn' | 'error'
    }
};

// Freeze the configuration to prevent modifications
Object.freeze(config);

// Export the configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = config;
} 