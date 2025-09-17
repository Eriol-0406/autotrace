# AutoTrace - Blockchain Inventory Management System

A comprehensive B2B inventory management system built with Next.js, MongoDB, and Ethereum smart contracts. AutoTrace enables manufacturers, suppliers, and distributors to manage inventory transactions, vendor relationships, and blockchain-based order tracking.

## 🚀 Features

### Client-Side Modules
- **Dashboard**: Real-time inventory overview with role-specific metrics
- **Inventory Management**: Demand/Supply transactions with blockchain integration
- **Vendor Management**: View vendors, create orders, and rate performance
- **Tracking**: Monitor shipments and blockchain transaction status
- **Reports**: Generate stock, transaction, and forecast reports

### Admin-Side Modules
- **System Dashboard**: System-wide metrics and activity monitoring
- **Transaction Approval**: Approve/reject client transactions
- **Vendor Management**: Add/edit/remove vendors across the network
- **Entity Management**: Manage blockchain-registered entities
- **System Reports**: Comprehensive system-wide analytics

### Blockchain Integration
- **Smart Contract Integration**: Ethereum-based order management
- **Wallet Connection**: MetaMask and Web3 wallet support
- **Transaction Tracking**: Real-time blockchain transaction monitoring
- **Vendor Registration**: On-chain entity registration and management

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, MongoDB, Mongoose
- **Blockchain**: Ethereum, Solidity, Ethers.js, Hardhat
- **UI Components**: Radix UI, shadcn/ui
- **Authentication**: Google OAuth, Email/Password
- **Database**: MongoDB Atlas

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB Atlas account
- MetaMask or Web3 wallet
- Git

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd autotrace
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create `.env.local` file with:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=http://localhost:3000
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   Open [http://localhost:3000](http://localhost:3000) in your browser

## 🏗 Smart Contract Deployment

1. **Install Hardhat dependencies**
   ```bash
   npm install --save-dev hardhat @nomiclabs/hardhat-ethers ethers
   ```

2. **Deploy contracts**
   ```bash
   npx hardhat compile
   npx hardhat run scripts/deploy.js --network <network>
   ```

## 👥 User Roles

- **Manufacturer**: Manages raw materials and finished goods
- **Supplier**: Handles component sourcing and distribution
- **Distributor**: Manages customer-facing inventory
- **Admin**: System oversight and vendor management

## 📱 Usage

1. **Sign up/Login**: Create account or use Google OAuth
2. **Role Selection**: Choose your business role (Manufacturer/Supplier/Distributor)
3. **Wallet Connection**: Connect MetaMask or Web3 wallet
4. **Inventory Management**: Create demand/supply transactions
5. **Vendor Management**: View vendors and create orders
6. **Blockchain Integration**: Track orders on Ethereum blockchain

## 🔧 Development

### Project Structure
```
src/
├── app/                 # Next.js app router pages
├── components/          # React components
├── lib/                 # Utilities and services
├── context/             # React context providers
├── hooks/               # Custom React hooks
└── types/               # TypeScript type definitions
```

### Key Files
- `src/lib/smart-contract.ts` - Blockchain integration
- `src/lib/database.ts` - MongoDB operations
- `src/context/enhanced-app-state-provider.tsx` - Global state management
- `contracts/InventoryContract.sol` - Smart contract

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in this repository
- Check the documentation in `/docs`
- Review the smart contract code in `/contracts`

---

Built with ❤️ for B2B inventory management