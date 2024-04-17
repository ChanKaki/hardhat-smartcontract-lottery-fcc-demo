const { network, getNamedAccounts, deployments, ethers } = require("hardhat");
const {
  developmentChains,
  networkConfig,
} = require("../helper-hardhat-config");
const { assert, expect } = require("chai");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Raffle Unit Tests", async function () {
      let raffle, vrfCoordinatorV2Mock,deployer,raffEntranceFee;
      const chainId = network.config.chainId;
      beforeEach(async function () {
       deployer  = (await getNamedAccounts()).deployer;
        // execute deployment as fixture for test /;
        await deployments.fixture("all");
        raffle = await ethers.getContract("Raffle", deployer);
        vrfCoordinatorV2Mock = await ethers.getContract(
          "VRFCoordinatorV2Mock",
          deployer
        );
        raffEntranceFee = await raffle.getEntranceFee();
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

      describe("enterRaffle", async function () {
        it("reverts when you don't pay entough", async function () {
          await expect(raffle.enterRaffle()).to.be.revertedWith(
            "Raffle_NotEnoughETHEntered"
          );
        });

        it("records players when they enther",async function(){
          await raffle.enterRaffle({value:raffEntranceFee});
          const playerFromContract  = await raffle.getPlayer(0);
          assert.equal(playerFromContract,deployer);
        })
      });
      
    });
