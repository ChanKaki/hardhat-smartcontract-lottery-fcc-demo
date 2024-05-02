const {ethers, network} = require("hardhat");
const fs = require("fs")

const FRONT_END_ADDRESSS_FILE = "../nextjs-smartcontract-lottery-fcc-demo/contracts/contractAddress.json";
const FRONT_END_ABI_FILE = "../nextjs-smartcontract-lottery-fcc-demo/contracts/abi.json";

module.exports = async function ({ getNamedAccounts, deployments }) {
    if(process.env.UPDATE_FROD_END){
       await updateContractAddress(deployments);
        await updateAbi(deployments);
    }
}

async function updateAbi(deployments){
    const  raffleAddress = (await deployments.get("Raffle")).address;
      const  raffle = await ethers.getContractAt(
      "Raffle",
      raffleAddress
    );
    fs.writeFileSync(FRONT_END_ABI_FILE, JSON.stringify(raffle.interface.fragments));

}

async function updateContractAddress(deployments){
    const  raffleAddress = (await deployments.get("Raffle")).address;
    const chainId = network.config.chainId.toString();
    const currentAddresss =JSON.parse(fs.readFileSync(FRONT_END_ADDRESSS_FILE,"utf8"));
    if(chainId in currentAddresss){
        if(!currentAddresss[chainId].includes()){
            currentAddresss[chainId].push(raffleAddress)
        }
   
    }else{
          currentAddresss[chainId] = [raffleAddress];
    }
     fs.writeFileSync(FRONT_END_ADDRESSS_FILE,JSON.stringify(currentAddresss));
}

module.exports.tags = ["all","frontend"]