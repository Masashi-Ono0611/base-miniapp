/* eslint-disable no-console */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const hre = require("hardhat");
const { ethers } = hre;
const { NonceManager } = require("ethers");

async function main() {
  const networkName = hre.network.name;
  const chainId = hre.network.config.chainId;

  if (!process.env.PRIVATE_KEY) throw new Error("Missing PRIVATE_KEY in .env");
  if (networkName === "base_sepolia" && !process.env.BASE_SEPOLIA_RPC_URL) {
    throw new Error("Missing BASE_SEPOLIA_RPC_URL for base_sepolia");
  }

  const [baseSigner] = await ethers.getSigners();
  const deployer = new NonceManager(baseSigner);
  const deployerAddress = await deployer.getAddress();
  const bal = await ethers.provider.getBalance(deployerAddress);
  console.log(`Deployer: ${deployerAddress}`);
  console.log(`Network: ${networkName} (chainId=${chainId})`);
  console.log(`Balance: ${ethers.formatEther(bal)} ETH`);

  // 1,000,000 BCT with 18 decimals
  const initialSupply = ethers.parseUnits("1000000", 18);

  const Token = await ethers.getContractFactory("BonsaiCoinTest", deployer);
  const token = await Token.deploy(initialSupply);
  await token.waitForDeployment();
  console.log("BonsaiCoinTest deployed:", await token.getAddress());

  const Vault = await ethers.getContractFactory("Vault", deployer);
  const vault = await Vault.deploy(await token.getAddress());
  await vault.waitForDeployment();
  console.log("Vault deployed:", await vault.getAddress());

  const outDir = path.join(__dirname, "..", "deployments");
  fs.mkdirSync(outDir, { recursive: true });
  const outfile = path.join(outDir, `${networkName}.json`);
  const out = {
    network: networkName,
    chainId,
    token: await token.getAddress(),
    vault: await vault.getAddress(),
  };
  fs.writeFileSync(outfile, JSON.stringify(out, null, 2));
  console.log(`Saved addresses to ${outfile}`);

  console.log("\nENV to copy:");
  console.log(`NEXT_PUBLIC_TOKEN_ADDRESS=${await token.getAddress()}`);
  console.log(`NEXT_PUBLIC_VAULT_ADDRESS=${await vault.getAddress()}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
