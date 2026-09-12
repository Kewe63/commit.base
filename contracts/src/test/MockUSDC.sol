// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @dev Local-test token only. Never use this mock as a production asset.
contract MockUSDC is ERC20 {
    bool public transfersEnabled = true;
    function setTransfersEnabled(bool enabled) external { transfersEnabled = enabled; }
    function transfer(address to, uint256 amount) public override returns (bool) {
        if (!transfersEnabled) return false;
        return super.transfer(to, amount);
    }
    constructor() ERC20("Mock USDC", "mUSDC") {}
    function decimals() public pure override returns (uint8) { return 6; }
    function mint(address to, uint256 amount) external { _mint(to, amount); }
}
