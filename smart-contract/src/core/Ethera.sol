// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {EtheraUnit} from "../tokens/EtheraUnit.sol";
import {IChainlinkFeed} from "../interfaces/IChainlinkFeed.sol";
import {
    ReentrancyGuard
} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

contract Ethera is EtheraUnit, ReentrancyGuard {
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
        uint256 etheraAmount,
        uint256 ethUsdPrice,
        uint256 etheraUsdPrice,
        uint256 collateralRatioBps
    );

    event Repay(
        address indexed user,
        uint256 etheraAmount,
        uint256 remainingDebt
    );

    event Withdraw(address indexed user, uint256 ethAmount);

    event Claim(address indexed user, uint256 ethAmount);

    uint256 public constant WITHDRAWAL_DELAY = 3 days;

    uint256 public constant MIN_CR_BPS = 15000; // 150%

    address public immutable ethUsdFeed;

    mapping(address => Position) public positions;

    constructor(address ethUsdFeed_) EtheraUnit() ReentrancyGuard() {
        if (ethUsdFeed_ == address(0)) revert InvalidOracle();

        ethUsdFeed = ethUsdFeed_;
    }

    function deposit()
        external
        payable
        nonReentrant
        returns (uint256 etheraAmount)
    {
        if (msg.value == 0) revert ZeroValue();

        (uint256 ethUsdPrice, uint256 etheraUsdPrice) = _getPrices();

        mintShares(msg.sender, etheraAmount);

        Position storage position = positions[msg.sender];
        position.collateralETH += msg.value;
        position.debt += etheraAmount;
        position.lastRepayTime = block.timestamp;

        // emit Deposit(
        //     msg.sender,
        //     msg.value,
        //     etheraAmount,
        //     ethUsdPrice,
        //     etheraUsdPrice
        // );
    }

    function withdraw(uint256 ethAmount) external nonReentrant {
        if (ethAmount == 0) revert ZeroValue();

        Position storage position = positions[msg.sender];

        if (position.collateralETH == 0) revert NoShares();
        if (ethAmount > position.collateralETH) revert InsufficientCollateral();

        if (position.debt > 0) {
            // Debt exists: check CR after withdrawal
            uint256 remainingCollateral = position.collateralETH - ethAmount;
            _checkHeartRate(remainingCollateral, position.debt);
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

    function repay(uint256 etheraAmount) external nonReentrant {
        if (etheraAmount == 0) revert ZeroValue();

        Position storage position = positions[msg.sender];

        // Cap to remaining debt (protocol-safe rounding)
        if (etheraAmount > position.debt) {
            etheraAmount = position.debt;
        }

        uint256 userShares = sharesOf(msg.sender);
        if (userShares < etheraAmount) revert InsufficientShares();

        // Update debt BEFORE burning (CEI pattern)
        position.debt -= etheraAmount;

        // If debt fully repaid, record timestamp for withdrawal delay
        if (position.debt == 0) {
            position.lastRepayTime = block.timestamp;
        }

        // Burn TPPU tokens
        _burn(msg.sender, etheraAmount);

        emit Repay(msg.sender, etheraAmount, position.debt);
    }

    function claim() external nonReentrant {
        Position storage position = positions[msg.sender];

        if (position.debt > 0) revert DebtNotZero();
        if (position.withdrawableETH == 0) revert NothingToClaim();

        uint256 claimAmount = position.withdrawableETH;

        position.withdrawableETH = 0;

        emit Claim(msg.sender, claimAmount);
    }

    function _checkHeartRate(
        uint256 collateralETH,
        uint256 debtETHERA
    ) internal view {
        if (debtETHERA == 0) return;

        (uint256 ethUsdPrice, uint256 etheraUsdPrice) = _getPrices();

        // collateral_value / debt_value >= minCR (150%)

        uint256 debtValueUsd = Math.mulDiv(
            debtETHERA,
            etheraUsdPrice,
            PRECISION
        );

        // collateralValueUsd * BPS >= debtValueUsd * MIN_CR_BPS
    }

    function liquidate() public {}

    function previewDeposit(
        uint256 ethAmount
    )
        external
        view
        returns (
            uint256 etheraAmount,
            uint256 crBps,
            uint256 ethUsdPrice,
            uint256 etheraUsdPrice
        )
    {
        (ethUsdPrice, etheraUsdPrice) = _getPrices();
    }

    function _getPrices()
        internal
        view
        returns (uint256 ethUsdPrice, uint256 etheraUsdPrice)
    {
        IChainlinkFeed feed = IChainlinkFeed(ethUsdFeed);
        (, int256 answer, , uint256 updatedAt, ) = feed.latestRoundData();

        if (answer <= 0) revert NegativePrice();

        uint8 decimals = feed.decimals();
        ethUsdPrice = uint256(answer) * (10 ** (18 - decimals));
    }
}
