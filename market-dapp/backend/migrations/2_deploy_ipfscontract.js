var STMarketplace = artifacts.require("./STMarketplace.sol");

module.exports = function(deployer) {
  deployer.deploy(STMarketplace, '0x5660a2Ead35A975D9F7C96d0B5f5FA12A12710d8');
};