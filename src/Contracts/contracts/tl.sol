// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// ERC20 Contract for turkish lira currency
contract TL is ERC20 {
    constructor(uint256 initialSupply) ERC20("Turkish Lira", "TL") {
        _mint(msg.sender, initialSupply);
    }
    //Since this is a test currency user can take amount as much as they want.
    function takeAmount(uint256 amount) public{
        _mint(msg.sender, amount);
    }
}