import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, get } = deployments;
  const { deployer } = await getNamedAccounts();

  //const Descartes = await get("Descartes");

  //NOTE: if deploying to polygon use instead
  //const SimracerCoin = {address: "0xf0c3C4AC63Be272a94712bCcc39490A159Cd0D7C"};
  //and then npx hardhat deploy --network polygon
  const SimracerCoin = await deploy("SimracerCoin", {
    from: deployer,
    log: true,
  });
  await deploy("SimthunderOwner", {
    from: deployer,
    log: true,
    args: [SimracerCoin.address],
  });

  await deploy("SimracingMomentOwner", {
    from: deployer,
    log: true,
    args: [SimracerCoin.address],
  });

  /*await deploy("ContentMarketplace", {
    from: deployer,
    log: true,
    args: [SimracerCoin.address],
  });*/
  const STSetup = await deploy("STSetup", {
    from: deployer,
    log: true
  });
  const STSkin = await deploy("STSkin", {
    from: deployer,
    log: true
  });
  const STMarketplace = await deploy("STMarketplace", {
    from: deployer,
    log: true,
    args: [SimracerCoin.address, STSetup.address, STSkin.address],
  });
};

export default func;
export const tags = ["Marketplace"];
