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

# Run the deployment test
print_message "Running deployment tests..." "${YELLOW}"
node test-deployment.js

# Check the exit code
if [ $? -eq 0 ]; then
    print_message "All tests passed!" "${GREEN}"
else
    print_message "Some tests failed. Please check the output above for details." "${RED}"
    exit 1
fi 