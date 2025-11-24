# 🚀 AutoTrace

**AutoTrace** is a comprehensive inventory management platform built with Next.js, featuring Web3 integration, real-time inventory tracking, blockchain transactions, and AI-powered supply forecasting. Designed for manufacturers, suppliers, and distributors to manage their inventory, transactions, and supply chain operations efficiently.

## ✨ Features

### 🔐 Authentication & User Management
- **Multi-Authentication**: Email/password and Google OAuth login
- **Role-Based Access Control**: Admin, Manufacturer, Supplier, and Distributor roles
- **Web3 Wallet Integration**: Optional MetaMask wallet connection for blockchain features
- **JWT Token Authentication**: Secure session management

### 📦 Inventory Management
- **Real-Time Inventory Tracking**: Monitor stock levels across your supply chain
- **Multi-Role Support**: Different inventory views for Manufacturers, Suppliers, and Distributors
- **Stock Alerts**: Automatic notifications for low stock and reorder points
- **Admin Overview**: Comprehensive inventory management for administrators

### 🔄 Transaction Management
- **Supply & Demand Transactions**: Create and track inventory transactions
- **Real-Time Synchronization**: Instant updates across all connected clients and admin panels
- **Blockchain Integration**: Optional blockchain-based transaction recording
- **Transaction History**: Complete audit trail with search and filtering

### 📊 Analytics & Reporting
- **Stock History Charts**: Visualize inventory trends over time
- **Transaction Volume Analytics**: Track transaction patterns and volumes
- **Inventory Turnover Reports**: Performance metrics and analytics
- **Supply Forecasting**: AI-powered predictions for inventory needs

### 🚢 Shipment Tracking
- **Real-Time Tracking**: Monitor shipments across the supply chain
- **Status Updates**: Track shipment progress from origin to destination
- **Admin Visibility**: Comprehensive tracking dashboard for administrators

### 👥 Vendor Management
- **Vendor Directory**: Manage relationships with suppliers and partners
- **Vendor Profiles**: Store vendor information and wallet addresses
- **Transaction Linking**: Connect transactions to specific vendors

### 🔗 Blockchain Features
- **Smart Contract Integration**: Deploy and interact with inventory smart contracts
- **Etherscan Integration**: Direct links to view blockchain transactions
- **Transaction Hashing**: Immutable transaction records on the blockchain
- **Sepolia Testnet Support**: Test blockchain features on test networks

### 👨‍💼 Admin Features
- **User Management**: Create, edit, and manage user accounts
- **System-Wide Visibility**: View all transactions and inventory across the platform
- **Transaction Approval**: Approve or reject transactions as needed
- **Real-Time Dashboard**: Monitor all system activity in real-time

## 🚀 Quick Start (One-Command Installation)

### Prerequisites
- **Node.js** 18+ and npm
- **Git** (optional but recommended)
- **macOS**: Homebrew (will be installed if missing)
- **Linux/Windows**: MongoDB must be installed manually

### Installation

Simply run this command in your terminal:

```bash
curl -fsSL https://raw.githubusercontent.com/Eriol-0406/studio/main/install.sh | bash
```

Or if you've cloned the repository:

```bash
chmod +x install.sh && ./install.sh
```

This single command will:
- ✅ Check and install prerequisites (Node.js, npm, Homebrew)
- ✅ Install and start MongoDB (macOS)
- ✅ Install all npm dependencies
- ✅ Set executable permissions
- ✅ Create `.env.local` with secure configuration
- ✅ Generate secure JWT secrets

### Start the Application

After installation, start the development server:

```bash
npm run dev
```

Then open your browser to:
```
http://localhost:9002
```

## 📋 Manual Installation

If you prefer to install manually or the automated script doesn't work:

### 1. Install Prerequisites

#### macOS
```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node

# Verify installation
node --version && npm --version
```

#### Linux (Ubuntu/Debian)
```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

#### Windows
- Download and install Node.js from [nodejs.org](https://nodejs.org/)
- Download MongoDB from [mongodb.com](https://www.mongodb.com/try/download/community)

### 2. Setup MongoDB

#### macOS
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community
```

Or use the provided script:
```bash
./scripts/setup-mongodb.sh
```

### 3. Clone and Install

```bash
# Clone the repository
git clone https://github.com/Eriol-0406/studio.git
cd studio

# Install dependencies
npm install

# Set executable permissions (macOS/Linux)
chmod +x node_modules/.bin/*
```

### 4. Environment Configuration

Create a `.env.local` file in the project root:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/autotrace

# JWT Secret for authentication tokens
JWT_SECRET=your-secure-jwt-secret-here

# NextAuth Configuration
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=http://localhost:9002

# Google OAuth (Optional)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id-here

# Blockchain Configuration (Optional)
SEPOLIA_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
PRIVATE_KEY=your-private-key-here
```

Generate secure secrets:
```bash
# Generate JWT_SECRET
openssl rand -hex 32

# Generate NEXTAUTH_SECRET
openssl rand -hex 32
```

### 5. Start the Development Server

```bash
npm run dev
```

Visit `http://localhost:9002` in your browser.

## 🔑 Test Accounts

The following test accounts are available (create via MongoDB admin tool):

### Admin Account
- **Email**: `admin@example.com`
- **Password**: `admin123`
- **Access**: Full system administration

### Client Accounts
- **Supplier**: `supplier@example.com` / `password123`
- **Distributor**: `distributor@example.com` / `password123`
- **Manufacturer**: `manufacturer@example.com` / `password123`

### Create Test Users

