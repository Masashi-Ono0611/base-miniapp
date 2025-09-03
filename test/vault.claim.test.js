const { expect } = require("chai");
const { ethers } = require("hardhat");

// Helper
const toWei = (n) => ethers.parseUnits(n.toString(), 18);

describe("Vault claim()", function () {
  async function deployAll() {
    const [owner, user, other] = await ethers.getSigners();

    const initialSupply = toWei(100_000);
    const Token = await ethers.getContractFactory("BonsaiCoinTest");
    const token = await Token.deploy(initialSupply);
    await token.waitForDeployment();

    const Vault = await ethers.getContractFactory("Vault");
    const vault = await Vault.deploy(await token.getAddress());
    await vault.waitForDeployment();

    return { owner, user, other, token, vault };
  }

  it("allows user to claim up to 10,000 BCT cumulatively without deposit", async function () {
    const { owner, user, token, vault } = await deployAll();

    // fund vault with enough tokens
    await token.transfer(await vault.getAddress(), toWei(20_000));

    const userVault = vault.connect(user);

    // first claim 7,000
    await expect(userVault.claim(toWei(7_000)))
      .to.emit(vault, "Claimed")
      .withArgs(user.address, toWei(7_000));

    // second claim 3,000 (total 10,000)
    await userVault.claim(toWei(3_000));

    // further claim should fail due to per-user limit
    await expect(userVault.claim(toWei(1))).to.be.revertedWith("limit");

    // balances check
    expect(await token.balanceOf(user.address)).to.equal(toWei(10_000));
    expect(await vault.claimedOf(user.address)).to.equal(toWei(10_000));
    expect(await vault.remainingClaimable(user.address)).to.equal(0n);
  });

  it("reverts if vault has insufficient liquidity", async function () {
    const { user, vault } = await deployAll();
    const userVault = vault.connect(user);
    await expect(userVault.claim(toWei(1))).to.be.revertedWith("vault-empty");
  });

  it("deposit/withdraw remains intact and independent from claim cap", async function () {
    const { owner, user, token, vault } = await deployAll();

    // fund user and approve deposit
    await token.transfer(user.address, toWei(200));
    const userToken = token.connect(user);
    await userToken.approve(await vault.getAddress(), toWei(200));

    const userVault = vault.connect(user);

    await userVault.deposit(toWei(150));
    expect(await vault.balanceOf(user.address)).to.equal(toWei(150));

    await userVault.withdraw(toWei(50));
    expect(await vault.balanceOf(user.address)).to.equal(toWei(100));

    // fund vault for claim
    await token.transfer(await vault.getAddress(), toWei(11_000));

    // claim should still allow up to 10,000 regardless of deposits
    await userVault.claim(toWei(10_000));
    expect(await vault.remainingClaimable(user.address)).to.equal(0n);

    // user final wallets: 200 - 150 + 50 + 10,000 = 10,100
    expect(await token.balanceOf(user.address)).to.equal(toWei(10_100));
  });
});
