const { expect } = require("chai");
const { BigNumber } = require("ethers");

const {
    loadFixture,
  } = require("@nomicfoundation/hardhat-network-helpers");

describe("Marketplace", () => {
    async function deployTokenFixture() {
        const [owner, addr1, addr2] = await ethers.getSigners();
    
        const src = await ethers.deployContract("SimracerCoin");
        const marketplace = await ethers.deployContract("STMarketplace", [src.address]);

        await src.approve(marketplace.address, 1000);
    
        // Fixtures can return anything you consider useful for your tests
        return { marketplace, src, owner, addr1, addr2 };
      }

    it("newCarSetup create a new car setup", async () => {
        const { marketplace, owner } = await loadFixture(deployTokenFixture);

        const result = await marketplace.newCarSetup(
            (new TextEncoder()).encode("ipfs/path/to/data"),
            "car brand test",
            "track test",
            "simulator test",
            "season test",
            "series test",
            "description test",
            10,
            ethers.utils.hexZeroPad("0x0", 32),
            ethers.utils.hexZeroPad("0x0", 32),
            "cmartins88");

        var id = result.value;

        expect(id).to.equal(BigNumber.from(0));

        const carSetup = await marketplace.getCarSetup(id);

        expect(carSetup.info.carBrand).to.equal("car brand test");
        expect(carSetup.ad.seller).to.equal(owner.address);
        expect(carSetup.id).to.equal(BigNumber.from(id));
    });

    it("newCarSetup create multiple car setups when called multiple times", async () => {
        const { marketplace, owner } = await loadFixture(deployTokenFixture);

        for(var i = 0; i < 2; ++i) {
            var result = await marketplace.newCarSetup(
                (new TextEncoder()).encode("ipfs/path/to/data"),
                "car brand test" + i,
                "track test",
                "simulator test",
                "season test",
                "series test",
                "description test",
                10,
                ethers.utils.hexZeroPad("0x0", 32),
                ethers.utils.hexZeroPad("0x0", 32),
                "cmartins88");

                console.log(result);

            var id = result.value;

            expect(id).to.equal(BigNumber.from(i));

            var carSetup = await marketplace.getCarSetup(id);

            expect(carSetup.info.carBrand).to.equal("car brand test" + i);
            expect(carSetup.ad.seller).to.equal(owner.address);
            expect(carSetup.id).to.equal(BigNumber.from(id));
        }
    });
});