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

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_message "Installing dependencies..." "${YELLOW}"
    npm install
fi

# Check for environment file
if [ ! -f .env ]; then
    print_message "Creating .env file from example..." "${YELLOW}"
    cp .env.example .env
    print_message "Please update the .env file with your production configuration." "${RED}"
    exit 1
fi

# Run tests before starting
print_message "Running tests..." "${YELLOW}"
./test.sh

if [ $? -ne 0 ]; then
    print_message "Tests failed. Please fix the issues before starting the application." "${RED}"
    exit 1
fi

# Run linting before starting
print_message "Running linting..." "${YELLOW}"
./lint.sh

if [ $? -ne 0 ]; then
    print_message "Linting failed. Please fix the issues before starting the application." "${RED}"
    exit 1
fi

# Start the application
print_message "Starting the application in production mode..." "${GREEN}"
print_message "The server will be available at http://localhost:${PORT:-3000}" "${GREEN}"
print_message "Press Ctrl+C to stop the server" "${YELLOW}"

# Start the server with PM2 if available, otherwise use node
if command_exists pm2; then
    pm2 start server.js --name "moon-sighting-app"
else
    print_message "PM2 is not installed. Installing..." "${YELLOW}"
    npm install -g pm2
    pm2 start server.js --name "moon-sighting-app"
fi 