const hre = require("hardhat");

const USDC = {
  84532: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  8453: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
};

// Validate locally before obtaining a signer or making any RPC request.
function deploymentToken(chainId, env = process.env) {
  if (!USDC[chainId]) throw new Error(`Unsupported deployment chainId ${chainId}`);
  if (env.CONFIRM_DEPLOY !== "true") throw new Error("Set CONFIRM_DEPLOY=true only after deployment review");
  if (chainId === 8453 && env.ALLOW_MAINNET_DEPLOY !== "true") {
    throw new Error("Mainnet requires ALLOW_MAINNET_DEPLOY=true");
  }
  if (!/^0x[0-9a-fA-F]{64}$/.test(env.PRIVATE_KEY || "")) {
    throw new Error("A valid PRIVATE_KEY is required for deployment");
  }
  return USDC[chainId];
}

async function main() {
  const chainId = hre.network.config.chainId;
  const usdcAddress = deploymentToken(chainId);
  const liveChain = await hre.ethers.provider.getNetwork();
  if (liveChain.chainId !== BigInt(chainId)) throw new Error("RPC chain ID mismatch");
  if (await hre.ethers.provider.getCode(usdcAddress) === "0x") throw new Error("USDC has no code on configured RPC");

  console.log(`Deploying a NEW CommitmentVault on chainId ${chainId}; legacy vaults are unchanged.`);
  const vault = await hre.ethers.deployContract("CommitmentVault", [usdcAddress]);
  await vault.waitForDeployment();
  const address = await vault.getAddress();
  if (await hre.ethers.provider.getCode(address) === "0x") throw new Error("Deployed code not found");
  if ((await vault.usdc()).toLowerCase() !== usdcAddress.toLowerCase()) throw new Error("Token verification failed");
  console.log(`CommitmentVault deployed to: ${address}`);
  console.log(`Verify: npx hardhat verify --network ${hre.network.name} ${address} ${usdcAddress}`);
  console.log("Configure the frontend chain/vault address explicitly; this does not migrate old stakes.");
}

if (require.main === module) main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

module.exports = { deploymentToken };
