// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title BonsaiCoinTest (BCT)
/// @notice Simple ERC20 token for testing deposit/withdraw with Vault on Base Sepolia
contract BonsaiCoinTest is ERC20 {
    constructor(uint256 initialSupply) ERC20("BonsaiCoinTest", "BCT") {
        _mint(msg.sender, initialSupply);
    }
}
