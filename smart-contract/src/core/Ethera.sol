// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {EtheraUnit} from "../token/EtheraUnit.sol";
import {BufferFund} from "./BufferFund.sol";
import {CREngine} from "./CREngine.sol";
import {PriceLib} from "../lib/PriceLib.sol";
import {VolatilityLevel, LiquidityLevel} from "../lib/RiskTypes.sol";
import {EtheraOracle} from "../oracle/EtheraOracle.sol";
import {IChainlinkFeed} from "../interfaces/IChainlinkFeed.sol";
import {
    ReentrancyGuard
} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

//     :::::::----------------------------------------------
//    ---:::::::-------------------------------------------::
//   -----::::::-------------------------------------:::::::::
//  -------::::-------------------------------------:::::::::::
//  --------:::-------------------------------------::::::::::::
//   -------=:::-----:-------------==============================
//    -----===-:------:=++++++++++++++++++***********##########%
//     ----====-::------=+++++++++++++++++**********##########%
//      =--====+-::::----=++++++++++++++***********##########%
//       ======++=::::::::=++++++++++++***********##########%
//        =====+++=::::::::-++++++++++***********##########
//          ===+++++:::::::::         %%%%%%%%#+##########
//           ++++++++-::::::::         %%%%%##*##########
//            ++++++*+:::::::::          %###*##########
//             ++++++**::::::::::        %##*##########
//              +++++***-::::::::          *##########
//               *++*****-::::::::.
//                ********-::::::::.
//                 ********=::::::::.
//                  ********=::::::::.
//                    *******+::::::::.
//                     ********:::::::::
//                      ******#+::::::::.
//                       ******#*:--------
//                      *********########
//                     *********########
//                    *+******+#########
//                   ++******+#*******#
//                  +++*****+********                     %++++++++++
//                 *+******+*********                    %%#=++++++===
//                +++****++******++*                    %%%%#==========
//               *++****++****++++*                    %%%%%%#-=======--
//              *+******+****++++                     %%%%%%%%#=====-----
//             ********+***++++++                    %%%%%%%%%#*+++******+
//            *******++****+++++                    %%%%#####%**#########
//           *******++****++++*                     %%%######+##########
//          ********+****+++++                    %%%%%#####***********
//         ********+****+++++**++                %%%%%%####***********
//        ********+*****+++++++++++++++***********#%%%%###*+******++*
//       ********+*****+++++++++++++++++***********#%%%##*+**+++++++
//      ********+*****++++*++++++++++++++***********#%%#*++++++++++
//     ********+*****++++*++++++++++++++++***********#%#++++++++++
//    **************++++++++============++++++++++++++++++++++==+
//    **************+++++++========================++++++++=====
//     *****+#*****+++++++===========================+++=======
//      ****##*****++++++++===================================
//       **###******+++++++++================================

