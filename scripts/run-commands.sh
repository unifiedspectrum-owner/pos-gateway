#!/bin/bash

# Automated script to execute commands from commands.sh
# This script runs Wrangler commands for setting up secrets and migrations

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Helper functions for colored output
log_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

log_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

log_error() {
    echo -e "${RED}✗ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

log_header() {
    echo -e "${BOLD}${BLUE}$1${NC}"
}

# Function to execute a command with error handling
execute_command() {
    local description="$1"
    local command="$2"
    
    log_info "Executing: $description"
    
    if eval "$command"; then
        log_success "$description completed successfully"
        return 0
    else
        log_error "$description failed"
        return 1
    fi
}

# Check prerequisites
check_prerequisites() {
    log_header "🔍 Checking Prerequisites..."

    # Check if migration files exist
    local migration_files=(
        "./migrations/001_users_schema.sql"
        "./migrations/002_seed_users_data.sql"
    )

    local missing_files=()
    for file in "${migration_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            missing_files+=("$file")
        fi
    done

    if [[ ${#missing_files[@]} -gt 0 ]]; then
        log_error "Missing required migration files:"
        for file in "${missing_files[@]}"; do
            echo "   - $file"
        done
        return 1
    fi

    # Check if wrangler is installed
    if ! command -v wrangler &> /dev/null; then
        log_error "Wrangler CLI not found. Please install it first."
        return 1
    fi

    log_success "All prerequisites met"
    return 0
}

# Parse command line arguments
parse_arguments() {
    local secrets=true
    local migrations=true
    local help=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --secrets-only|-s)
                secrets=true
                migrations=false
                shift
                ;;
            --migrations-only|-m)
                secrets=false
                migrations=true
                shift
                ;;
            --all|-a)
                secrets=true
                migrations=true
                shift
                ;;
            --help|-h)
                help=true
                shift
                ;;
            *)
                log_warning "Unknown argument: $1"
                shift
                ;;
        esac
    done
    
    echo "$secrets:$migrations:$help"
}

# Display help information
show_help() {
    echo -e "${BOLD}${GREEN}🚀 POS Backend Setup Script${NC}\n"
    echo -e "${BOLD}Usage:${NC}"
    echo "  ./run-commands.sh [options]"
    echo ""
    echo -e "${BOLD}Options:${NC}"
    echo "  -s, --secrets-only     Execute only secrets setup commands"
    echo "  -m, --migrations-only  Execute only database migration commands"
    echo "  -a, --all             Execute all commands (default)"
    echo "  -h, --help            Show this help message"
    echo ""
    echo -e "${BOLD}Examples:${NC}"
    echo "  ./run-commands.sh                    # Run all commands"
    echo "  ./run-commands.sh --secrets-only     # Setup secrets only"
    echo "  ./run-commands.sh --migrations-only  # Run migrations only"
    echo "  npm run setup:bash -- --secrets-only # Using npm script with options"
}

# Main execution function
main() {
    # Parse arguments
    local options_result
    options_result=$(parse_arguments "$@")
    IFS=':' read -r secrets migrations help <<< "$options_result"
    
    # Show help if requested
    if [[ "$help" == "true" ]]; then
        show_help
        exit 0
    fi
    
    echo -e "${BOLD}${GREEN}🚀 POS Backend Setup Script${NC}\n"
    
    # Show what will be executed
    local execution_plan=()
    [[ "$secrets" == "true" ]] && execution_plan+=("Secrets Setup")
    [[ "$migrations" == "true" ]] && execution_plan+=("Database Migrations")
    
    if [[ ${#execution_plan[@]} -eq 0 ]]; then
        log_warning "No commands selected for execution. Use --help for usage information."
        exit 1
    fi
    
    log_info "Execution plan: $(IFS=', '; echo "${execution_plan[*]}")"
    echo ""
    
    # Check prerequisites
    if ! check_prerequisites; then
        exit 1
    fi
    
    echo ""
    
    # Initialize counters
    local success_count=0
    local failure_count=0
    
    # Setup secrets
    if [[ "$secrets" == "true" ]]; then
        log_header "🔐 Setting up Secrets..."
        
        if execute_command "Setup TWILIO_ACCOUNT_SID Secret" \
            'wrangler secrets-store secret create "9a9c2cca4b2a48e89fd597554b8357db" --name TWILIO_ACCOUNT_SID --scopes workers'; then
            ((success_count++))
        else
            ((failure_count++))
        fi
        sleep 1
        
        if execute_command "Setup TWILIO_AUTH_TOKEN Secret" \
            'wrangler secrets-store secret create "9a9c2cca4b2a48e89fd597554b8357db" --name TWILIO_AUTH_TOKEN --scopes workers'; then
            ((success_count++))
        else
            ((failure_count++))
        fi
        sleep 1
        
        if execute_command "Setup SENDGRID_API_KEY Secret" \
            'wrangler secrets-store secret create "9a9c2cca4b2a48e89fd597554b8357db" --name SENDGRID_API_KEY --scopes workers'; then
            ((success_count++))
        else
            ((failure_count++))
        fi
        sleep 1
        
        echo ""
    fi
    
    # Run migrations
    if [[ "$migrations" == "true" ]]; then
        log_header "📊 Running Database Migrations..."

        if execute_command "Execute Migration - Users Schema" \
            "wrangler d1 execute 'pos-db-global' --file='./migrations/001_users_schema.sql'"; then
            ((success_count++))
        else
            ((failure_count++))
        fi
        sleep 1

        if execute_command "Execute Migration - Seed Users Data" \
            "wrangler d1 execute 'pos-db-global' --file='./migrations/002_seed_users_data.sql'"; then
            ((success_count++))
        else
            ((failure_count++))
        fi
        sleep 1

        echo ""
    fi
    
    # Display summary
    log_header "📋 Execution Summary"
    echo "   Total Commands: $((success_count + failure_count))"
    echo -e "   ${GREEN}Successful: $success_count${NC}"
    echo -e "   ${RED}Failed: $failure_count${NC}"
    
    if [[ $failure_count -gt 0 ]]; then
        echo -e "\n${YELLOW}⚠ Some commands failed. Please check the errors above.${NC}"
        exit 1
    else
        echo -e "\n${GREEN}🎉 All commands executed successfully!${NC}"
        exit 0
    fi
}

# Handle script interruption
trap 'log_warning "\nProcess interrupted by user"; exit 1' INT

# Run the script
main "$@"