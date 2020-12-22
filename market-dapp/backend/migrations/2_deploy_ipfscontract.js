var STMarketplace = artifacts.require("./STMarketplace.sol");

module.exports = function(deployer) {
  //TODO: change placeholder address for the real deployed Descartes address
  const placeholder = '0x5660a2Ead35A975D9F7C96d0B5f5FA12A12710d8';
  deployer.deploy(STMarketplace, placeholder);
};