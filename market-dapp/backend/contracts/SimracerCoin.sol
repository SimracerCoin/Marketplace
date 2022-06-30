pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

//for building on Remix:
//import "@openzeppelin/contracts@3.1.0-solc-0.7/token/ERC20/ERC20.sol";
//import "@openzeppelin/contracts@3.1.0-solc-0.7/token/ERC20/ERC20Burnable.sol";
//import "@openzeppelin/contracts@3.1.0-solc-0.7/access/Ownable.sol";


contract SimracerCoin is ERC20, ERC20Burnable, Ownable {
    uint private INITIAL_SUPPLY = 200000000e18;

	constructor()
        ERC20("Simracer Coin", "SRC")
        ERC20Burnable() public
	    {
            _mint(msg.sender, INITIAL_SUPPLY);
        }
}