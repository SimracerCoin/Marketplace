pragma solidity ^0.5.1;
pragma experimental ABIEncoderV2;

contract ContentMarketplace {

    /// @notice records necessary information for an advertisement
    struct Advertisement {
        address payable seller;       // seller address
        uint256 price;                // trade price
        bytes32 dataHash;             // merkle hash of unencrypted data
        bytes32 encryptedDataHash;    // merkle hash of encrypted data
        bytes ipfsPath;               // ipfs path of encrypted data
        bytes32 testTemplateHash;     // hash of the machine representing the test procedure for decrypted data
    }

    /// @notice records information regarding a purchase
    struct Purchase {
        uint256 adId;
        address buyer;
        bytes buyerKey;
        bytes encryptedDataKey;
        uint256 date;
    }

    enum NotificationType { Request, Accept_A, Challenge, Accept_B }
    // @notice full representation of a notification
    struct Notification {
        uint256 purchaseId;       // purchase information
        string message;           // generic message
        NotificationType nType;   // type of notification
        bool archive;             // archived notification
        uint256 date;             // notification date
        address sender;           // notification from address
        address receiver;         // notification to address
    }

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
    mapping(uint256 => Notification) notifications;
    mapping(address => uint256[]) notificationsPerUser;

    // purchase events
    event PurchaseRequested(uint256 adId, uint256 purchaseId, address buyer, bytes buyerKey);
    event PurchaseAccepted(uint256 adId, uint256 purchaseId, bytes encryptedDataKey);
    event PurchaseChallenged(uint256 adId, uint256 purchaseId, uint256 descartesIndex);
    event PurchaseFinalized(uint256 adId, uint256 purchaseId, bool isSuccess);


    /// @param descartesAddress address of the Descartes contract
    constructor(address descartesAddress) public {
        // TODO retrieve Descartes interface from the address
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
        ad.seller = msg.sender;
        ad.price = _price;
        ad.dataHash = _dataHash;
        ad.encryptedDataHash = _encryptedDataHash;
        ad.ipfsPath = _ipfsPath;
        ad.testTemplateHash = _testTemplateHash;

        adId = numAds++;
        adsPerSeller[ad.seller].push(adId);

        return adId;
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
            uint256 id = _adIds[i];
            ret[i] = ads[id];
        }
        return ret;
    }

    /// @notice returns identifiers for a seller's advertisements
    function listAdsPerSeller(address _seller) public view
        returns (uint256[] memory)
    {
        return adsPerSeller[_seller];
    }

    /// @notice retrieves a purchase given its identifier
    function getPurchase(uint256 _purchaseId) public view
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
        uint256 _adId,                 // ad identifier
        bytes memory _buyerKey         // buyer's public key used for encrypting messages so that only the buyer can see
    ) public
        payable                        // funds matching ad price, which will be locked until purchase is finalized
        returns (uint256 purchaseId)   // returns purchase request identifier
    {
        // TODO: ensure ad exists
        // TODO: ensure funds are adequade
        Advertisement memory ad = getAd(_adId);
        require(msg.value == (ad.price),"Amount should be equal to the item price");

        // stores purchase info
        Purchase storage purchase = purchases[numPurchases];
        purchase.adId = _adId;
        purchase.buyer = msg.sender;
        purchase.buyerKey = _buyerKey;
        purchase.date = now;

        purchaseId = numPurchases++;
        purchasesPerAd[purchase.adId].push(purchaseId);

        newNotification(purchaseId, "Purchase was requested", msg.sender, ad.seller, NotificationType.Request);

        emit PurchaseRequested(purchase.adId, purchaseId, purchase.buyer, purchase.buyerKey);
        return purchaseId;
    }

    /// @notice called by seller to accept a purchase request for a registered advertisement
    function acceptPurchase(
        uint256 _purchaseId,           // purchase request identifier
        bytes memory _encryptedDataKey // key for decrypting data, encrypted using buyer's public key
    ) public
        payable                        // deposit sent by the seller that will be locked until purchase is finalized
    {
        // TODO...

        Purchase storage purchase = purchases[_purchaseId];
        purchase.encryptedDataKey = _encryptedDataKey;

        newNotification(_purchaseId, "Thank you for your purchase. Please check item.", msg.sender, purchase.buyer, NotificationType.Accept_A);
    
        emit PurchaseAccepted(purchase.adId, _purchaseId, _encryptedDataKey);
    }


    /// @notice called by buyer to challenge a purchase, stating that content could not be retrieved
    function challengePurchase(
        uint256 _purchaseId,           // purchase request identifier
        bytes memory _privateKey       // buyer's private key used to decrypt the data key
    ) public
        returns (uint256 descartesIndex)  // returns index of the descartes computation that will verify the challenge
    {
        // TODO...

        Purchase memory purchase = getPurchase(_purchaseId);
        Advertisement memory ad = getAd(purchase.adId);

        newNotification(_purchaseId, "Purchase was challenged", msg.sender, ad.seller, NotificationType.Challenge);

        emit PurchaseChallenged(purchase.adId, _purchaseId, descartesIndex);
        return descartesIndex;
    }

    /// @notice finalizes purchase, unlocking buyer's funds and seller's deposit as appropriate
    function finalizePurchase(
        uint256 _purchaseId            // purchase request identifier
    ) public {
        // TODO...
        Purchase memory purchase = getPurchase(_purchaseId);
        Advertisement memory ad = getAd(purchase.adId);

        address payable accountAddress = ad.seller;
        accountAddress.transfer(ad.price);

        newNotification(_purchaseId, "Purchase was accepted", msg.sender, ad.seller, NotificationType.Accept_B);

        emit PurchaseFinalized(purchase.adId, _purchaseId, true); 
    }

    // @notice create notification
    function newNotification(
        uint256 _purchaseId,           // purchase request identifier
        string memory _message,        // generic message
        address _sender,               // who sends the message
        address _receiver,             // who receives the message
        NotificationType _type         // type of notification
    ) public
        returns (uint256 notificationId)           // returns notification identifier
    {
        Notification storage notification = notifications[numNotifications];
        notification.purchaseId = _purchaseId;
        notification.message = _message;
        notification.nType = _type;
        notification.archive = false;
        notification.date = now;
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
            uint256 id = _notificationIds[i];
            ret[i] = notifications[id];
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

}
