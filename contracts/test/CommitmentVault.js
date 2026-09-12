const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

const DAY = 86400;
const AMOUNT = 100_000_000n;
async function fixture() {
  const [alice, bob, penalty] = await ethers.getSigners();
  const token = await ethers.deployContract("MockUSDC");
  const vault = await ethers.deployContract("CommitmentVault", [await token.getAddress()]);
  await token.mint(alice.address, AMOUNT * 10n);
  await token.mint(bob.address, AMOUNT * 10n);
  return { alice, bob, penalty, token, vault };
}
async function created(days = 5) {
  const f = await loadFixture(fixture);
  await f.token.approve(await f.vault.getAddress(), AMOUNT);
  await f.vault.createCommitment(AMOUNT, days, f.penalty.address, 80);
  const c = await f.vault.getCommitment(0);
  return { ...f, start: Number(c.startTime), end: Number(c.startTime) + days * DAY };
}
async function record(vault, count) {
  for (let i = 0; i < count; i++) {
    if (i) await time.setNextBlockTimestamp(Number((await vault.getCommitment(0)).lastCheckinTime) + DAY);
    await vault.checkin(0);
  }
}

describe("CommitmentVault local lifecycle", function () {
  it("exposes no administrator or arbitrary withdrawal ABI", async function () {
    const { vault } = await loadFixture(fixture);
    for (const name of ["owner", "transferOwnership", "renounceOwnership", "emergencyWithdraw"]) {
      expect(vault.interface.getFunction(name)).to.equal(null);
    }
  });
  it("rejects a zero token address", async function () {
    await expect(ethers.deployContract("CommitmentVault", [ethers.ZeroAddress])).to.be.revertedWith("Invalid USDC address");
  });
  it("rejects a token address without code", async function () {
    const { alice } = await loadFixture(fixture);
    await expect(ethers.deployContract("CommitmentVault", [alice.address])).to.be.revertedWith("Invalid USDC address");
  });
  it("publishes the fixed duration and threshold policy", async function () {
    const { vault } = await loadFixture(fixture);
    expect(await vault.MAX_DURATION_DAYS()).to.equal(365);
    expect(await vault.REQUIRED_THRESHOLD()).to.equal(80);
    expect(await vault.CHECKIN_COOLDOWN()).to.equal(DAY);
  });
  it("creates with exact stake, tuple layout and unchanged event", async function () {
    const { alice, penalty, token, vault } = await loadFixture(fixture);
    await token.approve(await vault.getAddress(), AMOUNT);
    const tx = await vault.createCommitment(AMOUNT, 5, penalty.address, 80);
    await expect(tx).to.emit(vault, "CommitmentCreated").withArgs(0, alice.address, AMOUNT, 5, penalty.address);
    const block = await ethers.provider.getBlock((await tx.wait()).blockNumber);
    expect(Array.from(await vault.getCommitment(0))).to.deep.equal([
      alice.address, AMOUNT, 5n, 0n, 80n, penalty.address, BigInt(block.timestamp), 0n, false,
    ]);
    expect(await token.balanceOf(await vault.getAddress())).to.equal(AMOUNT);
    expect(await token.allowance(alice.address, await vault.getAddress())).to.equal(0);
    expect(await vault.nextCommitmentId()).to.equal(1);
  });
  it("requires approval without creating a record", async function () {
    const { penalty, token, vault } = await loadFixture(fixture);
    await expect(vault.createCommitment(AMOUNT, 5, penalty.address, 80)).to.be.revertedWithCustomError(token, "ERC20InsufficientAllowance");
    expect(await vault.nextCommitmentId()).to.equal(0);
  });
  it("rejects insufficient approved balance", async function () {
    const { penalty, token, vault } = await loadFixture(fixture);
    await token.approve(await vault.getAddress(), AMOUNT * 11n);
    await expect(vault.createCommitment(AMOUNT * 11n, 5, penalty.address, 80)).to.be.revertedWithCustomError(token, "ERC20InsufficientBalance");
    expect(await vault.nextCommitmentId()).to.equal(0);
  });
  for (const days of [1, 365]) {
    it(`accepts duration boundary ${days}`, async function () {
      const { vault } = await created(days);
      expect((await vault.getCommitment(0)).durationDays).to.equal(days);
    });
  }
  for (const days of [0, 366, ethers.MaxUint256]) {
    it(`rejects unsupported duration ${days}`, async function () {
      const { vault, penalty } = await loadFixture(fixture);
      await expect(vault.createCommitment(AMOUNT, days, penalty.address, 80)).to.be.revertedWith("Duration must be 1-365 days");
    });
  }
  for (const threshold of [0, 1, 79, 81, 100, 101]) {
    it(`rejects unsupported threshold ${threshold} before approval`, async function () {
      const { vault, penalty } = await loadFixture(fixture);
      await expect(vault.createCommitment(AMOUNT, 5, penalty.address, threshold)).to.be.revertedWith("Threshold must be 80");
    });
  }
  it("rejects zero stake", async function () {
    const { vault, penalty } = await loadFixture(fixture);
    await expect(vault.createCommitment(0, 5, penalty.address, 80)).to.be.revertedWith("Amount must be > 0");
  });
  it("rejects zero penalty recipient", async function () {
    const { vault } = await loadFixture(fixture);
    await expect(vault.createCommitment(AMOUNT, 5, ethers.ZeroAddress, 80)).to.be.revertedWith("Invalid penalty address");
  });
  it("indexes independent users and sequential IDs", async function () {
    const { vault, token, bob, alice, penalty } = await created();
    await token.connect(bob).approve(await vault.getAddress(), AMOUNT);
    await vault.connect(bob).createCommitment(AMOUNT, 1, penalty.address, 80);
    expect(await vault.getUserCommitments(alice.address)).to.deep.equal([0n]);
    expect(await vault.getUserCommitments(bob.address)).to.deep.equal([1n]);
    expect(await vault.getUserCommitments(penalty.address)).to.deep.equal([]);
  });
  for (const method of ["getCommitment", "checkin", "finalize"]) {
    it(`${method} requires an existing commitment`, async function () {
      const { vault } = await loadFixture(fixture);
      await expect(vault[method](0)).to.be.revertedWith("Commitment not found");
    });
  }
  it("only the commitment owner can check in", async function () {
    const { vault, bob } = await created();
    await expect(vault.connect(bob).checkin(0)).to.be.revertedWith("Not your commitment");
  });
  it("permits an immediate first checkin with the unchanged indexed event", async function () {
    const { vault, alice } = await created();
    await expect(vault.checkin(0)).to.emit(vault, "CheckinRecorded").withArgs(0, alice.address, 1);
    expect((await vault.getCommitment(0)).lastCheckinTime).to.equal(await time.latest());
  });
  it("rejects a second checkin before 24 hours", async function () {
    const { vault } = await created();
    await vault.checkin(0);
    await time.setNextBlockTimestamp((await time.latest()) + DAY - 1);
    await expect(vault.checkin(0)).to.be.revertedWith("Wait 24h between checkins");
  });
  it("accepts a checkin at exactly 24 hours", async function () {
    const { vault } = await created();
    await record(vault, 2);
    expect((await vault.getCommitment(0)).checkins).to.equal(2);
  });
  it("accepts the first checkin one second before deadline", async function () {
    const { vault, end } = await created(1);
    await time.setNextBlockTimestamp(end - 1);
    await expect(vault.checkin(0)).to.emit(vault, "CheckinRecorded");
  });
  for (const offset of [0, 1, DAY]) {
    it(`rejects checkin at deadline plus ${offset} seconds`, async function () {
      const { vault, end } = await created(1);
      await time.setNextBlockTimestamp(end + offset);
      await expect(vault.checkin(0)).to.be.revertedWith("Commitment has ended");
    });
  }
  it("keeps the stake locked after all checkins until explicit settlement", async function () {
    const { vault, token } = await created(1);
    await vault.checkin(0);
    expect((await vault.getCommitment(0)).finalized).to.equal(false);
    expect(await token.balanceOf(await vault.getAddress())).to.equal(AMOUNT);
    await expect(vault.checkin(0)).to.be.revertedWith("All days completed");
    await expect(vault.finalize(0)).to.be.revertedWith("Duration not yet elapsed");
  });
  it("rejects finalization one second before deadline", async function () {
    const { vault, end } = await created();
    await time.setNextBlockTimestamp(end - 1);
    await expect(vault.finalize(0)).to.be.revertedWith("Duration not yet elapsed");
  });
  for (const [days, count, success] of [[5, 4, true], [5, 3, false], [3, 2, false], [3, 3, true], [1, 0, false], [1, 1, true]]) {
    it(`settles ${count}/${days} checkins to ${success ? "owner" : "penalty"} at deadline, callable by anyone`, async function () {
      const { vault, token, alice, bob, penalty, end } = await created(days);
      await record(vault, count);
      await time.setNextBlockTimestamp(end);
      const recipient = success ? alice.address : penalty.address;
      const tx = vault.connect(bob).finalize(0);
      await expect(tx).to.changeTokenBalances(token, [vault, recipient], [-AMOUNT, AMOUNT]);
      await expect(tx).to.emit(vault, "CommitmentFinalized").withArgs(0, success, recipient, AMOUNT);
      expect((await vault.getCommitment(0)).finalized).to.equal(true);
      expect(await vault.getUserCommitments(alice.address)).to.deep.equal([0n]);
    });
  }
  it("retains a pending commitment when the token declines settlement and allows retry", async function () {
    const { vault, token, end } = await created();
    await token.setTransfersEnabled(false);
    await time.setNextBlockTimestamp(end);
    await expect(vault.finalize(0)).to.be.revertedWithCustomError(vault, "SafeERC20FailedOperation").withArgs(await token.getAddress());
    expect((await vault.getCommitment(0)).finalized).to.equal(false);
    expect(await token.balanceOf(await vault.getAddress())).to.equal(AMOUNT);
    await token.setTransfersEnabled(true);
    await expect(vault.finalize(0)).to.emit(vault, "CommitmentFinalized");
  });
  it("settling one record leaves the other record's stake intact", async function () {
    const { vault, token, penalty, end } = await created(1);
    await token.approve(await vault.getAddress(), AMOUNT);
    await vault.createCommitment(AMOUNT, 365, penalty.address, 80);
    await time.setNextBlockTimestamp(end);
    await vault.finalize(0);
    expect(await token.balanceOf(await vault.getAddress())).to.equal(AMOUNT);
    expect((await vault.getCommitment(1)).finalized).to.equal(false);
  });
  it("rejects repeat settlement and checkin on finalized records", async function () {
    const { vault, end } = await created();
    await time.setNextBlockTimestamp(end);
    await vault.finalize(0);
    await expect(vault.finalize(0)).to.be.revertedWith("Already finalized");
    await expect(vault.checkin(0)).to.be.revertedWith("Already finalized");
  });
});
