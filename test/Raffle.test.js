const { network, getNamedAccounts, deployments, ethers } = require("hardhat");
const {
  developmentChains,
  networkConfig,
} = require("../helper-hardhat-config");
const { use,assert, expect } = require("chai");
const { solidity } = require("ethereum-waffle");
use(solidity);

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Raffle Unit Tests", async function () {
      let raffle, vrfCoordinatorV2Mock,deployer,raffEntranceFee,interval;
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
        interval = await raffle.getInterval();

      });

      describe("constructor", async function () {
        it("initializes the raffle corrently", async function () {
          const raffleState = await raffle.getRaffleState();
          assert.equal(raffleState.toString(), "0");
          assert.equal(
            interval.toString(),
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

        it("emits event on enter",async function(){
           await expect(raffle.enterRaffle({value:raffEntranceFee}))
           .to.emit(raffle,"RaffleEnter") ;
        })

        it("doesnt allo entarnce when raffle is calculating",async function(){
          await raffle.enterRaffle({value:raffEntranceFee});
          //hardhat network 的方法
          await network.provider.send("evm_increaseTime",[Number(interval) + 1]);
          await network.provider.send("evm_mine",[]);
          await raffle.performUpkeep("0x");
          await expect(raffle.enterRaffle({value:raffEntranceFee}))
          .to.be.revertedWith("Raffle_NotOpen");
        })
      });
      
      describe("checkUpKeep",async function(){
          it("returns false if people haven't send any ETH",async function(){
            await network.provider.send("evm_increaseTime",[Number(interval) + 1]);
            await network.provider.send("evm_mine",[]);
            //callStatic 能实际调用合约方法，但不会产生交易,ether 6 跟5 的用法不一样
            const { upkeepNeeded } = await raffle.checkUpkeep.staticCall("0x");
            assert (!upkeepNeeded);
          })

          it("retuerns false if raffle isn't open",async function(){
            await raffle.enterRaffle({value:raffEntranceFee});
            //hardhat network 的方法
            await network.provider.send("evm_increaseTime",[Number(interval) + 1]);
            await network.provider.send("evm_mine",[]);
            await raffle.performUpkeep("0x");
            const raffleState = await raffle.getRaffleState();
            const {upkeepNeeded} = await raffle.checkUpkeep.staticCall("0x");
            assert.equal(raffleState.toString(),"1");
            assert.equal(upkeepNeeded,false);
          })

    
            it("returns false if enough time hasn't passed", async () => {
                  await raffle.enterRaffle({ value: raffEntranceFee });
                  await network.provider.send("evm_increaseTime",[Number(interval) -5]);
                  await network.provider.send("evm_mine",[]);
                  const { upkeepNeeded } = await raffle.checkUpkeep.staticCall("0x");
                  assert(!upkeepNeeded);
              })
              it("returns true if enough time has passed, has players, eth, and is open", async () => {
                  await raffle.enterRaffle({ value: raffEntranceFee })
                  await network.provider.send("evm_increaseTime", [Number(interval) + 1])
                  await network.provider.send("evm_mine",[]);
                  const { upkeepNeeded } =  await raffle.checkUpkeep.staticCall("0x");
                  assert(upkeepNeeded)
              })
      })

      describe("performUpkeep",function(){
        it("it can only run if checkupkeep is true",async function(){
                 await raffle.enterRaffle({ value: raffEntranceFee })
                  await network.provider.send("evm_increaseTime", [Number(interval) + 1])
                  await network.provider.send("evm_mine",[]);
                  const tx = await raffle.performUpkeep("0x");
                  assert(tx);
        });

        it("reverts when checkupkeep is false",async function (){
            await expect(raffle.performUpkeep("0x")).to.be.revertedWith("Raffle_UpKeepNotNeeded");
        });

        it("updates the raffle state,emits and event,and calls the vrf coordinator",async function(){
              await raffle.enterRaffle({ value: raffEntranceFee })
              await network.provider.send("evm_increaseTime", [Number(interval) + 1])
              await network.provider.send("evm_mine",[]);
              const txResponse = await raffle.performUpkeep("0x");
              const txReceipt = await txResponse.wait(1);
              const requestId = txReceipt.logs[1].args.requestId;
              const raffleState = await raffle.getRaffleState();
              assert(Number(requestId)>0);
              assert(raffleState.toString()=="1");
        });

        describe("fulfilelRamdomWords",function(){
          beforeEach(async function(){
              await raffle.enterRaffle({ value: raffEntranceFee })
              await network.provider.send("evm_increaseTime", [Number(interval) + 1])
              await network.provider.send("evm_mine",[]);
          })

          it("can only be called after performUpkeep",async function(){
            await expect(
              vrfCoordinatorV2Mock.fulfillRandomWords(0,raffle.getAddress())
            ).to.be.revertedWith("nonexistent request");

            await expect(vrfCoordinatorV2Mock.fulfillRandomWords(1,raffle.getAddress()))
            .to.be.revertedWith("nonexistent request");
          })
        })

      })

    });
