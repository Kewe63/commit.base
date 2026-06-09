const hre = require("hardhat");

// USDC addresses
const USDC = {
  84532: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // Base Sepolia
  8453:  "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Base Mainnet
};

async function main() {
  const chainId = hre.network.config.chainId;
  const usdcAddress = USDC[chainId];

  if (!usdcAddress) {
    throw new Error(`No USDC address configured for chainId ${chainId}`);
  }

  console.log(`Deploying CommitmentVault on chainId ${chainId}...`);
  console.log(`USDC address: ${usdcAddress}`);

  const CommitmentVault = await hre.ethers.getContractFactory("CommitmentVault");
  const vault = await CommitmentVault.deploy(usdcAddress);
  await vault.waitForDeployment();

  const address = await vault.getAddress();
  console.log(`CommitmentVault deployed to: ${address}`);
  console.log(`\nVerify with:`);
  console.log(`npx hardhat verify --network ${hre.network.name} ${address} ${usdcAddress}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
