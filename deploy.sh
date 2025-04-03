#!/bin/bash

# Exit on error
set -e

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root (use sudo)"
  exit 1
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Moon Sighting Application Deployment${NC}"

# Update system packages
echo -e "${YELLOW}Updating system packages...${NC}"
apt-get update
apt-get upgrade -y

# Install required packages
echo -e "${YELLOW}Installing required packages...${NC}"
apt-get install -y curl git nginx certbot python3-certbot-nginx

# Install Node.js if not already installed
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Installing Node.js...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

# Install PM2 if not already installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}Installing PM2...${NC}"
    npm install -g pm2
fi

# Create application directory
APP_DIR="/opt/moon-sighting-app"
echo -e "${YELLOW}Creating application directory at ${APP_DIR}...${NC}"
mkdir -p $APP_DIR

# Copy application files
echo -e "${YELLOW}Copying application files...${NC}"
cp -r ./* $APP_DIR/

# Install dependencies
echo -e "${YELLOW}Installing application dependencies...${NC}"
cd $APP_DIR
npm install --production

# Create .env file if it doesn't exist
if [ ! -f "$APP_DIR/.env" ]; then
    echo -e "${YELLOW}Creating .env file...${NC}"
    cp .env.example .env
    echo -e "${RED}Please update the .env file with your configuration${NC}"
fi

# Configure Nginx
echo -e "${YELLOW}Configuring Nginx...${NC}"
cat > /etc/nginx/sites-available/moon-sighting-app << EOL
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOL

# Enable the site
ln -sf /etc/nginx/sites-available/moon-sighting-app /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Restart Nginx
systemctl restart nginx

# Start the application with PM2
echo -e "${YELLOW}Starting the application with PM2...${NC}"
cd $APP_DIR
pm2 start server.js --name moon-sighting-app
pm2 save

# Setup PM2 to start on boot
pm2 startup

# Prompt for SSL setup
echo -e "${YELLOW}Would you like to set up SSL with Let's Encrypt? (y/n)${NC}"
read -r setup_ssl

if [[ $setup_ssl =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Enter your domain name:${NC}"
    read -r domain_name
    
    certbot --nginx -d "$domain_name" --non-interactive --agree-tos --email admin@example.com
fi

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Update the .env file with your configuration"
echo "2. Set up your domain name in the Nginx configuration"
echo "3. Configure SSL if you haven't already"
echo "4. Test the application by visiting your domain"

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

# Check for environment variables
if [ -z "$DEPLOY_HOST" ]; then
    print_message "DEPLOY_HOST environment variable is not set." "${RED}"
    exit 1
fi

if [ -z "$DEPLOY_USER" ]; then
    print_message "DEPLOY_USER environment variable is not set." "${RED}"
    exit 1
fi

if [ -z "$DEPLOY_PATH" ]; then
    print_message "DEPLOY_PATH environment variable is not set." "${RED}"
    exit 1
fi

# Create backup before deploying
print_message "Creating backup before deployment..." "${YELLOW}"
./backup.sh

if [ $? -ne 0 ]; then
    print_message "Failed to create backup. Aborting deployment." "${RED}"
    exit 1
fi

# Run tests
print_message "Running tests..." "${YELLOW}"
./test.sh

if [ $? -ne 0 ]; then
    print_message "Tests failed. Aborting deployment." "${RED}"
    exit 1
fi

# Run linting
print_message "Running linting..." "${YELLOW}"
./lint.sh

if [ $? -ne 0 ]; then
    print_message "Linting failed. Aborting deployment." "${RED}"
    exit 1
fi

# Create deployment package
print_message "Creating deployment package..." "${YELLOW}"
DEPLOY_PACKAGE="deploy_$(date +%Y%m%d_%H%M%S).tar.gz"
tar --exclude='node_modules' --exclude='.git' --exclude='backups' -czf "$DEPLOY_PACKAGE" .

if [ $? -ne 0 ]; then
    print_message "Failed to create deployment package." "${RED}"
    exit 1
fi

# Deploy to production
print_message "Deploying to production..." "${YELLOW}"
scp "$DEPLOY_PACKAGE" "$DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH/"

if [ $? -ne 0 ]; then
    print_message "Failed to copy deployment package to production server." "${RED}"
    rm "$DEPLOY_PACKAGE"
    exit 1
fi

# Clean up local deployment package
rm "$DEPLOY_PACKAGE"

# Execute deployment commands on production server
print_message "Executing deployment commands on production server..." "${YELLOW}"
ssh "$DEPLOY_USER@$DEPLOY_HOST" "cd $DEPLOY_PATH && \
    tar -xzf $(basename $DEPLOY_PACKAGE) && \
    rm $(basename $DEPLOY_PACKAGE) && \
    npm install --production && \
    pm2 restart moon-sighting-app || pm2 start server.js --name moon-sighting-app"

if [ $? -ne 0 ]; then
    print_message "Failed to execute deployment commands on production server." "${RED}"
    exit 1
fi

print_message "Deployment completed successfully!" "${GREEN}" 