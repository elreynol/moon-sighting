# Moon Sighting Notification System

This module provides notification functionality for the moon sighting application, allowing users to receive alerts about potential moon visibility.

## Features

- **Permission Management**: Handles browser notification permissions
- **Push Notifications**: Supports web push notifications for real-time alerts
- **Scheduled Notifications**: Sends reminders at optimal times for moon sighting
- **Background Checks**: Periodically checks moon visibility in the background
- **Offline Support**: Uses service workers for offline functionality
- **Data Caching**: Caches moon data for faster access

## Components

### 1. NotificationManager

The main class that handles all notification-related functionality:

```javascript
const notificationManager = new NotificationManager(moonApi, locationManager);
```

Key methods:
- `checkPermission()`: Verifies browser support and requests user permission
- `subscribeToPushNotifications()`: Handles push notification subscription
- `scheduleMoonNotification(moonInfo)`: Schedules notifications for specific moon events
- `sendNotification(title, body)`: Sends immediate notifications
- `checkMoonVisibility()`: Checks if the moon might be visible today
- `setupDailyChecks()`: Configures daily visibility checks

### 2. Service Worker

The service worker (`service-worker.js`) handles:
- Push notification reception
- Background sync for moon visibility checks
- Offline functionality
- Cache management for moon data

### 3. Test Interface

A test interface (`notification-test.html`) is provided to:
- Test notification permissions
- Subscribe/unsubscribe to push notifications
- Send test notifications
- Schedule notifications
- Check moon visibility

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Start the server:
   ```
   npm start
   ```

3. Open the test interface:
   ```
   http://localhost:3000
   ```

## Configuration

The notification system can be configured in `config.js`:

```javascript
{
  features: {
    pushNotifications: true,
    // other features...
  },
  notifications: {
    enabled: true,
    checkTime: '19:00',
    reminderMinutes: 30
  }
}
```

## API Endpoints

The server provides the following API endpoints:

- `POST /api/notifications/subscribe`: Subscribe to push notifications
- `POST /api/notifications/unsubscribe`: Unsubscribe from push notifications
- `POST /api/notifications/send`: Send a push notification to all subscribers
- `GET /api/moon/visibility`: Get moon visibility data

## Browser Support

The notification system requires a browser that supports:
- Service Workers
- Push API
- Notifications API
- IndexedDB

## Security Considerations

- VAPID keys are generated for each server instance
- In production, keys should be stored securely
- Subscriptions should be stored in a database
- HTTPS is required for service workers and push notifications

## Future Enhancements

- Implement unsubscribe functionality
- Add support for custom notification sounds
- Improve offline data synchronization
- Add support for notification categories
- Implement notification grouping 