// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "./ContentMarketplaceTypes.sol";

interface Migratable {
    function getData(uint256) external view returns (
        Advertisement memory, 
        setupInfo memory,
        skinInfo memory,
        User memory,
        Comment[] memory,
        Purchase[] memory, 
        Notification[] memory,
        ItemType);

    function migrateData(address, uint256, uint256) external;

    function getNumAds() external view returns (uint256);
}