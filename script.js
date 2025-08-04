// Tax Calculator JavaScript

// Tax slabs for FY 2024-25
const TAX_SLABS = {
    newRegime: {
        below60: [
            { min: 0, max: 300000, rate: 0 },
            { min: 300000, max: 700000, rate: 5 },
            { min: 700000, max: 1000000, rate: 10 },
            { min: 1000000, max: 1200000, rate: 15 },
            { min: 1200000, max: 1500000, rate: 20 },
            { min: 1500000, max: Infinity, rate: 30 }
        ],
        '60to80': [
            { min: 0, max: 300000, rate: 0 },
            { min: 300000, max: 700000, rate: 5 },
            { min: 700000, max: 1000000, rate: 10 },
            { min: 1000000, max: 1200000, rate: 15 },
            { min: 1200000, max: 1500000, rate: 20 },
            { min: 1500000, max: Infinity, rate: 30 }
        ],
        above80: [
            { min: 0, max: 500000, rate: 0 },
            { min: 500000, max: 700000, rate: 5 },
            { min: 700000, max: 1000000, rate: 10 },
            { min: 1000000, max: 1200000, rate: 15 },
            { min: 1200000, max: 1500000, rate: 20 },
            { min: 1500000, max: Infinity, rate: 30 }
        ]
    },
    oldRegime: {
        below60: [
            { min: 0, max: 250000, rate: 0 },
            { min: 250000, max: 500000, rate: 5 },
            { min: 500000, max: 1000000, rate: 20 },
            { min: 1000000, max: Infinity, rate: 30 }
        ],
        '60to80': [
            { min: 0, max: 300000, rate: 0 },
            { min: 300000, max: 500000, rate: 5 },
            { min: 500000, max: 1000000, rate: 20 },
            { min: 1000000, max: Infinity, rate: 30 }
        ],
        above80: [
            { min: 0, max: 500000, rate: 0 },
            { min: 500000, max: 1000000, rate: 20 },
            { min: 1000000, max: Infinity, rate: 30 }
        ]
    }
};

// Standard deduction for new regime
const STANDARD_DEDUCTION = {
    newRegime: 75000,
    oldRegime: 0
};

// Initialize the calculator
document.addEventListener('DOMContentLoaded', function() {
    // Set up event listeners
    setupEventListeners();
    
    // Initialize form
    initializeForm();
    
    // Show initial empty results
    showEmptyResults();
});

function setupEventListeners() {
    // Regime change listener
    document.getElementById('regime').addEventListener('change', handleRegimeChange);
    
    // Form input listeners for real-time calculation
    const inputs = ['annualIncome', 'age', 'section80C', 'section80D', 'hra', 'otherDeductions'];
    inputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', debounce(calculateTax, 500));
        }
    });
    
    // Smooth scrolling for navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

function initializeForm() {
    // Set default values
    document.getElementById('annualIncome').value = '';
    document.getElementById('age').value = 'below60';
    document.getElementById('regime').value = 'new';
    
    // Hide old regime deductions initially
    handleRegimeChange();
}

function handleRegimeChange() {
    const regime = document.getElementById('regime').value;
    const deductionsSection = document.getElementById('oldRegimeDeductions');
    const regimeBadge = document.getElementById('regimeBadge');
    
    if (regime === 'old') {
        deductionsSection.style.display = 'block';
        regimeBadge.textContent = 'Old Regime';
        regimeBadge.style.background = 'linear-gradient(135deg, #dc2626, #b91c1c)';
    } else {
        deductionsSection.style.display = 'none';
        regimeBadge.textContent = 'New Regime';
        regimeBadge.style.background = 'linear-gradient(135deg, #10b981, #059669)';
    }
    
    // Recalculate if income is entered
    if (document.getElementById('annualIncome').value) {
        calculateTax();
    }
}

function calculateTax() {
    const income = parseFloat(document.getElementById('annualIncome').value) || 0;
    const age = document.getElementById('age').value;
    const regime = document.getElementById('regime').value;
    
    if (income <= 0) {
        showEmptyResults();
        return;
    }
    
    // Show loading state
    const calculateBtn = document.querySelector('.btn-calculate');
    calculateBtn.classList.add('loading');
    
    setTimeout(() => {
        const result = performTaxCalculation(income, age, regime);
        displayResults(result);
        calculateBtn.classList.remove('loading');
    }, 300);
}

