pragma solidity ^0.5.1;
pragma experimental ABIEncoderV2;

contract IPFSInbox {    
    
    struct carSetup {
        string ipfsHash;
        string carBrand;
        string track;
        string simulator;
        string season;
        uint256 price;
        string _address;
    }
    
    struct skin {
        string ipfsHash;
        string carBrand;
        string simulator;
        uint256 price;
        string _address;
    }
    
    
    //Saves those 2 files
    mapping (address => carSetup[]) carsInbox;
    mapping (address => skin[]) skinsInbox;
    
    
    //To track if vendor address already exists
    mapping (address => bool) userExists;
    
    //Keep track of all vendor addresses and existing files
    address[] private userAddresses;
    string[] private ipfsList;
    uint256 public carsCounter;
    uint256 public skinsCounter;
        
    // Events
    event ipfsSaved(string _ipfsHash, address _address);
    event carSaved(address _address, string _ipfsHash, string _carBrand, string _track, string _simulator, string _season, uint256 _price);
    event skinSaved(address _address, string _ipfsHash, string _carBrand, string _simulator, uint256 _price);
    
    // An empty constructor that creates an instance of the contract
    constructor() public{
        carsCounter = 0;
        skinsCounter = 0;
    }    
    

    function saveCar(address _address, string memory _ipfsHash, string memory _carBrand, string memory _track, string memory _simulator, string memory _season, uint256 _price) public {
        string memory string_address = addressToString(_address);
        carSetup memory car = carSetup(_ipfsHash, _carBrand, _track, _simulator, _season, _price, string_address);
        carsInbox[_address].push(car);
        carsCounter++;
        ipfsList.push(_ipfsHash);
        emit carSaved(_address,_ipfsHash, _carBrand, _track, _simulator, _season, _price);
        if(userExists[_address] == false) {
            userExists[_address] = true;
            userAddresses.push(_address);    
        }
    }
    

    
    
    function saveSkin(address _address, string memory _ipfsHash, string memory _carBrand, string memory _simulator, uint256 _price) public {
        string memory string_address = addressToString(_address);
        skin memory newSkin = skin(_ipfsHash, _carBrand,  _simulator, _price, string_address);
        skinsInbox[_address].push(newSkin);
        skinsCounter++;
        ipfsList.push(_ipfsHash);
        emit skinSaved (_address,_ipfsHash, _carBrand, _simulator, _price);
        if(userExists[_address] == false) {
            userExists[_address] = true;
            userAddresses.push(_address);    
        }
    }

    function saveVendor(address _address) public returns(bool){
        if(userExists[_address] == false) {
            userExists[_address] = true;
            userAddresses.push(_address);
            return true;    
        }
        return false;
    }
    
    function getCars() public view returns(carSetup[] memory allCars){
        carSetup[] memory cars = new carSetup[](carsCounter);
        uint256 i = 0;
        for(uint256 j = 0; j < userAddresses.length; j++) {
            address _address =  userAddresses[j];
            
            for(uint256 k = 0; k < carsInbox[_address].length; k++) {
                carSetup storage car = carsInbox[_address][k];
                cars[i] = car;
                i++;
            }
        }
        return cars;
    }
    
    function getSkins() public view returns(skin[] memory allSkins){
        skin[] memory skins = new skin[](skinsCounter);
        uint256 i = 0;
        for(uint256 j = 0; j < userAddresses.length; j++) {
            address _address =  userAddresses[j];
            
            for(uint256 k = 0; k < skinsInbox[_address].length; k++) {
                skin storage skin2 = skinsInbox[_address][k];
                skins[i] = skin2;
                i++;
            }
        }
        return skins;
    }

    function isVendor(address _address) public view returns(bool) {
        return userExists[_address];
    }
    
    
    function getNumberVendors() public view returns(uint256) {
        return userAddresses.length;
    }
    
    function getNumberCars() public view returns(uint256) {
        return carsCounter;
    }
    
    function getNumberSkins() public view returns(uint256) {
        return skinsCounter;
    }
    
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