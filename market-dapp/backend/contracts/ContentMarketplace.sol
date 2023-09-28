pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ContentMarketplaceTypes.sol";
//import "@cartesi/descartes-sdk/contracts/DescartesInterface.sol";

// NOTE IF building on Remix use the same solidity version of openzeppelin, that is here on the package.json
// 3.1.0-solc-0.7 this is to avoid issues with versions/deprecated/change functions, etc:;
// import "@openzeppelin/contracts@3.1.0-solc-0.7/token/ERC20/ERC20.sol";

abstract contract ContentMarketplace is Ownable {

    //DescartesInterface descartes;
    ERC20 SIMRACERCOIN;

    // storage of advertisements
    uint256 numAds = 0;
    mapping(uint256 => Advertisement) internal ads;
    mapping(address => uint256[]) internal adsPerSeller;

    // storage of purchases
    uint256 numPurchases = 0;
    mapping(uint256 => Purchase) internal purchases;
    mapping(uint256 => uint256[]) internal purchasesPerAd;

    // storage of notifications
    uint256 numNotifications = 0;
    mapping(uint256 => Notification) internal notifications;
    mapping(address => uint256[]) internal notificationsPerUser;

    // purchase events
    event PurchaseRequested(uint256 adId, uint256 purchaseId, address buyer, bytes buyerKey);
    event PurchaseAccepted(uint256 adId, uint256 purchaseId, bytes encryptedDataKey);
    //event PurchaseChallenged(uint256 adId, uint256 purchaseId, uint256 descartesIndex);
    event PurchaseFinalized(uint256 adId, uint256 purchaseId, bool isSuccess);

    constructor(address payable_token) {
        SIMRACERCOIN = ERC20(payable_token);
    }

    /// @notice creates a new advertisement for published and encrypted content
    function createAd(
        uint256 _price,                // trade price
        bytes32 _dataHash,             // merkle hash of unencrypted data
        bytes32 _encryptedDataHash,    // merkle hash of encrypted data
        bytes memory _ipfsPath,        // ipfs path of encrypted data
        bytes32 _testTemplateHash      // hash of the machine representing the test procedure for decrypted data
    ) internal
        returns (uint256 adId)          // returns ad identifier
    {
        Advertisement storage ad = ads[numAds];
        ad.seller = payable(msg.sender);
        ad.price = _price;
        ad.dataHash = _dataHash;
        ad.encryptedDataHash = _encryptedDataHash;
        ad.ipfsPath = _ipfsPath;
        ad.testTemplateHash = _testTemplateHash;
        ad.active = true;

        adId = numAds++;
        adsPerSeller[ad.seller].push(adId);

        return adId;
    }

    /// @notice edit an advertisement
    function editAd(
        uint256 _adId,
        uint256 _price                // trade price
    ) internal
    {
        require(isAdActive(_adId), "Ad not found");
        require(msg.sender == owner() || msg.sender == ads[_adId].seller, "Only owner or seller could edit");

        ads[_adId].price = _price;
    }

    /// @notice retrieves an advertisement given its identifier
    function getAd(uint256 _adId) public view
        returns (Advertisement memory)
    {
        return ads[_adId];
    }

    /// @notice retrieves an array of advertisements given their identifiers
    function getAds(uint256[] memory _adIds) public view
        returns (Advertisement[] memory)
    {
        Advertisement[] memory ret = new Advertisement[](_adIds.length);
        for(uint256 i = 0; i < _adIds.length; i++) {
            ret[i] = ads[_adIds[i]];
        }
        return ret;
    }

    function getNumAds() public view returns (uint256) 
    {
        return numAds;
    }

    function setAdActive(uint256 _adId, bool _active) public onlyOwner
    {
        ads[_adId].active = _active;
    }

    function isAdActive(uint256 _adId) public view returns (bool) 
    {
        return ads[_adId].active;
    }

    /// @notice returns identifiers for a seller's advertisements
    function listAdsPerSeller(address _seller) public view
        returns (uint256[] memory)
    {
        return adsPerSeller[_seller];
    }

    /// @notice retrieves a purchase given its identifier
    function getPurchase(uint256 _purchaseId) public view virtual
        returns (Purchase memory)
    {
        return purchases[_purchaseId];
    }

    /// @notice retrieves an advertisement given its identifier
    function getPurchases(uint256[] memory _purchaseIds) public view
        returns (Purchase[] memory)
    {
        Purchase[] memory ret = new Purchase[](_purchaseIds.length);
        for(uint256 i = 0; i < _purchaseIds.length; i++) {
            uint256 id = _purchaseIds[i];
            ret[i] = purchases[id];
        }
        return ret;
    }

    /// @notice requests purchase of a registered advertisement
    function requestPurchase(
        uint256 _adId,                  // ad identifier
        bytes memory _buyerKey,         // buyer's public key used for encrypting messages so that only the buyer can see
        bool secure
    ) public
        // funds matching ad price, which will be locked until purchase is finalized
        returns (uint256 purchaseId)   // returns purchase request identifier
    {
        Advertisement memory ad = getAd(_adId);
        require(ad.active, "Ad not found");
        // check if allowed to spend SRC
        require(SIMRACERCOIN.allowance(msg.sender, address(this)) >= ad.price, "Check the token allowance");
        // transfer SRC
        require(SIMRACERCOIN.transferFrom(msg.sender, secure ? address(this) : ad.seller, ad.price), "Cannot pay for item");

        // stores purchase info
        Purchase storage purchase = purchases[numPurchases];
        purchase.adId = _adId;
        purchase.buyer = payable(msg.sender);
        purchase.buyerKey = _buyerKey;
        purchase.date = block.timestamp;
        purchase.status = secure ? PurchaseStatus.Request : PurchaseStatus.Accept_B;
        purchase.secure = secure;

        purchaseId = numPurchases++;
        purchasesPerAd[purchase.adId].push(purchaseId);

        if(secure) {
            newNotification(purchaseId, "Purchase was requested", msg.sender, ad.seller);
        }

        emit PurchaseRequested(purchase.adId, purchaseId, purchase.buyer, purchase.buyerKey);
        return purchaseId;
    }

    /// @notice called by seller to accept a purchase request for a registered advertisement
    // deposit sent by the seller that will be locked until purchase is finalized
    function acceptPurchase(
        uint256 _purchaseId,           // purchase request identifier
        bytes memory _encryptedDataKey // key for decrypting data, encrypted using buyer's public key
    ) public
    {
        Purchase storage purchase = purchases[_purchaseId];
        purchase.encryptedDataKey = _encryptedDataKey;
        purchase.status = PurchaseStatus.Accept_A;

        newNotification(_purchaseId, "Thank you for your purchase. Please check item.", msg.sender, purchase.buyer);
    
        emit PurchaseAccepted(purchase.adId, _purchaseId, _encryptedDataKey);
    }

    /// @notice finalizes purchase, unlocking buyer's funds and seller's deposit as appropriate
    function finalizePurchase(
        uint256 _purchaseId,            // purchase request identifier
        bool _withSuccess
    ) public {
        Purchase storage purchase = purchases[_purchaseId];
        Advertisement memory ad = getAd(purchase.adId);

        require(SIMRACERCOIN.transferFrom(address(this), _withSuccess ? ad.seller : purchase.buyer, ad.price),"Cannot unlock funds to transfer ownership");
        
        if(_withSuccess) {
            purchase.status = PurchaseStatus.Accept_B;
            newNotification(_purchaseId, "Purchase was accepted.", msg.sender, ad.seller);
        }
        else {
            purchase.status = PurchaseStatus.Reject;
            newNotification(_purchaseId, "Purchase was rejected.", msg.sender, ad.seller);
        }

        emit PurchaseFinalized(purchase.adId, _purchaseId, _withSuccess); 
    }

    // @notice payback unfinish purchases
    function rejectAllPurchases() external onlyOwner {
        for(uint256 i = 0; i < numPurchases; ++i) {
            if(purchases[i].secure && (purchases[i].status == PurchaseStatus.Request || purchases[i].status == PurchaseStatus.Accept_A)) {
                SIMRACERCOIN.transferFrom(address(this), purchases[i].buyer, ads[purchases[i].adId].price);
            }
        }
    }

    // @notice create notification
    function newNotification(
        uint256 _purchaseId,           // purchase request identifier
        string memory _message,        // generic message
        address _sender,               // who sends the message
        address _receiver              // who receives the message
    ) internal
        returns (uint256 notificationId)           // returns notification identifier
    {
        Notification storage notification = notifications[numNotifications];
        notification.purchaseId = _purchaseId;
        notification.message = _message;
        notification.archive = false;
        notification.date = block.timestamp;
        notification.sender = _sender;
        notification.receiver = _receiver;

        notificationId = numNotifications++;
        //notificationsPerSeller[ads[purchases[_purchaseId].adId].seller].push(notificationId);
        notificationsPerUser[_receiver].push(notificationId);

        return notificationId;
    }

    /// @notice retrieves an array of notifications given their identifiers
    function getNotifications(uint256[] memory _notificationIds) public view
        returns (Notification[] memory)
    {
        Notification[] memory ret = new Notification[](_notificationIds.length);
        for(uint256 i = 0; i < _notificationIds.length; i++) {
            ret[i] = notifications[_notificationIds[i]];
        }
        return ret;
    }

    /// @notice returns identifiers for a seller's notifications
    function listNotificationsPerUser(address _user) public view
        returns (uint256[] memory)
    {
        return notificationsPerUser[_user];
    }

    function archiveNotification(uint256 _notificationId) public {
        notifications[_notificationId].archive = true;
    }

    function deleteItemFromMarketplace(uint256 itemId, address _seller, bool isOwner) internal returns(bool) {

        require(itemId >= 0,"Invalid item id");
        //is contract owner
        if(isOwner) {
            //get corresponding ad
            Advertisement memory adv = ads[itemId];
            //get the seller address
            address payable _theSeller = adv.seller;

            uint256 _size = adsPerSeller[_theSeller].length;

            for (uint256 i = 0; i < _size; i++) {
                uint256 _adId = adsPerSeller[_theSeller][i];
                //find by id on adsPerSeller[]
                if(_adId == itemId) {
                    //found the item, delete it
                    adsPerSeller[_theSeller][i] = adsPerSeller[_theSeller][_size - 1];
                    adsPerSeller[_theSeller].pop();
                    //also remove from ads list
                    delete ads[itemId];
                    return true;
                }
            }
            //regular seller account
        } else if(_seller == msg.sender) {
            //double check
            uint256 _size = adsPerSeller[_seller].length;
            for (uint256 i = 0; i < _size; i++) {
                uint256 _adId = adsPerSeller[_seller][i];
                if(_adId == itemId) {

                    //found the item, delete it
                    adsPerSeller[_seller][i] = adsPerSeller[_seller][_size - 1];
                    adsPerSeller[_seller].pop();
                    //get the one from ads
               
                    //get corresponding ad
                    Advertisement memory adv = ads[itemId];
                    if( adv.seller == _seller  ) { //ex: item with id 3 is at position 2
                        delete ads[itemId];
                        return true;
                    }
                }
            }
        }
        return false;
    }

    //get contract owner/deployer
    function getContractOwner() public view returns(address) {
        return owner();
    }

}
