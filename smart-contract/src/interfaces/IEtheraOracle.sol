// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IEtheraOracle
 * @notice Interface for ETHERA/USD price oracle
 */
interface IEtheraOracle {
    /// @notice Returns ETHERA/USD price with 18 decimals
    function price() external view returns (uint256);
}
