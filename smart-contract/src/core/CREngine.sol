// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {ICREngine} from "../interfaces/ICREngine.sol";
import {IChainlinkFeed} from "../interfaces/IChainlinkFeed.sol";
import {
    VolatilityLevel,
    LiquidityLevel,
    BufferState
} from "../lib/RiskTypes.sol";
import {BSRCalculator} from "./BSRCalculator.sol";
import {PremiumCalculator} from "./PremiumCalculator.sol";
import {BufferFund} from "./BufferFund.sol";
import {EtheraOracle} from "../oracle/EtheraOracle.sol";
import {EtheraUnit} from "../token/EtheraUnit.sol";

/**
 * CR Formula:
 * CR_target = CR_base + f(V) + f(L) - f(BSR)
 *
 * Where:
 * - CR_base = 150% (15000 bps)
 * - f(V) = volatility risk premium
 * - f(L) = liquidity risk premium
 * - f(BSR) = buffer insurance discount
 *
 * Decision Matrix (emerges from formula):
 * | Buffer    | Volatility | CR     |
 * |-----------|------------|--------|
 * | THICK     | LOW        | 120%   |
 * | THIN      | LOW        | 150%   |
 * | THICK     | HIGH       | 150%   |
 * | THIN      | HIGH       | 180%   |
 */
contract CREngine is ICREngine {
    using BSRCalculator for uint256;
    using PremiumCalculator for VolatilityLevel;
    using PremiumCalculator for LiquidityLevel;
    using PremiumCalculator for BufferState;

    uint256 public constant CR_BASE = 15000;

    uint256 public constant CR_MIN = 10000;

    uint256 public constant CR_MAX = 20000;

    uint256 public constant BPS = 10000;

    uint256 public constant PRECISION = 1e18;

    BufferFund public immutable bufferFund;

    EtheraUnit public immutable tppuToken;

    EtheraOracle public immutable etheraOracle;

    address public immutable ethUsdFeed;

    error InvalidAddress();
    error NegativePrice();

    constructor(
        address bufferFund_,
        address tppuToken_,
        address etheraOracle_,
        address ethUsdFeed_
    ) {
        if (bufferFund_ == address(0)) revert InvalidAddress();
        if (tppuToken_ == address(0)) revert InvalidAddress();
        if (etheraOracle_ == address(0)) revert InvalidAddress();
        if (ethUsdFeed_ == address(0)) revert InvalidAddress();

        bufferFund = BufferFund(payable(bufferFund_));
        tppuToken = EtheraUnit(tppuToken_);
        etheraOracle = EtheraOracle(etheraOracle_);
        ethUsdFeed = ethUsdFeed_;
    }

    function getTargetCR(
        VolatilityLevel v,
        LiquidityLevel l
    ) external view override returns (uint256 crBps) {
        // Get current BSR classification
        BufferState bsrState = _getCurrentBufferState();

        // Calculate CR using formula
        crBps = _calculateCR(v, l, bsrState);
    }

    function maxMintable(
        uint256 ethValueUsd,
        uint256 tppuUsdPrice,
        VolatilityLevel v,
        LiquidityLevel l
    ) external view override returns (uint256 maxTppu) {
        BufferState bsrState = _getCurrentBufferState();
        uint256 crBps = _calculateCR(v, l, bsrState);

        maxTppu = Math.mulDiv(
            ethValueUsd * BPS,
            PRECISION,
            crBps * tppuUsdPrice
        );
    }

    function getCurrentBSR() external view override returns (uint256 bsrBps) {
        (uint256 ethUsdPrice, uint256 tppuUsdPrice) = _getPrices();
        uint256 bufferEth = bufferFund.getBalance();
        uint256 tppuSupply = tppuToken.getTotalShares();

        bsrBps = BSRCalculator.calculateBSR(
            bufferEth,
            ethUsdPrice,
            tppuSupply,
            tppuUsdPrice
        );
    }

    function _calculateCR(
        VolatilityLevel v,
        LiquidityLevel l,
        BufferState bsr
    ) internal pure returns (uint256 crBps) {
        (uint256 adjustment, bool isNegative) = PremiumCalculator
            .calculateAdjustment(v, l, bsr);

        if (isNegative) {
            crBps = CR_BASE > adjustment ? CR_BASE - adjustment : CR_MIN;
        } else {
            crBps = CR_BASE + adjustment;
        }

        if (crBps < CR_MIN) crBps = CR_MIN;
        if (crBps > CR_MAX) crBps = CR_MAX;
    }

    function _getCurrentBufferState() internal view returns (BufferState) {
        (uint256 ethUsdPrice, uint256 tppuUsdPrice) = _getPrices();
        uint256 bufferEth = bufferFund.getBalance();
        uint256 tppuSupply = tppuToken.getTotalShares();

        if (tppuSupply == 0) {
            return BufferState.THICK; // Max discount when no liability
        }

        uint256 bsrBps = BSRCalculator.calculateBSR(
            bufferEth,
            ethUsdPrice,
            tppuSupply,
            tppuUsdPrice
        );

        return BSRCalculator.classifyBSR(bsrBps);
    }

    function _getPrices()
        internal
        view
        returns (uint256 ethUsdPrice, uint256 tppuUsdPrice)
    {
        IChainlinkFeed feed = IChainlinkFeed(ethUsdFeed);
        (, int256 answer, , uint256 updatedAt, ) = feed.latestRoundData();

        if (answer <= 0) revert NegativePrice();

        uint8 decimals = feed.decimals();
        ethUsdPrice = uint256(answer) * (10 ** (18 - decimals));

        tppuUsdPrice = etheraOracle.price();
    }

    function previewCR(
        VolatilityLevel v,
        LiquidityLevel l,
        BufferState bsr
    ) external pure returns (uint256 crBps) {
        return _calculateCR(v, l, bsr);
    }
}