function performTaxCalculation(income, age, regime) {
    // Get deductions
    let totalDeductions = 0;
    
    if (regime === 'new') {
        totalDeductions = STANDARD_DEDUCTION.newRegime;
    } else {
        const section80C = Math.min(parseFloat(document.getElementById('section80C').value) || 0, 150000);
        const section80D = parseFloat(document.getElementById('section80D').value) || 0;
        const hra = parseFloat(document.getElementById('hra').value) || 0;
        const otherDeductions = parseFloat(document.getElementById('otherDeductions').value) || 0;
        
        totalDeductions = section80C + section80D + hra + otherDeductions;
    }
    
    // Calculate taxable income
    const taxableIncome = Math.max(0, income - totalDeductions);
    
    // Get tax slabs
    const slabs = TAX_SLABS[regime][age];
    
    // Calculate tax
    let tax = 0;
    const breakdown = [];
    
    for (const slab of slabs) {
        if (taxableIncome > slab.min) {
            const taxableAmount = Math.min(taxableIncome, slab.max) - slab.min;
            const slabTax = (taxableAmount * slab.rate) / 100;
            tax += slabTax;
            
            if (slabTax > 0) {
                breakdown.push({
                    range: slab.max === Infinity ? 
                        `₹${formatNumber(slab.min)}+ @ ${slab.rate}%` : 
                        `₹${formatNumber(slab.min)} - ₹${formatNumber(slab.max)} @ ${slab.rate}%`,
                    tax: slabTax
                });
            }
        }
    }
    
    // Calculate cess (4% on tax)
    const cess = tax * 0.04;
    const totalTax = tax + cess;
    
    return {
        grossIncome: income,
        totalDeductions: totalDeductions,
        taxableIncome: taxableIncome,
        incomeTax: tax,
        cess: cess,
        totalTax: totalTax,
        netIncome: income - totalTax,
        breakdown: breakdown,
        regime: regime
    };
}

function displayResults(result) {
    // Update summary
    document.getElementById('grossIncome').textContent = `₹${formatNumber(result.grossIncome)}`;
    document.getElementById('totalDeductions').textContent = `₹${formatNumber(result.totalDeductions)}`;
    document.getElementById('taxableIncome').textContent = `₹${formatNumber(result.taxableIncome)}`;
    document.getElementById('incomeTax').textContent = `₹${formatNumber(result.incomeTax)}`;
    document.getElementById('cess').textContent = `₹${formatNumber(result.cess)}`;
    document.getElementById('totalTax').textContent = `₹${formatNumber(result.totalTax)}`;
    
    // Update breakdown
    const breakdownContent = document.getElementById('breakdownContent');
    breakdownContent.innerHTML = '';
    
    if (result.breakdown.length === 0) {
        breakdownContent.innerHTML = '<p style="color: #10b981; font-weight: 500;">No tax applicable - Income below taxable limit</p>';
    } else {
        result.breakdown.forEach(item => {
            const breakdownItem = document.createElement('div');
            breakdownItem.className = 'breakdown-item';
            breakdownItem.innerHTML = `
                <span>${item.range}</span>
                <span>₹${formatNumber(item.tax)}</span>
            `;
            breakdownContent.appendChild(breakdownItem);
        });
    }
    
    // Show results panel
    document.getElementById('resultsPanel').style.display = 'block';
    
    // Store results for comparison
    window.currentCalculation = result;
}

function showEmptyResults() {
    const fields = ['grossIncome', 'totalDeductions', 'taxableIncome', 'incomeTax', 'cess', 'totalTax'];
    fields.forEach(field => {
        document.getElementById(field).textContent = '₹0';
    });
    
    document.getElementById('breakdownContent').innerHTML = '<p style="color: #64748b;">Enter your income to see tax breakdown</p>';
}

