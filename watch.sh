#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored messages
print_message() {
    echo -e "${2}${1}${NC}"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for required commands
print_message "Checking required commands..." "${YELLOW}"

if ! command_exists tail; then
    print_message "tail command is not available. Please install it first." "${RED}"
    exit 1
fi

# Create logs directory if it doesn't exist
if [ ! -d "logs" ]; then
    mkdir -p logs
fi

# Function to watch PM2 logs
watch_pm2_logs() {
    if command_exists pm2; then
        print_message "Watching PM2 logs..." "${GREEN}"
        print_message "Press Ctrl+C to exit" "${YELLOW}"
        pm2 logs moon-sighting-app --lines 1000
    else
        print_message "PM2 is not installed. Falling back to file logs..." "${YELLOW}"
        watch_file_logs
    fi
}

# Function to watch file logs
watch_file_logs() {
    if [ -f "logs/app.log" ]; then
        print_message "Watching file logs..." "${GREEN}"
        print_message "Press Ctrl+C to exit" "${YELLOW}"
        tail -f logs/app.log
    else
        print_message "No log file found. Creating new log file..." "${YELLOW}"
        touch logs/app.log
        tail -f logs/app.log
    fi
}

# Main watch function
watch_logs() {
    print_message "Starting log watch..." "${YELLOW}"
    echo "----------------------------------------"

    # Check if the application is running
    if command_exists pm2; then
        if pm2 list | grep -q "moon-sighting-app"; then
            watch_pm2_logs
        else
            print_message "Application is not running with PM2. Falling back to file logs..." "${YELLOW}"
            watch_file_logs
        fi
    else
        watch_file_logs
    fi
}

# Start watching logs
watch_logs 