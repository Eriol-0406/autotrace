#!/bin/bash

# AutoTrace - One-Command Installation Script
# This script installs all dependencies and sets up the development environment

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored messages
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_step() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Get OS type
get_os() {
    case "$(uname -s)" in
        Darwin*)    echo "macOS";;
        Linux*)     echo "Linux";;
        MINGW*)     echo "Windows";;
        *)          echo "Unknown";;
    esac
}

OS=$(get_os)

print_step "🚀 AutoTrace Installation Script"
echo ""
print_info "Operating System: $OS"
echo ""

# Step 1: Check prerequisites
print_step "Step 1: Checking Prerequisites"

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    print_success "Node.js is installed: $NODE_VERSION"
    
    # Check if Node.js version is >= 18
    NODE_MAJOR_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_MAJOR_VERSION" -lt 18 ]; then
        print_error "Node.js version 18 or higher is required. Current version: $NODE_VERSION"
        exit 1
    fi
else
    print_error "Node.js is not installed"
    echo ""
    if [ "$OS" = "macOS" ]; then
        print_info "Installing Node.js via Homebrew..."
        if command_exists brew; then
            brew install node
        else
            print_error "Homebrew is not installed. Please install Homebrew first:"
            echo "  /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
            exit 1
        fi
    else
        print_error "Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi
fi

# Check npm
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    print_success "npm is installed: $NPM_VERSION"
else
    print_error "npm is not installed"
    exit 1
fi

# Check Git
if command_exists git; then
    GIT_VERSION=$(git --version)
    print_success "Git is installed: $GIT_VERSION"
else
    print_warning "Git is not installed (optional but recommended)"
fi

echo ""

# Step 2: Install MongoDB (macOS only)
if [ "$OS" = "macOS" ]; then
    print_step "Step 2: Setting up MongoDB"
    
    if command_exists brew; then
        # Check if MongoDB is already installed
        if brew list mongodb-community >/dev/null 2>&1; then
            print_success "MongoDB is already installed"
        else
            print_info "Installing MongoDB..."
            brew tap mongodb/brew
            brew install mongodb-community
            print_success "MongoDB installed successfully"
        fi
        
        # Check if MongoDB is running
        if brew services list | grep mongodb-community | grep started >/dev/null 2>&1; then
            print_success "MongoDB service is already running"
        else
            print_info "Starting MongoDB service..."
            brew services start mongodb/brew/mongodb-community
            sleep 3
            if brew services list | grep mongodb-community | grep started >/dev/null 2>&1; then
                print_success "MongoDB service started successfully"
            else
                print_error "Failed to start MongoDB service"
                exit 1
            fi
        fi
    else
        print_warning "Homebrew is not installed. MongoDB setup skipped."
        print_info "To install MongoDB manually:"
        echo "  1. Install Homebrew: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
        echo "  2. Run: brew tap mongodb/brew && brew install mongodb-community"
        echo "  3. Run: brew services start mongodb/brew/mongodb-community"
    fi
elif [ "$OS" = "Linux" ]; then
    print_step "Step 2: MongoDB Setup"
    print_warning "MongoDB setup for Linux is not automated in this script"
    print_info "Please install MongoDB manually:"
    echo "  Visit: https://www.mongodb.com/docs/manual/installation/"
    echo ""
elif [ "$OS" = "Windows" ]; then
    print_step "Step 2: MongoDB Setup"
    print_warning "MongoDB setup for Windows is not automated in this script"
    print_info "Please install MongoDB manually:"
    echo "  Download from: https://www.mongodb.com/try/download/community"
    echo ""
fi

echo ""

# Step 3: Install dependencies
print_step "Step 3: Installing Dependencies"

if [ -d "node_modules" ]; then
    print_info "node_modules directory exists. Running npm install to update..."
else
    print_info "Installing npm packages..."
fi

npm install

if [ $? -eq 0 ]; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

echo ""

# Step 4: Set executable permissions
print_step "Step 4: Setting Permissions"

