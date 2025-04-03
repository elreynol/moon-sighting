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

# Stop the application first
print_message "Stopping the application..." "${YELLOW}"
./stop.sh

# Clean up node_modules
print_message "Cleaning up node_modules..." "${YELLOW}"
if [ -d "node_modules" ]; then
    rm -rf node_modules
    print_message "node_modules removed successfully." "${GREEN}"
fi

# Clean up logs
print_message "Cleaning up logs..." "${YELLOW}"
if [ -d "logs" ]; then
    rm -rf logs
    print_message "Logs removed successfully." "${GREEN}"
fi

# Clean up PM2 processes
if command_exists pm2; then
    print_message "Cleaning up PM2 processes..." "${YELLOW}"
    pm2 delete moon-sighting-app
    print_message "PM2 processes cleaned up successfully." "${GREEN}"
fi

# Clean up environment file
print_message "Cleaning up environment file..." "${YELLOW}"
if [ -f ".env" ]; then
    rm .env
    print_message "Environment file removed successfully." "${GREEN}"
fi

# Clean up package-lock.json
print_message "Cleaning up package-lock.json..." "${YELLOW}"
if [ -f "package-lock.json" ]; then
    rm package-lock.json
    print_message "package-lock.json removed successfully." "${GREEN}"
fi

print_message "Cleanup completed successfully!" "${GREEN}"
print_message "To reinstall the application, run: ./dev.sh" "${YELLOW}" 