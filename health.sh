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

# Function to check if a port is in use
check_port() {
    local port=$1
    if command_exists lsof; then
        lsof -i :$port >/dev/null 2>&1
        return $?
    else
        netstat -an | grep ":$port" | grep "LISTEN" >/dev/null 2>&1
        return $?
    fi
}

# Function to check disk space
check_disk_space() {
    local threshold=90
    local usage=$(df -h . | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$usage" -gt "$threshold" ]; then
        print_message "Warning: Disk usage is above ${threshold}% (${usage}%)" "${RED}"
        return 1
    fi
    print_message "Disk usage: ${usage}%" "${GREEN}"
    return 0
}

# Function to check memory usage
check_memory() {
    if command_exists free; then
        local total=$(free -m | awk '/Mem:/ {print $2}')
        local used=$(free -m | awk '/Mem:/ {print $3}')
        local usage=$((used * 100 / total))
        if [ "$usage" -gt 90 ]; then
            print_message "Warning: Memory usage is above 90% (${usage}%)" "${RED}"
            return 1
        fi
        print_message "Memory usage: ${usage}%" "${GREEN}"
    else
        print_message "Memory check not available" "${YELLOW}"
    fi
    return 0
}

# Function to check CPU usage
check_cpu() {
    if command_exists top; then
        local usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}')
        if [ "$(echo "$usage > 90" | bc)" -eq 1 ]; then
            print_message "Warning: CPU usage is above 90% (${usage}%)" "${RED}"
            return 1
        fi
        print_message "CPU usage: ${usage}%" "${GREEN}"
    else
        print_message "CPU check not available" "${YELLOW}"
    fi
    return 0
}

# Function to check application status
check_application() {
    local port=${PORT:-3000}
    
    # Check if the application is running
    if check_port $port; then
        print_message "Application is running on port $port" "${GREEN}"
        
        # Check if the application is responding
        if command_exists curl; then
            if curl -s "http://localhost:$port" >/dev/null; then
                print_message "Application is responding to HTTP requests" "${GREEN}"
            else
                print_message "Application is not responding to HTTP requests" "${RED}"
                return 1
            fi
        fi
    else
        print_message "Application is not running on port $port" "${RED}"
        return 1
    fi
    
    return 0
}

# Function to check PM2 status
check_pm2() {
    if command_exists pm2; then
        if pm2 list | grep -q "moon-sighting-app"; then
            print_message "Application is running with PM2" "${GREEN}"
            pm2 show moon-sighting-app
        else
            print_message "Application is not running with PM2" "${RED}"
            return 1
        fi
    else
        print_message "PM2 is not installed" "${YELLOW}"
    fi
    return 0
}

# Main health check
print_message "Starting health check..." "${YELLOW}"
echo "----------------------------------------"

# Check system resources
print_message "\nChecking system resources:" "${YELLOW}"
check_disk_space
check_memory
check_cpu

# Check application status
print_message "\nChecking application status:" "${YELLOW}"
check_application
check_pm2

print_message "\nHealth check completed!" "${GREEN}" 