// js/app-logic.js - Google Apps Script पर आधारित फाइनल कोड

// --------------------------------------------------
// 1. GLOBAL STATE AND API URL (केवल Apps Script URL)
// --------------------------------------------------

// --- IMPORTANT: AUTH API URL ---
// आपके Google Apps Script Web App का URL (इसे सभी API कॉल्स के लिए इस्तेमाल किया गया है)
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbz7tUp9MBT3YWyAj-ljKWaL_YibTh9y8LK5x8Wv9VW3MVyCgrivbH8XDT3Fuzt5zxnF/exec'; 

// FAKE DATA for market chart rendering
const FAKE_COINS = [
    { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', current_price: 5800000, price_change_percentage_24h: 2.14, image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png' },
    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', current_price: 350000, price_change_percentage_24h: -1.65, image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png' },
    { id: 'tether', name: 'Tether', symbol: 'USDT', current_price: 83.50, price_change_percentage_24h: 0.01, image: 'https://assets.coingecko.com/coins/images/325/large/Tether-logo.png' },
    { id: 'bnb', name: 'BNB', symbol: 'BNB', current_price: 48000, price_change_percentage_24h: 0.85, image: 'https://assets.coingecko.com/coins/images/825/large/binance-coin-logo.png' },
    { id: 'solana', name: 'Solana', symbol: 'SOL', current_price: 11500, price_change_percentage_24h: 5.32, image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png' },
    { id: 'xrp', name: 'XRP', current_price: 52.70, price_change_percentage_24h: -2.11, image: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png' },
    { id: 'cardano', name: 'Cardano', symbol: 'ADA', current_price: 38.50, price_change_percentage_24h: 1.19, image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png' },
    { id: 'dogecoin', name: 'Dogecoin', symbol: 'DOGE', current_price: 13.20, price_change_percentage_24h: 8.99, image: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png' },
    { id: 'shiba-inu', name: 'Shiba Inu', current_price: 0.0023, price_change_percentage_24h: -0.55, image: 'https://assets.coingecko.com/coins/images/11939/large/shiba.png' },
    { id: 'polygon', name: 'Polygon', symbol: 'MATIC', current_price: 65.10, price_change_percentage_24h: 3.45, image: 'https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png' }
];

// Configuration for Toastify messages
const toastSuccessConfig = { duration: 4000, gravity: "bottom", position: "right", style: { background: "linear-gradient(to right, #00b09b, #96c93d)" } };
const toastErrorConfig = { duration: 4000, gravity: "bottom", position: "right", style: { background: "linear-gradient(to right, #ff5f6d, #ffc371)" } };

// --------------------------------------------------
// 2. STATE MANAGEMENT (localStorage)
// --------------------------------------------------

function getState() {
    const defaultState = {
        depositAmount: 2000,
        // Set fake deposit date to 28 days ago to make countdown realistic
        depositDate: new Date(new Date().setDate(new Date().getDate() - 28)).toISOString(),
        referrals: [
            { name: "Priya S.", date: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(), status: "Completed", bonus: 200 },
            { name: "Arjun Verma", date: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString(), status: "Completed", bonus: 200 },
            { name: "Rohan Mehta", date: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(), status: "Pending", bonus: 0 }
        ],
        activities: [
            { type: "Referral Bonus", from: "Priya S.", amount: 200, date: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString() },
            { type: "Daily Profit", from: "Profit for the day", amount: 100, date: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString() },
            { type: "Initial Deposit", from: "Bronze Pass", amount: 2000, date: new Date(new Date().setDate(new Date().getDate() - 28)).toISOString() }
        ]
    };
    const stateFromStorage = localStorage.getItem('cryptoWinState');
    if (stateFromStorage) {
        return JSON.parse(stateFromStorage);
    } else {
        localStorage.setItem('cryptoWinState', JSON.stringify(defaultState));
        return defaultState;
    }
}

function saveState(newState) {
    localStorage.setItem('cryptoWinState', JSON.stringify(newState));
}

// --------------------------------------------------
// 3. AUTHENTICATION HANDLERS (Apps Script API Calls)
// --------------------------------------------------

function handleSignup() {
    const signupForm = document.getElementById('signup-form');
    if (!signupForm) return;

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('signup-username').value;
        const password = document.getElementById('signup-password').value;
        const referrerCode = document.getElementById('referrer-code').value;
        
        if (!username || !password) { Toastify({ text: "Please fill in all fields.", ...toastErrorConfig }).showToast(); return; }

        const btn = signupForm.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Processing...';

        try {
            // FIX: Use WEB_APP_URL
            const response = await fetch(WEB_APP_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'signup', username, password, referrerCode: referrerCode }) 
            });

            const result = await response.json();
            
            if (result.status === 'success') {
                Toastify({ text: "✅ Signup successful! Redirecting to dashboard...", ...toastSuccessConfig }).showToast();
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('currentUser', username);
                window.location.href = './dashboard.html';
            } else {
                Toastify({ text: `❌ ${result.message}`, ...toastErrorConfig }).showToast();
            }
        } catch (error) {
            Toastify({ text: "❌ Network error. Check API URL. (Is the server active?)", ...toastErrorConfig }).showToast();
        } finally {
            btn.disabled = false;
            btn.textContent = 'Create Account';
        }
    });
}

