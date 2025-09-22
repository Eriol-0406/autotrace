import { ethers } from "hardhat";

async function main() {
  console.log("Testing InventoryContract...");

  // Get the deployed contract
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const InventoryContract = await ethers.getContractFactory("InventoryContract");
  const contract = InventoryContract.attach(contractAddress);

  // Test creating an order
  const [owner, buyer, seller] = await ethers.getSigners();
  
  console.log("Creating test order...");
  const tx = await (contract as any).connect(buyer).createOrder(
    seller.address,
    "Test Part",
    100
  );
  
  const receipt = await tx.wait();
  console.log("Order created! Transaction hash:", receipt.hash);
  
  // Get order count
  const orderCount = await (contract as any).getOrderCount();
  console.log("Total orders:", orderCount.toString());
  
  // Get the first order
  const order = await (contract as any).getOrder(1);
  console.log("First order details:");
  console.log("- Order ID:", order.orderId.toString());
  console.log("- Buyer:", order.buyer);
  console.log("- Seller:", order.seller);
  console.log("- Part Name:", order.partName);
  console.log("- Quantity:", order.quantity.toString());
  console.log("- Completed:", order.completed);
  
  console.log("\n✅ Smart contract test completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
