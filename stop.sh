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
    print_message "PM2 is not installed. The application may not be running with PM2." "${YELLOW}"
    print_message "Checking for running Node.js processes..." "${YELLOW}"
    
    # Find and kill any running Node.js processes
    pkill -f "node server.js"
    if [ $? -eq 0 ]; then
        print_message "Application stopped successfully." "${GREEN}"
    else
        print_message "No running application found." "${YELLOW}"
    fi
    exit 0
fi

# Stop the application using PM2
print_message "Stopping the application..." "${YELLOW}"
pm2 stop moon-sighting-app

if [ $? -eq 0 ]; then
    print_message "Application stopped successfully." "${GREEN}"
else
    print_message "Failed to stop the application. It may not be running with PM2." "${RED}"
    print_message "Checking for running Node.js processes..." "${YELLOW}"
    
    # Find and kill any running Node.js processes
    pkill -f "node server.js"
    if [ $? -eq 0 ]; then
        print_message "Application stopped successfully." "${GREEN}"
    else
        print_message "No running application found." "${YELLOW}"
    fi
fi 