function compareRegimes() {
    const income = parseFloat(document.getElementById('annualIncome').value) || 0;
    const age = document.getElementById('age').value;
    
    if (income <= 0) {
        alert('Please enter your annual income first');
        return;
    }
    
    // Calculate for both regimes
    const newRegimeResult = performTaxCalculation(income, age, 'new');
    const oldRegimeResult = performTaxCalculation(income, age, 'old');
    
    // Display comparison
    document.getElementById('newRegimeTax').textContent = `₹${formatNumber(newRegimeResult.totalTax)}`;
    document.getElementById('oldRegimeTax').textContent = `₹${formatNumber(oldRegimeResult.totalTax)}`;
    document.getElementById('newRegimeNet').textContent = `₹${formatNumber(newRegimeResult.netIncome)}`;
    document.getElementById('oldRegimeNet').textContent = `₹${formatNumber(oldRegimeResult.netIncome)}`;
    
    // Calculate savings
    const newSavings = oldRegimeResult.totalTax - newRegimeResult.totalTax;
    const oldSavings = newRegimeResult.totalTax - oldRegimeResult.totalTax;
    
    document.getElementById('newSavings').textContent = newSavings > 0 ? `₹${formatNumber(newSavings)} saved` : newSavings < 0 ? `₹${formatNumber(Math.abs(newSavings))} extra` : 'Same';
    document.getElementById('oldSavings').textContent = oldSavings > 0 ? `₹${formatNumber(oldSavings)} saved` : oldSavings < 0 ? `₹${formatNumber(Math.abs(oldSavings))} extra` : 'Same';
    
    // Show recommendation
    const recommendation = document.getElementById('recommendation');
    if (newRegimeResult.totalTax < oldRegimeResult.totalTax) {
        recommendation.innerHTML = `
            <h4 style="color: #10b981; margin-bottom: 0.5rem;">💡 Recommendation: Choose New Tax Regime</h4>
            <p>You can save ₹${formatNumber(newSavings)} by choosing the new tax regime.</p>
        `;
    } else if (oldRegimeResult.totalTax < newRegimeResult.totalTax) {
        recommendation.innerHTML = `
            <h4 style="color: #dc2626; margin-bottom: 0.5rem;">💡 Recommendation: Choose Old Tax Regime</h4>
            <p>You can save ₹${formatNumber(oldSavings)} by choosing the old tax regime with deductions.</p>
        `;
    } else {
        recommendation.innerHTML = `
            <h4 style="color: #2563eb; margin-bottom: 0.5rem;">💡 Both regimes result in same tax</h4>
            <p>You can choose either regime as both result in the same tax liability.</p>
        `;
    }
    
    // Show comparison section
    document.getElementById('comparisonSection').style.display = 'block';
    document.getElementById('comparisonSection').scrollIntoView({ behavior: 'smooth' });
}

function downloadPDF() {
    if (!window.currentCalculation) {
        alert('Please calculate tax first');
        return;
    }
    
    // Create PDF content
    const result = window.currentCalculation;
    const content = `
TAX CALCULATION REPORT
=====================

Income Details:
- Gross Annual Income: ₹${formatNumber(result.grossIncome)}
- Total Deductions: ₹${formatNumber(result.totalDeductions)}
- Taxable Income: ₹${formatNumber(result.taxableIncome)}

Tax Calculation (${result.regime.toUpperCase()} REGIME):
- Income Tax: ₹${formatNumber(result.incomeTax)}
- Health & Education Cess (4%): ₹${formatNumber(result.cess)}
- Total Tax Liability: ₹${formatNumber(result.totalTax)}
- Net Income After Tax: ₹${formatNumber(result.netIncome)}

Generated on: ${new Date().toLocaleDateString('en-IN')}
Generated by: TaxCalc Pro
    `;
    
    // Create and download file
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tax-calculation-${new Date().getFullYear()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

function scrollToCalculator() {
    document.getElementById('calculator').scrollIntoView({ behavior: 'smooth' });
}

// Utility functions
function formatNumber(num) {
    return new Intl.NumberFormat('en-IN').format(Math.round(num));
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Analytics and Monetization Functions
function trackCalculation() {
    // Google Analytics tracking (add your GA4 tracking ID)
    if (typeof gtag !== 'undefined') {
        gtag('event', 'tax_calculation', {
            'event_category': 'engagement',
            'event_label': 'calculate_tax'
        });
    }
}

function trackDownload() {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'pdf_download', {
            'event_category': 'engagement',
            'event_label': 'download_report'
        });
    }
}

function trackComparison() {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'regime_comparison', {
            'event_category': 'engagement',
            'event_label': 'compare_regimes'
        });
    }
}

// Add tracking to existing functions
const originalCalculateTax = calculateTax;
calculateTax = function() {
    originalCalculateTax.call(this);
    trackCalculation();
};

const originalDownloadPDF = downloadPDF;
downloadPDF = function() {
    originalDownloadPDF.call(this);
    trackDownload();
};

const originalCompareRegimes = compareRegimes;
compareRegimes = function() {
    originalCompareRegimes.call(this);
    trackComparison();
};

// Service Worker Registration for PWA (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