contract Ethera is EtheraUnit, ReentrancyGuard {
    using PriceLib for uint256;

    uint256 public constant PRECISION = 1e18;

    uint256 public constant BPS = 10000;

    error ZeroValue();
    error InvalidCREngine();
    error InvalidBufferFund();
    error InvalidOracle();
    error ETHTransferFailed();
    error ExceedsMaxMintable();
    error NegativePrice();
    error InsufficientShares();
    error NoShares();
    error WithdrawDelayNotMet();
    error InsufficientCollateral();
    error DebtNotZero();
    error NothingToClaim();
    error WithdrawalBreaksCR();

    struct Position {
        uint256 collateralETH;
        uint256 debt;
        uint256 withdrawableETH;
        uint256 lastRepayTime;
    }

    event Deposit(
        address indexed user,
        uint256 ethAmount,
        uint256 tppuAmount,
        uint256 ethUsdPrice,
        uint256 tppuUsdPrice,
        uint256 collateralRatioBps
    );

    event Repay(
        address indexed user,
        uint256 tppuAmount,
        uint256 remainingDebt
    );

    event Withdraw(address indexed user, uint256 ethAmount);

    event Claim(address indexed user, uint256 ethAmount);

    uint256 public constant WITHDRAWAL_DELAY = 3 days;

    uint256 public constant MIN_CR_BPS = 15000; // 150%

    CREngine public immutable crEngine;

    BufferFund public immutable bufferFund;

    EtheraOracle public immutable etheraOracle;

    address public immutable ethUsdFeed;

    mapping(address => Position) public positions;

    constructor(
        address crEngine_,
        address bufferFund_,
        address etheraOracle_,
        address ethUsdFeed_
    ) EtheraUnit() ReentrancyGuard() {
        if (crEngine_ == address(0)) revert InvalidCREngine();
        if (bufferFund_ == address(0)) revert InvalidBufferFund();
        if (etheraOracle_ == address(0)) revert InvalidOracle();

        crEngine = CREngine(crEngine_);
        bufferFund = BufferFund(payable(bufferFund_));
        etheraOracle = EtheraOracle(etheraOracle_);
        ethUsdFeed = ethUsdFeed_;
    }

    function deposit()
        external
        payable
        nonReentrant
        returns (uint256 tppuAmount)
    {
        if (msg.value == 0) revert ZeroValue();

        (uint256 ethUsdPrice, uint256 tppuUsdPrice) = _getPrices();

        uint256 ethValueUsd = PriceLib.ethToUsd(msg.value, ethUsdPrice);

        VolatilityLevel volatility = VolatilityLevel.NORMAL;
        LiquidityLevel liquidity = LiquidityLevel.NORMAL;

        uint256 crBps = crEngine.getTargetCR(volatility, liquidity);

        tppuAmount = Math.mulDiv(
            ethValueUsd * BPS,
            PRECISION,
            crBps * tppuUsdPrice
        );

        mintShares(msg.sender, tppuAmount);

        Position storage position = positions[msg.sender];
        position.collateralETH += msg.value;
        position.debt += tppuAmount;
        position.lastRepayTime = block.timestamp;

        (bool success, ) = address(bufferFund).call{value: msg.value}("");
        if (!success) revert ETHTransferFailed();

        emit Deposit(
            msg.sender,
            msg.value,
            tppuAmount,
            ethUsdPrice,
            tppuUsdPrice,
            crBps
        );
    }

    function withdraw(uint256 ethAmount) external nonReentrant {
        if (ethAmount == 0) revert ZeroValue();

        Position storage position = positions[msg.sender];

        if (position.collateralETH == 0) revert NoShares();
        if (ethAmount > position.collateralETH) revert InsufficientCollateral();

        if (position.debt > 0) {
            // Debt exists: check CR after withdrawal
            uint256 remainingCollateral = position.collateralETH - ethAmount;
            if (!_checkHeartRate(remainingCollateral, position.debt)) {
                revert WithdrawalBreaksCR();
            }
        } else {
            // Debt is zero: check withdrawal delay
            if (block.timestamp < position.lastRepayTime + WITHDRAWAL_DELAY) {
                revert WithdrawDelayNotMet();
            }
        }

        // Update state: move to withdrawable, not directly to user
        position.collateralETH -= ethAmount;
        position.withdrawableETH += ethAmount;

        emit Withdraw(msg.sender, ethAmount);
    }

    function repay(uint256 tppuAmount) external nonReentrant {
        if (tppuAmount == 0) revert ZeroValue();

        Position storage position = positions[msg.sender];

        // Cap to remaining debt (protocol-safe rounding)
        if (tppuAmount > position.debt) {
            tppuAmount = position.debt;
        }

        // User must have sufficient TPPU shares
        uint256 userShares = sharesOf(msg.sender);
        if (userShares < tppuAmount) revert InsufficientShares();

        // Update debt BEFORE burning (CEI pattern)
        position.debt -= tppuAmount;

        // If debt fully repaid, record timestamp for withdrawal delay
        if (position.debt == 0) {
            position.lastRepayTime = block.timestamp;
        }

        // Burn TPPU tokens
        _burn(msg.sender, tppuAmount);

        emit Repay(msg.sender, tppuAmount, position.debt);
    }

    function claim() external nonReentrant {
        Position storage position = positions[msg.sender];

        if (position.debt > 0) revert DebtNotZero();
        if (position.withdrawableETH == 0) revert NothingToClaim();

        uint256 claimAmount = position.withdrawableETH;

        // Clear state BEFORE external call (CEI pattern)
        position.withdrawableETH = 0;

        // Request ETH from BufferFund
        bufferFund.withdrawTo(msg.sender, claimAmount);

        emit Claim(msg.sender, claimAmount);
    }

    function _checkHeartRate(
        uint256 collateralETH,
        uint256 debtTPPU
    ) internal view returns (bool) {
        if (debtTPPU == 0) return true;

        (uint256 ethUsdPrice, uint256 tppuUsdPrice) = _getPrices();

        // collateral_value / debt_value >= minCR (150%)
        uint256 collateralValueUsd = PriceLib.ethToUsd(
            collateralETH,
            ethUsdPrice
        );
        uint256 debtValueUsd = Math.mulDiv(debtTPPU, tppuUsdPrice, PRECISION);

        // collateralValueUsd * BPS >= debtValueUsd * MIN_CR_BPS
        return collateralValueUsd * BPS >= debtValueUsd * MIN_CR_BPS;
    }

    function liquidate() public {}

    function previewDeposit(
        uint256 ethAmount
    )
        external
        view
        returns (
            uint256 tppuAmount,
            uint256 crBps,
            uint256 ethUsdPrice,
            uint256 tppuUsdPrice
        )
    {
        (ethUsdPrice, tppuUsdPrice) = _getPrices();

        uint256 ethValueUsd = PriceLib.ethToUsd(ethAmount, ethUsdPrice);

        crBps = crEngine.getTargetCR(
            VolatilityLevel.NORMAL,
            LiquidityLevel.NORMAL
        );

        tppuAmount = Math.mulDiv(
            ethValueUsd * BPS,
            PRECISION,
            crBps * tppuUsdPrice
        );
    }

    function getSystemMetrics()
        external
        view
        returns (
            uint256 bsrBps,
            uint256 crBps,
            uint256 totalTPPU,
            uint256 bufferEth
        )
    {
        bsrBps = crEngine.getCurrentBSR();
        crBps = crEngine.getTargetCR(
            VolatilityLevel.NORMAL,
            LiquidityLevel.NORMAL
        );
        totalTPPU = getTotalShares();
        bufferEth = bufferFund.getBalance();
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
}
