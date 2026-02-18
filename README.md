# Ethera Protocol

> **Money that can't be inflated away.**

Protocol Design Document | Version 1.0 | February 2026

---

*This document is the result of iterative design.
Every decision includes its reasoning.
Limitations are explicitly acknowledged, not hidden.*

---

## Table of Contents

1. [Vision & Problem Statement](#1-vision--problem-statement)
2. [Token Architecture — ETHERA & wETHERA](#2-token-architecture--ethera--wethera)
3. [Ethera Price Index — How ETHERA Price Is Determined](#3-ethera-price-index--how-ethera-price-is-determined)
4. [ETH Staking Layer & Yield Distribution](#4-eth-staking-layer--yield-distribution)
5. [Collateral & Minting](#5-collateral--minting)
6. [Buffer Fund — Slashing Insurance](#6-buffer-fund--slashing-insurance)
7. [Liquidation System](#7-liquidation-system)
8. [Protocol Economics](#8-protocol-economics)
9. [System Architecture](#9-system-architecture)
10. [Smart Contract Interfaces](#10-smart-contract-interfaces)
11. [Acknowledged Limitations — V1](#11-acknowledged-limitations--v1)
12. [Frequently Anticipated Questions](#12-frequently-anticipated-questions)

---

## 1. Vision & Problem Statement

### 1.1 The Problem Being Solved

All existing stablecoins share the same structural flaw: they are stable against the fiat, but the fiat itself is not stable against purchasing power.

USDC, USDT, and DAI may maintain their peg, but their real value declines over time due to inflation.

> **Example:** U.S. CPI in 2022 reached 8.5% YoY. That means $1,000 USDC held at the beginning of 2022 had the purchasing power of only $922 by the end of the year. Not because USDC depegged, but because the fiat weakened.

**Core Insight:**
DeFi has successfully solved censorship resistance and permissionlessness.
It has *not* fundamentally solved purchasing power preservation.

Ethera is the first attempt to build an inflation-indexed monetary primitive using fully decentralized infrastructure.

### 1.2 Ethera Vision in One Sentence

Ethera is money that cannot be inflated. Its fiat value rises with inflation instead of falling alongside it.

---

## 2. Token Architecture — ETHERA & wETHERA

### 2.1 Two Tokens, Two Use Cases

Ethera uses a dual-token structure.

| Token | Type | Primary Function | Target User |
|---|---|---|---|
| ETHERA | Rebasing ERC-20 | Savings + inflation hedge. Balance increases via rebase | Passive holders |
| wETHERA | Wrapped non-rebasing ERC-20 | DeFi composability. Ratio adjusts over time | Developers & protocols |

Rebasing tokens are incompatible with many DeFi systems due to balance mutations.
wETHERA solves this exactly like wstETH does for stETH.

- Retail users hold **ETHERA**.
- Protocols integrate **wETHERA**.

### 2.2 Relationship Between ETHERA and wETHERA

The `wETHERA:ETHERA` ratio increases over time as rebases occur.

**At genesis:**

```
1 wETHERA = 1 ETHERA
```

**After 1 year at 4% APR (90% net distributed):**

```
1 wETHERA ≈ 1.036 ETHERA
```

**Conversions:**

```
Wrap:   wETHERA = ETHERA / currentRatio
Unwrap: ETHERA  = wETHERA × currentRatio
```

---

## 3. Ethera Price Index — How ETHERA Price Is Determined

### 3.1 Final Index Composition

ETHERA price is determined by a weighted economic index.

| Component | Weight | Rationale |
|---|---|---|
| CPI Composite | 50% | Core purchasing power |
| Gold (XAU/USD) | 30% | Primary hard asset |
| Silver (XAG/USD) | 20% | Industrial + monetary hedge |

### 3.2 Oracle Formula

ETHERA price reflects relative change from genesis values:

```
P_ethera = P_start × (
  0.50 × CPI_t    / CPI_0    +
  0.30 × Gold_t   / Gold_0   +
  0.20 × Silver_t / Silver_0
)
```

- **Genesis anchor:** `$1.00`
- The oracle stores both the final price and per-component ratios for transparency.
- This allows anyone to inspect *why* ETHERA moved.

---

## 4. ETH Staking Layer & Yield Distribution

Deposited ETH is staked via protocol validators.

**Yield distribution:**

| Destination | Allocation |
|---|---|
| Protocol revenue | 10% (fixed) |
| Buffer Fund | 5-40% (dynamic, based on BSR) |
| ETHERA holders (rebase) | Remaining |

### 4.2 Rebase Mechanism — Direct Minting (Selected)

Three options were evaluated:

| Option | Mechanism | Decision |
|---|---|---|
| DEX Buy | Buy ETHERA from market | Rejected (MEV risk, liquidity dependency) |
| Direct Mint | Mint new ETHERA from yield | **Selected** |
| Depositors Only | Rebase only depositors | Rejected (two-class system) |

Rebase increases total supply proportionally without altering ownership share.
Every new ETHERA is backed by real ETH yield.

### 4.3 Dynamic Yield Split — Buffer Solvency Ratio

| BSR Condition | Buffer | User | Protocol |
|---|---|---|---|
| < 2% | 40% | 50% | 10% |
| 2-5% | 20% | 70% | 10% |
| > 5% | 5% | 85% | 10% |

Dynamic allocation prevents capital inefficiency while maintaining tail-risk protection.

---

## 5. Collateral & Minting

Users obtain ETHERA by:

1. **Depositing ETH** (minting)
2. **Buying on secondary market**

Only deposited ETH positions generate rebase yield.

### 5.4 Two ETHERA Buckets Per User

| Bucket | Meaning | Affects CR? |
|---|---|---|
| `mintedETHERA` | Debt from minting | Yes |
| `rebaseETHERA` | Yield reward | No |

This separation prevents liquidation purely due to reward accrual.

---

## 6. Buffer Fund — Slashing Insurance

Stored in **ETH** (not ETHERA).

**Purpose:**

- Absorb validator slashing losses
- Maintain collateral integrity
- Increase user confidence

> Slashing is statistically rare (~0.03-0.04% annually), but tail-risk protection is necessary.

---

## 7. Liquidation System

Two liquidation triggers:

1. **Nominal CR breach** (standard CDP model)
2. **Real value erosion** (ETHERA appreciation increases debt value)

The second trigger is unique to Ethera. If ETHERA rises significantly while ETH stagnates, debt grows in real terms.

> **Warning:** This must be clearly communicated in the UI.

---

## 8. Protocol Economics

**Revenue:**

- 10% of staking yield (~0.4% of TVL annually at 4% APR)
- Optional minting fee
- Liquidation fee

**Break-even simulation:**

- ~$50M TVL needed to cover $200k annual OPEX
- Early-stage sustainability requires external funding.

---

## 9. System Architecture

**Four layers:**

```
┌──────────────────────────────┐
│         User Layer           │
├──────────────────────────────┤
│       Staking Layer          │
├──────────────────────────────┤
│     Oracle Layer (CRE)       │
├──────────────────────────────┤
│   Smart Contract Layer       │
└──────────────────────────────┘
```

**Core contracts:**

| Contract | Purpose |
|---|---|
| `ETHERAPriceConsumer.sol` | CRE oracle price feed |
| `ETHERAVault.sol` | Deposit, mint, CR logic |
| `ETHERAToken.sol` | Rebasing ERC-20 |
| `wETHERAToken.sol` | Wrapped non-rebasing token |
| `BufferFund.sol` | Slashing insurance pool |
| `DynamicCR.sol` | Dynamic collateral ratio |

---

## 10. Smart Contract Interfaces

Interfaces remain structurally identical to the original specification.
*(Technical Solidity interfaces preserved as written.)*

---

## 11. Acknowledged Limitations — V1

### Technical

- Monthly CPI release
- Single CPI basket
- Single collateral (ETH only)
- Semi-trusted validator set
- Counterintuitive real-value liquidation

### Economic

- Requires significant TVL
- Yield haircut vs self-staking
- Rising ETHERA price increases borrowing cost
- Liquidity bootstrap challenges

### Scope Boundaries

- Not multi-collateral
- Not cross-chain
- No governance token (V1)
- Not fully trustless staking

---

## 12. Frequently Anticipated Questions

<details>
<summary><strong>Why not RAI?</strong></summary>

| | RAI | Ethera |
|---|---|---|
| Peg | Market-driven floating peg | CPI + hard asset narrative |
| Yield | No yield engine | ETH staking as economic engine |
| Narrative | Abstract monetary narrative | Concrete inflation hedge framing |

</details>

<details>
<summary><strong>Why not use Aave + stETH?</strong></summary>

- USDC debt erodes with inflation
- ETHERA is purchasing-power indexed
- ETHERA functions as a savings instrument

</details>
---

## Project Structure

```
ethera/
├── smart-contract/     # Solidity contracts (Foundry)
├── cre-ethera/         # CRE oracle workflow
├── frontend/           # Next.js frontend
└── README.md
```

---

*This document reflects the state of design thinking as of February 2026.*
*All economic parameters are governance-adjustable post-launch.*