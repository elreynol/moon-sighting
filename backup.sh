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

# Create backup directory if it doesn't exist
BACKUP_DIR="backups"
if [ ! -d "$BACKUP_DIR" ]; then
    mkdir -p "$BACKUP_DIR"
fi

# Generate timestamp for backup file
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.tar.gz"

# Files and directories to backup
BACKUP_ITEMS=(
    "public"
    "server.js"
    "package.json"
    ".env"
    "logs"
)

# Check if any items exist before creating backup
EXISTING_ITEMS=()
for item in "${BACKUP_ITEMS[@]}"; do
    if [ -e "$item" ]; then
        EXISTING_ITEMS+=("$item")
    fi
done

if [ ${#EXISTING_ITEMS[@]} -eq 0 ]; then
    print_message "No files found to backup." "${RED}"
    exit 1
fi

# Create backup
print_message "Creating backup..." "${YELLOW}"
tar -czf "$BACKUP_FILE" "${EXISTING_ITEMS[@]}"

if [ $? -eq 0 ]; then
    print_message "Backup created successfully: $BACKUP_FILE" "${GREEN}"
    
    # Calculate backup size
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    print_message "Backup size: $BACKUP_SIZE" "${GREEN}"
    
    # List backup contents
    print_message "Backup contents:" "${YELLOW}"
    tar -tvf "$BACKUP_FILE"
else
    print_message "Failed to create backup." "${RED}"
    exit 1
fi

# Clean up old backups (keep only the last 5)
print_message "Cleaning up old backups..." "${YELLOW}"
cd "$BACKUP_DIR" && ls -t | tail -n +6 | xargs -r rm --

print_message "Backup process completed successfully!" "${GREEN}" 