import { HardhatUserConfig, task } from "hardhat/config";
import { HttpNetworkUserConfig } from "hardhat/types";

import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "hardhat-typechain";
import "hardhat-deploy";

import "@nomiclabs/hardhat-solpp";
// import "solidity-coverage"; @dev WIP this plugin is not updated to hardhat yet

//npx hardhat deploy was not getting access to process.env
require('dotenv').config({path:__dirname+'/.env'});

// This is a sample hardhat task. To learn how to create your own go to
// https://hardhat.dev/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, bre) => {
  const accounts = await bre.ethers.getSigners();
  for (const account of accounts) {
    console.log(await account.getAddress());
  }
});

// read MNEMONIC from file or from env variable
let mnemonic = process.env.MNEMONIC;

const infuraNetwork = (
  network: string,
  chainId?: number,
  gas?: number
): HttpNetworkUserConfig => {
  return {
    url: `https://${network}.infura.io/v3/${process.env.PROJECT_ID}`,
    chainId,
    gas,
    accounts: mnemonic ? { mnemonic } : undefined,
  };
};

const config: HardhatUserConfig = {
  networks: {
    hardhat: mnemonic
      ? { accounts: { mnemonic }, chainId: 31337 }
      : { chainId: 31337 },
    localhost: {
      url: "http://localhost:8545",
      accounts: mnemonic ? { mnemonic } : undefined
    },
    coverage: {
      url: "http://localhost:8555", // <-- If you change this, also set the port option in .solcover.js.
      // chainId: "*", // not set means it's ignored
      gas: 0xfffffffffff, // <-- Use this high gas value
      gasPrice: 0x01, // <-- Use this low gas price
    },
    rinkeby: infuraNetwork("rinkeby", 4, 6283185),
    kovan: infuraNetwork("kovan", 42, 6283185),
    goerli: infuraNetwork("goerli", 5, 6283185),
    matic_testnet: {
      url: "https://rpc-mumbai.matic.today",
      chainId: 80001,
      accounts: mnemonic ? { mnemonic } : undefined,
    },
    bsc_testnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      chainId: 97,
      accounts: mnemonic ? { mnemonic } : undefined,
    },
    polygon: {
      url: "https://polygon-rpc.com/",
      chainId: 137,
      accounts: mnemonic ? { mnemonic } : undefined, //[`0x${mnemonic}`]
    }
  },
  solidity: {
    version: "0.7.6",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
    },
  },
  paths: {
    artifacts: "artifacts",
    deploy: "deploy",
    deployments: "deployments",
  },
  solpp: {
    defs: {
      BUILD_TEST:
        process.argv.includes("test") || process.argv.includes("coverage"),
    },
  },
  typechain: {
    outDir: "src/types",
    target: "ethers-v5",
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    proxy: {
      default: 1,
    },
    alice: {
      default: 0,
    },
    bob: {
      default: 1,
    },
  },
};

export default config;
