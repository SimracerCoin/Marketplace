/**
 * Conflitator instantiate
 *
 * Basic usage
 * - npx hardhat run --network localhost --no-compile instantiate.ts
 *
 * Parametrization (setting env variables)
 * - "data": defines mathematical expression to evaluate (default is "2^71 + 36^12")
 */

const config = {
  ipfsPath: process.env.IPFS_PATH || "",
  loggerRootHash: process.env.LOGGER_ROOT_HASH || "",
  machineTemplateHash: process.env.MACHINE_TEMPLATE_HASH || "",
};

Object.entries(config).forEach(([key, value]) => {
  if (value.length === 0) {
    console.error(`${key} could not be found in environment vars`, config);
    process.exit(-1);
  }
});

import hre from "hardhat";

async function main() {
  console.log("Loaded Configs: ", JSON.stringify(config, null, 2));

  const { ethers, getNamedAccounts } = hre;
  const { Descartes } = await hre.deployments.all();

  const { alice, bob } = await getNamedAccounts();

  //const alice = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  //const bob = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

  // retrieves deployed Descartes instance based on its address and ABI
  let [signer] = await ethers.getSigners();

  const descartes = new ethers.Contract(
    Descartes.address,
    Descartes.abi,
    signer
  );

  let data = "";
  if (process.env.data) {
    data = process.env.data;
  }
  console.log("");
  console.log(`Instantiating "Conflitator" for data "${data}"...\n`);

  const aDrive = {
    position: "0xa000000000000000",
    driveLog2Size: 7,
    directValue: ethers.utils.formatBytes32String(""),
    loggerIpfsPath: ethers.utils.hexlify(
      ethers.utils.toUtf8Bytes(config.ipfsPath.replace(/\s+/g, ""))
    ),
    loggerRootHash: `0x${config.loggerRootHash}`,
    waitsProvider: false,
    needsLogger: true,
    provider: alice,
  };

  const pDrive = {
    position: "0xb000000000000000",
    driveLog2Size: 10,
    directValue: ethers.utils.formatBytes32String("12345Abc"),
    loggerIpfsPath: ethers.utils.formatBytes32String(""),
    loggerRootHash: ethers.utils.formatBytes32String(""),
    waitsProvider: false,
    needsLogger: false,
    provider: alice,
  };

  // instantiates descartes computation
  const tx = await descartes.instantiate(
    // final time: 1e11 gives us ~50 seconds for completing the computation itself
    1e11,
    // template hash
    `0x${config.machineTemplateHash}`,
    // output position
    "0xc000000000000000",
    // output log2 size
    5,
    // round duration
    51,
    [alice, bob],
    [aDrive, pDrive]
  );

  // retrieves created computation's index
  const index = await new Promise((resolve) => {
    descartes.on("DescartesCreated", (index) => resolve(index));
  });

  console.log(
    `Instantiation successful with index '${index}' (tx: ${tx.hash} ; blocknumber: ${tx.blockNumber})\n`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
