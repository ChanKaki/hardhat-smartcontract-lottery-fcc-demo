const { network, getNamedAccounts, deployments, ethers } = require("hardhat");
const {
  developmentChains,
  networkConfig,
} = require("../../helper-hardhat-config");
const { assert, expect } = require("chai");


developmentChains.includes(network.name)?describe.skip:
  describe("Raffle Unit Tests", async function () {
      let raffle,deployer,raffEntranceFee;
      beforeEach(async function () {
       deployer  = (await getNamedAccounts()).deployer;
        raffle = await ethers.getContract("Raffle", deployer);
        raffEntranceFee = await raffle.getEntranceFee();
      });

        describe("fulfilelRamdomWords",function(){
          it("workd with live chainLink keepers and chainlink vrf,we got a random winner",async function(){
              const startingTimeStamp = await raffle.getLatestTimeStamp();
              const accounts= await ethers.getSigners();
              await new Promise(async(resolve,reject)=>{
                console.log(">>>>>>>")
                raffle.once("WinnerPicked",async()=>{
                    console.log("WinnerPicked event fired!")
                    resolve()
                    try{
                        const recentWinner = await raffle.getRecentWinner();
                        const raffleState = await raffle.getRaffleState();
                        const winnerEndingBalacen = await accounts[0].provider.getBalance();
                        const endingTimeStamp = await raffle.getLatestTimeStamp();
                        await expect(raffle.getPlayer(0)).to.be.reverted;
                        assert.equal(recentWinner.toString(), accounts[0].address);
                        assert.equal(raffleState,0);
                        assert.equal(winnerEndingBalacen.toString(),winnerStartingBalance.add(raffEntranceFee).toString());
                        assert(endingTimeStamp>startingTimeStamp);
                        resolve();
                    }
                    catch(error){
                      reject(error)
                    }

                })
            
            console.log(">>>>>>>start")     
              const tx =   await raffle.enterRaffle({ value: raffEntranceFee }); 
              await tx.wait(1);
                const winnerStartingBalance = await accounts[0].provider.getBalance();
                console.log(">>>>>>>winnerStartingBalance",winnerStartingBalance)     
                 

              })

              



          })


        })

})