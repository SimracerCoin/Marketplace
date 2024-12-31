import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  //const Descartes = await get("Descartes");

  //NOTE: if deploying to arbitrum use instead
  /*
  const SimracerCoin = {address: "0xb87f23C28643d035999d9974F37066F48465d9E2"};
  const STSetup = {address: "0x4AffCCa2174dC8BC3A841B65578CFe6f7724420f"};
  const STSkin = {address: "0x48abadA0E4f651b16AdE669C2757d61A6768Fb55"};
  const SimracingMomentOwner = {address: "0xAadC027185ab25666935271b324B7699389E8655"};
  */
  //and then npx hardhat deploy --network arbitrum
  
  const SimracerCoin = await deploy("SimracerCoin", {
    from: deployer,
    log: true,
  });
  await deploy("SimthunderOwner", {
    from: deployer,
    log: true,
    args: [SimracerCoin.address],
  });
  const SimracingMomentOwner = await deploy("SimracingMomentOwner", {
    from: deployer,
    log: true,
    args: [SimracerCoin.address],
  });
  const STSetup = await deploy("STSetup", {
    from: deployer,
    log: true
  });
  const STSkin = await deploy("STSkin", {
    from: deployer,
    log: true
  });
  await deploy("STMarketplace", {
    from: deployer,
    log: true,
    args: [SimracerCoin.address, STSetup.address, STSkin.address],
  });

  const title = "Genesis Collection";
  const description = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec eget mollis elit, in pharetra massa. Vestibulum posuere nisi aliquet massa convallis, id lobortis justo convallis. Integer nec dui et mauris porta lobortis rutrum vitae mi. Sed hendrerit ipsum vel euismod malesuada. In tincidunt, leo in interdum dapibus, erat ligula consequat risus, eget dignissim leo ligula nec nunc. Curabitur ac enim libero. Ut velit urna, hendrerit nec tellus non, suscipit euismod est.";
  const cover = "https://simthunder.infura-ipfs.io/ipfs/QmYQM7fe7JUxncS3yQfPat6UvtjJu8urjzr7Z7gJYXVbdb";
  const dropId = 1;
  await deploy("SimracingMomentDrop", {
    from: deployer,
    log: true,
    args: [title, description, cover, dropId, SimracerCoin.address, SimracingMomentOwner.address],
  });
};

export default func;
export const tags = ["Marketplace"];
