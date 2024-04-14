const { network, getNamedAccounts, deployments, ethers } = require("hardhat");
const { developmentChains, networkConfig } = require("../helper-hardhat-config");
const { assert } = require("chai");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Raffle Unit Tests", async function () {
      let raffle, vrfCoordinatorV2Mock;
      const chainId = network.config.chainId;
      beforeEach(async function () {
        const { deployer } = await getNamedAccounts();
        // execute deployment as fixture for test /;
        await deployments.fixture("all");
        raffle = await ethers.getContract("Raffle", deployer);
        vrfCoordinatorV2Mock = await ethers.getContract(
          "VRFCoordinatorV2Mock",
          deployer
        );
      });

      describe("constructor", async function () {
        it("initializes the raffle corrently", async function () {
          const raffleState = await raffle.getRaffleState();
          const intervale = await raffle.getInterval();
            assert.equal(raffleState.toString(), "0");
            assert.equal(
              intervale.toString(),
              networkConfig[chainId]["interval"]
            );
        });
      });
    });
