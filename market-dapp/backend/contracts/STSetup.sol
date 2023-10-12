// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "./STStorage.sol";

contract STSetup is STStorage {
    
    /// @notice Registers a new car setup for sale
    function newSetup(
        bytes memory _ipfsPath,        // ipfs path of encrypted data
        string memory _carBrand,
        string memory _track,
        string memory _simulator,
        string memory _season,
        string memory _series,
        string memory _description,
        uint256 _price,                // trade price
        bytes32 _encryptedDataHash,    // merkle hash of encrypted data
        string memory _nick
    ) external returns (uint256 adId)
    {
        adId = createAd(
            _price,
            _encryptedDataHash,
            _ipfsPath,
            _nick
        );

        setupInfo storage info = setupInfos[adId];
        info.carBrand = _carBrand;
        info.track = _track;
        info.simulator = _simulator;
        info.season = _season;
        info.series = _series;
        info.description = _description;
        
        setupIds.push(adId);
    }

    /// @notice Registers a new car setup for sale
    function editSetup(
        uint256 _adId,
        string memory _carBrand,
        string memory _track,
        string memory _simulator,
        string memory _season,
        string memory _series,
        string memory _description,
        uint256 _price                // trade price
    ) external
    {
        editAd(
            _adId,
            _price
        );

        setupInfo storage info = setupInfos[_adId];
        info.carBrand = _carBrand;
        info.track = _track;
        info.simulator = _simulator;
        info.season = _season;
        info.series = _series;
        info.description = _description;
    }

    /// @notice Gets the list of all car setup files
    function getSetups() external view returns(Setup[] memory setups) 
    {    
        setups = new Setup[](setupIds.length);

        for (uint256 i = 0; i < setupIds.length; i++) {
            setups[i] = Setup(setupIds[i], ads[setupIds[i]], setupInfos[setupIds[i]]);
        }
    }

    /// @notice Get car setup by Id
    function getSetup(uint256 _adId) public view returns(Setup memory) 
    {
        require(isSetup(_adId), "ad not found");
        return Setup(_adId, ads[_adId], setupInfos[_adId]);
    }
}