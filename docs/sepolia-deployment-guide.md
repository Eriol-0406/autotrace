# 🚀 Sepolia Testnet Deployment Guide

## Prerequisites

### 1. Get Sepolia ETH (Free Testnet Tokens)
- Visit: https://sepoliafaucet.com/
- Enter your wallet address: `0xd083Fc4F2a8CB7Bc506A4Ce2c706A3F5218006d2`
- Request 0.1 Sepolia ETH

### 2. Add Sepolia Network to MetaMask
- Network Name: `Sepolia Test Network`
- RPC URL: `https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID`
- Chain ID: `11155111`
- Currency Symbol: `ETH`
- Block Explorer: `https://sepolia.etherscan.io`

### 3. Get Infura Project ID
- Visit: https://infura.io/
- Create free account
- Create new project
- Copy Project ID

### 4. Get Your Private Key
- Open MetaMask
- Go to Settings > Security & Privacy > Reveal Private Key
- Copy your private key (starts with 0x)

## Setup Environment Variables

Create a `.env` file in your project root:

```bash
# Sepolia Testnet Configuration
SEPOLIA_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
PRIVATE_KEY=YOUR_PRIVATE_KEY_HERE
```

Replace:
- `YOUR_INFURA_PROJECT_ID` with your Infura project ID
- `YOUR_PRIVATE_KEY_HERE` with your MetaMask private key

## Deploy to Sepolia

1. **Compile the contract:**
   ```bash
   npx hardhat compile
   ```

2. **Deploy to Sepolia:**
   ```bash
   npx hardhat run scripts/deploy-sepolia.ts --network sepolia
   ```

3. **Copy the contract address** from the deployment output

4. **Update your app** with the new contract address

## Update Your Application

After deployment, update `src/lib/smart-contract.ts`:

```typescript
// Replace this line:
const INVENTORY_CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000";

// With your deployed contract address:
const INVENTORY_CONTRACT_ADDRESS = "0xYOUR_DEPLOYED_CONTRACT_ADDRESS";
```

## Test the Integration

1. **Switch MetaMask to Sepolia network**
2. **Place an order** from your inventory page
3. **Check the blockchain page** for real transactions
4. **Click Etherscan links** to see real blockchain data

## Troubleshooting

- **"Insufficient funds"**: Get more Sepolia ETH from faucet
- **"Network not found"**: Make sure Sepolia is added to MetaMask
- **"Invalid private key"**: Check your private key format (should start with 0x)
- **"Infura error"**: Verify your Infura project ID is correct

