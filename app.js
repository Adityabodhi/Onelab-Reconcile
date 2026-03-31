import { generateData } from './dataGenerator.js';
import { reconcile } from './reconciliation.js';

document.addEventListener('DOMContentLoaded', () => {
    let currentData = null;
    let reconciliationResults = null;

    const elements = {
        internalBal: document.getElementById('internal-balance'),
        bankBal: document.getElementById('bank-balance'),
        variance: document.getElementById('variance'),
        gapCount: document.getElementById('gap-count'),
        timingCount: document.getElementById('timing-count'),
        roundingCount: document.getElementById('rounding-count'),
        duplicateCount: document.getElementById('duplicate-count'),
        orphanCount: document.getElementById('orphan-count'),
        reconBody: document.getElementById('recon-body'),
        regenBtn: document.getElementById('regenerate-data'),
        filterTabs: document.querySelectorAll('.filter-tab')
    };

    const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

    const updateDashboard = (results, gaps) => {
        // Calculate totals
        const totalInternal = currentData.transactions.reduce((sum, tx) => sum + tx.amount, 0);
        const totalSettled = currentData.settlements.reduce((sum, s) => sum + s.amount, 0);
        const varianceVal = totalInternal - totalSettled;

        elements.internalBal.textContent = formatCurrency(totalInternal);
        elements.bankBal.textContent = formatCurrency(totalSettled);
        elements.variance.textContent = formatCurrency(varianceVal);
        
        const totalGaps = gaps.timing.length + gaps.rounding.length + gaps.duplicate.length + gaps.orphan.length;
        elements.gapCount.textContent = `${totalGaps} Issues Identified`;

        elements.timingCount.textContent = gaps.timing.length;
        elements.roundingCount.textContent = gaps.rounding.length;
        elements.duplicateCount.textContent = gaps.duplicate.length;
        elements.orphanCount.textContent = gaps.orphan.length;

        renderTable(results);
    };

    const renderTable = (results, filter = 'all') => {
        elements.reconBody.innerHTML = '';
        
        const filtered = filter === 'gaps' 
            ? results.filter(r => r.status !== 'MATCHED') 
            : results;

        filtered.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.date}</td>
                <td><code class="tx-code">${row.id}</code></td>
                <td>${row.type}</td>
                <td>${formatCurrency(row.amount)}</td>
                <td>${formatCurrency(row.settled_amt)}</td>
                <td><span class="status-tag ${row.status.toLowerCase().replace('_', '-')}">${row.status_text}</span></td>
            `;
            elements.reconBody.appendChild(tr);
        });
    };

    const refreshData = () => {
        currentData = generateData();
        const { results, gaps } = reconcile(currentData.transactions, currentData.settlements);
        reconciliationResults = results;
        updateDashboard(results, gaps);
    };

    // Event Listeners
    elements.regenBtn.addEventListener('click', refreshData);

    elements.filterTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            elements.filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderTable(reconciliationResults, tab.dataset.filter);
        });
    });

    // Initial Load
    refreshData();
});
