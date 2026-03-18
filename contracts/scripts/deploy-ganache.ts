import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts to Ganache with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // 部署 ArtNFT 合约
  console.log("\nDeploying ArtNFT...");
  const ArtNFT = await ethers.getContractFactory("ArtNFT");
  const artNFT = await ArtNFT.deploy();
  await artNFT.waitForDeployment();
  const nftAddress = await artNFT.getAddress();
  console.log("ArtNFT deployed to:", nftAddress);

  // 部署 Auction 合约
  console.log("\nDeploying Auction...");
  const Auction = await ethers.getContractFactory("Auction");
  const auction = await Auction.deploy(nftAddress);
  await auction.waitForDeployment();
  const auctionAddress = await auction.getAddress();
  console.log("Auction deployed to:", auctionAddress);

  // 授予 Auction 合约相关角色
  console.log("\nGranting roles...");
  const MINTER_ROLE = await artNFT.MINTER_ROLE();
  const AUCTION_HOUSE_ROLE = await artNFT.AUCTION_HOUSE_ROLE();
  
  const grantTx1 = await artNFT.grantRole(MINTER_ROLE, auctionAddress);
  await grantTx1.wait();
  console.log("Granted MINTER_ROLE to Auction contract");

  const grantTx2 = await artNFT.grantRole(AUCTION_HOUSE_ROLE, auctionAddress);
  await grantTx2.wait();
  console.log("Granted AUCTION_HOUSE_ROLE to Auction contract");

  console.log("\n=== Deployment Complete ===");
  console.log("ArtNFT Address:", nftAddress);
  console.log("Auction Address:", auctionAddress);
  console.log("\n====================================");
  console.log("请将以下地址填入 frontend/.env 文件:");
  console.log("====================================");
  console.log(`VITE_NFT_CONTRACT_ADDRESS=${nftAddress}`);
  console.log(`VITE_AUCTION_CONTRACT_ADDRESS=${auctionAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
