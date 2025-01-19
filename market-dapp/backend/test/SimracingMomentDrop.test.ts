import { ethers } from "hardhat";
import { expect } from "chai";
import { Contract } from "ethers";

describe("SimracingMomentDrop", function () {
  let simracerCoin: Contract;
  let simracingMomentOwner: Contract;
  let simracingMomentDrop: Contract;
  let deployer: string;
  let user: string;

  before(async function () {
    // Get accounts
    const accounts = await ethers.getSigners();
    deployer = accounts[0].address;
    user = accounts[1].address;

    // Deploy SimracerCoin (ERC20)
    const SimracerCoin = await ethers.getContractFactory("SimracerCoin");
    simracerCoin = await SimracerCoin.deploy();
    await simracerCoin.deployed();

    // Deploy SimracingMomentOwner (IAwardItem)
    const SimracingMomentOwner = await ethers.getContractFactory("SimracingMomentOwner");
    simracingMomentOwner = await SimracingMomentOwner.deploy(simracerCoin.address);
    await simracingMomentOwner.deployed();

    // Deploy SimracingMomentDrop (non-upgradable contract)
    const SimracingMomentDrop = await ethers.getContractFactory("SimracingMomentDrop");
    simracingMomentDrop = await SimracingMomentDrop.deploy(
      "Simracing Drop Title",       // Title
      "Simracing Drop Description", // Description
      "https://example.com/cover.jpg", // Cover URL
      1,                            // Drop ID
      simracerCoin.address,         // Purchase token
      simracingMomentOwner.address  // SimracingMomentOwner contract
    );
    await simracingMomentDrop.deployed();
  });

  describe("Initialization", function () {
    it("should initialize with correct values", async function () {
      expect(await simracingMomentDrop._title()).to.equal("Simracing Drop Title");
      expect(await simracingMomentDrop._description()).to.equal("Simracing Drop Description");
      expect(await simracingMomentDrop._cover()).to.equal("https://example.com/cover.jpg");
      expect(await simracingMomentDrop.drop()).to.equal(1);
      expect(await simracingMomentDrop.purchaseToken()).to.equal(simracerCoin.address);
    });
  });

  describe("Pack Creation", function () {
    it("should allow the owner to create a pack", async function () {
      const saleDistributionAddresses = [deployer];
      const saleDistributionAmounts = [100]; // 100% to the deployer
      const marketplaceDistributionAddresses = [deployer];
      const marketplaceDistributionAmounts = [100]; // 100% to the deployer

      await simracingMomentDrop.createPack(
        5, // NFT amount
        ethers.utils.parseEther("10"), // Price in purchase token
        "Serie 1", // Serie
        "Pack Type 1", // Pack Type
        saleDistributionAddresses,
        saleDistributionAmounts,
        marketplaceDistributionAddresses,
        marketplaceDistributionAmounts
      );

      const pack = await simracingMomentDrop.getPackById(1);
      expect(pack.packId).to.equal(1);
      expect(pack.nftAmount).to.equal(5);
      expect(pack.price).to.equal(ethers.utils.parseEther("10"));
      expect(pack.serie).to.equal("Serie 1");
      expect(pack.packType).to.equal("Pack Type 1");
    });

    it("should fail if the sale distribution percentages do not add up to 100", async function () {
      const invalidDistributionAmounts = [50, 30]; // Doesn't sum to 100
      await expect(
        simracingMomentDrop.createPack(
          5,
          ethers.utils.parseEther("10"),
          "Serie 2",
          "Pack Type 2",
          [deployer, user],
          invalidDistributionAmounts,
          [deployer],
          [100]
        )
      ).to.be.revertedWith("Total distribution percentages must equal 100");
    });
  });

  describe("Pack Purchase", function () {
    beforeEach(async function () {
      const saleStart = Math.floor(Date.now() / 1000) - 100;

      await simracingMomentDrop.setSaleStart(saleStart);

      await simracingMomentDrop.createPack(
        5,
        ethers.utils.parseEther("10"),
        "Serie 1",
        "Pack Type 1",
        [deployer],
        [100],
        [deployer],
        [100]
      );
    });

    it("should allow a user to purchase a pack", async function () {
      await simracerCoin.transfer(user, ethers.utils.parseEther("50"));
      const userSigner = await ethers.getSigner(user);
      await simracerCoin.connect(userSigner).approve(simracingMomentDrop.address, ethers.utils.parseEther("10"));

      const userBalanceBefore = await simracerCoin.balanceOf(user);
      await simracingMomentDrop.connect(userSigner).buyPack(1);
      const userBalanceAfter = await simracerCoin.balanceOf(user);

      expect(userBalanceBefore.sub(userBalanceAfter)).to.equal(ethers.utils.parseEther("10"));
    });

    it("should fail if the user does not have enough allowance", async function () {
      const userSigner = await ethers.getSigner(user);

      // Transfer tokens and set insufficient allowance
      await simracerCoin.transfer(user, ethers.utils.parseEther("50"));
      await simracerCoin.connect(userSigner).approve(simracingMomentDrop.address, ethers.utils.parseEther("5")); // Less than required

      await simracingMomentDrop.createPack(
        5,
        ethers.utils.parseEther("10"),
        "Serie 1",
        "Pack Type 1",
        [deployer],
        [100],
        [deployer],
        [100]
      );

      // Attempt to purchase the pack
      await expect(simracingMomentDrop.connect(userSigner).buyPack(2)).to.be.revertedWith("Insufficient allowance");
    });
  });
      
  it("should fail if the pack does not exist", async function () {
    const userSigner = await ethers.getSigner(user);
    await expect(simracingMomentDrop.connect(userSigner).buyPack(99)).to.be.revertedWith("Pack does not exist");
  });

  describe("Pack Opening", function () {
    beforeEach(async function () {
      const saleStart = Math.floor(Date.now() / 1000) - 100;

      await simracingMomentDrop.setSaleStart(saleStart);

      await simracingMomentDrop.createPack(
        5,
        ethers.utils.parseEther("10"),
        "Serie 1",
        "Pack Type 1",
        [deployer],
        [100],
        [deployer],
        [100]
      );
    });

    it("should fail if a non-buyer tries to open the pack", async function () {
        // User 1 purchases the pack
        const user1Signer = await ethers.getSigner(user);
        await simracerCoin.transfer(user, ethers.utils.parseEther("50"));
        await simracerCoin.connect(user1Signer).approve(simracingMomentDrop.address, ethers.utils.parseEther("10"));
        await simracingMomentDrop.connect(user1Signer).buyPack(2);
        
        // User 2 tries to open the pack
        const user2Signer = await ethers.getSigner(deployer); // Non-buyer
        await expect(
            simracingMomentDrop.connect(user2Signer).openPack(2)
        ).to.be.revertedWith("Not the pack buyer");
    });      
  });
  describe("Extended Tests", function () {
    beforeEach(async function () {
        const saleStart = Math.floor(Date.now() / 1000) - 100;
  
        await simracingMomentDrop.setSaleStart(saleStart);
  
        await simracingMomentDrop.createPack(
          5,
          ethers.utils.parseEther("10"),
          "Serie 1",
          "Pack Type 1",
          [deployer],
          [100],
          [deployer],
          [100]
        );
      });
    it("should not allow non-owners to create a pack", async function () {
      const userSigner = await ethers.getSigner(user);
      await expect(
        simracingMomentDrop.connect(userSigner).createPack(
          5,
          ethers.utils.parseEther("10"),
          "Serie 2",
          "Pack Type 2",
          [deployer],
          [100],
          [deployer],
          [100]
        )
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should allow the owner to update the pack information before sale starts", async function () {
      const saleStart = Math.floor(Date.now() / 1000) + 1000;
      await simracingMomentDrop.setSaleStart(saleStart);

      const newPrice = ethers.utils.parseEther("15");
      await simracingMomentDrop.editPackInfo(1, "Updated Serie", "Updated Pack Type", newPrice);

      const updatedPack = await simracingMomentDrop.getPackById(1);
      expect(updatedPack.price).to.equal(newPrice);
      expect(updatedPack.serie).to.equal("Updated Serie");
      expect(updatedPack.packType).to.equal("Updated Pack Type");
    });

    it("should not allow updating pack information after sale starts", async function () {
      const saleStart = Math.floor(Date.now() / 1000) - 100; // Sale already started
      await simracingMomentDrop.setSaleStart(saleStart);

      await expect(
        simracingMomentDrop.editPackInfo(1, "Updated Serie", "Updated Pack Type", ethers.utils.parseEther("15"))
      ).to.be.revertedWith("Sale has already started");
    });

    it("should not allow non-buyers to open a pack", async function () {
        const userSigner = await ethers.getSigner(user);
        await simracerCoin.transfer(user, ethers.utils.parseEther("50"));
        await simracerCoin.connect(userSigner).approve(simracingMomentDrop.address, ethers.utils.parseEther("10"));
        await simracingMomentDrop.connect(userSigner).buyPack(3);
  
        const nonBuyerSigner = await ethers.getSigner(deployer); // Deploying account is not the buyer
        await expect(simracingMomentDrop.connect(nonBuyerSigner).openPack(3)).to.be.revertedWith("Not the pack buyer");
    });

    it("should allow multiple packs to be bought and opened by a single user", async function () {
      const userSigner = await ethers.getSigner(user);
      await simracerCoin.transfer(user, ethers.utils.parseEther("50"));

      // Approve and buy both packs
      await simracerCoin.connect(userSigner).approve(simracingMomentDrop.address, ethers.utils.parseEther("20"));
      await simracingMomentDrop.connect(userSigner).buyPack(4);
      await simracingMomentDrop.connect(userSigner).buyPack(5);

      // Verify ownership
      const registeredIDs1 = await simracingMomentDrop.getRegisteredIDs(user);
      expect(registeredIDs1.length).to.equal(25); // 5 from Pack 1, 3 from Pack 2

      // Open both packs
      await simracingMomentDrop.connect(userSigner).openPack(4);
      await simracingMomentDrop.connect(userSigner).openPack(5);

      const pack1 = await simracingMomentDrop.getPackById(4);
      const pack2 = await simracingMomentDrop.getPackById(5);
      expect(pack1.opened).to.equal(true);
      expect(pack2.opened).to.equal(true);
    });

    it("should not allow creating a pack with invalid distribution percentages", async function () {
      const invalidDistributionAmounts = [50, 30]; // Sum not equal to 100
      await expect(
        simracingMomentDrop.createPack(
          5,
          ethers.utils.parseEther("10"),
          "Serie Invalid",
          "Pack Type Invalid",
          [deployer, user],
          invalidDistributionAmounts,
          [deployer],
          [100]
        )
      ).to.be.revertedWith("Total distribution percentages must equal 100");
    });

    it("should lock and unlock the contract", async function () {
      await simracingMomentDrop.lock();
      expect(await simracingMomentDrop._closed()).to.equal(true);

      await expect(
        simracingMomentDrop.buyPack(1)
      ).to.be.revertedWith("Contract is locked");

      await simracingMomentDrop.unlock();
      expect(await simracingMomentDrop._closed()).to.equal(false);
    });

    it("should allow the owner to delete a pack before the sale starts", async function () {
      const saleStart = Math.floor(Date.now() / 1000) + 1000;
      await simracingMomentDrop.setSaleStart(saleStart);

      const newPackId = await simracingMomentDrop.packIncrementId();

      await simracingMomentDrop.createPack(
        5,
        ethers.utils.parseEther("10"),
        "Serie 3",
        "Pack Type 3",
        [deployer],
        [100],
        [deployer],
        [100]
      );

      await simracingMomentDrop.deletePackById(newPackId);

      // Fetch the pack and verify it has default values
      const deletedPack = await simracingMomentDrop.getPackById(newPackId);

      expect(deletedPack.packId).to.equal(0); // Default value for uint256
      expect(deletedPack.nftAmount).to.equal(0); // Default value for uint256
      expect(deletedPack.price).to.equal(0); // Default value for uint256
      expect(deletedPack.buyer).to.equal(ethers.constants.AddressZero); // Default value for address
      expect(deletedPack.opened).to.equal(false); // Default value for bool
    });

    it("should not allow deleting a pack after the sale starts", async function () {
      const saleStart = Math.floor(Date.now() / 1000) - 100;
      await simracingMomentDrop.setSaleStart(saleStart);

      await expect(simracingMomentDrop.deletePackById(1)).to.be.revertedWith("Sale has already started");
    });
  });
});
