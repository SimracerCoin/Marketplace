pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

enum PurchaseStatus { Request, Accept_A, Challenge, Accept_B, Reject }
enum ItemType { Setup, Skin }

/// @notice records necessary information for an advertisement
struct Advertisement {
    address payable seller;       // seller address
    uint256 price;                // trade price
    bytes32 dataHash;             // merkle hash of unencrypted data
    bytes32 encryptedDataHash;    // merkle hash of encrypted data
    bytes ipfsPath;               // ipfs path of encrypted data
    bytes32 testTemplateHash;     // hash of the machine representing the test procedure for decrypted data
    bool active;
}

/// @notice records information regarding a purchase
struct Purchase {
    uint256 adId;
    address payable buyer;
    bytes buyerKey;
    bytes encryptedDataKey;
    //uint256 descartesIndex;   // descartes computation that will verify the challenge
    uint256 date;               // purchase date
    PurchaseStatus status;
    bool secure;
}

// @notice full representation of a notification
struct Notification {
    uint256 purchaseId;       // purchase information
    string message;           // generic message
    bool archive;             // archived notification
    uint256 date;             // notification date
    address sender;           // notification from address
    address receiver;         // notification to address
}

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
    string description;
    string designer;
    string license;
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
struct Comment {
    uint256 itemId;
    address commentator;
    string description;
    uint256 review;
    uint256 date;   
}

struct User {
    address id;
    bool active;
    bool verified;
    string nickname;
}