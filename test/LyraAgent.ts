import { expect } from "chai";
import { network } from "hardhat";

const { ethers, networkHelpers } = await network.create();

const ONE_HOUR = 3600n;
const PROFIT_BPS = 1000n;
const DEPOSIT = 1_000_000_000n; // 1000 USDC con 6 decimales

describe("LyraAgent", function () {
  async function deployFixture() {
    const [owner, other] = await ethers.getSigners();

    const usdc = await ethers.deployContract("MockERC20", ["USD Coin", "USDC", 6]);
    const router = await ethers.deployContract("MockSwapRouter", [await usdc.getAddress(), PROFIT_BPS]);
    await usdc.mint(await router.getAddress(), ethers.parseUnits("1000000", 6));

    const agent = await ethers.deployContract("LyraAgent", [await usdc.getAddress(), await router.getAddress()]);

    return { owner, other, usdc, router, agent };
  }

  async function fundAndApprove(
    usdc: Awaited<ReturnType<typeof deployFixture>>["usdc"],
    owner: Awaited<ReturnType<typeof deployFixture>>["owner"],
    agentAddress: string,
    amount: bigint,
  ) {
    await usdc.mint(owner.address, amount);
    await usdc.connect(owner).approve(agentAddress, amount);
  }

  async function passCooldown(lastExecutionTime: bigint) {
    await networkHelpers.time.increaseTo(lastExecutionTime + ONE_HOUR + 1n);
  }

  it("el deposit falla sin allowance y si no es el owner", async function () {
    const { owner, other, usdc, agent } = await networkHelpers.loadFixture(deployFixture);
    const agentAddress = await agent.getAddress();

    await usdc.mint(owner.address, DEPOSIT);
    await expect(agent.depositUSDC(DEPOSIT)).to.be.revertedWith("MockERC20: insufficient allowance");
    await expect(agent.depositUSDC(0)).to.be.revertedWith("LyraAgent: zero amount");

    await usdc.mint(other.address, DEPOSIT);
    await usdc.connect(other).approve(agentAddress, DEPOSIT);
    await expect(agent.connect(other).depositUSDC(DEPOSIT)).to.be.revertedWith("LyraAgent: not owner");
  });

  it("el deposit mueve USDC al contrato", async function () {
    const { owner, usdc, agent } = await networkHelpers.loadFixture(deployFixture);
    const agentAddress = await agent.getAddress();

    await fundAndApprove(usdc, owner, agentAddress, DEPOSIT);

    await expect(agent.depositUSDC(DEPOSIT))
      .to.emit(agent, "Deposit")
      .withArgs(owner.address, DEPOSIT);

    expect(await usdc.balanceOf(agentAddress)).to.equal(DEPOSIT);
    expect(await usdc.balanceOf(owner.address)).to.equal(0n);
    expect(await agent.owner()).to.equal(owner.address);
  });

  it("checkAndExecute revierte sin saldo aunque haya pasado el cooldown", async function () {
    const { agent } = await networkHelpers.loadFixture(deployFixture);
    await passCooldown(await agent.lastExecutionTime());
    expect(await agent.canExecute()).to.equal(false);
    await expect(agent.checkAndExecute()).to.be.revertedWith("LyraAgent: no balance");
  });

  it("checkAndExecute revierte si es demasiado pronto", async function () {
    const { owner, usdc, agent } = await networkHelpers.loadFixture(deployFixture);
    const agentAddress = await agent.getAddress();
    await fundAndApprove(usdc, owner, agentAddress, DEPOSIT);
    await agent.depositUSDC(DEPOSIT);

    expect(await agent.canExecute()).to.equal(false);
    const [canExec] = await agent.checker();
    expect(canExec).to.equal(false);
    await expect(agent.connect(owner).checkAndExecute()).to.be.revertedWith("LyraAgent: cooldown");
  });

  it("checkAndExecute hace el swap simulado, aumenta el saldo y emite TradeExecuted", async function () {
    const { owner, usdc, agent } = await networkHelpers.loadFixture(deployFixture);
    const agentAddress = await agent.getAddress();
    await fundAndApprove(usdc, owner, agentAddress, DEPOSIT);
    await agent.depositUSDC(DEPOSIT);

    await passCooldown(await agent.lastExecutionTime());
    expect(await agent.canExecute()).to.equal(true);

    const amountOut = DEPOSIT + (DEPOSIT * PROFIT_BPS) / 10_000n;
    const tx = await agent.checkAndExecute();
    const receipt = await tx.wait();
    const block = await ethers.provider.getBlock(receipt!.blockNumber);

    await expect(tx).to.emit(agent, "Swap").withArgs(DEPOSIT, amountOut);
    await expect(tx)
      .to.emit(agent, "TradeExecuted")
      .withArgs("BUY", "ETH", BigInt(block!.timestamp), DEPOSIT, amountOut);

    expect(await usdc.balanceOf(agentAddress)).to.equal(amountOut);
    expect(amountOut).to.be.greaterThan(DEPOSIT);
    expect(await agent.lastExecutionTime()).to.equal(BigInt(block!.timestamp));
  });

  it("un segundo checkAndExecute antes de 1 hora revierte y funciona tras avanzar el tiempo", async function () {
    const { owner, usdc, agent } = await networkHelpers.loadFixture(deployFixture);
    const agentAddress = await agent.getAddress();
    await fundAndApprove(usdc, owner, agentAddress, DEPOSIT);
    await agent.depositUSDC(DEPOSIT);

    await passCooldown(await agent.lastExecutionTime());
    await agent.checkAndExecute();

    const balanceAfterFirst = await usdc.balanceOf(agentAddress);
    await expect(agent.checkAndExecute()).to.be.revertedWith("LyraAgent: cooldown");
    expect(await usdc.balanceOf(agentAddress)).to.equal(balanceAfterFirst);

    await passCooldown(await agent.lastExecutionTime());
    const amountOut = balanceAfterFirst + (balanceAfterFirst * PROFIT_BPS) / 10_000n;
    await agent.checkAndExecute();
    expect(await usdc.balanceOf(agentAddress)).to.equal(amountOut);
  });

  it("withdraw solo lo hace el owner y no por encima del balance", async function () {
    const { owner, other, usdc, agent } = await networkHelpers.loadFixture(deployFixture);
    const agentAddress = await agent.getAddress();
    await fundAndApprove(usdc, owner, agentAddress, DEPOSIT);
    await agent.depositUSDC(DEPOSIT);

    await passCooldown(await agent.lastExecutionTime());
    await agent.checkAndExecute();

    const balance = await usdc.balanceOf(agentAddress);
    await expect(agent.withdrawProfits(0)).to.be.revertedWith("LyraAgent: zero amount");
    await expect(agent.connect(other).withdrawProfits(balance)).to.be.revertedWith("LyraAgent: not owner");
    await expect(agent.withdrawProfits(balance + 1n)).to.be.revertedWith("LyraAgent: insufficient balance");
    expect(await usdc.balanceOf(agentAddress)).to.equal(balance);

    await expect(agent.withdrawProfits(balance)).to.emit(agent, "Withdraw").withArgs(owner.address, balance);
    expect(await usdc.balanceOf(agentAddress)).to.equal(0n);
    expect(await usdc.balanceOf(owner.address)).to.equal(balance);
  });
});
