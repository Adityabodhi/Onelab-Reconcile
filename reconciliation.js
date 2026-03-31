/**
 * Onelab Assessment: Reconciliation Engine
 * Core logic for matching transactions to settlements and finding gaps.
 */

export const reconcile = (transactions, settlements) => {
    const results = [];
    const gaps = {
        timing: [],    // April -> May
        rounding: [],  // Floating point drift
        duplicate: [], // Internal system double entry
        orphan: []     // Settlement without original TX
    };

    const monthEnd = new Date(2026, 3, 30); // April 30

    // Clone to avoid side effects
    const settlementsCopy = [...settlements];
    const settlementMap = new Map();
    settlementsCopy.forEach(s => {
        if (!settlementMap.has(s.transaction_id)) {
            settlementMap.set(s.transaction_id, []);
        }
        settlementMap.get(s.transaction_id).push(s);
    });

    // Strategy: Pass 1 - Process Transactions
    const txTracker = new Set();
    transactions.forEach((tx) => {
        const matchingSettlements = settlementMap.get(tx.id) || [];
        const match = matchingSettlements.find(s => !s.used);
        
        // Gap 3: Duplicate entry in internal ledger?
        if (txTracker.has(tx.id)) {
            gaps.duplicate.push(tx);
            results.push({
                ...tx,
                settled_amt: 0.00,
                status: 'DUPLICATE_ERROR',
                status_text: 'Duplicate Entry'
            });
            return;
        }
        txTracker.add(tx.id);

        if (match) {
            match.used = true;
            const diff = Math.abs(tx.amount - match.amount);
            
            // Gap 2: Rounding Difference 
            if (diff > 0 && diff < 0.05) {
                gaps.rounding.push({ tx, settlement: match });
                results.push({
                    ...tx,
                    settled_amt: match.amount,
                    status: 'ROUNDING_DIFF',
                    status_text: 'Rounding Error'
                });
            } else {
                // Check if timing difference
                const settleDate = new Date(match.date);
                if (settleDate > monthEnd && new Date(tx.date) <= monthEnd) {
                    gaps.timing.push({ tx, settlement: match });
                    results.push({
                        ...tx,
                        settled_amt: match.amount,
                        status: 'TIMING_DIFF',
                        status_text: 'Pending (Next Month)'
                    });
                } else {
                    results.push({
                        ...tx,
                        settled_amt: match.amount,
                        status: 'MATCHED',
                        status_text: 'Matched'
                    });
                }
            }
        } else {
            // No settlement found at all
            results.push({
                ...tx,
                settled_amt: 0.00,
                status: 'MISSING',
                status_text: 'Unsettled'
            });
        }
    });

    // Strategy: Pass 2 - Find Orphan Settlements
    settlementsCopy.filter(s => !s.used).forEach(s => {
        gaps.orphan.push(s);
        results.push({
            id: s.transaction_id || 'UNKNOWN',
            date: s.date,
            amount: 0.00,
            settled_amt: s.amount,
            type: 'UNKNOWN',
            status: 'ORPHAN_REFUND',
            status_text: 'Orphan Record'
        });
    });

    return { results, gaps };
};