Use the MongoDB admin tool:
```bash
npx tsx scripts/mongodb-admin.ts create-user --name "Admin User" --email "admin@example.com" --password "admin123" --role null --isAdmin true
```

## 📚 Available Scripts

```bash
# Development
npm run dev          # Start development server on port 9002
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript type checking

# Database Management
npx tsx scripts/mongodb-admin.ts list-users              # List all users
npx tsx scripts/mongodb-admin.ts create-user --name "John" --email "john@example.com" --password "pass123" --role "Supplier"
npx tsx scripts/mongodb-admin.ts update-user admin@example.com --isAdmin true
npx tsx scripts/mongodb-admin.ts reset-password user@example.com newpassword
npx tsx scripts/mongodb-admin.ts delete-user user@example.com
npx tsx scripts/mongodb-admin.ts stats                   # Database statistics
```

## 🏗️ Project Structure

```
autotrace/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # Authentication endpoints
│   │   │   ├── users/         # User management
│   │   │   ├── parts/         # Inventory parts
│   │   │   └── transactions/  # Transaction management
│   │   ├── admin/             # Admin pages
│   │   ├── dashboard/         # Dashboard page
│   │   ├── inventory/         # Inventory management
│   │   ├── onboarding/        # User onboarding flow
│   │   └── ...
│   ├── components/            # React components
│   │   ├── admin/            # Admin components
│   │   ├── auth/             # Authentication components
│   │   ├── inventory/        # Inventory components
│   │   └── ui/               # UI primitives
│   ├── context/              # React context providers
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utility libraries
│   │   ├── database.ts       # Database service
│   │   ├── mongodb.ts        # MongoDB connection
│   │   └── ...
│   └── types/                # TypeScript types
├── contracts/                # Smart contracts
├── scripts/                  # Utility scripts
├── docs/                     # Documentation
└── public/                   # Static assets
```

## 🔧 Configuration

### MongoDB

The application uses MongoDB for persistent data storage. The default connection string is:
```
mongodb://localhost:27017/autotrace
```

For production, use MongoDB Atlas:
1. Create account at [mongodb.com/atlas](https://cloud.mongodb.com/)
2. Create a cluster
3. Update `MONGODB_URI` in `.env.local`

### Google OAuth

To enable "Login with Google":
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add `NEXT_PUBLIC_GOOGLE_CLIENT_ID` to `.env.local`

### Blockchain Configuration

For Sepolia Testnet deployment:
1. Get Sepolia ETH from [sepoliafaucet.com](https://sepoliafaucet.com/)
2. Create Infura project at [infura.io](https://infura.io/)
3. Add `SEPOLIA_URL` and `PRIVATE_KEY` to `.env.local`

See `docs/sepolia-deployment-guide.md` for detailed instructions.

## 🌐 Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `MONGODB_URI` | Yes | MongoDB connection string | `mongodb://localhost:27017/autotrace` |
| `JWT_SECRET` | Yes | Secret for JWT token signing | Auto-generated in install script |
| `NEXTAUTH_SECRET` | Yes | Secret for NextAuth | Auto-generated in install script |
| `NEXTAUTH_URL` | No | Application URL | `http://localhost:9002` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | No | Google OAuth client ID | - |
| `SEPOLIA_URL` | No | Sepolia RPC endpoint | - |
| `PRIVATE_KEY` | No | Wallet private key for blockchain | - |

## 📖 Documentation

Additional documentation is available in the `docs/` directory:

- [`docs/blueprint.md`](docs/blueprint.md) - Project blueprint and design guidelines
- [`docs/mongodb-setup.md`](docs/mongodb-setup.md) - MongoDB setup guide
- [`docs/blockchain-integration-guide.md`](docs/blockchain-integration-guide.md) - Blockchain features
- [`docs/sepolia-deployment-guide.md`](docs/sepolia-deployment-guide.md) - Testnet deployment
- [`MONGODB_ADMIN_GUIDE.md`](MONGODB_ADMIN_GUIDE.md) - MongoDB admin commands

## 🛠️ Development

### Tech Stack

- **Framework**: Next.js 15.3 (App Router)
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT + Google OAuth
- **Blockchain**: Ethereum (Ethers.js), Hardhat
- **UI**: React 18, Tailwind CSS, Radix UI
- **Forms**: React Hook Form, Zod validation
- **State Management**: React Context API

### Key Features Implementation

- **Real-Time Sync**: Custom data service with change listeners
- **Role-Based Access**: Context-based state management
- **Web3 Integration**: MetaMask wallet connection
- **Smart Contracts**: Solidity contracts with Hardhat

## 🐛 Troubleshooting

### MongoDB Not Starting
```bash
# macOS
brew services list | grep mongodb
brew services restart mongodb/brew/mongodb-community

# Linux
sudo systemctl status mongod
sudo systemctl restart mongod
```

### Port Already in Use
```bash
# Change port in package.json
"dev": "next dev --turbopack -p 9003"
```

### Database Connection Issues
1. Verify MongoDB is running
2. Check `MONGODB_URI` in `.env.local`
3. Test connection: `mongosh mongodb://localhost:27017/autotrace`

### Permission Errors (macOS/Linux)
```bash
chmod +x node_modules/.bin/*
chmod +x install.sh
```

## 📝 License

This project is private and proprietary.

## 👤 Author

**Eriol**
- GitHub: [@Eriol-0406](https://github.com/Eriol-0406)

## 🤝 Support

For issues, questions, or contributions, please open an issue on GitHub or contact the maintainer.

---

**Built with ❤️ using Next.js, MongoDB, and Web3 technologies**