function handleLogin() {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        
        if (!username || !password) { Toastify({ text: "Please fill in all fields.", ...toastErrorConfig }).showToast(); return; }

        const btn = loginForm.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Processing...';

        try {
            // FIX: Use WEB_APP_URL
            const response = await fetch(WEB_APP_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'login', username, password })
            });

            const result = await response.json();
            
            if (result.status === 'success') { 
                Toastify({ text: "🎉 Login successful! Welcome back.", ...toastSuccessConfig }).showToast();
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('currentUser', username);
                window.location.href = './dashboard.html';
            } else {
                Toastify({ text: `❌ Login failed: Invalid credentials.`, ...toastErrorConfig }).showToast();
            }
        } catch (error) {
            Toastify({ text: "❌ Network error. Check API URL. (Is the server active?)", ...toastErrorConfig }).showToast();
        } finally {
            btn.disabled = false;
            btn.textContent = 'Sign In';
        }
    });
}

// --------------------------------------------------
// 4. DEPOSIT & CREDIT LOGIC
// --------------------------------------------------

// Function to credit user's wallet based on Sheet verification
async function checkAndProcessPendingCredits() {
    const userEmail = localStorage.getItem('userEmail') || localStorage.getItem('currentUser');
    if (!userEmail) return;

    // FIX: Use WEB_APP_URL for the GET request
    const apiUrl = `${WEB_APP_URL}?action=check_credit&user_email=${encodeURIComponent(userEmail)}`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) { return; }
        const result = await response.json();

        if (result.status === 'success' && result.credits && result.credits.length > 0) {
            
            let state = getState();
            let totalCreditedAmount = 0;
            
            for (const credit of result.credits) {
                // 1. Update local storage state
                state.activities.push({
                    type: 'Manual Deposit', 
                    from: `Admin Verified (UTR: ${credit.utr})`, 
                    amount: credit.amount, 
                    date: new Date().toISOString()
                });
                state.depositAmount += credit.amount;
                totalCreditedAmount += credit.amount;

                // 2. Mark the row as processed in Google Sheet (Backend POST call)
                // FIX: Use WEB_APP_URL
                fetch(WEB_APP_URL, { 
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'mark_processed', rowNumber: credit.row }) 
                });
            }
            
            saveState(state);
            
            Toastify({ 
                text: `🎉 ₹${totalCreditedAmount.toLocaleString('en-IN')} successfully credited!`, 
                duration: 8000, 
                gravity: "top", 
                position: "center", 
                style: { background: "linear-gradient(to right, #10B981, #06B6D4)" } 
            }).showToast();

            if (document.getElementById('dashboard')) {
                initDashboardLogic();
            }
        }
    } catch (error) {
        console.error('Error checking credits:', error);
    }
}


// --------------------------------------------------
// 5. CORE DASHBOARD & RENDERING FUNCTIONS
// --------------------------------------------------

