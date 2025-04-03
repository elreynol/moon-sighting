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

# Check for PM2
if ! command_exists pm2; then
    print_message "PM2 is not installed. Checking for log files..." "${YELLOW}"
    
    # Check for log files in the current directory
    if [ -f "logs/app.log" ]; then
        print_message "Found log file. Displaying logs..." "${GREEN}"
        tail -f logs/app.log
    else
        print_message "No log files found. The application may not be running." "${RED}"
        exit 1
    fi
    exit 0
fi

# Display PM2 logs
print_message "Displaying PM2 logs..." "${GREEN}"
print_message "Press Ctrl+C to exit" "${YELLOW}"

# Check if the application is running with PM2
if pm2 list | grep -q "moon-sighting-app"; then
    pm2 logs moon-sighting-app
else
    print_message "Application is not running with PM2. Checking for log files..." "${YELLOW}"
    
    # Check for log files in the current directory
    if [ -f "logs/app.log" ]; then
        print_message "Found log file. Displaying logs..." "${GREEN}"
        tail -f logs/app.log
    else
        print_message "No log files found. The application may not be running." "${RED}"
        exit 1
    fi
fi 