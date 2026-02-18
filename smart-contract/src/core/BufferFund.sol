// SPDX-License-Identifier: MIT

pragma solidity ^0.8.13;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract BufferFund is Ownable {
    event ETHReceived(address indexed from, uint256 amount);
    event BufferUpdated(uint256 oldBalance, uint256 newBalance);
    event WithdrawTo(address indexed recipient, uint256 amount);

    error ETHTransferFailed();
    error Unauthorized();
    error InvalidAddress();

    address public etheraMoney;

    modifier onlyEtheraMoney() {
        if (msg.sender != etheraMoney) revert Unauthorized();
        _;
    }

    constructor(address owner_) Ownable(owner_) {}

    receive() external payable {
        emit ETHReceived(msg.sender, msg.value);
    }

    function setEtheraMoney(address etheraMoney_) external onlyOwner {
        if (etheraMoney_ == address(0)) revert InvalidAddress();
        etheraMoney = etheraMoney_;
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getStakingBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function withdrawTo(
        address recipient,
        uint256 amount
    ) external onlyEtheraMoney {
        (bool success, ) = payable(recipient).call{value: amount}("");
        if (!success) revert ETHTransferFailed();
        emit WithdrawTo(recipient, amount);
    }
}
