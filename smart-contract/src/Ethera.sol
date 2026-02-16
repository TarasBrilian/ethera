// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Ethera is Ownable {
    constructor() Ownable(msg.sender) {}

    function deposit() public {}

    function withdraw() public {}
}
