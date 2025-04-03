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

# Function to install dependencies
install_deps() {
    print_message "Installing dependencies..." "${YELLOW}"
    npm install

    if [ $? -eq 0 ]; then
        print_message "Dependencies installed successfully!" "${GREEN}"
    else
        print_message "Failed to install dependencies." "${RED}"
        exit 1
    fi
}

# Function to update dependencies
update_deps() {
    print_message "Updating dependencies..." "${YELLOW}"
    npm update

    if [ $? -eq 0 ]; then
        print_message "Dependencies updated successfully!" "${GREEN}"
    else
        print_message "Failed to update dependencies." "${RED}"
        exit 1
    fi
}

# Function to check for outdated dependencies
check_outdated() {
    print_message "Checking for outdated dependencies..." "${YELLOW}"
    npm outdated

    if [ $? -eq 0 ]; then
        print_message "Dependency check completed!" "${GREEN}"
    else
        print_message "Failed to check dependencies." "${RED}"
        exit 1
    fi
}

# Function to audit dependencies
audit_deps() {
    print_message "Auditing dependencies..." "${YELLOW}"
    npm audit

    if [ $? -eq 0 ]; then
        print_message "Dependency audit completed!" "${GREEN}"
    else
        print_message "Failed to audit dependencies." "${RED}"
        exit 1
    fi
}

# Function to fix dependency issues
fix_deps() {
    print_message "Fixing dependency issues..." "${YELLOW}"
    npm audit fix

    if [ $? -eq 0 ]; then
        print_message "Dependency issues fixed successfully!" "${GREEN}"
    else
        print_message "Failed to fix dependency issues." "${RED}"
        exit 1
    fi
}

# Function to clean dependency cache
clean_deps() {
    print_message "Cleaning dependency cache..." "${YELLOW}"
    npm cache clean --force

    if [ $? -eq 0 ]; then
        print_message "Dependency cache cleaned successfully!" "${GREEN}"
    else
        print_message "Failed to clean dependency cache." "${RED}"
        exit 1
    fi
}

# Main function to handle commands
handle_command() {
    case "$1" in
        "install")
            install_deps
            ;;
        "update")
            update_deps
            ;;
        "check")
            check_outdated
            ;;
        "audit")
            audit_deps
            ;;
        "fix")
            fix_deps
            ;;
        "clean")
            clean_deps
            ;;
        *)
            print_message "Usage: ./deps.sh {install|update|check|audit|fix|clean}" "${RED}"
            exit 1
            ;;
    esac
}

# Handle command
handle_command "$@" 