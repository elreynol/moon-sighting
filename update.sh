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

if ! command_exists git; then
    print_message "git is not installed. Please install git first." "${RED}"
    exit 1
fi

# Create backup before updating
print_message "Creating backup before update..." "${YELLOW}"
./backup.sh

if [ $? -ne 0 ]; then
    print_message "Failed to create backup. Aborting update." "${RED}"
    exit 1
fi

# Stop the application
print_message "Stopping the application..." "${YELLOW}"
./stop.sh

# Update dependencies
print_message "Updating dependencies..." "${YELLOW}"
npm update

if [ $? -ne 0 ]; then
    print_message "Failed to update dependencies." "${RED}"
    exit 1
fi

# Update git repository if it exists
if [ -d ".git" ]; then
    print_message "Updating git repository..." "${YELLOW}"
    git pull

    if [ $? -ne 0 ]; then
        print_message "Failed to update git repository." "${RED}"
        exit 1
    fi
fi

# Run tests
print_message "Running tests..." "${YELLOW}"
./test.sh

if [ $? -ne 0 ]; then
    print_message "Tests failed. Rolling back to previous version..." "${RED}"
    ./restore.sh
    exit 1
fi

# Run linting
print_message "Running linting..." "${YELLOW}"
./lint.sh

if [ $? -ne 0 ]; then
    print_message "Linting failed. Rolling back to previous version..." "${RED}"
    ./restore.sh
    exit 1
fi

# Start the application
print_message "Starting the application..." "${YELLOW}"
./start.sh

if [ $? -ne 0 ]; then
    print_message "Failed to start the application. Rolling back to previous version..." "${RED}"
    ./restore.sh
    exit 1
fi

# Run health check
print_message "Running health check..." "${YELLOW}"
./health.sh

if [ $? -ne 0 ]; then
    print_message "Health check failed. Rolling back to previous version..." "${RED}"
    ./restore.sh
    exit 1
fi

print_message "Update completed successfully!" "${GREEN}" 