import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { ethers, upgrades } = hre;
  const proxyAddress = "0xYourProxyAddress"; // Replace with the deployed proxy address

  console.log("Upgrading SimracingMomentDrop...");

  // Get the contract factory for the new implementation
  const SimracingMomentDropV2 = await ethers.getContractFactory("SimracingMomentDrop");

  // Upgrade the proxy
  const upgraded = await upgrades.upgradeProxy(proxyAddress, SimracingMomentDropV2);

  console.log("SimracingMomentDrop upgraded. New implementation address:", upgraded.address);
};

export default func;
export const tags = ["SimracingMomentDropUpgrade"];
