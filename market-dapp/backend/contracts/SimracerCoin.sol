pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract SimracerCoin is ERC20 {
    uint private INITIAL_SUPPLY = 200000000e18;

	constructor()
        ERC20("Simracer Coin", "SRC") public
	    {
            _mint(msg.sender, INITIAL_SUPPLY);
        }
}