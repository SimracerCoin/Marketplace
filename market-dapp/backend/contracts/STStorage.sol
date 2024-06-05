// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ContentMarketplaceTypes.sol";

abstract contract STStorage is Pausable, Ownable {

    // storage of advertisements
    uint256 internal numAds = 0;
    mapping(uint256 => Advertisement) internal ads;

    uint256 internal numUsers = 0;
    mapping (address => User) internal users;

    // /// @notice Maps the 2 type of files
    mapping(uint256 => setupInfo) internal setupInfos;
    mapping(uint256 => skinInfo) internal skinInfos;
    uint256[] internal setupIds;
    uint256[] internal skinIds;

    uint256[50] private __gap;  // Storage gap of 50 slots (32 bytes each)

    event UserCreated(address addr);
    event AdCreated(address seller, uint256 price, bytes ipfsPath);
    event AdEdited(address seller, uint256 price);

    function createAd(
        address _seller,
        uint256 _price,                // trade price
        bytes32 _encryptedDataHash,    // merkle hash of encrypted data
        bytes memory _ipfsPath,        // ipfs path of encrypted data
        string memory _nick
    ) internal whenNotPaused returns (uint256 adId)
    {
        createSeller(_seller, _nick);

        Advertisement storage ad = ads[numAds];
        ad.seller = payable(_seller);
        ad.price = _price;
        ad.encryptedDataHash = _encryptedDataHash;
        ad.ipfsPath = _ipfsPath;
        ad.active = true;

        adId = numAds++;

        emit AdCreated(_seller, _price, _ipfsPath);
    }

    /// @notice edit an advertisement
    function editAd(
        address _seller,
        uint256 _adId,
        uint256 _price                // trade price
    ) internal whenNotPaused
    {
        require(ads[_adId].active, "ad not found");
        require(_seller == owner() || _seller == ads[_adId].seller, "unauthorized call");

        ads[_adId].price = _price;

        emit AdEdited(_seller, _price);
    }

    /// @notice Registers seller address
    function createSeller(address _seller, string memory _nick) public 
    {
        if(!isSeller(_seller)) {
            users[_seller] = User(_seller, true, false, _nick);
            numUsers++;

            emit UserCreated(_seller);
        }
    }

    function isSeller(address _seller) public view returns(bool) 
    {
        return users[_seller].id != address(0);
    }

    /// @notice Tests if car setup exists
    function isSetup(uint256 _adId) public view returns(bool) 
    {
        for(uint256 i = 0; i < setupIds.length; i++) {
            if(_adId == setupIds[i]) { return true; }
        }
        return false;
    }

    /// @notice Tests if skin exists
    function isSkin(uint256 _adId) public view returns(bool) 
    {
        for(uint256 i = 0; i < skinIds.length; i++) {
            if(_adId == skinIds[i]) { return true; }
        }
        return false;
    }
}