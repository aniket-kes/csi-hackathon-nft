
const hre = require("hardhat");

async function main() {
  // const lockedAmount = hre.ethers.utils.parseEther("0.001");

  const NFTMarketPlace = await hre.ethers.getContractFactory("NFTMarketPlace");
  const nftmarketPlace = await NFTMarketPlace.deploy();

  await nftmarketPlace.deployed();

  console.log(`NFTmarketPlace deployed to:", ${nftmarketPlace.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