if [ -d "node_modules/.bin" ]; then
    chmod +x node_modules/.bin/*
    print_success "Executable permissions set for node_modules/.bin/*"
else
    print_warning "node_modules/.bin directory not found"
fi

echo ""

# Step 5: Create environment file
print_step "Step 5: Environment Configuration"

ENV_FILE=".env.local"
ENV_EXAMPLE=".env.example"

if [ -f "$ENV_FILE" ]; then
    print_warning ".env.local already exists. Skipping creation."
    print_info "Current .env.local contents:"
    cat "$ENV_FILE" | grep -v "^#" | grep -v "^$" || echo "  (empty or all comments)"
else
    print_info "Creating .env.local file..."
    
    # Generate a random JWT secret
    JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    NEXTAUTH_SECRET=$(openssl rand -hex 32 2>/dev/null || node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    
    cat > "$ENV_FILE" << EOF
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/autotrace

# JWT Secret for authentication tokens
JWT_SECRET=$JWT_SECRET

# NextAuth Configuration
NEXTAUTH_SECRET=$NEXTAUTH_SECRET
NEXTAUTH_URL=http://localhost:9002

# Google OAuth (Optional - Get from https://console.cloud.google.com/)
# NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id-here

# Blockchain Configuration (Optional - For Sepolia Testnet deployment)
# SEPOLIA_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
# PRIVATE_KEY=your-private-key-here

# Goerli Testnet (Optional)
# GOERLI_URL=https://goerli.infura.io/v3/YOUR_INFURA_PROJECT_ID
EOF
    
    print_success ".env.local created successfully"
    print_info "Generated secure JWT_SECRET and NEXTAUTH_SECRET"
fi

echo ""

# Step 6: Final summary
print_step "✨ Installation Complete!"

print_success "AutoTrace has been successfully installed!"
echo ""
print_info "📋 Next Steps:"
echo ""
echo "  1. Start the development server:"
echo "     ${GREEN}npm run dev${NC}"
echo ""
echo "  2. Open your browser and navigate to:"
echo "     ${GREEN}http://localhost:9002${NC}"
echo ""
echo "  3. Test Accounts (if MongoDB is set up):"
echo "     • Admin: ${YELLOW}admin@example.com${NC} / ${YELLOW}admin123${NC}"
echo "     • Supplier: ${YELLOW}supplier@example.com${NC} / ${YELLOW}password123${NC}"
echo "     • Distributor: ${YELLOW}distributor@example.com${NC} / ${YELLOW}password123${NC}"
echo "     • Manufacturer: ${YELLOW}manufacturer@example.com${NC} / ${YELLOW}password123${NC}"
echo ""
print_info "📚 Useful Commands:"
echo ""
echo "  • Run development server:    ${GREEN}npm run dev${NC}"
echo "  • Build for production:      ${GREEN}npm run build${NC}"
echo "  • Run production server:     ${GREEN}npm start${NC}"
echo "  • Type checking:             ${GREEN}npm run typecheck${NC}"
echo "  • Linting:                   ${GREEN}npm run lint${NC}"
echo ""

if [ "$OS" = "macOS" ] && command_exists brew; then
    echo "  • MongoDB admin tool:        ${GREEN}npx tsx scripts/mongodb-admin.ts list-users${NC}"
    echo "  • Start MongoDB:             ${GREEN}brew services start mongodb/brew/mongodb-community${NC}"
    echo "  • Stop MongoDB:              ${GREEN}brew services stop mongodb/brew/mongodb-community${NC}"
fi

echo ""
print_info "🔧 Configuration:"
echo ""
echo "  • Environment file: ${YELLOW}.env.local${NC} (already created)"
echo "  • MongoDB URI: ${YELLOW}mongodb://localhost:27017/autotrace${NC}"
echo "  • Development URL: ${YELLOW}http://localhost:9002${NC}"
echo ""

if [ -f "$ENV_FILE" ]; then
    if ! grep -q "NEXT_PUBLIC_GOOGLE_CLIENT_ID=" "$ENV_FILE" || grep -q "^# NEXT_PUBLIC_GOOGLE_CLIENT_ID=" "$ENV_FILE"; then
        print_warning "⚠️  Google OAuth is not configured. To enable 'Login with Google':"
        echo "  1. Go to: https://console.cloud.google.com/"
        echo "  2. Create a project and OAuth 2.0 credentials"
        echo "  3. Add NEXT_PUBLIC_GOOGLE_CLIENT_ID to .env.local"
    fi
fi

echo ""
print_success "Happy coding! 🎉"
echo ""

