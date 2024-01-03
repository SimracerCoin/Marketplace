// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./STStorage.sol";
import "./Migratable.sol";

abstract contract ContentMarketplace is STStorage, Migratable {

    uint256 private PURCHASE_FEE = 0;   // base 10**3

    //DescartesInterface descartes;
    ERC20 internal SIMRACERCOIN;

    // storage of purchases
    uint256 internal numPurchases = 0;
    mapping(uint256 => Purchase) internal purchases;
    mapping(uint256 => uint256[]) internal purchasesAd;
    mapping(address => uint256[]) internal purchasesUser;

    // storage of notifications
    uint256 internal numNotifications = 0;
    mapping(uint256 => Notification) internal notifications;
    mapping(address => uint256[]) internal notificationsUser;
    mapping(uint256 => uint256[]) internal notificationsPurchase;

        // /// @notice To track comments from item
    mapping(uint256 => Comment[]) internal itemComments;
    mapping(address => Comment[]) internal sellerComments;

    // purchase events
    event PurchaseRequested(uint256 adId, uint256 pId, address buyer, bytes buyerKey);
    event PurchaseAccepted(uint256 adId, uint256 pId, bytes encryptedDataKey);
    event PurchaseFinalized(uint256 adId, uint256 pId, bool isSuccess);
    event AdDeleted(uint256 adId);

    // Modifier to check if the caller is the owner
    modifier onlyOwnerOrInternal() {
        require(msg.sender == owner() || msg.sender == address(this), "Caller is not the owner or internal");
        _;
    }

    constructor(address payable_token) {
        SIMRACERCOIN = ERC20(payable_token);
    }

    function migrateData(
        address _oldContractAddr,
        uint256 _startIndex, 
        uint256 _endIndex
    ) external override onlyOwner
    {
        require(_startIndex < _endIndex, "invalid range");

        Migratable oldContract = Migratable(_oldContractAddr);

        if(_endIndex > oldContract.getNumAds())
            _endIndex = oldContract.getNumAds();

        for (uint256 i = _startIndex; i < _endIndex; i++) {
            (Advertisement memory _ad, 
            setupInfo memory _setup,
            skinInfo memory _skin,
            User memory _user,
            Comment[] memory _comments,
            Purchase[] memory _purchases, 
            Notification[] memory _notifications,
            ItemType _type) = oldContract.getData(i);

            address sellerAddr = _ad.seller;

            // import ad
            ads[numAds] = _ad;

            // import user if not exists
            if(users[sellerAddr].id == address(0)) {
                users[sellerAddr] = _user;
                numUsers++; 
            }

            // import details
            if(_type == ItemType.Setup) {
                setupInfos[numAds] = _setup;
                setupIds.push(numAds);
            } else if (_type == ItemType.Skin) {
                skinInfos[numAds] = _skin;
                skinIds.push(numAds);
            }
            
            // import comments
            for(uint256 j = 0; j < _comments.length; ++j) {
                itemComments[numAds].push(_comments[j]);
                sellerComments[sellerAddr].push(_comments[j]);
            }
            
            // import purchases
            for(uint256 j = 0; j < _purchases.length; ++j) {
                purchases[numPurchases] = _purchases[j];
                purchasesAd[_purchases[j].adId].push(numPurchases);
                purchasesUser[_purchases[j].buyer].push(numPurchases);
                numPurchases++;
            }

            // import notifications
            for(uint256 j = 0; j < _notifications.length; ++j) {
                notifications[numNotifications] = _notifications[j];
                notificationsUser[_notifications[j].receiver].push(numNotifications);
                notificationsPurchase[_notifications[j].purchaseId].push(numNotifications);
                numNotifications++;
            }

            numAds++;
        }
    }

    function getData(uint256 _idx) external view override whenPaused returns(
        Advertisement memory _ad,
        setupInfo memory _setupInfo,
        skinInfo memory _skinInfo,
        User memory _user,
        Comment[] memory _comments,
        Purchase[] memory _purchases, 
        Notification[] memory _notifications,
        ItemType _type
    ) {
        require(_idx < numAds, "ad not found");

        _ad = ads[_idx];                      // export ad
        _user = users[ads[_idx].seller];      // export ad user
        _comments = itemComments[_idx];       // export comments about this ad

        if(isSetup(_idx)) {
            _setupInfo = setupInfos[_idx];  // export details about ad - if a car setup
            _type = ItemType.Setup;
        } else if (isSkin(_idx)) {
            _skinInfo = skinInfos[_idx];    // export details about ad - if a skin
            _type = ItemType.Skin;
        }

        // export purchases for this ad
        uint256 nrPurchases = purchasesAd[_idx].length;

        if(nrPurchases > 0) {
            uint256 j = 0;

            _purchases = new Purchase[](nrPurchases);
            _notifications = new Notification[](calculateNotifications(_idx, nrPurchases));

            for(uint256 u = 0; u < nrPurchases; ++u) {
                uint256 pId = purchasesAd[_idx][u];

                _purchases[u] = purchases[pId];

                // export notifications for this purchase
                for(uint256 i = 0; i < notificationsPurchase[pId].length; ++i) {
                    _notifications[j++] = notifications[notificationsPurchase[pId][i]];
                }
            }
        }
    }

    function calculateNotifications(uint256 _ad, uint256 _nrPurchases) private view returns (uint256 nrNotifications) {
        nrNotifications = 0;
        for(uint256 u = 0; u < _nrPurchases; ++u) {
            nrNotifications += notificationsPurchase[purchasesAd[_ad][u]].length;
        }
    }

    /// @notice retrieves an advertisement given its identifier
    function getAd(uint256 _adId) external view returns (Advertisement memory) {
        return ads[_adId];
    }

    /// @notice retrieves an array of advertisements given their identifiers
    function getAds(uint256[] memory _adIds) external view returns (Advertisement[] memory _ads) {
        _ads = new Advertisement[](_adIds.length);
        for(uint256 i = 0; i < _adIds.length; i++) {
            _ads[i] = ads[_adIds[i]];
        }
    }

    function getNumAds() external override view returns (uint256) {
        return numAds;
    }

    function setAdActive(uint256 _adId, bool _active) external {
        require(_msgSender() == owner() || _msgSender() == ads[_adId].seller, "unauthorized call");
        ads[_adId].active = _active;
    }

    /// @notice retrieves a purchase given its identifier
    function getPurchase(uint256 _pId) external view virtual returns (Purchase memory) {
        return purchases[_pId];
    }

    /// @notice retrieves an advertisement given its identifier
    function getPurchases(uint256[] memory _pIds) external view returns (Purchase[] memory ret) {
        ret = new Purchase[](_pIds.length);
        for(uint256 i = 0; i < _pIds.length; i++) {
            ret[i] = purchases[_pIds[i]];
        }
    }

    /// @notice requests purchase of a registered advertisement
    function requestPurchase(
        uint256 _adId,                  // ad identifier
        bytes memory _buyerKey,         // buyer's public key used for encrypting messages so that only the buyer can see
        bool secure
    ) external whenNotPaused returns (uint256 pId)
    {
        // funds matching ad price, which will be locked until purchase is finalized
        Advertisement memory ad = ads[_adId];
        require(ad.active, "ad not found");
        // check if allowed to spend SRC
        require(SIMRACERCOIN.allowance(_msgSender(), address(this)) >= ad.price, "token allowance");
        
        // transfer SRC
        uint256 fee = ad.price * PURCHASE_FEE / 1000;
        if(fee > 0)
            require(SIMRACERCOIN.transferFrom(_msgSender(), address(this), fee), "cannot pay fee"); // fee
        
        require(SIMRACERCOIN.transferFrom(_msgSender(), secure ? address(this) : ad.seller, ad.price - fee), "cannot pay");

        pId = numPurchases++;

        // stores purchase info
        Purchase storage purchase = purchases[pId];
        purchase.adId = _adId;
        purchase.buyer = payable(_msgSender());
        purchase.buyerKey = _buyerKey;
        purchase.date = block.timestamp;
        purchase.status = secure ? PurchaseStatus.Request : PurchaseStatus.Accept_B;
        purchase.secure = secure;

        purchasesAd[purchase.adId].push(pId);
        purchasesUser[_msgSender()].push(pId);

        if(secure) {
            newNotification(pId, "Purchase was requested", _msgSender(), ad.seller, NotificationType.Purchase);
        }

        emit PurchaseRequested(purchase.adId, pId, purchase.buyer, purchase.buyerKey);
    }

    function setPurchaseFee(uint256 _fee) external onlyOwner {
        PURCHASE_FEE = _fee;
    }

    function getPurchaseFee() external view returns (uint256) {
        return PURCHASE_FEE;
    }

    /// @notice called by seller to accept a purchase request for a registered advertisement
    // deposit sent by the seller that will be locked until purchase is finalized
    function acceptPurchase(
        uint256 _pId,           // purchase request identifier
        bytes memory _encryptedDataKey // key for decrypting data, encrypted using buyer's public key
    ) external whenNotPaused
    {
        Purchase storage purchase = purchases[_pId];
        purchase.encryptedDataKey = _encryptedDataKey;
        purchase.status = PurchaseStatus.Accept_A;

        newNotification(_pId, "Thank you for your purchase.", _msgSender(), purchase.buyer, NotificationType.Purchase);
    
        emit PurchaseAccepted(purchase.adId, _pId, _encryptedDataKey);
    }

    /// @notice finalizes purchase, unlocking buyer's funds and seller's deposit as appropriate
    function finalizePurchase(
        uint256 _pId,            // purchase request identifier
        bool _withSuccess
    ) external whenNotPaused 
    {
        Purchase storage purchase = purchases[_pId];
        Advertisement memory ad = ads[purchase.adId];

        require(SIMRACERCOIN.transferFrom(address(this), _withSuccess ? ad.seller : purchase.buyer, ad.price), "run out of funds");
        
        if(_withSuccess) {
            purchase.status = PurchaseStatus.Accept_B;
            newNotification(_pId, "Purchase was accepted.", _msgSender(), ad.seller, NotificationType.Purchase);
        }
        else {
            purchase.status = PurchaseStatus.Reject;
            newNotification(_pId, "Purchase was rejected.", _msgSender(), ad.seller, NotificationType.Purchase);
        }

        emit PurchaseFinalized(purchase.adId, _pId, _withSuccess); 
    }

    // @notice payback unfinish purchases
    function rejectAllPurchases() external onlyOwner whenPaused {
        for(uint256 i = 0; i < numPurchases; ++i) {
            if(purchases[i].secure && (purchases[i].status == PurchaseStatus.Request || purchases[i].status == PurchaseStatus.Accept_A)) {
                require(SIMRACERCOIN.transferFrom(address(this), purchases[i].buyer, ads[purchases[i].adId].price), "token transfer failed");
            }
        }
    }

    // @notice create notification
    function newNotification(
        uint256 _pId,                  // purchase request identifier
        string memory _message,        // generic message
        address _sender,               // who sends the message
        address _receiver,             // who receives the message
        NotificationType _type         // type of notification
    ) public onlyOwnerOrInternal returns (uint256 nId)
    {
        nId = numNotifications++;

        Notification storage notification = notifications[nId];
        notification.purchaseId = _pId;
        notification.message = _message;
        notification.archive = false;
        notification.date = block.timestamp;
        notification.sender = _sender == address(0) ? owner() : _sender;
        notification.receiver = _receiver;
        notification.nType = _type;

        notificationsUser[_receiver].push(nId);

        if(_type == NotificationType.Purchase)
            notificationsPurchase[_pId].push(nId);
    }

    /// @notice retrieves an array of notifications given their identifiers
    function getNotifications(
        uint256[] memory _nIds
    ) external view returns (Notification[] memory ret) 
    {
        ret = new Notification[](_nIds.length);
        for(uint256 i = 0; i < _nIds.length; i++) {
            ret[i] = notifications[_nIds[i]];
        }
    }

    /// @notice returns identifiers for a seller's notifications
    function listNotificationsUser(address _user) external view returns (uint256[] memory) {
        return notificationsUser[_user];
    }

    /// @notice returns identifiers for a seller's notifications
    function listPurchasesUser(address _user) external view returns (uint256[] memory) {
        return purchasesUser[_user];
    }

    /// @notice returns identifiers for a seller's notifications
    function listNotificationsPurchase(uint256 _pId) external view returns (uint256[] memory) {
        return notificationsPurchase[_pId];
    }

    function archiveNotification(uint256 _nId) external whenNotPaused {
        require(notifications[_nId].receiver == _msgSender(), "only notification owner");
        notifications[_nId].archive = true;
    }

    function setSellerFlags(address _user, bool _verified, bool _active) external onlyOwner {
        users[_user].verified = _verified;
        users[_user].active = _active;
    }

    function getSeller(address _user) external view returns(User memory) {
        return users[_user];
    }

    /// @notice Registers a new comment for item
    function newComment(
        uint256 _adId,
        string memory _description,
        uint256 _review
    ) external whenNotPaused 
    {
        require(ads[_adId].active, "ad not found");

        Comment memory _comment = Comment(_adId, _msgSender(), _description, _review, block.timestamp);
        itemComments[_adId].push(_comment);
        sellerComments[ads[_adId].seller].push(_comment);
    }

    /// @notice Gets the list of comments from item
    function getItemComments(uint256 _adId) external view returns(Comment[] memory) {
        return itemComments[_adId];
    }

    /// @notice Gets the list of comments from item
    function getSellerComments(address _seller) external view returns(Comment[] memory) {
        return sellerComments[_seller];
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
