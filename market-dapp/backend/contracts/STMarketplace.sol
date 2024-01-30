// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "./Migratable.sol";
import "./ContentMarketplace.sol";

contract STMarketplace is ContentMarketplace, Migratable {   

    mapping(bytes4 => address) private targets;

    // new constructor, without descartes address supplied
    constructor(address payable_token, address _stSetup, address _stSkin) ContentMarketplace(payable_token) {
        bytes4[] memory setups_methods = new bytes4[](5);
        setups_methods[0] = bytes4(keccak256("newSetup(bytes,string,string,string,string,string,string,uint256,bytes32,string)"));
        setups_methods[1] = bytes4(keccak256("editSetup(uint256,string,string,string,string,string,string,uint256)"));
        setups_methods[2] = bytes4(keccak256("getSetups()"));
        setups_methods[3] = bytes4(keccak256("getSetup(uint256)"));
        setups_methods[4] = bytes4(keccak256("isSetup(uint256)"));

        bytes4[] memory skins_methods = new bytes4[](5);
        skins_methods[0] = bytes4(keccak256("newSkin(bytes,string,string,uint256,bytes32,string,string[],string,string,string)"));
        skins_methods[1] = bytes4(keccak256("editSkin(uint256,string,string,uint256,string[],string,string,string)"));
        skins_methods[2] = bytes4(keccak256("getSkins()"));
        skins_methods[3] = bytes4(keccak256("getSkin(uint256)"));
        skins_methods[4] = bytes4(keccak256("isSkin(uint256)"));

        changeTargetForSelectors(setups_methods, _stSetup);
        changeTargetForSelectors(skins_methods, _stSkin);
    }

    function changeTargetForSelectors(bytes4[] memory selectors, address newTarget) public onlyOwner {
        for(uint256 i = 0; i < selectors.length; ++i) {
            targets[selectors[i]] = newTarget;
        }
    }

    function migrateData(
        address _oldContractAddr,
        uint256 _startIndex, 
        uint256 _endIndex
    ) external override onlyOwner
    {
        require(_startIndex < _endIndex, "invalid range");

        Migratable oldContract = Migratable(_oldContractAddr);

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
                purchasesAd[numAds].push(numPurchases);
                numPurchases++;
            }

            // import notifications
            for(uint256 j = 0; j < _notifications.length; ++j) {
                notifications[numNotifications] = _notifications[j];
                notificationsUser[sellerAddr].push(numNotifications);
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
        for(uint256 u = 0; u < purchasesAd[_idx].length; ++u) {
            uint256 pId = purchasesAd[_idx][u];

            _purchases[u] = purchases[pId];

            // export notifications for this purchase
            uint256 j = 0;
            for(uint256 i = 0; i < numNotifications; ++i) {
                Notification storage notification = notifications[i];
                if(notification.purchaseId == pId) {
                    _notifications[j++] = notification;
                }
            }
        }
    }

    fallback() external payable {
        address target = targets[msg.sig];

        require(target != address(0), "no target set");

        assembly {
            let ptr := mload(0x40)
            calldatacopy(ptr, 0, calldatasize())
            let result := delegatecall(gas(), target, ptr, calldatasize(), 0, 0)
            let size := returndatasize()
            returndatacopy(ptr, 0, size)
            switch result 
                case 0 { revert(ptr, size) } 
                default { return(ptr, size) }
        }
    }
}