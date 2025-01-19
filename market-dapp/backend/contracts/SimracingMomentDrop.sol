// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

interface IAwardItem {
    function awardItem(
        address recipient,
        address payable seriesOwner,
        uint256 itemPrice,
        string memory metadata
    ) external returns (uint256);
}

/// @title SimracingMomentDrop
/// @notice This contract manages the creation, sale, and distribution of NFT packs for sim racing moments.
contract SimracingMomentDrop is Ownable, ReentrancyGuard {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    IERC20 public purchaseToken;
    IAwardItem public simracingMoment;

    uint256 public drop;
    string public _title;
    string public _description;
    string public _cover;

    mapping(address => mapping(uint256 => bool)) public registeredIDs;
    mapping(address => uint256[]) public registeredIDsArray;
    mapping(uint256 => bool) public alreadyMinted;

    mapping(uint256 => Pack) public packs;
    mapping(address => uint256[]) public packsBuyer;
    mapping(uint256 => MarketplaceDistribution) private marketplaceDistributions;

    uint256 public packIncrementId;
    uint256 public lastNFTID;

    bool public _closed;
    uint256 public _openedPacks;
    uint256 public _boughtPacks;
    uint256 public _offeredPacks;

    uint256 public _saleStart;

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

    struct MarketplaceDistribution {
        uint256[] marketplaceDistributionAmounts;
        address[] marketplaceDistributionAddresses;
    }

    event PackCreated(uint256 packId, string indexed serie, string indexed packType, uint256 dropId);
    event PackBought(address indexed by, uint256 packId);
    event PackOpened(address indexed by, uint256 packId);
    event PackDeleted(uint256 packId);
    event NftMinted(uint256 nftId);

    constructor(
        string memory title,
        string memory description,
        string memory cover,
        uint256 _drop,
        IERC20 _purchaseToken,
        IAwardItem _simracingMoment
    ) {
        purchaseToken = _purchaseToken;
        simracingMoment = _simracingMoment;
        _title = title;
        _description = description;
        _cover = cover;
        drop = _drop;

        packIncrementId = 1;
        lastNFTID = 1;
        _closed = false;
        _openedPacks = 0;
        _boughtPacks = 0;
        _offeredPacks = 0;
        _saleStart = 0;
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
    function setTitle(string memory title) public onlyOwner {
        _title = title;
    }
    
    /// @notice Sets the ID of the drop
    function setDrop(uint256 _drop) public onlyOwner {
        drop = _drop;
    }

    /// @notice Sets the cover image URL of the drop
    function setCover(string memory cover) public onlyOwner {
        _cover = cover;
    }

    /// @notice Sets the description of the drop
    function setDescription(string memory description) public onlyOwner {
        _description = description;
    }

    /// @notice Sets the start time for the sale
    function setSaleStart(uint256 saleStart) public onlyOwner {
        _saleStart = saleStart;
    }

    function getDrop() public view returns(
        uint256 id,
        string memory title,
        string memory cover,
        string memory description,
        uint256 totalPacks,
        uint256 saleStart,
        bool saleEnd,
        uint256 boughtPacks,
        bool closed
    ) {
        id = drop;
        title = _title;
        cover = _cover;
        description = _description;
        totalPacks = packIncrementId - 1;
        saleStart = _saleStart;
        saleEnd = totalPacks - _boughtPacks == 0;
        boughtPacks = _boughtPacks;
        closed = _closed;
    }

    /// @notice Retrieves the registered IDs for a given address
    function getRegisteredIDs(
        address _address
    ) public view returns (uint256[] memory) {
        return registeredIDsArray[_address];
    }

    /// @notice Retreives pack ids for a given address
    function getPacksByBuyer(
        address _address
    ) public view returns (uint256[] memory) {
        return packsBuyer[_address];
    }

    /// @notice Retrieves pack details by pack ID
    function getPackById(uint256 packId) public view returns (Pack memory) {
        return packs[packId];
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
    function buyPack(uint256 packId) public nonReentrant {
        require(!_closed, "Contract is locked");
        require(packs[packId].buyer == address(0), "Pack already bought");
        require(packs[packId].price != 0, "Pack does not exist");
        require(block.timestamp >= _saleStart, "Sale has not started yet");

        uint256 price = packs[packId].price;

        require(
            purchaseToken.allowance(_msgSender(), address(this)) >= price,
            "Insufficient allowance"
        );
        require(
            purchaseToken.balanceOf(_msgSender()) >= price,
            "Insufficient balance"
        );

        _distributePackShares(_msgSender(), packId, price);

        _boughtPacks = _boughtPacks.add(1);

        for (uint i = 0; i < packs[packId].nftAmount; i++) {
            registeredIDs[_msgSender()][packs[packId].initialNFTId.add(i)] = true;
            registeredIDsArray[_msgSender()].push(packs[packId].initialNFTId.add(i));
        }

        packs[packId].buyer = _msgSender();
        packsBuyer[_msgSender()].push(packId);

        emit PackBought(_msgSender(), packId);
    }

    /**
     * @notice Allows the owner of a pack to open it and make NFTs claimable.
     * @param packId The ID of the pack to open.
     */
    function openPack(uint256 packId) public {
        require(!_closed, "Contract is locked");
        require(!packs[packId].opened, "Pack already opened");
        require(packs[packId].buyer != address(0), "Pack not bought");
        require(packs[packId].buyer == _msgSender(), "Not the pack buyer");

        _openedPacks = _openedPacks.add(1);
        packs[packId].opened = true;

        emit PackOpened(_msgSender(), packId);
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

    function isMinted(uint256 tokenId) public view returns (bool) {
        return alreadyMinted[tokenId];
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
        _mint(_msgSender(), metadata);
    }

    /**
     * @notice Mints a specific NFT for the caller.
     * @param tokenIdToMint The ID of the NFT to mint.
     * @param metadata The metadata for the NFT.
     */
    function mint(uint256 tokenIdToMint, string memory metadata) public nonReentrant {
        _mint(_msgSender(), tokenIdToMint, metadata);
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
    function _mint(address receiver, uint256 tokenIdToMint, string memory metadata) private {
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
}