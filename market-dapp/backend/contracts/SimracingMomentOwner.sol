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

contract SimracingMomentOwner is ERC721, Ownable {

    ERC20 SIMRACERCOIN; //pay with simracercoin
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    mapping(uint256 => uint256) prices;
    mapping(uint256 => address payable) seriesOwners;

    /**
     * @notice The constructor for the Simthunder Owner NFT contract.
     * @param payable_token Address of SRC ERC20 contract, the contract in wich we pay the transactions
     */
    constructor(address payable_token) public ERC721("Simthunder Moment", "STCLIP") {
        SIMRACERCOIN = ERC20(payable_token);
    }

    function awardItem(address recipient, address payable seriesOwner, uint256 itemPrice, string memory metadata) public returns (uint256) {   
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        _mint(recipient, newItemId);
        prices[newItemId] = itemPrice;
        seriesOwners[newItemId] = seriesOwner;
        _setTokenURI(newItemId, metadata);
        return newItemId;
    }

    function buyItem(uint256 itemId, uint256 itemPrice) external {
        require(itemPrice == prices[itemId], "Check the item price");
        address accountAddress = seriesOwners[itemId];


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
        if(!isNFTOwner) {
            approve(_seller, itemId);
        }
        delete seriesOwners[itemId];
        if(nftOwner != _seller) {
            return transferFrom(nftOwner, _seller, itemId);
        }

    }

    function currentTokenId() public returns (uint256) {
        return _tokenIds.current();
    }
}
