# Onelab Assessment - Implementation Walkthrough

This document outlines the strategic approach and technical implementation for the **Financial Reconciliation Assessment**.

## 🧠 1. Brainstorming & Analysis

### The Problem
- **Core issue**: Mismatch between platform internal books and bank settlement statements.
- **Goal**: Identify and categorize the "Gaps" causing the imbalance.

### Data Strategy
Since no files were provided, I designed a synthetic data engine that generates realistic "Golden Path" data (90% success) and injects the 4 requested "Gap Types" with controlled edge cases.

### Expected Gap Types & Logic:
1.  **Timing Difference**: 
    - *Scenario*: Transaction on April 29th, Settle Date on May 2nd. 
    - *Detection*: Tx date <= MonthEnd AND Settle date > MonthEnd.
2.  **Rounding Difference**:
    - *Scenario*: Internal amount $100.005 (rounds to $100.01) vs Bank amount $100.00.
    - *Detection*: Tx amount != Settle amount, where delta < $0.05.
3.  **Duplicate Entry**:
    - *Scenario*: Same TxID appears twice in internal ledger but only once at the bank.
    - *Detection*: Tracking TxIDs in a `Set` during processing and flagging recurring IDs.
4.  **Orphan Refund**:
    - *Scenario*: Bank records a refund settlement that has no matching initial transaction in the platform.
    - *Detection*: Post-processing the settlement list to find items not "used" (matched) during the transaction pass.

---

## 🛠️ 2. Distilled Prompt

If I were to prompt Claude Code or Cursor to build this in one go, I would use this distilled prompt:

> **Prompt**: "Build a high-fidelity Financial Reconciliation Dashboard in a single-page Vanilla HTML/JS/CSS app. 
> 
> 1. **Data Engine**: Generate 50+ synthetic transactions and settlements. Inject 4 specific gaps: 
>    - (a) A transaction in April that settles in May. 
>    - (b) A rounding difference ($0.01 drift). 
>    - (c) A duplicate internal transaction entry. 
>    - (d) A refund in settlements with no matching internal transaction ID. 
> 
> 2. **Reconciliation Logic**: Implement a matching engine that pairs IDs/Amounts and flags these 4 specific 'Gap Types' with clear descriptions. 
> 
> 3. **UI/UX**: Create a premium, dark-mode glassmorphic dashboard. Include high-level metrics (Internal Sum vs Bank Sum vs Variance), a 'Gap Analysis' sidebar with counts, and a sortable table with status tags (@matched, @timing-diff, @rounding-error, etc.). Ensure the design feels bespoke and state-of-the-art."

---

## ✅ 3. Test Cases & Verification

| Test Case | Method | Expected Result | Actual Result |
| :--- | :--- | :--- | :--- |
| **Timing Gap** | Created `TX-TIMING-001` (Apr 29) + `SET-TIMING-001` (May 1) | UI flags as "Pending (Next Month)" | ✅ Verified |
| **Rounding Gap** | Created `TX-ROUND-001` ($100.005) + `SET-ROUND-001` ($100.00) | UI flags as "Rounding Error" | ✅ Verified |
| **Duplicate Gap** | Injected `TX-DUP-999` twice into Tx array. | UI flags 2nd instance as "Duplicate Entry" | ✅ Verified |
| **Orphan Gap** | Created `SET-ORPHAN-001` with unknown TxID. | UI flags as "Orphan Record" | ✅ Verified |
| **Data Integrity** | Total Internal - Total Bank = Total Variance | Variance matches sum of individual gaps | ✅ Verified |

---

## 🚀 4. Working Output Summary

### How to Run
1. Navigate to the project directory.
2. Run a simple local server (e.g., `python -m http.server 8000`).
3. Open `http://localhost:8000` in your browser.

### ⚠️ What would go wrong in production?
In a real-world scenario, this implementation would face three major challenges:
1. **Scale**: Arrays and `Set` filters work for 1,000 transactions, but production involves millions. We would need a streaming database approach (e.g., SQL joins) rather than in-memory JS processing.
2. **Complex Batching**: Real banks often batch 50 transactions into 1 settlement record. This system assumes 1-to-1 matching, whereas production requires a N-to-1 aggregate matching algorithm using fuzzy logic or metadata (e.g., matching common memo fields).
3. **Multi-Currency Drift**: Production environments deal with FX rates. A transaction in EUR settled in USD creates "realized gain/loss" variances that look like rounding errors but are actually accounting adjustments.

---
**Author**: Adityabodhi Gaikwad
**Date**: March 31, 2026
