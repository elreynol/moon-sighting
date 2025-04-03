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
        this.publicKey = null;
        this.subscription = null;
        this.init();
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

    async init() {
        try {
            // Get the public key from the server
            const response = await fetch('/api/notifications/public-key');
            const data = await response.json();
            this.publicKey = data.publicKey;

            // Check if we already have a subscription
            const registration = await navigator.serviceWorker.ready;
            this.subscription = await registration.pushManager.getSubscription();

            // Update UI based on subscription status
            this.updateUI();
        } catch (error) {
            console.error('Error initializing notification manager:', error);
        }
    }

    async subscribe() {
        try {
            const registration = await navigator.serviceWorker.ready;
            
            // Request notification permission
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                throw new Error('Notification permission denied');
            }

            // Subscribe to push notifications
            this.subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(this.publicKey)
            });

            // Send subscription to server
            await fetch('/api/notifications/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.subscription)
            });

            this.updateUI();
            return true;
        } catch (error) {
            console.error('Error subscribing to notifications:', error);
            throw error;
        }
    }

    async unsubscribe() {
        try {
            if (!this.subscription) {
                return false;
            }

            // Unsubscribe from push notifications
            await this.subscription.unsubscribe();

            // Remove subscription from server
            await fetch('/api/notifications/unsubscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.subscription)
            });

            this.subscription = null;
            this.updateUI();
            return true;
        } catch (error) {
            console.error('Error unsubscribing from notifications:', error);
            throw error;
        }
    }

    isSubscribed() {
        return this.subscription !== null;
    }

    updateUI() {
        const button = document.getElementById('notificationBtn');
        if (button) {
            button.textContent = this.isSubscribed() ? 'Disable Notifications' : 'Enable Notifications';
        }
    }

    // Helper function to convert base64 to Uint8Array
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }
}

// Export the NotificationManager class
module.exports = NotificationManager; 