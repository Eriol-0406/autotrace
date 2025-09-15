# 🗄️ MongoDB Integration for AutoTrace

## Overview

Your AutoTrace project now has **full MongoDB integration** for persistent data storage! This means all your inventory data, transactions, vendors, and shipments will be saved to a database and persist between sessions.

## 🚀 Quick Setup

### 1. Install and Start MongoDB
```bash
# Run the setup script
./scripts/setup-mongodb.sh
```

### 2. Create Environment File
Create `.env.local` in your project root:
```env
MONGODB_URI=mongodb://localhost:27017/autotrace
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:9002
```

### 3. Restart Your Application
```bash
npm run dev
```

## 📊 What's Stored in MongoDB

### Database Collections:
- **`users`** - User accounts, roles, wallet info
- **`parts`** - Inventory parts with quantities
- **`transactions`** - Supply/demand transactions with blockchain data
- **`vendors`** - Vendor information with wallet addresses
- **`shipments`** - Shipment tracking data

### Data Flow:
```
User Action → Frontend → API Route → MongoDB → Response
     ↓           ↓          ↓          ↓         ↓
  Login     →  State   →  /api/*   →  DB    →  Update UI
```

## 🔄 Data Migration

The system automatically handles migration from localStorage to MongoDB:

1. **First Login**: User is created in database
2. **Data Sync**: Existing localStorage data is synced to database
3. **Future Sessions**: Data loads from database, localStorage as backup
4. **Real-time Updates**: Changes sync to database automatically

## 🛠️ API Endpoints

### Users
- `GET /api/users?email=user@example.com` - Get user by email
- `POST /api/users` - Create new user
- `PUT /api/users` - Update user info

### Parts
- `GET /api/parts?userId=123` - Get user's parts
- `POST /api/parts` - Create new part
- `PUT /api/parts` - Update part
- `DELETE /api/parts?id=123` - Delete part

### Transactions
- `GET /api/transactions?userId=123` - Get user's transactions
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions` - Update transaction

### Vendors
- `GET /api/vendors?userId=123` - Get user's vendors
- `POST /api/vendors` - Create vendor
- `PUT /api/vendors` - Update vendor
- `DELETE /api/vendors?id=123` - Delete vendor

### Shipments
- `GET /api/shipments?userId=123` - Get user's shipments
- `POST /api/shipments` - Create shipment
- `PUT /api/shipments` - Update shipment

## 🔧 Database Models

### User Model
```typescript
{
  email: string;
  name: string;
  role: 'Manufacturer' | 'Supplier' | 'Distributor';
  isAdmin: boolean;
  walletAddress?: string;
  walletConnected: boolean;
}
```

### Part Model
```typescript
{
  userId: ObjectId;
  id: string;
  name: string;
  quantity: number;
  reorderPoint: number;
  maxStock: number;
  type: 'raw' | 'wip' | 'finished';
  source?: string;
  leadTime?: number;
  backorders?: number;
}
```

### Transaction Model
```typescript
{
  userId: ObjectId;
  id: string;
  partName: string;
  type: 'supply' | 'demand';
  quantity: number;
  date: string;
  from: string;
  to: string;
  role: 'Manufacturer' | 'Supplier' | 'Distributor';
  blockchainOrderId?: string;
  blockchainTxHash?: string;
  etherscanUrl?: string;
}
```

## 🎯 Key Features

### ✅ Automatic Data Persistence
- All inventory changes saved to database
- Real-time sync with 2-second debounce
- LocalStorage as backup/offline support

### ✅ User Management
- Automatic user creation on first login
- Google OAuth integration with database
- Role-based data filtering

### ✅ Blockchain Integration
- Transaction hashes stored in database
- Etherscan links preserved
- Smart contract order IDs tracked

### ✅ Charts & Analytics
- All charts now use real database data
- Historical data preserved
- Performance metrics calculated from actual data

## 🚨 Troubleshooting

### MongoDB Not Starting
```bash
# Check status
brew services list | grep mongodb

# Restart service
brew services restart mongodb/brew/mongodb-community

# Check logs
tail -f /opt/homebrew/var/log/mongodb/mongo.log
```

### Connection Issues
```bash
# Test connection
mongosh mongodb://localhost:27017/autotrace

# Check if database exists
use autotrace
show collections
```

### Data Not Syncing
1. Check browser console for errors
2. Verify `.env.local` file exists
3. Check MongoDB is running
4. Clear browser localStorage and re-login

## 📈 Performance Benefits

- **Faster Load Times**: Data loads from database instead of localStorage
- **Better Scalability**: Multiple users can use the system
- **Data Integrity**: ACID transactions ensure data consistency
- **Backup & Recovery**: Database can be backed up and restored
- **Analytics**: Rich querying capabilities for business intelligence

## 🔒 Security

- User data is isolated by `userId`
- No cross-user data access
- Input validation on all API endpoints
- MongoDB authentication (when configured)

## 🌐 Production Deployment

For production, use **MongoDB Atlas**:

1. Create account at [mongodb.com/atlas](https://cloud.mongodb.com/)
2. Create a cluster
3. Get connection string
4. Update `MONGODB_URI` in production environment
5. Set up database user with appropriate permissions

## 🎉 What's Next

Your AutoTrace application now has enterprise-grade data persistence! Users can:
- Login and have their data automatically saved
- Access their inventory from any device
- Have their blockchain transactions tracked
- Generate accurate reports from real data
- Collaborate with multiple users (admin mode)

The system maintains backward compatibility with localStorage while providing the benefits of a proper database backend.
