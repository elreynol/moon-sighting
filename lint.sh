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

# Install ESLint if not installed
if ! command_exists eslint; then
    print_message "Installing ESLint..." "${YELLOW}"
    npm install -g eslint
fi

# Install Prettier if not installed
if ! command_exists prettier; then
    print_message "Installing Prettier..." "${YELLOW}"
    npm install -g prettier
fi

# Run ESLint
print_message "Running ESLint..." "${YELLOW}"
eslint . --ext .js

# Check ESLint exit code
if [ $? -eq 0 ]; then
    print_message "ESLint checks passed!" "${GREEN}"
else
    print_message "ESLint found some issues. Please fix them before continuing." "${RED}"
    exit 1
fi

# Run Prettier
print_message "Running Prettier..." "${YELLOW}"
prettier --check "**/*.{js,jsx,ts,tsx,json,css,scss,md}"

# Check Prettier exit code
if [ $? -eq 0 ]; then
    print_message "Prettier checks passed!" "${GREEN}"
else
    print_message "Prettier found some formatting issues. Please fix them before continuing." "${RED}"
    exit 1
fi

print_message "All code quality checks passed!" "${GREEN}" 