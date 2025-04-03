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

# Check if backup directory exists
BACKUP_DIR="backups"
if [ ! -d "$BACKUP_DIR" ]; then
    print_message "Backup directory not found." "${RED}"
    exit 1
fi

# List available backups
print_message "Available backups:" "${YELLOW}"
ls -1 "$BACKUP_DIR" | grep "backup_.*\.tar\.gz$" | sort -r

# Prompt user to select a backup
print_message "\nEnter the name of the backup file to restore (or press Enter for the latest):" "${YELLOW}"
read BACKUP_FILE

# If no backup file specified, use the latest
if [ -z "$BACKUP_FILE" ]; then
    BACKUP_FILE=$(ls -t "$BACKUP_DIR" | grep "backup_.*\.tar\.gz$" | head -n1)
    if [ -z "$BACKUP_FILE" ]; then
        print_message "No backup files found." "${RED}"
        exit 1
    fi
fi

# Check if the backup file exists
if [ ! -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
    print_message "Backup file not found: $BACKUP_FILE" "${RED}"
    exit 1
fi

# Stop the application before restoring
print_message "Stopping the application..." "${YELLOW}"
./stop.sh

# Create a backup of current state before restoring
print_message "Creating backup of current state..." "${YELLOW}"
./backup.sh

# Restore from backup
print_message "Restoring from backup: $BACKUP_FILE" "${YELLOW}"
tar -xzf "$BACKUP_DIR/$BACKUP_FILE"

if [ $? -eq 0 ]; then
    print_message "Backup restored successfully!" "${GREEN}"
    
    # Install dependencies
    print_message "Installing dependencies..." "${YELLOW}"
    npm install
    
    # Start the application
    print_message "Starting the application..." "${YELLOW}"
    ./start.sh
else
    print_message "Failed to restore backup." "${RED}"
    exit 1
fi 