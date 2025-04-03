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

# Install dependencies
print_message "Installing dependencies..." "${YELLOW}"
npm install

# Create necessary directories if they don't exist
print_message "Creating necessary directories..." "${YELLOW}"
mkdir -p public/js public/css

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    print_message "Creating .env file from example..." "${YELLOW}"
    cp .env.example .env
    print_message "Please update the .env file with your configuration." "${YELLOW}"
fi

# Start the development server
print_message "Starting development server..." "${GREEN}"
print_message "The server will be available at http://localhost:3000" "${GREEN}"
print_message "Press Ctrl+C to stop the server" "${YELLOW}"

# Run the server with nodemon for auto-reloading
if command_exists nodemon; then
    nodemon server.js
else
    print_message "nodemon is not installed. Installing..." "${YELLOW}"
    npm install -g nodemon
    nodemon server.js
fi 