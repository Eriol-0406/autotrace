# Smart Contract Deployment Guide

## Overview
This guide will help you deploy the InventoryContract to a blockchain network and integrate it with your application.

## Prerequisites
- Node.js and npm installed
- MetaMask or similar Web3 wallet
- Some testnet ETH (for gas fees)

## Step 1: Install Hardhat (Smart Contract Development Framework)

```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npx hardhat init
```

## Step 2: Configure Hardhat

Create `hardhat.config.js`:

```javascript
require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.19",
  networks: {
    goerli: {
      url: "https://goerli.infura.io/v3/YOUR_INFURA_PROJECT_ID",
      accounts: ["YOUR_PRIVATE_KEY"]
    },
    sepolia: {
      url: "https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID", 
      accounts: ["YOUR_PRIVATE_KEY"]
    }
  }
};
```

## Step 3: Deploy the Contract

1. Copy `contracts/InventoryContract.sol` to your Hardhat project
2. Create a deployment script in `scripts/deploy.js`:

```javascript
const hre = require("hardhat");

async function main() {
  const InventoryContract = await hre.ethers.getContractFactory("InventoryContract");
  const inventoryContract = await InventoryContract.deploy();

  await inventoryContract.deployed();

  console.log("InventoryContract deployed to:", inventoryContract.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

3. Deploy to testnet:
```bash
npx hardhat run scripts/deploy.js --network goerli
```

## Step 4: Update Contract Address

After deployment, update the contract address in `src/lib/smart-contract.ts`:

```typescript
const INVENTORY_CONTRACT_ADDRESS = "0xYOUR_DEPLOYED_CONTRACT_ADDRESS";
```

## Step 5: Test the Integration

1. Connect your Web3 wallet to the same network you deployed to
2. Place an order through the inventory system
3. Check the transaction on Etherscan/Polygonscan

## Network Support

The contract supports multiple networks:
- **Ethereum Mainnet**: Production use
- **Goerli Testnet**: Testing (deprecated, use Sepolia)
- **Sepolia Testnet**: Testing
- **Polygon Mainnet**: Lower gas fees
- **Mumbai Testnet**: Polygon testing

## Gas Optimization

The contract is optimized for minimal gas usage:
- Simple struct storage
- Efficient event logging
- No complex computations

## Security Considerations

- Only deploy to testnets for development
- Use proper access controls in production
- Consider upgrading to a proxy pattern for future updates
- Implement proper error handling

## Troubleshooting

### Common Issues:

1. **"Contract not initialized"**: Ensure wallet is connected
2. **"Insufficient funds"**: Add more ETH to your wallet
3. **"Transaction failed"**: Check gas limit and network congestion
4. **"Invalid vendor address"**: Update vendor wallet addresses in the service

### Getting Testnet ETH:

- **Goerli**: https://goerlifaucet.com/
- **Sepolia**: https://sepoliafaucet.com/
- **Mumbai**: https://faucet.polygon.technology/

## Next Steps

1. Deploy to your preferred testnet
2. Update the contract address in the code
3. Test the full ordering flow
4. Consider deploying to mainnet for production use
