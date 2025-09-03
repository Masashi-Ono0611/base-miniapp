// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title Simple ERC20 Vault
/// @notice Holds a single ERC20 token and lets users deposit/withdraw their balance
contract Vault {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;

    // User deposit balances tracked normally
    mapping(address => uint256) public balanceOf;

    // Per-user cumulative claimed amount (without requiring prior deposit)
    mapping(address => uint256) public claimedOf;

    // Max claimable amount per user: 10,000 tokens (BonsaiCoinTest uses 18 decimals)
    // Using 1e18 unit here as the token has 18 decimals by design
    uint256 public constant CLAIM_LIMIT = 10_000 * 1e18;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event Claimed(address indexed user, uint256 amount);

    constructor(address _token) {
        require(_token != address(0), "token=0");
        token = IERC20(_token);
    }

    function deposit(uint256 amount) external {
        require(amount > 0, "amount=0");
        token.safeTransferFrom(msg.sender, address(this), amount);
        balanceOf[msg.sender] += amount;
        emit Deposited(msg.sender, amount);
    }

    function withdraw(uint256 amount) external {
        require(amount > 0, "amount=0");
        uint256 bal = balanceOf[msg.sender];
        require(bal >= amount, "insufficient");
        balanceOf[msg.sender] = bal - amount;
        token.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    /// @notice Returns how much the user can still claim from the per-user allowance
    function remainingClaimable(address user) public view returns (uint256) {
        uint256 claimed = claimedOf[user];
        if (claimed >= CLAIM_LIMIT) return 0;
        return CLAIM_LIMIT - claimed;
    }

    /// @notice Allows a user to claim tokens from the Vault up to CLAIM_LIMIT per address
    /// Does not require prior deposit; subject only to per-user cap and current vault liquidity
    function claim(uint256 amount) external {
        require(amount > 0, "amount=0");
        uint256 rem = remainingClaimable(msg.sender);
        require(amount <= rem, "limit");
        require(token.balanceOf(address(this)) >= amount, "vault-empty");
        claimedOf[msg.sender] += amount;
        token.safeTransfer(msg.sender, amount);
        emit Claimed(msg.sender, amount);
    }
}
