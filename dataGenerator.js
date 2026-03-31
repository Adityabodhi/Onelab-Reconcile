/**
 * Onelab Assessment: Data Generation Engine
 * Responsible for creating synthetic transaction and settlement data
 * with injected gaps for reconciliation testing.
 */

export const generateData = () => {
    const transactions = [];
    const settlements = [];
    const startDate = new Date(2026, 3, 1); // April 1st, 2026

    // 1. Generate normal "Golden Path" data (90% of data)
    for (let i = 0; i < 50; i++) {
        const id = `TX-${1000 + i}`;
        const amount = parseFloat((Math.random() * 500 + 10).toFixed(2));
        const date = new Date(startDate);
        date.setDate(date.getDate() + Math.floor(i / 2));

        transactions.push({
            id,
            date: date.toISOString().split('T')[0],
            amount,
            type: 'payment',
            description: `Sale at Register ${i % 5}`
        });

        // Settlements happen 1-2 days later
        const settlementDate = new Date(date);
        settlementDate.setDate(settlementDate.getDate() + (Math.random() > 0.5 ? 1 : 2));

        settlements.push({
            settlement_id: `SET-${5000 + i}`,
            transaction_id: id,
            date: settlementDate.toISOString().split('T')[0],
            amount,
            status: 'settled'
        });
    }

    // 2. Inject Gap Type 1: Timing Difference (Settled following month)
    // Transaction on April 29, Settled on May 1
    const tGapDate = new Date(2026, 3, 29);
    const sGapDate = new Date(2026, 4, 1);
    const tGapId = 'TX-TIMING-001';
    
    transactions.push({
        id: tGapId,
        date: tGapDate.toISOString().split('T')[0],
        amount: 850.50,
        type: 'payment',
        description: 'Large Corporate Order'
    });
    
    settlements.push({
        settlement_id: 'SET-TIMING-001',
        transaction_id: tGapId,
        date: sGapDate.toISOString().split('T')[0],
        amount: 850.50,
        status: 'settled'
    });

    // 3. Inject Gap Type 2: Rounding Difference 
    // Two transactions of $10.004 results in $20.008 -> $20.01 internally
    // But bank settles them as two separate $10.00 items? 
    // Or bank batches them but rounds differently.
    const rGapId = 'TX-ROUND-001';
    transactions.push({
        id: rGapId,
        date: '2026-04-15',
        amount: 100.005, // Will round to 100.01 in UI
        type: 'payment',
        description: 'Micro-transaction Batch A'
    });
    
    settlements.push({
        settlement_id: 'SET-ROUND-001',
        transaction_id: rGapId,
        date: '2026-04-17',
        amount: 100.00, // Bank lost the half-cent
        status: 'settled'
    });

    // 4. Inject Gap Type 3: Duplicate Entry in Internal System
    const dGapId = 'TX-DUP-999';
    const dupData = {
        id: dGapId,
        date: '2026-04-10',
        amount: 125.00,
        type: 'payment',
        description: 'Subscription Renewal'
    };
    transactions.push(dupData);
    transactions.push({...dupData}); // Exact duplicate entry in books!
    
    settlements.push({
        settlement_id: 'SET-DUP-999',
        transaction_id: dGapId,
        date: '2026-04-12',
        amount: 125.00,
        status: 'settled'
    });

    // 5. Inject Gap Type 4: Orphan Refund (Bank has it, platform doesn't)
    settlements.push({
        settlement_id: 'SET-ORPHAN-001',
        transaction_id: 'TX-UNKNOWN-X',
        date: '2026-04-20',
        amount: -45.00, // Refund
        status: 'settled'
    });

    return { transactions, settlements };
};
