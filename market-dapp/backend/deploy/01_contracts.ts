import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, get } = deployments;
  const { deployer } = await getNamedAccounts();

  const Descartes = await get("Descartes");
  await deploy("ContentMarketplace", {
    from: deployer,
    log: true,
    args: [Descartes.address],
  });
  await deploy("STMarketplace", {
    from: deployer,
    log: true,
    args: [Descartes.address],
  });
  const SimracerCoin = await deploy("SimracerCoin", {
    from: deployer,
    log: true,
  });
  await deploy("SimthunderOwner", {
    from: deployer,
    log: true,
    args: [SimracerCoin.address],
  });
};

export default func;
export const tags = ["Marketplace"];
