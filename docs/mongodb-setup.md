# MongoDB Setup Guide

## 1. Install MongoDB

### macOS (using Homebrew):
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community
```

### Windows:
Download and install from [MongoDB Community Server](https://www.mongodb.com/try/download/community)

### Linux (Ubuntu):
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

## 2. Environment Configuration

Create a `.env.local` file in your project root with:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/autotrace

# Next.js Configuration
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:9002
```

## 3. Database Models

The following models are created:

- **User**: Stores user accounts, roles, and wallet information
- **Part**: Stores inventory parts with quantities and specifications
- **Transaction**: Stores supply/demand transactions with blockchain data
- **Vendor**: Stores vendor information with wallet addresses
- **Shipment**: Stores shipment tracking information

## 4. API Endpoints

- `GET/POST/PUT /api/users` - User management
- `GET/POST/PUT/DELETE /api/parts` - Inventory parts
- `GET/POST/PUT /api/transactions` - Transaction history
- `GET/POST/PUT/DELETE /api/vendors` - Vendor management
- `GET/POST/PUT /api/shipments` - Shipment tracking

## 5. Data Migration

The app will automatically migrate from localStorage to MongoDB when:
1. User logs in for the first time
2. Data is saved to the database
3. localStorage data is preserved as backup

## 6. Testing the Setup

1. Start MongoDB: `brew services start mongodb/brew/mongodb-community`
2. Start your Next.js app: `npm run dev`
3. Login and create some data
4. Check MongoDB: `mongosh` then `use autotrace` and `show collections`

## 7. Production Setup

For production, use MongoDB Atlas:
1. Create account at [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a cluster
3. Get connection string
4. Update `MONGODB_URI` in production environment variables
