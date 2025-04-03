/**
 * notificationManager.js
 * 
 * Manages notifications and reminders for the moon sighting application.
 */

const config = require('./config');

/**
 * Notification Manager class
 */
class NotificationManager {
    /**
     * Create a new Notification Manager
     * @param {Object} moonApi - The moon API instance
     * @param {Object} locationManager - The location manager instance
     */
    constructor(moonApi, locationManager) {
        this.moonApi = moonApi;
        this.locationManager = locationManager;
        this.notificationsEnabled = config.features.pushNotifications && config.notifications.enabled;
        this.checkPermission();
    }
    
    /**
     * Check if notifications are supported and request permission if needed
     */
    async checkPermission() {
        if (!('Notification' in window)) {
            console.log('This browser does not support notifications');
            this.notificationsEnabled = false;
            return;
        }
        
        if (Notification.permission !== 'granted') {
            try {
                const permission = await Notification.requestPermission();
                this.notificationsEnabled = permission === 'granted';
            } catch (error) {
                console.error('Error requesting notification permission:', error);
                this.notificationsEnabled = false;
            }
        }
    }
    
    /**
     * Subscribe to push notifications
     */
    async subscribeToPushNotifications() {
        if (!this.notificationsEnabled) {
            return;
        }
        
        try {
            if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
                console.log('Push notifications are not supported');
                return;
            }
            
            const registration = await navigator.serviceWorker.register('/service-worker.js');
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: 'YOUR_PUBLIC_VAPID_KEY' // Replace with your VAPID key
            });
            
            // Send subscription to your server
            await fetch('/api/notifications/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subscription)
            });
            
            console.log('Successfully subscribed to push notifications');
        } catch (error) {
            console.error('Error subscribing to push notifications:', error);
        }
    }
    
    /**
     * Schedule a notification for moon sighting
     * @param {Object} moonInfo - Moon information object
     */
    scheduleMoonNotification(moonInfo) {
        if (!this.notificationsEnabled) {
            return;
        }
        
        // Calculate notification time (30 minutes before sunset)
        const sunsetTime = new Date(moonInfo.sunset.iso);
        const notificationTime = new Date(sunsetTime);
        notificationTime.setMinutes(notificationTime.getMinutes() - config.notifications.reminderMinutes);
        
        // Don't schedule if the time has already passed
        if (notificationTime <= new Date()) {
            return;
        }
        
        // Schedule the notification
        setTimeout(() => {
            this.sendNotification(
                'Moon Sighting Reminder',
                `The new moon may be visible tonight at sunset (${moonInfo.sunset.formatted12Hour})`
            );
        }, notificationTime - new Date());
    }
    
    /**
     * Send a notification
     * @param {string} title - Notification title
     * @param {string} body - Notification body
     */
    sendNotification(title, body) {
        if (!this.notificationsEnabled) {
            return;
        }
        
        try {
            const notification = new Notification(title, {
                body: body,
                icon: '/images/moon-icon.png'
            });
            
            notification.onclick = function() {
                window.focus();
                this.close();
            };
        } catch (error) {
            console.error('Error sending notification:', error);
        }
    }
    
    /**
     * Check moon visibility and send notification if needed
     */
    async checkMoonVisibility() {
        if (!this.notificationsEnabled) {
            return;
        }
        
        try {
            const location = this.locationManager.getCurrentLocation();
            const today = new Date();
            
            // Get moon visibility for today
            const visibility = await this.moonApi.getMoonVisibility(today, location.latitude, location.longitude);
            
            // If moon might be visible, send a notification
            if (visibility.visible) {
                this.sendNotification(
                    'Moon Sighting Opportunity',
                    `The moon may be visible tonight! Check after sunset.`
                );
            }
        } catch (error) {
            console.error('Error checking moon visibility:', error);
        }
    }
    
    /**
     * Set up daily checks for moon visibility
     */
    setupDailyChecks() {
        if (!this.notificationsEnabled) {
            return;
        }
        
        // Parse the check time from config
        const [hours, minutes] = config.notifications.checkTime.split(':').map(Number);
        
        // Calculate time until next check
        const now = new Date();
        const nextCheck = new Date(now);
        nextCheck.setHours(hours, minutes, 0, 0);
        
        // If the check time has already passed today, schedule for tomorrow
        if (nextCheck <= now) {
            nextCheck.setDate(nextCheck.getDate() + 1);
        }
        
        // Calculate milliseconds until next check
        const timeUntilNextCheck = nextCheck - now;
        
        // Schedule the first check
        setTimeout(() => {
            this.checkMoonVisibility();
            
            // Schedule subsequent checks every 24 hours
            setInterval(() => this.checkMoonVisibility(), 24 * 60 * 60 * 1000);
        }, timeUntilNextCheck);
    }
}

// Export the NotificationManager class
module.exports = NotificationManager; 