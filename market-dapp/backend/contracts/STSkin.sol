// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "./STStorage.sol";

contract STSkin is STStorage {

    /// @notice Registers a new car skin for sale
    function newSkin(
        bytes memory _ipfsPath,        // ipfs path of encrypted data
        string memory _carBrand,
        string memory _simulator,
        uint256 _price,                   // trade price
        bytes32 _encryptedDataHash,       // merkle hash of encrypted data
        string memory _nick,
        string[] memory _imagePath,       // ipfs path for image skin
        string memory _description,
        string memory _designer,
        string memory _license
    ) external returns (uint256 id)
    {
        id = createAd(
            _price,
            _encryptedDataHash,
            _ipfsPath,
            _nick
        );

        skinInfo storage info = skinInfos[id];
        info.carBrand = _carBrand;
        info.simulator = _simulator;
        info.skinPic = _imagePath;
        info.description = _description;
        info.designer = _designer;
        info.license = _license;

        skinIds.push(id);
    }

    /// @notice Registers a new car skin for sale
    function editSkin(
        uint256 _adId,
        string memory _carBrand,
        string memory _simulator,
        uint256 _price,                   // trade price
        string[] memory _imagePath,       // ipfs path for image skin
        string memory _description,
        string memory _designer,
        string memory _license
    ) external
    {
        editAd(
            _adId,
            _price
        );

        skinInfo storage info = skinInfos[_adId];
        info.carBrand = _carBrand;
        info.simulator = _simulator;
        info.skinPic = _imagePath;
        info.description = _description;
        info.designer = _designer;
        info.license = _license;
    }
    
    /// @notice Gets the list of all skin files
    function getSkins() external view returns(Skin[] memory skins) {
        skins = new Skin[](skinIds.length);

        for(uint256 i = 0; i < skinIds.length; i++) {
            skins[i] = Skin(skinIds[i], ads[skinIds[i]], skinInfos[skinIds[i]]);
        }
    }

    /// @notice Get skin by Id
    function getSkin(uint256 _adId) public view returns(Skin memory) {
        require(isSkin(_adId), "ad not found");
        return Skin(_adId, ads[_adId], skinInfos[_adId]);
    }
}