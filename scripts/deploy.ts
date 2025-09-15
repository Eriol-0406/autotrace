const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying InventoryContract...");

  const InventoryContract = await ethers.getContractFactory("InventoryContract");
  const inventoryContract = await InventoryContract.deploy();

  await inventoryContract.waitForDeployment();

  const address = await inventoryContract.getAddress();
  console.log("InventoryContract deployed to:", address);
  
  console.log("\n📋 Next Steps:");
  console.log("1. Copy the contract address above");
  console.log("2. Update INVENTORY_CONTRACT_ADDRESS in src/lib/smart-contract.ts");
  console.log("3. Test the integration in your app");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
