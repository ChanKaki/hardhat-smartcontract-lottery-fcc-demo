const { network, ethers } = require("hardhat");
const {
  developmentChains,
  networkConfig,
} = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");

const VRF_SUB_FUND_AMOUNT = ethers.parseEther("1");

module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;
  let vrfCoordinatorV2Address, subscriptionId,vrfCoordinatorV2Mock;
  if (developmentChains.includes(network.name)) {
    vrfCoordinatorV2Address = (await deployments.get("VRFCoordinatorV2Mock"))
      .address;
    // getContractAt 是hardhat 的方法
    vrfCoordinatorV2Mock = await ethers.getContractAt(
      "VRFCoordinatorV2Mock",
      vrfCoordinatorV2Address
    );
    //    getContract返回的是合约信息，不是合约实体，这会导致你无法调用合约方法
    //vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
    // vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address
    const transactionResponse = await vrfCoordinatorV2Mock.createSubscription();
    const transactionReceipt = await transactionResponse.wait(1);
    subscriptionId =transactionReceipt.logs[0].topics[1];
    await vrfCoordinatorV2Mock.fundSubscription(
       BigInt(subscriptionId),
      VRF_SUB_FUND_AMOUNT
    );
  } else {
    vrfCoordinatorV2Address = networkConfig[chainId]["vrfCoordinatorV2"];
    subscriptionId = networkConfig[chainId]["subscriptionId"];
  }

  const entranceFee = networkConfig[chainId]["entranceFee"];
  const gasLane = networkConfig[chainId]["gasLane"];
  const interval = networkConfig[chainId]["interval"];
  const callBackGasLimit = networkConfig[chainId]["callBackGasLimit"];
  const arguments = [
    vrfCoordinatorV2Address,
    entranceFee,
    gasLane,
    subscriptionId,
    callBackGasLimit,
    interval,
  ];
  const raffle = await deploy("Raffle", {
    from: deployer,
    args: arguments,
    log: true,
    waitConfirmations: network.config.blockConfirmations,
  });

  if (developmentChains.includes(network.name)) {
        await vrfCoordinatorV2Mock.addConsumer(BigInt(subscriptionId), raffle.address)
      }
  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    log("verify.....");
    await verify(raffle.address, arguments);
  }
  log("all done --------");
};

module.exports.tags = ["all", "raffle"];
