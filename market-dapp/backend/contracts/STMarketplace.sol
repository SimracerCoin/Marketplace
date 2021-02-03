pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "./ContentMarketplace.sol";

/// @title Simthunder Sim Racing Marketplace - first iteration
/// @notice Non-Cartesi blockchain code for registering sellers and sim racing assets

contract STMarketplace is ContentMarketplace {    

    // cartesi machine template used to validate each asset category
    bytes32 validateCarSetupTemplateHash = "0x123";
    bytes32 validateCarSkinTemplateHash = "0x456";
    
    // holds information specific to a car setup file
    struct carSetupInfo {
        string carBrand;
        string track;
        string simulator;
        string season;
        string description;
        string series;
    }
       
    // holds information specific to a car skin file
    struct carSkinInfo {
        string carBrand;
        string simulator;
    }
       
    // full representation of an advertised car setup
    struct carSetup {
        uint256 id;         // id of the advertisement
        Advertisement ad;   // generic ad information, including seller and content
        carSetupInfo info;  // specific car setup information
    }
       
    // full representation of an advertised car skin
    struct carSkin {
        uint256 id;         // id of the advertisement
        Advertisement ad;   // generic ad information, including seller and content
        carSkinInfo info;   // specific car skin information
    }

    // /// @notice Maps the 2 type of files
    mapping(uint256 => carSetupInfo) carSetupInfos;
    mapping(uint256 => carSkinInfo) carSkinInfos;
    uint256[] carSetupIds;
    uint256[] carSkinIds;
    
    // /// @notice To track if seller address already exists
    mapping (address => bool) userExists;

    // /// @notice To mapping user and his nickname
    mapping (address => string) userNickname;
    
    // /// @notice Keep track of all seller addresses and existing files
    address[] private userAddresses;

    /// @notice Events
    event carSetupSaved(address _address, bytes _ipfsPath, string _carBrand, string _track, string _simulator, string _season, uint256 _price);
    event skinSaved(address _address, bytes _ipfsPath, string _carBrand, string _simulator, uint256 _price);
    
    /// @notice Creates an instance of the contract
    /// @param descartesAddress address of the Descartes contract
    constructor(address descartesAddress) ContentMarketplace(descartesAddress) {
    }    
    
    /// @notice Registers a new car setup for sale
    function newCarSetup(
        bytes memory _ipfsPath,        // ipfs path of encrypted data
        string memory _carBrand,
        string memory _track,
        string memory _simulator,
        string memory _season,
        string memory _series,
        string memory _description,
        uint256 _price,                // trade price
        bytes32 _dataHash,             // merkle hash of unencrypted data
        bytes32 _encryptedDataHash,    // merkle hash of encrypted data
        string memory _nickname
    ) public
        returns (uint256 id)           // returns ad identifier
    {
        id = createAd(
            _price,
            _dataHash,
            _encryptedDataHash,
            _ipfsPath,
            validateCarSetupTemplateHash
        );

        carSetupInfo storage info = carSetupInfos[id];
        info.carBrand = _carBrand;
        info.track = _track;
        info.simulator = _simulator;
        info.season = _season;
        info.series = _series;
        info.description = _description;
        
        carSetupIds.push(id);
        saveSeller(msg.sender, _nickname);

        emit carSetupSaved(msg.sender, _ipfsPath, _carBrand, _track, _simulator, _season, _price);

        return id;
    }

    /// @notice Registers a new car skin for sale
    function newSkin(
        bytes memory _ipfsPath,        // ipfs path of encrypted data
        string memory _carBrand,
        string memory _simulator,
        uint256 _price,                // trade price
        bytes32 _dataHash,             // merkle hash of unencrypted data
        bytes32 _encryptedDataHash,    // merkle hash of encrypted data
        string memory _nickname
    ) public
        returns (uint256 id)           // returns ad identifier
    {
        id = createAd(
            _price,
            _dataHash,
            _encryptedDataHash,
            _ipfsPath,
            validateCarSkinTemplateHash
        );

        carSkinInfo storage info = carSkinInfos[id];
        info.carBrand = _carBrand;
        info.simulator = _simulator;

        carSkinIds.push(id);
        saveSeller(msg.sender, _nickname);
        emit skinSaved (msg.sender,_ipfsPath, _carBrand, _simulator, _price);

        return id;
    }

    /// @notice Registers seller address
    function saveSeller(address _address, string memory _nickname) public returns(bool){
        if(userExists[_address] == false) {
            userExists[_address] = true;
            userAddresses.push(_address);
            userNickname[_address] = _nickname;
            return true;    
        }
        return false;
    }

    /// @notice Registers seller address
    function getNickname(address _address) public returns(string memory) {
        return userNickname[_address];
    }
    
    /// @notice Gets the list of all car setup files
    function getCarSetups() public view returns(carSetup[] memory setups){
        setups = new carSetup[](carSetupIds.length);
        for (uint256 i = 0; i < carSetupIds.length; i++) {
            uint256 id = carSetupIds[i];
            setups[i].id = id;
            setups[i].ad = ads[id];
            setups[i].info = carSetupInfos[id];
        }
        return setups;
    }
    
    /// @notice Gets the list of all skin files
    function getSkins() public view returns(carSkin[] memory skins){
        skins = new carSkin[](carSkinIds.length);
        for(uint256 i = 0; i < carSkinIds.length; i++) {
            uint256 id = carSkinIds[i];
            skins[i].id = id;
            skins[i].ad = ads[id];
            skins[i].info = carSkinInfos[id];
        }
        return skins;
    }

    /// @notice Tests if sellers exists
    function isSeller(address _address) public view returns(bool) {
        return userExists[_address];
    }
    
    /// @notice Gets number of sellers
    function getNumberSellers() public view returns(uint256) {
        return userAddresses.length;
    }
    
    /// @notice Gets number of car setup files
    function getNumberCars() public view returns(uint256) {
        return carSetupIds.length;
    }
    
    /// @notice Gets number of skin files
    function getNumberSkins() public view returns(uint256) {
        return carSkinIds.length;
    }
    
    /// @notice Utility method to return string from an address
    function addressToString(address _addr) public pure returns(string memory) 
    {
        bytes32 value = bytes32(uint256(_addr));
        bytes memory alphabet = "0123456789abcdef";

        bytes memory str = new bytes(51);
        str[0] = '0';
        str[1] = 'x';
        for (uint256 i = 0; i < 20; i++) {
            str[2+i*2] = alphabet[uint8(value[i + 12] >> 4)];
            str[3+i*2] = alphabet[uint8(value[i + 12] & 0x0f)];
        }
        return string(str);
    }
}