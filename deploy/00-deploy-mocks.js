const { network, ethers } = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config");

// 线上的话这个价格是由赞助方提供，现在我们在测试环境，没得赞助，这部分钱就是我们自己来付
const BASE_FEE = ethers.parseEther("0.30");
const GAS_PRICE_LINK = 1e9;

module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;
  const args = [BASE_FEE, GAS_PRICE_LINK];

  if (developmentChains.includes(network.name)) {
    log("local network detected!");
    const resonse = await deploy("VRFCoordinatorV2Mock", {
      from: deployer,
      log: true,
      args: [BASE_FEE, GAS_PRICE_LINK],
    });
    log("mock" + resonse);
  }
};

module.exports.tags = ["all", "mocks "];
