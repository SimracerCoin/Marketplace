// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "./ContentMarketplace.sol";

contract STMarketplace is ContentMarketplace {   

    mapping(bytes4 => address) private targets;

    // new constructor, without descartes address supplied
    constructor(address payable_token, address _stSetup, address _stSkin) ContentMarketplace(payable_token) {
        bytes4[] memory setups_methods = new bytes4[](5);
        setups_methods[0] = bytes4(keccak256("newSetup(bytes,string,string,string,string,string,string,uint256,bytes32,string)"));
        setups_methods[1] = bytes4(keccak256("editSetup(uint256,string,string,string,string,string,string,uint256)"));
        setups_methods[2] = bytes4(keccak256("getSetups()"));
        setups_methods[3] = bytes4(keccak256("getSetup(uint256)"));

        bytes4[] memory skins_methods = new bytes4[](5);
        skins_methods[0] = bytes4(keccak256("newSkin(bytes,string,string,uint256,bytes32,string,string[],string,string,string)"));
        skins_methods[1] = bytes4(keccak256("editSkin(uint256,string,string,uint256,string[],string,string,string)"));
        skins_methods[2] = bytes4(keccak256("getSkins()"));
        skins_methods[3] = bytes4(keccak256("getSkin(uint256)"));

        changeTargetForSelectors(setups_methods, _stSetup);
        changeTargetForSelectors(skins_methods, _stSkin);
    }

    function changeTargetForSelectors(bytes4[] memory selectors, address newTarget) public onlyOwner {
        for(uint256 i = 0; i < selectors.length; ++i) {
            targets[selectors[i]] = newTarget;
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

    // Receive function
    receive() external payable {
        // This function is empty but enables the contract to
        // safely receive Ether when no data is sent with the transaction.
    }
}