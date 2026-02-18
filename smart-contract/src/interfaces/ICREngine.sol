// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {VolatilityLevel, LiquidityLevel} from "../lib/RiskTypes.sol";

interface ICREngine {
    function getTargetCR(
        VolatilityLevel v,
        LiquidityLevel l
    ) external view returns (uint256 crBps);

    function maxMintable(
        uint256 ethValueUsd,
        uint256 tppuUsdPrice,
        VolatilityLevel v,
        LiquidityLevel l
    ) external view returns (uint256 maxTppu);

    function getCurrentBSR() external view returns (uint256 bsrBps);
}
