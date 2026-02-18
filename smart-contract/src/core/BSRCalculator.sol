// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {BufferState} from "../lib/RiskTypes.sol";

library BSRCalculator {
    uint256 internal constant BPS = 10000;

    uint256 internal constant PRECISION = 1e18;

    uint256 internal constant THICK_THRESHOLD = 1000;

    uint256 internal constant THIN_THRESHOLD = 200;

    error ZeroTPPULiability();

    function calculateBSR(
        uint256 bufferEthWei,
        uint256 ethUsdPrice,
        uint256 tppuSupply,
        uint256 tppuUsdPrice
    ) internal pure returns (uint256) {
        if (tppuSupply == 0) {
            return type(uint256).max;
        }
        if (tppuUsdPrice == 0) revert ZeroTPPULiability();

        uint256 numerator = bufferEthWei * ethUsdPrice;

        uint256 denominator = tppuSupply * tppuUsdPrice;

        return Math.mulDiv(numerator, BPS, denominator);
    }

    function classifyBSR(uint256 bsrBps) internal pure returns (BufferState) {
        if (bsrBps > THICK_THRESHOLD) {
            return BufferState.THICK;
        } else if (bsrBps >= THIN_THRESHOLD) {
            return BufferState.NORMAL;
        } else {
            return BufferState.THIN;
        }
    }

    function calculateAndClassify(
        uint256 bufferEthWei,
        uint256 ethUsdPrice,
        uint256 tppuSupply,
        uint256 tppuUsdPrice
    ) internal pure returns (uint256 bsrBps, BufferState state) {
        bsrBps = calculateBSR(
            bufferEthWei,
            ethUsdPrice,
            tppuSupply,
            tppuUsdPrice
        );
        state = classifyBSR(bsrBps);
    }
}
