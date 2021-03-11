/**
 * Conflitator instantiate
 *
 * Basic usage
 * - npx hardhat run --network localhost --no-compile instantiate.ts
 *
 * Parametrization (setting env variables)
 * - "data": defines mathematical expression to evaluate (default is "2^71 + 36^12")
 */
import hre from "hardhat";

async function main() {
  const { ethers } = hre;
  const { Descartes } = await hre.deployments.all();

  //const { alice, bob } = await getNamedAccounts();

  const claimer = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
  const challenger = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

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

  const ipfsPath = '/ipfs/QmP1snrmSnwmZSMVGwusbuK5nDq3Wew6t2VZz5AwkGEbns';
  const loggerRootHash = '0x55237aebebb43983a762037a92be834b5e5693a72f37c3656f17702ebf4f68cf';

  const aDrive = {
      position: '0x9000000000000000',
      driveLog2Size: 5,
      directValue: ethers.utils.formatBytes32String(data),
      loggerIpfsPath: ethers.utils.hexlify(
          ethers.utils.toUtf8Bytes(ipfsPath.replace(/\s+/g, ""))
      ),
      loggerRootHash: loggerRootHash,
      waitsProvider: false,
      needsLogger: true,
      provider: claimer,
  };

  const pDrive = {
      position: '0xa000000000000000',
      driveLog2Size: 5,
      directValue: ethers.utils.formatBytes32String('1q'),
      loggerIpfsPath: ethers.utils.formatBytes32String(''),
      loggerRootHash: ethers.utils.formatBytes32String(""),
      waitsProvider: false,
      needsLogger: false,
      provider: claimer,
  }

   // defines input drive
/*   const input = {
    position: "0x9000000000000000",
    driveLog2Size: 5,
    directValue: ethers.utils.toUtf8Bytes(data),
    loggerIpfsPath: ethers.utils.formatBytes32String(""),
    loggerRootHash: ethers.utils.formatBytes32String(""),
    waitsProvider: false,
    needsLogger: false,
    provider: claimer,
  }; */
 
  // instantiates descartes computation
  const tx = await descartes.instantiate(
    // final time: 1e11 gives us ~50 seconds for completing the computation itself
    1e11,
    // template hash
    "0x62282173bb0cadf4404f96385f05d48bf9124f63937886ec68ce42ce75f71649",
    // output position
    "0xb000000000000000",
    // output log2 size
    10,
    // round duration
    51,
    [claimer, challenger],
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
