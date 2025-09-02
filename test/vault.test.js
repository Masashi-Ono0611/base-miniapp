const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Vault", function () {
  it("deposit and withdraw updates balances", async function () {
    const [owner, user] = await ethers.getSigners();

    const initialSupply = ethers.parseUnits("1000", 18);
    const Token = await ethers.getContractFactory("BonsaiCoinTest");
    const token = await Token.deploy(initialSupply);
    await token.waitForDeployment();

    const Vault = await ethers.getContractFactory("Vault");
    const vault = await Vault.deploy(await token.getAddress());
    await vault.waitForDeployment();

    // transfer some tokens to user
    await token.transfer(user.address, ethers.parseUnits("100", 18));

    // user approves vault
    const userToken = token.connect(user);
    await userToken.approve(await vault.getAddress(), ethers.parseUnits("50", 18));

    // deposit
    const userVault = vault.connect(user);
    await userVault.deposit(ethers.parseUnits("50", 18));
    expect(await userVault.balanceOf(user.address)).to.equal(ethers.parseUnits("50", 18));
    expect(await token.balanceOf(user.address)).to.equal(ethers.parseUnits("50", 18));

    // withdraw
    await userVault.withdraw(ethers.parseUnits("20", 18));
    expect(await userVault.balanceOf(user.address)).to.equal(ethers.parseUnits("30", 18));
    expect(await token.balanceOf(user.address)).to.equal(ethers.parseUnits("70", 18));
  });
});
