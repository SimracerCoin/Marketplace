import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts, ethers, upgrades } = hre;
  const { deploy, get, save } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("Fetching already deployed contracts...");

  // Retrieve the deployed SimracerCoin contract
  const simracerCoinDeployment = await get("SimracerCoin");
  const simracerCoinAddress = simracerCoinDeployment.address;
  console.log("SimracerCoin address:", simracerCoinAddress);

  // Retrieve the deployed SimracingMomentOwner contract
  const simracingMomentOwnerDeployment = await get("SimracingMomentOwner");
  const simracingMomentOwnerAddress = simracingMomentOwnerDeployment.address;
  console.log("SimracingMomentOwner address:", simracingMomentOwnerAddress);

  console.log("Deploying SimracingMomentDrop...");
  // Define constructor arguments for SimracingMomentDrop
  const title = "Simracing Drop Title";
  const description = "Simracing Drop Description";
  const cover = "https://example.com/cover.jpg";
  const dropId = 1;

  // Get the contract factory for SimracingMomentDrop
  const SimracingMomentDrop = await ethers.getContractFactory("SimracingMomentDrop");

  // Deploy the SimracingMomentDrop as a proxy
  const simracingMomentDrop = await upgrades.deployProxy(SimracingMomentDrop, [
    title,
    description,
    cover,
    dropId,
    simracerCoinAddress, // purchaseTokenAddress (SimracerCoin)
    simracingMomentOwnerAddress, // simracingMomentAddress (SimracingMomentOwner)
  ]);

  // Save deployment to Hardhat Deploy's deployment system
  await save("SimracingMomentDrop", {
    abi: SimracingMomentDrop.interface.format(ethers.utils.FormatTypes.json), // Removed type assertion
    address: simracingMomentDrop.address,
  });

  console.log("SimracingMomentDrop deployed to:", simracingMomentDrop.address);
};

export default func;
export const tags = ["SimracingMomentDrop"];
