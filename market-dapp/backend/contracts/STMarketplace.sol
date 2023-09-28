pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/utils/Pausable.sol";
import "./Migratable.sol";
import "./ContentMarketplace.sol";

/// @title Simthunder Sim Racing Marketplace - first iteration
/// @notice Non-Cartesi blockchain code for registering sellers and sim racing assets

contract STMarketplace is ContentMarketplace, Migratable, Pausable {   

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

    // /// @notice To track comments from item
    mapping(uint256 => Comment[]) itemComments;
    mapping(address => Comment[]) sellerComments;

    // /// @notice Maps the 2 type of files
    mapping(uint256 => carSetupInfo) carSetupInfos;
    mapping(uint256 => carSkinInfo) carSkinInfos;
    uint256[] carSetupIds;
    uint256[] carSkinIds;

    uint256 numUsers = 0;
    mapping (address => User) users;

    /// @notice Events
    event carSetupSaved(address _address, bytes _ipfsPath, string _carBrand, string _track, string _simulator, string _season, uint256 _price);
    event skinSaved(address _address, bytes _ipfsPath, string _carBrand, string _simulator, uint256 _price);
    event userSaved(address _address);
    event deletedMarketPlaceItem(uint256 itemId);
    event deletedItemInfo(uint256 itemId);
    
    /**
    /// notice_ Creates an instance of the contract
    /// param_ descartesAddress address of the Descartes contract
    /// constructor(address descartesAddress) ContentMarketplace(descartesAddress) {
    }*/

    // new constructor, without descartes address supplied
    constructor(address payable_token) ContentMarketplace(payable_token) {
    } 

    function migrateData(
        address _oldContractAddr,
        uint256 _startIndex, 
        uint256 _endIndex
    ) external override onlyOwner
    {
        require(_startIndex <= _endIndex, "Invalid range");

        Migratable oldContract = Migratable(_oldContractAddr);

        for (uint256 i = _startIndex; i < _endIndex; i++) {
            (Advertisement memory _ad, 
            carSetupInfo memory _carSetupInfo,
            carSkinInfo memory _carSkinInfo,
            User memory _user,
            Comment[] memory _comments,
            Purchase[] memory _purchases, 
            Notification[] memory _notifications,
            ItemType _type) = oldContract.getData(i);

            address sellerAddr = _ad.seller;

            // import ad
            ads[numAds] = _ad;
            adsPerSeller[sellerAddr].push(numAds);

            // import user if not exists
            if(!isSeller(sellerAddr)) {
                users[sellerAddr] = _user;
                numUsers++; 
            }

            // import details
            if(_type == ItemType.Setup) {
                carSetupInfos[numAds] = _carSetupInfo;
                carSetupIds.push(numAds);
            } else if (_type == ItemType.Skin) {
                carSkinInfos[numAds] = _carSkinInfo;
                carSkinIds.push(numAds);
            }
            
            // import comments
            for(uint256 j = 0; j < _comments.length; ++j) {
                itemComments[numAds].push(_comments[j]);
                sellerComments[sellerAddr].push(_comments[j]);
            }
            
            // import purchases
            for(uint256 j = 0; j < _purchases.length; ++j) {
                purchases[numPurchases] = _purchases[j];
                purchasesPerAd[numAds].push(numPurchases);
                numPurchases++;
            }

            // import notifications
            for(uint256 j = 0; j < _notifications.length; ++j) {
                notifications[numNotifications] = _notifications[j];
                notificationsPerUser[sellerAddr].push(numNotifications);
                numNotifications++;
            }

            numAds++;
        }
    }

    function getData(uint256 _index) external view override whenPaused returns(
        Advertisement memory _ad,
        carSetupInfo memory _carSetupInfo,
        carSkinInfo memory _carSkinInfo,
        User memory _user,
        Comment[] memory _comments,
        Purchase[] memory _purchases, 
        Notification[] memory _notifications,
        ItemType _type
    ) {
        require(_index < numAds, "Item not found");

        _ad = ads[_index];                      // export ad
        _user = users[ads[_index].seller];      // export ad user
        _comments = itemComments[_index];       // export comments about this ad

        if(isCarSetup(_index)) {
            _carSetupInfo = carSetupInfos[_index];  // export details about ad - if a car setup
            _type = ItemType.Setup;
        } else if (isSkin(_index)) {
            _carSkinInfo = carSkinInfos[_index];    // export details about ad - if a skin
            _type = ItemType.Skin;
        }

        // export purchases for this ad
        for(uint256 u = 0; u < purchasesPerAd[_index].length; ++u) {
            uint256 purchaseId = purchasesPerAd[_index][u];

            _purchases[u] = purchases[purchaseId];

            // export notifications for this purchase
            uint256 j = 0;
            for(uint256 i = 0; i < numNotifications; ++i) {
                Notification storage notification = notifications[i];
                if(notification.purchaseId == purchaseId) {
                    _notifications[j++] = notification;
                }
            }
        }
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
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
    ) public whenNotPaused
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

    /// @notice Registers a new car setup for sale
    function editCarSetup(
        uint256 _adId,
        string memory _carBrand,
        string memory _track,
        string memory _simulator,
        string memory _season,
        string memory _series,
        string memory _description,
        uint256 _price                // trade price
    ) public whenNotPaused
    {
        editAd(
            _adId,
            _price
        );

        carSetupInfo storage info = carSetupInfos[_adId];
        info.carBrand = _carBrand;
        info.track = _track;
        info.simulator = _simulator;
        info.season = _season;
        info.series = _series;
        info.description = _description;

        emit carSetupSaved(msg.sender, "", _carBrand, _track, _simulator, _season, _price);
    }

    /// @notice Registers a new car skin for sale
    function newSkin(
        bytes memory _ipfsPath,        // ipfs path of encrypted data
        string memory _carBrand,
        string memory _simulator,
        uint256 _price,                   // trade price
        bytes32 _dataHash,                // merkle hash of unencrypted data
        bytes32 _encryptedDataHash,       // merkle hash of encrypted data
        string memory _nickname,
        string[] memory _imagePath,       // ipfs path for image skin
        string memory _description,
        string memory _designer,
        string memory _license
    ) public whenNotPaused
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
        info.description = _description;
        info.designer = _designer;
        info.license = _license;

        carSkinIds.push(id);
        saveSeller(msg.sender, _nickname);
        emit skinSaved (msg.sender, _ipfsPath, _carBrand, _simulator, _price);

        return id;
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
    ) public whenNotPaused
    {
        editAd(
            _adId,
            _price
        );

        carSkinInfo storage info = carSkinInfos[_adId];
        info.carBrand = _carBrand;
        info.simulator = _simulator;
        info.skinPic = _imagePath;
        info.description = _description;
        info.designer = _designer;
        info.license = _license;

        emit skinSaved (msg.sender, "", _carBrand, _simulator, _price);
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

    function deleteSkin(uint256 itemId) public whenNotPaused returns(bool) {
        require(isSkin(itemId),"Not a valid skin");
        bool isOwner = (msg.sender == owner());
        require(isOwner || isSeller(msg.sender),"caller is not a seller, neither the owner");
        return deleteItem(itemId, msg.sender, isOwner, true);
    }

    function deleteCarSetup(uint256 itemId) public whenNotPaused returns(bool) {
        require(isCarSetup(itemId),"Not a valid car setup");
        bool isOwner = (msg.sender == owner());
        require(isOwner || isSeller(msg.sender),"caller is not a seller, neither the owner");
        return deleteItem(itemId, msg.sender, isOwner, false);
    }

     /// @notice Registers a new comment for item
    function newComment(
        uint256 _itemId,
        string memory _description,
        uint256 _review
    ) public whenNotPaused
        returns (bool)
    {
        require(isAdActive(_itemId), "Item not found");

        Comment memory _comment = Comment(_itemId, msg.sender, _description, _review, block.timestamp);
        itemComments[_itemId].push(_comment);
        sellerComments[ads[_itemId].seller].push(_comment);

        return true;
    }

    /// @notice Registers seller address
    function saveSeller(address _address, string memory _nickname) public whenNotPaused returns(bool) {
        if(!isSeller(_address)) {
            users[_address] = User(_address, true, false, _nickname);
            numUsers++;
            return true;    
        }
        return false;
    }

    /// @notice Set seller verified
    function setSellerVerified(address _address, bool _verified) public onlyOwner whenNotPaused {
        require(isSeller(_address), "Seller not found");
        users[_address].verified = _verified;
    }

    /// @notice Set seller verified
    function setSellerActive(address _address, bool _active) public onlyOwner whenNotPaused {
        require(isSeller(_address), "Seller not found");
        users[_address].active = _active;
    }

    /// @notice Registers seller address
    function getNickname(address _address) public view returns(string memory) {
        require(isSeller(_address), "Seller not found");
        return users[_address].nickname;
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
    }

    /// @notice Get car setup by Id
    function getCarSetup(uint256 _itemId) public view returns(carSetup memory) {
        require(isCarSetup(_itemId), "Item not found");

        return carSetup(_itemId, ads[_itemId], carSetupInfos[_itemId]);
    }
    
    /// @notice Gets the list of all skin files
    function getSkins() public view returns(carSkin[] memory skins) {

        skins = new carSkin[](carSkinIds.length);

        for(uint256 i = 0; i < carSkinIds.length; i++) {
            uint256 id = carSkinIds[i];
            
            skins[i].id = id;
            skins[i].ad = ads[id];
            skins[i].info = carSkinInfos[id];
        }
    }

    /// @notice Get skin by Id
    function getSkin(uint256 _itemId) public view returns(carSkin memory) {
        require(isSkin(_itemId), "Item not found");

        return carSkin(_itemId, ads[_itemId], carSkinInfos[_itemId]);
    }

    /// @notice Gets the list of comments from item
     function getItemComments(uint256 _itemId) public view returns(Comment[] memory comments_to_return) {
        return itemComments[_itemId];
    }

    /// @notice Gets the list of comments from item
     function getSellerComments(address _seller) public view returns(Comment[] memory comments_to_return) {
        return sellerComments[_seller];
    }

    /// @notice Tests if car setup exists
    function isCarSetup(uint256 _itemId) public view returns(bool) {
        for(uint256 i = 0; i < carSetupIds.length; i++) {
            if(_itemId == carSetupIds[i]) { return true; }
        }
        return false;
    }

    /// @notice Tests if skin exists
    function isSkin(uint256 _itemId) public view returns(bool) {
        for(uint256 i = 0; i < carSkinIds.length; i++) {
            if(_itemId == carSkinIds[i]) { return true; }
        }
        return false;
    }

    /// @notice Tests if sellers exists
    function isSeller(address _address) public view returns(bool) {
        return users[_address].id != address(0);
    }

    /// @notice Get if seller is verified
    function isSellerVerified(address _address) public view returns(bool) {
        return users[_address].verified;
    }

    /// @notice Get if seller is verified
    function isSellerActive(address _address) public view returns(bool) {
        return users[_address].active;
    }
    
    /// @notice Gets number of sellers
    function getNumberSellers() public view returns(uint256) {
        return numUsers;
    }
    
    /// @notice Gets number of car setup files
    function getNumberCars() public view returns(uint256) {
        return carSetupIds.length;
    }
    
    /// @notice Gets number of skin files
    function getNumberSkins() public view returns(uint256) {
        return carSkinIds.length;
    }
}