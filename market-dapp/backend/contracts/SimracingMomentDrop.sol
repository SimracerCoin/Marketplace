// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

/// @title SimracingMomentDrop
/// @notice This contract manages the creation, sale, and distribution of NFT packs for sim racing moments.
/// @dev This contract is upgradeable using OpenZeppelin's Initializable and OwnableUpgradeable patterns.
interface IAwardItem {
    /**
     * @notice Awards a new item to a recipient.
     * @param recipient The address to receive the awarded item.
     * @param seriesOwner The address of the series owner (optional logic in implementation).
     * @param itemPrice The price or value associated with the item (optional logic in implementation).
     * @param metadata Metadata URI for the new item.
     * @return The ID of the newly awarded item.
     */
    function awardItem(
        address recipient,
        address payable seriesOwner,
        uint256 itemPrice,
        string memory metadata
    ) external returns (uint256);
}

contract SimracingMomentDrop is Initializable, OwnableUpgradeable, ReentrancyGuardUpgradeable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    /// @notice Token used for purchases
    IERC20 public purchaseToken;

    /// @notice Interface to interact with the NFT awarding logic
    IAwardItem public simracingMoment;

    /// @notice ID of the current drop
    uint256 public drop;

    /// @notice Title of the drop
    string public title;

    /// @notice Description of the drop
    string public description;

    /// @notice Cover image URL of the drop
    string public cover;

    mapping(address => mapping(uint256 => bool)) public registeredIDs;
    mapping(address => uint256[]) public registeredIDsArray;
    mapping(uint256 => bool) public alreadyMinted;

    mapping(uint256 => Pack) public packs;
    mapping(uint256 => MarketplaceDistribution) private marketplaceDistributions;

    /// @notice Incremental ID for packs
    uint256 public packIncrementId;

    /// @notice ID of the last minted NFT
    uint256 public lastNFTID;

    /// @notice Indicates whether the contract is locked
    bool public _closed;

    /// @notice Tracks the number of opened packs
    uint256 public _openedPacks;

    /// @notice Tracks the number of bought packs
    uint256 public _boughtPacks;

    /// @notice Tracks the number of offered packs
    uint256 public _offeredPacks;

    /// @notice Start time of the sale
    uint256 public _saleStart;

    /// @notice End time of the sale
    uint256 public _saleEnd;

    /// @notice Structure to define a pack
    struct Pack {
        uint256 packId;
        uint256 nftAmount;
        uint256 initialNFTId;
        uint256[] saleDistributionAmounts;
        address[] saleDistributionAddresses;
        uint256 price;
        string serie;
        string packType;
        bool opened;
        address buyer;
    }

    /// @notice Structure to define marketplace distribution
    struct MarketplaceDistribution {
        uint256[] marketplaceDistributionAmounts;
        address[] marketplaceDistributionAddresses;
    }

    /// @notice Emitted when a new pack is created
    event PackCreated(uint256 packId, string indexed serie, string indexed packType, uint256 dropId);

    /// @notice Emitted when a pack is bought
    event PackBought(address indexed by, uint256 packId);

    /// @notice Emitted when a pack is opened
    event PackOpened(address indexed by, uint256 packId);

    /// @notice Emitted when a pack is deleted
    event PackDeleted(uint256 packId);

    /// @notice Emitted when an NFT is minted
    event NftMinted(uint256 nftId);

    /**
     * @notice Initializes the contract with the given parameters.
     * @param _title The title of the drop.
     * @param _description The description of the drop.
     * @param _cover The cover image URL of the drop.
     * @param _drop The ID of the drop.
     * @param _purchaseToken The ERC20 token used for purchases.
     * @param _simracingMoment The IAwardItem interface for NFT awarding.
     */
    function initialize(
        string memory _title,
        string memory _description,
        string memory _cover,
        uint256 _drop,
        IERC20 _purchaseToken,
        IAwardItem _simracingMoment
    ) public initializer {
        __Ownable_init();
        __ReentrancyGuard_init();

        purchaseToken = _purchaseToken;
        simracingMoment = _simracingMoment;
        title = _title;
        description = _description;
        cover = _cover;
        drop = _drop;

        packIncrementId = 1;
        lastNFTID = 1;
        _closed = false;
        _openedPacks = 0;
        _boughtPacks = 0;
        _offeredPacks = 0;
        _saleStart = 0;
        _saleEnd = 0;
    }

    /**
     * @notice Distributes pack shares to the specified addresses.
     * @dev Internal function used during pack purchase.
     * @param from The sender's address.
     * @param packId The ID of the pack.
     * @param amount The total amount to distribute.
     */
    function _distributePackShares(
        address from,
        uint256 packId,
        uint256 amount
    ) internal {
        Pack memory pack = packs[packId];
        for (uint i = 0; i < pack.saleDistributionAddresses.length; i++) {
            purchaseToken.safeTransferFrom(
                from,
                pack.saleDistributionAddresses[i],
                pack.saleDistributionAmounts[i].mul(amount).div(100)
            );
        }
    }

    /// @notice Sets the title of the drop
    function setTitle(string memory _title) public onlyOwner {
        title = _title;
    }
    
    /// @notice Sets the ID of the drop
    function setDrop(uint256 _drop) public onlyOwner {
        drop = _drop;
    }

    /// @notice Sets the cover image URL of the drop
    function setCover(string memory _cover) public onlyOwner {
        cover = _cover;
    }

    /// @notice Sets the description of the drop
    function setDescription(string memory _description) public onlyOwner {
        description = _description;
    }

    /// @notice Sets the start time for the sale
    function setSaleStart(uint256 saleStart) public onlyOwner {
        _saleStart = saleStart;
    }

    /// @notice Sets the end time for the sale
    function setSaleEnd(uint256 saleEnd) public onlyOwner {
        _saleEnd = saleEnd;
    }

    /// @notice Retrieves the registered IDs for a given address
    function getRegisteredIDs(
        address _address
    ) public view returns (uint256[] memory) {
        return registeredIDsArray[_address];
    }

    /// @notice Retrieves pack details by pack ID
    function getPackbyId(uint256 _packId) public view returns (Pack memory) {
        return packs[_packId];
    }

    /// @notice Retrieves marketplace distribution for a specific ERC721 token ID
    function getMarketplaceDistributionForERC721(
        uint256 _tokenId
    ) public view returns (uint256[] memory, address[] memory) {
        return (
            marketplaceDistributions[_tokenId].marketplaceDistributionAmounts,
            marketplaceDistributions[_tokenId].marketplaceDistributionAddresses
        );
    }

    /**
     * @notice Retrieves the price of a specific pack.
     * @param packId The ID of the pack.
     * @return The price of the pack in the purchase token.
     */
    function getPackPrice(uint256 packId) public view returns (uint256) {
        return packs[packId].price;
    }

    /**
     * @notice Allows a user to purchase a pack.
     * @param packId The ID of the pack to purchase.
     */
    function buyPack(uint256 packId) public {
        require(!_closed, "Contract is locked");
        require(packs[packId].buyer == address(0), "Pack already bought");
        require(packs[packId].price != 0, "Pack does not exist");
        require(block.timestamp >= _saleStart, "Sale has not started yet");
        require(block.timestamp <= _saleEnd, "Sale has finished already");

        uint256 price = packs[packId].price;

        require(
            purchaseToken.allowance(msg.sender, address(this)) >= price,
            "Insufficient allowance"
        );
        require(
            purchaseToken.balanceOf(msg.sender) >= price,
            "Insufficient balance"
        );

        _distributePackShares(msg.sender, packId, price);

        _boughtPacks = _boughtPacks.add(1);

        for (uint i = 0; i < packs[packId].nftAmount; i++) {
            registeredIDs[msg.sender][packs[packId].initialNFTId.add(i)] = true;
            registeredIDsArray[msg.sender].push(packs[packId].initialNFTId.add(i));
        }

        packs[packId].buyer = msg.sender;

        emit PackBought(msg.sender, packId);
    }

    /**
     * @notice Allows the owner of a pack to open it and make NFTs claimable.
     * @param packId The ID of the pack to open.
     */
    function openPack(uint256 packId) public {
        require(!_closed, "Contract is locked");
        require(!packs[packId].opened, "Pack already opened");
        require(packs[packId].buyer != address(0), "Pack not bought");
        require(packs[packId].buyer == msg.sender, "Not the pack buyer");
        require(block.timestamp >= _saleEnd, "Sale has not ended yet");

        _openedPacks = _openedPacks.add(1);
        packs[packId].opened = true;

        emit PackOpened(msg.sender, packId);
    }

    /**
     * @notice Creates a new pack with specified configurations.
     * @param nftAmount The number of NFTs in the pack.
     * @param price The price of the pack in the purchase token.
     * @param serie The series name of the pack.
     * @param packType The type of the pack.
     * @param saleDistributionAddresses The addresses to distribute the sale shares to.
     * @param saleDistributionAmounts The corresponding distribution percentages.
     * @param marketplaceDistributionAddresses Addresses for marketplace distribution.
     * @param marketplaceDistributionAmounts Corresponding distribution amounts for marketplace.
     */
    function createPack(
        uint256 nftAmount,
        uint256 price,
        string memory serie,
        string memory packType,
        address[] memory saleDistributionAddresses,
        uint256[] memory saleDistributionAmounts,
        address[] memory marketplaceDistributionAddresses,
        uint256[] memory marketplaceDistributionAmounts
    ) public onlyOwner {
        require(
            saleDistributionAmounts.length == saleDistributionAddresses.length,
            "Sale distribution lengths mismatch"
        );
        require(
            marketplaceDistributionAddresses.length == marketplaceDistributionAmounts.length,
            "Marketplace distribution lengths mismatch"
        );

        uint256 totalFees = 0;
        for (uint i = 0; i < saleDistributionAddresses.length; i++) {
            totalFees = totalFees.add(saleDistributionAmounts[i]);
        }
        require(totalFees == 100, "Total distribution percentages must equal 100");

        packs[packIncrementId] = Pack({
            packId: packIncrementId,
            nftAmount: nftAmount,
            initialNFTId: lastNFTID,
            price: price,
            serie: serie,
            saleDistributionAddresses: saleDistributionAddresses,
            saleDistributionAmounts: saleDistributionAmounts,
            packType: packType,
            opened: false,
            buyer: address(0)
        });

        for (uint j = 1; j <= nftAmount; j++) {
            marketplaceDistributions[lastNFTID.add(j)] = MarketplaceDistribution(
                marketplaceDistributionAmounts,
                marketplaceDistributionAddresses
            );
        }

        emit PackCreated(packIncrementId, serie, packType, drop);
        lastNFTID = lastNFTID.add(nftAmount);
        packIncrementId = packIncrementId.add(1);
    }

    /**
     * @notice Offers a pack to a specified recipient.
     * @param packId The ID of the pack to offer.
     * @param receivingAddress The address to receive the pack.
     */
    function offerPack(uint256 packId, address receivingAddress) public onlyOwner {
        require(packs[packId].packId == packId, "Pack does not exist");
        require(receivingAddress != address(0), "Invalid receiving address");

        Pack storage pack = packs[packId];
        pack.buyer = receivingAddress;

        uint256 nftAmount = pack.nftAmount;
        uint256 initialNFTId = pack.initialNFTId;

        for (uint i = 0; i < nftAmount; i++) {
            registeredIDs[receivingAddress][initialNFTId.add(i)] = true;
            registeredIDsArray[receivingAddress].push(initialNFTId.add(i));
        }

        _offeredPacks = _offeredPacks.add(1);

        emit PackBought(receivingAddress, packId);
    }

    /**
     * @notice Edits the information of an existing pack before the sale starts.
     * @param _packId The ID of the pack to edit.
     * @param serie The new series name.
     * @param packType The new pack type.
     * @param price The new price.
     */
    function editPackInfo(uint256 _packId, string memory serie, string memory packType, uint256 price) public onlyOwner {
        require(block.timestamp < _saleStart, "Sale has already started");
        packs[_packId].serie = serie;
        packs[_packId].packType = packType;
        packs[_packId].price = price;
    }

    /**
     * @notice Deletes a pack by its ID before the sale starts.
     * @param packId The ID of the pack to delete.
     */
    function deletePackById(uint256 packId) public onlyOwner {
        require(block.timestamp < _saleStart, "Sale has already started");
        delete packs[packId];
        emit PackDeleted(packId);
    }

    /**
     * @notice Mints NFTs in a batch by the owner.
     * @param receiver The address to receive the NFTs.
     * @param metadata An array of metadata for each NFT.
     */
    function mintInBatchByOwner(address receiver, string[] memory metadata) public onlyOwner {
        _mint(receiver, metadata);
    }

    /**
     * @notice Mints a specific NFT by the owner.
     * @param receiver The address to receive the NFT.
     * @param tokenIdToMint The ID of the NFT to mint.
     * @param metadata The metadata for the NFT.
     */
    function mintByOwner(address receiver, uint256 tokenIdToMint, string memory metadata) public onlyOwner {
        _mint(receiver, tokenIdToMint, metadata);
    }

    /**
     * @notice Mints NFTs in a batch for the caller.
     * @param metadata An array of metadata for each NFT.
     */
    function mintInBatch(string[] memory metadata) public {
        _mint(msg.sender, metadata);
    }

    /**
     * @notice Mints a specific NFT for the caller.
     * @param tokenIdToMint The ID of the NFT to mint.
     * @param metadata The metadata for the NFT.
     */
    function mint(uint256 tokenIdToMint, string memory metadata) public {
        _mint(msg.sender, tokenIdToMint, metadata);
    }

    /**
     * @dev Internal function to mint a batch of NFTs.
     * @param receiver The address to receive the NFTs.
     * @param metadata An array of metadata for each NFT.
     */
    function _mint(address receiver, string[] memory metadata) private {
        require(registeredIDsArray[receiver].length == metadata.length, "Metadata length mismatch with registered IDs");

        for (uint i = 0; i < registeredIDsArray[receiver].length; i++) {
            _mint(receiver, registeredIDsArray[receiver][i], metadata[i]);
        }
    }

    /**
     * @dev Internal function to mint a specific NFT.
     * @param receiver The address to receive the NFT.
     * @param tokenIdToMint The ID of the NFT to mint.
     * @param metadata The metadata for the NFT.
     */
    function _mint(address receiver, uint256 tokenIdToMint, string memory metadata) private nonReentrant {
        require(registeredIDs[receiver][tokenIdToMint], "Token not registered or not the rightful owner");
        require(!alreadyMinted[tokenIdToMint], "Already minted");

        alreadyMinted[tokenIdToMint] = true;
        simracingMoment.awardItem(receiver, payable(address(this)), 0, metadata);

        emit NftMinted(tokenIdToMint);
    }

    /// @notice Locks the contract, disabling core operations.
    function lock() public onlyOwner {
        _closed = true;
    }

    /// @notice Unlocks the contract, enabling core operations.
    function unlock() public onlyOwner {
        _closed = false;
    }

    uint256[50] private __gap;
}