function formatRelativeDate(isoDateString) {
    const date = new Date(isoDateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) { return `Today, ${date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}`; }
    if (date.toDateString() === yesterday.toDateString()) { return `Yesterday, ${date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}`; }
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function renderActivities() {
    const state = getState();
    const activityListEl = document.querySelector('#recent-activity ul');
    if (!activityListEl) return;
    state.activities.sort((a, b) => new Date(b.date) - new Date(a.date));

    activityListEl.innerHTML = state.activities.map(activity => {
        const isCredit = activity.amount > 0 && activity.type !== 'Withdrawal';
        const isDebit = activity.type === 'Withdrawal';
        const amountClass = isDebit ? 'text-red-400' : (isCredit ? 'text-green-400' : 'text-white');
        const sign = isDebit ? '-' : (isCredit ? '+' : '');

        return `
            <li class="flex items-center justify-between p-3 rounded-lg bg-black/20">
                <div>
                    <p class="font-semibold text-white">${activity.type}</p>
                    <p class="text-xs text-gray-400">${activity.from}</p>
                </div>
                <div class="text-right">
                    <p class="font-bold ${amountClass}">${sign} ₹${Math.abs(activity.amount).toLocaleString('en-IN')}</p>
                    <p class="text-xs text-gray-500">${formatRelativeDate(activity.date)}</p>
                </div>
            </li>`;
    }).join('');
}

function renderReferralHistory() {
    // This is primarily local state rendering logic
    const state = getState();
    const completedReferrals = state.referrals.filter(ref => ref.status === 'Completed').length;
    const prizes = [{ target: 5, id: 'progress-5' }, { target: 30, id: 'progress-30' }, { target: 50, id: 'progress-50' }];
    document.querySelectorAll('.md\\:grid-cols-3 > div').forEach((prizeEl, index) => {
        const prize = prizes[index];
        const progress = Math.min(100, (completedReferrals / prize.target) * 100).toFixed(0);
        // Add logic to update the badge element classes/text based on progress here if necessary
    });
}

function initDashboardLogic() {
    const state = getState();
    const totalProfitEl = document.getElementById('total-profit');
    const countdownTimerEl = document.getElementById('countdown-timer');
    const referralBonusEl = document.getElementById('referral-bonus');
    const depositCapitalEl = document.getElementById('deposit-capital');

    const totalBonus = state.referrals.reduce((sum, ref) => sum + (ref.status === 'Completed' ? ref.bonus : 0), 0);
    if(referralBonusEl) referralBonusEl.textContent = `₹${totalBonus.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
    if(depositCapitalEl) depositCapitalEl.textContent = `₹${state.depositAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;


    function updateProfit() {
        const depositDate = new Date(state.depositDate);
        const now = new Date();
        const timeDiff = now - depositDate; 
        const daysPassed = timeDiff / (1000 * 60 * 60 * 24);
        const profit = state.depositAmount * 0.05 * daysPassed;
        if(totalProfitEl) totalProfitEl.textContent = `₹${profit.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
    }
    
    function updateCountdown() {
        if (!countdownTimerEl) return;
        const depositDate = new Date(state.depositDate);
        const withdrawalDate = new Date(depositDate.setMonth(depositDate.getMonth() + 1));
        const timeLeft = withdrawalDate - new Date();

        if (timeLeft <= 0) { countdownTimerEl.textContent = "Ready to Withdraw!"; return; }
        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        countdownTimerEl.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }

    updateProfit();
    updateCountdown();
    renderActivities();
    setInterval(updateProfit, 1000);
    setInterval(updateCountdown, 1000);
}

function handleWithdrawal() {
    const withdrawBonusBtn = document.getElementById('withdraw-bonus-btn');
    if (!withdrawBonusBtn) return;
    
    let initialState = getState();
    const initialBonus = initialState.referrals.reduce((sum, ref) => sum + (ref.status === 'Completed' ? ref.bonus : 0), 0);
    if (initialBonus <= 0) {
        withdrawBonusBtn.disabled = true;
        withdrawBonusBtn.style.opacity = '0.5';
        withdrawBonusBtn.textContent = 'No Bonus to Withdraw';
    }

    withdrawBonusBtn.addEventListener('click', () => {
        withdrawBonusBtn.disabled = true;
        withdrawBonusBtn.innerHTML = `<svg class="animate-spin h-5 w-5 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;

        setTimeout(() => { // Simulate network delay
            let state = getState();
            const totalBonus = state.referrals.reduce((sum, ref) => sum + (ref.status === 'Completed' ? ref.bonus : 0), 0);
            
            state.activities.push({ type: 'Withdrawal', from: 'Referral Bonus', amount: -totalBonus, date: new Date().toISOString() });
            state.referrals = state.referrals.filter(ref => ref.status !== 'Completed');
            saveState(state);

            Toastify({ text: `✅ Withdrawal of ₹${totalBonus.toLocaleString('en-IN')} successful!`, duration: 4000, gravity: "bottom", position: "right", style: { background: "linear-gradient(to right, var(--neon-2), var(--neon-1))"} }).showToast();

            document.getElementById('referral-bonus').textContent = '₹0.00';
            withdrawBonusBtn.textContent = 'Bonus Withdrawn';
            renderActivities();
        }, 1500);
    });
}
function renderProfitChart() {
    const chartEl = document.getElementById('growthChart');
    if (!chartEl) return;

    // Destroy existing chart instance if it exists
    if (chartEl.chart) { chartEl.chart.destroy(); }

    const ctx = chartEl.getContext('2d');
    
    // --- Candlestick/High-Low Data Generation ---
    const dataPoints = [];
    const initialPrice = 2000;
    const volatilityFactor = 150; 
    let currentPrice = initialPrice;
    
    for (let i = 0; i < 30; i++) {
        const change = (Math.random() - 0.4) * volatilityFactor; 
        const nextPrice = currentPrice + change;
        const high = nextPrice + Math.random() * 50;
        const low = nextPrice - Math.random() * 50;
        const open = currentPrice;
        const close = nextPrice;

        dataPoints.push({
            x: `Day ${i + 1}`,
            y: [Math.min(open, close), Math.max(open, close)], 
            open: open, 
            close: close,
            high: high,
            low: low
        });
        currentPrice = nextPrice;
    }

    const barColors = dataPoints.map(day => {
        return day.close > day.open ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)';
    });

    const volumeData = Array.from({length: 30}, (_, i) => 1000 + Math.random() * 2000);

    chartEl.chart = new Chart(ctx, {
        type: 'bar', // Using bar type to simulate candlestick appearance
        data: {
            labels: dataPoints.map(d => d.x),
            datasets: [
                // 1. Candlestick Body (Bar Type)
                { label: 'BOT Range (Open/Close)', data: dataPoints.map(d => d.y), type: 'bar', backgroundColor: barColors, borderColor: 'white', borderWidth: 1, yAxisID: 'y', barPercentage: 0.6, categoryPercentage: 0.8 },
                // 2. High/Low Wicks (Line Type for connection)
                { label: 'High/Low Price', data: dataPoints.map(d => (d.high + d.low) / 2), type: 'line', borderColor: 'rgba(6, 182, 212, 0.7)', backgroundColor: 'transparent', borderWidth: 1.5, pointRadius: 0, tension: 0.1, yAxisID: 'y' },
                // 3. Volume Bars (Bar Type on secondary axis)
                { label: 'Volume (Trades)', data: volumeData, type: 'bar', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: 'transparent', yAxisID: 'y1', barPercentage: 0.9, categoryPercentage: 1.0 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: true, labels: { color: 'white', filter: function(item) { return item.datasetIndex < 2; } } }, tooltip: { mode: 'index', intersect: false } },
            scales: {
                x: { stacked: true, grid: { color: 'rgba(255, 255, 255, 0.08)' }, ticks: { color: 'rgba(255, 255, 255, 0.5)' } },
                y: { type: 'linear', display: true, position: 'left', grid: { color: 'rgba(255, 255, 255, 0.1)' }, title: { display: true, text: 'Price (₹)', color: 'rgba(6, 182, 212, 1)' }, min: 1800, max: 3500 },
                y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Volume', color: 'rgba(255, 255, 255, 0.5)' }, min: 0, max: 4000, ticks: { display: false } }
            }
        }
    });
}

// --------------------------------------------------
// 6. DOM READY INITIALIZATION
// --------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Dashboard/Core Logic if on a relevant page
    if (document.getElementById('dashboard')) {
        initDashboardLogic();
        handleWithdrawal();
        renderProfitChart();
        checkAndProcessPendingCredits(); // Check for credits on dashboard load
    }
    
    // Initialize Auth/Signup Logic if on a relevant page
    if (document.getElementById('signup-form')) {
        handleSignup();
    }
    if (document.getElementById('login-form')) {
        handleLogin();
    }
});