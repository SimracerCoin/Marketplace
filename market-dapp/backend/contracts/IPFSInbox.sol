pragma solidity >0.5.2;
pragma experimental ABIEncoderV2;

contract IPFSInbox {    
    
    mapping (address => string[]) ipfsInbox;
    mapping (string => uint256) fileIpfsPrice;
    mapping (address => bool) userExists;
    
    address[] private userAddresses;
    string[] private ipfsList;
    
    // Events
    event ipfsSent(string _ipfsHash, address _address);
    event inboxResponse(string response);    
    
    
    // An empty constructor that creates an instance of the contract
    constructor() public {}    
    
    
    function saveIPFS(address _address, string memory _ipfsHash, uint256 _filePrice) public {
        ipfsInbox[_address].push(_ipfsHash);
        fileIpfsPrice[_ipfsHash] = _filePrice;
        ipfsList.push(_ipfsHash);
        if(userExists[_address] == false) {
            userExists[_address] = true;
            userAddresses.push(_address);    
        }
        
    }
    
    function getNumberItems()  public view returns(uint256){
        uint256 items_length = 0;
        for(uint256 i = 0; i < userAddresses.length; i++) {
            items_length += ipfsInbox[userAddresses[i]].length;
        }
        
        return items_length;
    }
    
    
    function getNumberVendors() public view returns(uint256) {
        return userAddresses.length;
    }
    
    
    function getItemsFromVendor(address _address) public view returns(string[] memory) {
        return ipfsInbox[_address];
    }
    
    function getItems() public view returns(string[] memory) {
        return ipfsList;
    }
}