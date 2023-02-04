// File: @openzeppelin/contracts/utils/Context.sol

// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
// NOTE IF building on Remix use the same solidity version of openzeppelin, that is here on the package.json
// 3.1.0-solc-0.7 this is to avoid issues with versions/deprecated/change functions, etc:
// import "@openzeppelin/contracts@3.1.0-solc-0.7/utils/Counters.sol";
// import "@openzeppelin/contracts@3.1.0-solc-0.7/token/ERC721/ERC721.sol";
// import "@openzeppelin/contracts@3.1.0-solc-0.7/token/ERC20/ERC20.sol";
//import "@openzeppelin/contracts@3.1.0-solc-0.7/access/Ownable.sol";

contract SimthunderOwner is ERC721, Ownable {

    ERC20 SIMRACERCOIN; //pay with simracercoin
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    mapping(uint256 => uint256) prices;
    mapping(uint256 => address payable) seriesOwners;

    event itemEntryDeleted (
        uint256 itemId
    );

    event itemTransferred (
        uint256 itemId,
        address oldOwner,
        address newOwner
    );

    /**
     * @notice The constructor for the Simthunder Owner NFT contract.
     * @param payable_token Address of SRC ERC20 contract, the contract in wich we pay the transactions
     */
    constructor(address payable_token) public ERC721("Simthunder Owner", "STCAR") {
        SIMRACERCOIN = ERC20(payable_token);
    }

    function awardItem(address recipient, address payable seriesOwner, uint256 itemPrice, string memory metadata) public returns (uint256) {   
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        _mint(recipient, newItemId);
        prices[newItemId] = itemPrice;
        seriesOwners[newItemId] = seriesOwner;
        _setTokenURI(newItemId, metadata);
        //setApprovalForAll(address(this),true);
        return newItemId;
    }

    /**
     * @notice Get price and owner of an item
     * @param itemId Item id to get info
     * @return array Price and owner
     */
    function getItem(uint256 itemId) external view returns (uint256, address) {
        return (prices[itemId], seriesOwners[itemId]);
    }

    /**
     * Put an item for sale, directly from user wallet
     */
    function sellFromWallet(uint256 itemId, uint256 itemPrice) external {
        //check if it was bought here first
        require(prices[itemId] > 0, "The item does not exist on this marketplace");
        //know if the item was on marketplace before
        address nftOwner = ownerOf(itemId);
        //make sure the sender is the current owner
        require(nftOwner == msg.sender,"Sender is not the owner of the item, or the item does not exist");
        require(seriesOwners[itemId] != msg.sender, "You already listed this item");

        approve(address(this), itemId);
        prices[itemId] = itemPrice;
        seriesOwners[itemId] = msg.sender;
        return _transfer(msg.sender, address(this), itemId);
    }

    function buyItem(uint256 itemId, uint256 itemPrice) external {
        require(itemPrice == prices[itemId], "Check the item price");
        address accountAddress = seriesOwners[itemId];
        //accountAddress.transfer(prices[itemId]);
        //return _transfer(address(this), msg.sender, itemId);

        require(SIMRACERCOIN.allowance(msg.sender, address(this)) >= prices[itemId], "Check the token allowance");
        require(SIMRACERCOIN.transferFrom(msg.sender, accountAddress, prices[itemId]),"Cannot transfer NFT ownership");
        return _transfer(address(this), msg.sender, itemId);
    }

    function deleteItem(uint256 itemId) external {
        //original seller
        address _seller = seriesOwners[itemId];
        //check if exists
        require(_seller != address(0),"There is no seller for this item or the item does not exist");
        //check if is either seller or contrct owner
        address nftOwner = ownerOf(itemId);
        bool isContractOwner = (msg.sender == owner());
        bool isNFTOwner = (msg.sender == nftOwner);

        require(isContractOwner || isNFTOwner, "Not authorized to delete this item");
        delete seriesOwners[itemId];
        emit itemEntryDeleted(itemId);

        //otherwise its already where it belongs, no need to transfer any ownership
        if(nftOwner != _seller) {
            //already approved
            if(isContractOwner) {
                _transfer(address(this), _seller, itemId);
                emit itemTransferred(itemId, nftOwner, _seller);
            } else {
                approve(address(this), itemId);
                _transfer(nftOwner, _seller, itemId);
                emit itemTransferred(itemId, nftOwner, _seller);
            }
        }
    }

    function currentTokenId() public returns (uint256) {
        return _tokenIds.current();
    }
}
