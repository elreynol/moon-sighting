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

# Function to initialize database
init_db() {
    print_message "Initializing database..." "${YELLOW}"
    node scripts/init-db.js

    if [ $? -eq 0 ]; then
        print_message "Database initialized successfully!" "${GREEN}"
    else
        print_message "Failed to initialize database." "${RED}"
        exit 1
    fi
}

# Function to backup database
backup_db() {
    print_message "Creating database backup..." "${YELLOW}"
    node scripts/backup-db.js

    if [ $? -eq 0 ]; then
        print_message "Database backup created successfully!" "${GREEN}"
    else
        print_message "Failed to create database backup." "${RED}"
        exit 1
    fi
}

# Function to restore database
restore_db() {
    if [ -z "$1" ]; then
        print_message "Usage: ./db.sh restore <backup_file>" "${RED}"
        exit 1
    fi

    print_message "Restoring database from backup..." "${YELLOW}"
    node scripts/restore-db.js "$1"

    if [ $? -eq 0 ]; then
        print_message "Database restored successfully!" "${GREEN}"
    else
        print_message "Failed to restore database." "${RED}"
        exit 1
    fi
}

# Function to migrate database
migrate_db() {
    print_message "Running database migrations..." "${YELLOW}"
    node scripts/migrate-db.js

    if [ $? -eq 0 ]; then
        print_message "Database migrations completed successfully!" "${GREEN}"
    else
        print_message "Failed to run database migrations." "${RED}"
        exit 1
    fi
}

# Function to seed database
seed_db() {
    print_message "Seeding database..." "${YELLOW}"
    node scripts/seed-db.js

    if [ $? -eq 0 ]; then
        print_message "Database seeded successfully!" "${GREEN}"
    else
        print_message "Failed to seed database." "${RED}"
        exit 1
    fi
}

# Function to check database status
check_db() {
    print_message "Checking database status..." "${YELLOW}"
    node scripts/check-db.js

    if [ $? -eq 0 ]; then
        print_message "Database check completed successfully!" "${GREEN}"
    else
        print_message "Failed to check database status." "${RED}"
        exit 1
    fi
}

# Main function to handle commands
handle_command() {
    case "$1" in
        "init")
            init_db
            ;;
        "backup")
            backup_db
            ;;
        "restore")
            restore_db "$2"
            ;;
        "migrate")
            migrate_db
            ;;
        "seed")
            seed_db
            ;;
        "check")
            check_db
            ;;
        *)
            print_message "Usage: ./db.sh {init|backup|restore|migrate|seed|check} [backup_file]" "${RED}"
            exit 1
            ;;
    esac
}

# Handle command
handle_command "$@" 