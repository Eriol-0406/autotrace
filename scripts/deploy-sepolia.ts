const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying InventoryContract to Sepolia Testnet...");

  // Get the contract factory
  const InventoryContract = await ethers.getContractFactory("InventoryContract");

  // Deploy the contract
  console.log("⏳ Deploying contract...");
  const inventoryContract = await InventoryContract.deploy();

  // Wait for deployment to complete
  await inventoryContract.waitForDeployment();

  // Get the deployed address
  const contractAddress = await inventoryContract.getAddress();

  console.log("✅ Contract deployed successfully!");
  console.log("📍 Contract Address:", contractAddress);
  console.log("🔗 View on Etherscan:", `https://sepolia.etherscan.io/address/${contractAddress}`);
  
  // Verify the deployment
  console.log("🔍 Verifying deployment...");
  const orderCount = await inventoryContract.getOrderCount();
  console.log("📊 Initial order count:", orderCount.toString());

  console.log("\n🎉 Deployment complete! Update your smart-contract.ts file with:");
  console.log(`const INVENTORY_CONTRACT_ADDRESS = "${contractAddress}";`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
