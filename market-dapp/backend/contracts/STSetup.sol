// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "./STStorage.sol";

contract STSetup is STStorage {
    
    /// @notice Registers a new car setup for sale
    function _newSetup(
        address _seller,
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
    ) private returns (uint256 adId)
    {
        adId = createAd(
            _seller,
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
    ) external returns (uint256)
    {
        return _newSetup(_msgSender(), _ipfsPath, _carBrand, _track, _simulator, _season, _series, _description, _price, _encryptedDataHash, _nick);
    }

    function newSetupByOwner(
        address _seller,
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
    ) external onlyOwner returns (uint256)
    {
        return _newSetup(_seller, _ipfsPath, _carBrand, _track, _simulator, _season, _series, _description, _price, _encryptedDataHash, _nick);
    }

    /// @notice Registers a new car setup for sale
    function _editSetup(
        address _seller,
        uint256 _adId,
        string memory _carBrand,
        string memory _track,
        string memory _simulator,
        string memory _season,
        string memory _series,
        string memory _description,
        uint256 _price                // trade price
    ) private
    {
        editAd(
            _seller,
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
        _editSetup(_msgSender(), _adId, _carBrand, _track, _simulator, _season, _series, _description, _price);
    }

    function editSetupByOwner(
        address _seller,
        uint256 _adId,
        string memory _carBrand,
        string memory _track,
        string memory _simulator,
        string memory _season,
        string memory _series,
        string memory _description,
        uint256 _price                // trade price
    ) external onlyOwner
    {
        _editSetup(_seller, _adId, _carBrand, _track, _simulator, _season, _series, _description, _price);
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