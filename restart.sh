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

if ! command_exists node; then
    print_message "Node.js is not installed. Please install Node.js first." "${RED}"
    exit 1
fi

if ! command_exists npm; then
    print_message "npm is not installed. Please install npm first." "${RED}"
    exit 1
fi

# Stop the application first
print_message "Stopping the application..." "${YELLOW}"
./stop.sh

if [ $? -ne 0 ]; then
    print_message "Failed to stop the application. Please check the logs for details." "${RED}"
    exit 1
fi

# Wait for a moment to ensure the application is fully stopped
sleep 2

# Start the application
print_message "Starting the application..." "${YELLOW}"
./start.sh

if [ $? -ne 0 ]; then
    print_message "Failed to start the application. Please check the logs for details." "${RED}"
    exit 1
fi

print_message "Application restarted successfully!" "${GREEN}" 