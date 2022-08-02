// File: @openzeppelin/contracts/utils/Context.sol

// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
// NOTE IF building on Remix use the same solidity version of openzeppelin, that is here on the package.json
// 3.1.0-solc-0.7 this is to avoid issues with versions/deprecated/change functions, etc:
// import "@openzeppelin/contracts@3.1.0-solc-0.7/utils/Counters.sol";
// import "@openzeppelin/contracts@3.1.0-solc-0.7/token/ERC721/ERC721.sol";
// import "@openzeppelin/contracts@3.1.0-solc-0.7/token/ERC20/ERC20.sol";

contract SimracingMomentOwner is ERC721 {

    ERC20 SIMRACERCOIN; //pay with simracercoin
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    mapping(uint256 => uint256) prices;
    mapping(uint256 => address payable) seriesOwners;

    //NOT used, like CarOwnership on CarOwnership is not used either
    struct MomentOwnership {
        uint256 price;
        address seriesOwner;
        string skinPic;
        string series;
    }

    /**
     * @notice The constructor for the Simthunder Owner NFT contract.
     * @param payable_token Address of SRC ERC20 contract, the contract in wich we pay the transactions
     */
    constructor(address payable_token) public ERC721("Simracing Moment NFT", "SRM") {
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

    function currentTokenId() public returns (uint256) {
        return _tokenIds.current();
    }
}
