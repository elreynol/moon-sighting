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

# Function to validate environment variable
validate_env_var() {
    local var_name=$1
    local var_value=$2
    local required=$3

    if [ "$required" = "true" ] && [ -z "$var_value" ]; then
        print_message "Error: $var_name is required but not set." "${RED}"
        return 1
    fi
    return 0
}

# Function to set environment variable
set_env_var() {
    local var_name=$1
    local var_value=$2
    local env_file=".env"

    # Create .env file if it doesn't exist
    if [ ! -f "$env_file" ]; then
        touch "$env_file"
    fi

    # Check if variable already exists in .env
    if grep -q "^$var_name=" "$env_file"; then
        # Update existing variable
        sed -i '' "s|^$var_name=.*|$var_name=$var_value|" "$env_file"
    else
        # Add new variable
        echo "$var_name=$var_value" >> "$env_file"
    fi
}

# Function to get environment variable
get_env_var() {
    local var_name=$1
    local env_file=".env"

    if [ -f "$env_file" ]; then
        local var_value=$(grep "^$var_name=" "$env_file" | cut -d '=' -f2)
        echo "$var_value"
    fi
}

# Function to list all environment variables
list_env_vars() {
    local env_file=".env"

    if [ -f "$env_file" ]; then
        print_message "Current environment variables:" "${YELLOW}"
        while IFS= read -r line; do
            if [[ $line =~ ^[^#].+=.+ ]]; then
                var_name=$(echo "$line" | cut -d '=' -f1)
                var_value=$(echo "$line" | cut -d '=' -f2)
                print_message "$var_name = $var_value" "${GREEN}"
            fi
        done < "$env_file"
    else
        print_message "No environment variables found." "${YELLOW}"
    fi
}

# Function to remove environment variable
remove_env_var() {
    local var_name=$1
    local env_file=".env"

    if [ -f "$env_file" ]; then
        if grep -q "^$var_name=" "$env_file"; then
            sed -i '' "/^$var_name=/d" "$env_file"
            print_message "Removed $var_name from environment variables." "${GREEN}"
        else
            print_message "Variable $var_name not found." "${YELLOW}"
        fi
    else
        print_message "No environment variables found." "${YELLOW}"
    fi
}

# Main function to handle commands
handle_command() {
    case "$1" in
        "set")
            if [ -z "$2" ] || [ -z "$3" ]; then
                print_message "Usage: ./env.sh set <variable_name> <value>" "${RED}"
                exit 1
            fi
            set_env_var "$2" "$3"
            ;;
        "get")
            if [ -z "$2" ]; then
                print_message "Usage: ./env.sh get <variable_name>" "${RED}"
                exit 1
            fi
            get_env_var "$2"
            ;;
        "list")
            list_env_vars
            ;;
        "remove")
            if [ -z "$2" ]; then
                print_message "Usage: ./env.sh remove <variable_name>" "${RED}"
                exit 1
            fi
            remove_env_var "$2"
            ;;
        *)
            print_message "Usage: ./env.sh {set|get|list|remove} [variable_name] [value]" "${RED}"
            exit 1
            ;;
    esac
}

# Handle command
handle_command "$@" 