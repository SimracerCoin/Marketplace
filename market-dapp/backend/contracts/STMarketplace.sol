pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "./ContentMarketplace.sol";

/// @title Simthunder Sim Racing Marketplace - first iteration
/// @notice Non-Cartesi blockchain code for registering sellers and sim racing assets

contract STMarketplace is ContentMarketplace {   

    bytes32 templateHash = 0x565ed3f9210522787f757fd3a4d2cb1714cd46523bcef460d3d630cd5a29c3aa;
    uint64 outputPosition = 0xc000000000000000;
    uint8 outputLog2Size = 5;
    uint256 finalTime = 1e11;
    uint256 roundDuration = 51;
    //DescartesInterface.Drive[] drives;

    // defines password size as 1024 bytes
    // uint64 passwordLog2Size = 10;

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
        string[] skinPic;
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

    // full representation of comment
    struct comment {
        uint256 itemId;
        address commentator;
        string description;
        uint256 review;
        string date;   
    }

    // /// @notice To track comments from item
    mapping(uint256 => comment[]) itemComments;
    mapping(string => comment[]) sellerComments;

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

    event deletedMarketPlaceItem(
        uint256 itemId
    );

    event deletedItemInfo(
        uint256 itemId
    );
    
    /**
    /// notice_ Creates an instance of the contract
    /// param_ descartesAddress address of the Descartes contract
    /// constructor(address descartesAddress) ContentMarketplace(descartesAddress) {
    }*/

    // new constructor, without descartes address supplied
    constructor(address payable_token) ContentMarketplace(payable_token) {
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
        string memory _nickname,
        string[] memory _imagePath       // ipfs path for image skin
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
        info.skinPic = _imagePath;

        carSkinIds.push(id);
        saveSeller(msg.sender, _nickname);
        emit skinSaved (msg.sender,_ipfsPath, _carBrand, _simulator, _price);

        return id;
    }

    function deleteItem(uint256 itemId, address _seller, bool isOwner, bool isSkin) private returns(bool) {

        bool deleted = deleteItemFromMarketplace(itemId, _seller, isOwner);
        if(deleted) {
            emit deletedMarketPlaceItem(itemId);

            //also delete comments
            if(itemComments[itemId].length > 0) {
                delete itemComments[itemId];
            }

            if(isSkin) {
                //delete maping
                delete carSkinInfos[itemId];
                emit deletedItemInfo(itemId);

                for(uint256 i = 0; i < carSkinIds.length; i++) {
                    if(carSkinIds[i] == itemId) {
                        carSkinIds[i] = carSkinIds[carSkinIds.length - 1];
                        carSkinIds.pop();
                        return true;
                    }
                }
            } else {
                //delete maping
                delete carSetupInfos[itemId];
                emit deletedItemInfo(itemId);

                for(uint256 i = 0; i < carSetupIds.length; i++) {
                    if(carSetupIds[i] == itemId) {
                        carSetupIds[i] = carSetupIds[carSetupIds.length - 1];
                        carSetupIds.pop();
                        return true;
                    }
                }
            }
        }
        return false;
    }

    function deleteSkin(uint256 itemId) public returns(bool) {
        require(isSkin(itemId),"Not a valid skin");
        bool isOwner = (msg.sender == owner);
        require(isOwner || isSeller(msg.sender),"caller is not a seller, neither the owner");
        return deleteItem(itemId, msg.sender, isOwner, true);
    }

    function deleteCarSetup(uint256 itemId) public returns(bool) {
        require(isCarSetup(itemId),"Not a valid car setup");
        bool isOwner = (msg.sender == owner);
        require(isOwner || isSeller(msg.sender),"caller is not a seller, neither the owner");
        return deleteItem(itemId, msg.sender, isOwner, false);
    }

     /// @notice Registers a new comment for item
    function newComment(
        uint256 _itemId,
        string memory _description,
        uint256 _review,
        string memory _date,
        string memory _sellerNickname
    ) public
        returns (comment memory comment_to_return)
    {
        comment memory _comment = comment(_itemId, msg.sender, _description, _review, _date);
        itemComments[_itemId].push(_comment);
        sellerComments[_sellerNickname].push(_comment);
        return _comment;
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
    function getNickname(address _address) public view returns(string memory) {
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

    /// @notice Gets the list of comments from item
     function getItemComments(uint256 _itemId) public view returns(comment[] memory comments_to_return) {
        return itemComments[_itemId];
    }

    /// @notice Gets the list of comments from item
     function getSellerComments(string memory _sellerNickname) public view returns(comment[] memory comments_to_return) {
        return sellerComments[_sellerNickname];
    }

    /// @notice Tests if car setup exists
    function isCarSetup(uint256 _address) public view returns(bool) {
        for(uint256 i = 0; i < carSetupIds.length; i++) {
            uint256 id = carSetupIds[i];
            if(id == _address) { return true; }
        }
        return false;
    }

    /// @notice Tests if skin exists
    function isSkin(uint256 _address) public view returns(bool) {
        for(uint256 i = 0; i < carSkinIds.length; i++) {
            uint256 id = carSkinIds[i];
            if(id == _address) { return true; }
        }
        return false;
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
    /*function addressToString(address _addr) public pure returns(string memory) 
    {
        //with 8.0 cannot convert anymore uint256(address)
        bytes32 value = bytes32( convertSolidity8(_addr));
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

    function convertSolidity8(address a) internal pure returns (uint256) {
        return uint256(uint160(a));
    }*/

    /**
    function instantiateCartesiVerification(address claimer, address challenger, uint256 _purchaseId, DescartesInterface.Drive[] memory drives) public returns (uint256 index) 
    {
        address[] memory actors = new address[](2);
        actors[0] = claimer;
        actors[1] = challenger;

        Purchase storage purchase = purchases[_purchaseId];
        Advertisement memory ad = getAd(purchase.adId);

        index = descartes.instantiate(
            finalTime,
            templateHash,
            outputPosition,
            outputLog2Size,
            roundDuration,
            actors,
            drives
        );

        purchase.descartesIndex = index;

        newNotification(_purchaseId, "Purchase was challenged. Check status.", address(0), ad.seller, NotificationType.Challenge);
        newNotification(_purchaseId, "Challenged purchase. Check status.", address(0), msg.sender, NotificationType.Challenge);

        return index;
    } */

    /**
    function getResult(
        uint256 index,                  // cartesi machine result index
        uint256 _purchaseId             // purchase request identifier
    ) public returns (bool, bool, address, bytes memory) {
        bool a;
        bool b;
        address c;
        bytes memory d;

        (a, b, c, d) = descartes.getResult(index);

        if(a && !b) {
            bool success = utilCompareInternal(d,bytes("1"));
            finalizePurchase(_purchaseId, success);
        }

        return (a, b, c, d);
    }*/

    /*function utilCompareInternal(bytes memory a, bytes memory b) internal returns (bool) {
        if (a.length != b.length) {
            return false;
        }
        for (uint i = 0; i < a.length; i++) {
            if(a[i] != b[i]) {
                return false;
            }
        }
        return true;
    }*/
}