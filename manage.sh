#!/bin/bash

# Simple management script for the Moon Sighting Application
# Combines essential functionality from multiple scripts

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Application settings
APP_NAME="moon-sighting"
APP_DIR="/opt/$APP_NAME"
LOG_FILE="$APP_DIR/logs/app.log"
PM2_CONFIG="$APP_DIR/ecosystem.config.js"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run as root${NC}"
  exit 1
fi

# Function to display help
show_help() {
  echo -e "${GREEN}Moon Sighting Application Management Script${NC}"
  echo "Usage: $0 [command]"
  echo ""
  echo "Commands:"
  echo "  start       - Start the application"
  echo "  stop        - Stop the application"
  echo "  restart     - Restart the application"
  echo "  status      - Check application status"
  echo "  logs        - View application logs"
  echo "  deploy      - Deploy to production"
  echo "  backup      - Create a backup"
  echo "  restore     - Restore from backup"
  echo "  update      - Update the application"
  echo "  help        - Show this help message"
}

# Function to start the application
start_app() {
  echo -e "${YELLOW}Starting $APP_NAME...${NC}"
  
  # Create necessary directories if they don't exist
  mkdir -p $APP_DIR/logs
  
  # Start the application with PM2
  pm2 start $PM2_CONFIG
  
  echo -e "${GREEN}$APP_NAME started successfully${NC}"
}

# Function to stop the application
stop_app() {
  echo -e "${YELLOW}Stopping $APP_NAME...${NC}"
  
  # Stop the application with PM2
  pm2 stop $APP_NAME
  
  echo -e "${GREEN}$APP_NAME stopped successfully${NC}"
}

# Function to restart the application
restart_app() {
  echo -e "${YELLOW}Restarting $APP_NAME...${NC}"
  
  # Restart the application with PM2
  pm2 restart $APP_NAME
  
  echo -e "${GREEN}$APP_NAME restarted successfully${NC}"
}

# Function to check application status
check_status() {
  echo -e "${YELLOW}Checking $APP_NAME status...${NC}"
  
  # Check if the application is running
  if pm2 list | grep -q $APP_NAME; then
    echo -e "${GREEN}$APP_NAME is running${NC}"
    pm2 show $APP_NAME
  else
    echo -e "${RED}$APP_NAME is not running${NC}"
  fi
}

# Function to view application logs
view_logs() {
  echo -e "${YELLOW}Viewing $APP_NAME logs...${NC}"
  
  # Check if the log file exists
  if [ -f "$LOG_FILE" ]; then
    # Display the last 50 lines of the log file
    tail -n 50 $LOG_FILE
  else
    echo -e "${RED}Log file not found${NC}"
  fi
}

# Function to deploy to production
deploy_app() {
  echo -e "${YELLOW}Deploying $APP_NAME to production...${NC}"
  
  # Create a deployment package
  tar -czf $APP_NAME.tar.gz \
    --exclude="node_modules" \
    --exclude=".git" \
    --exclude="*.log" \
    .
  
  # Copy the package to the production server
  # Replace with your actual server details
  # scp $APP_NAME.tar.gz user@your-server:/tmp/
  
  # Execute deployment commands on the production server
  # Replace with your actual server details
  # ssh user@your-server "cd /opt/$APP_NAME && \
  #   tar -xzf /tmp/$APP_NAME.tar.gz && \
  #   npm install --production && \
  #   pm2 restart $APP_NAME && \
  #   rm /tmp/$APP_NAME.tar.gz"
  
  # Clean up local deployment package
  rm $APP_NAME.tar.gz
  
  echo -e "${GREEN}$APP_NAME deployed successfully${NC}"
}

# Function to create a backup
create_backup() {
  echo -e "${YELLOW}Creating backup of $APP_NAME...${NC}"
  
  # Create backup directory if it doesn't exist
  mkdir -p $APP_DIR/backups
  
  # Create a backup with timestamp
  BACKUP_FILE="$APP_DIR/backups/$APP_NAME-$(date +%Y%m%d%H%M%S).tar.gz"
  tar -czf $BACKUP_FILE \
    --exclude="node_modules" \
    --exclude=".git" \
    --exclude="*.log" \
    $APP_DIR
  
  echo -e "${GREEN}Backup created: $BACKUP_FILE${NC}"
}

# Function to restore from backup
restore_backup() {
  echo -e "${YELLOW}Restoring $APP_NAME from backup...${NC}"
  
  # Check if backup file is provided
  if [ -z "$1" ]; then
    echo -e "${RED}Please specify a backup file${NC}"
    echo "Usage: $0 restore <backup_file>"
    exit 1
  fi
  
  # Check if backup file exists
  if [ ! -f "$1" ]; then
    echo -e "${RED}Backup file not found: $1${NC}"
    exit 1
  fi
  
  # Stop the application
  stop_app
  
  # Extract the backup
  tar -xzf $1 -C $APP_DIR
  
  # Install dependencies
  cd $APP_DIR && npm install --production
  
  # Start the application
  start_app
  
  echo -e "${GREEN}$APP_NAME restored successfully${NC}"
}

# Function to update the application
update_app() {
  echo -e "${YELLOW}Updating $APP_NAME...${NC}"
  
  # Stop the application
  stop_app
  
  # Pull latest changes
  cd $APP_DIR && git pull
  
  # Install dependencies
  npm install --production
  
  # Start the application
  start_app
  
  echo -e "${GREEN}$APP_NAME updated successfully${NC}"
}

# Main script logic
case "$1" in
  start)
    start_app
    ;;
  stop)
    stop_app
    ;;
  restart)
    restart_app
    ;;
  status)
    check_status
    ;;
  logs)
    view_logs
    ;;
  deploy)
    deploy_app
    ;;
  backup)
    create_backup
    ;;
  restore)
    restore_backup "$2"
    ;;
  update)
    update_app
    ;;
  help|*)
    show_help
    ;;
esac

exit 0 