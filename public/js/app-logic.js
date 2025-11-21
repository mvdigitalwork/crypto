// js/app-logic.js

// --------------------------------------------------
// 0. CONFIGURATION & UTILITIES
// --------------------------------------------------

// CRITICAL: Replace this with your actual Google Apps Script Web App URL
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbz7tUp9MBT3YWyAj-ljKWaL_YibTh9y8LK5x8Wv9VW3MVyCgrivbH8XDT3Fuzt5zxnF/exec'; 

// Configuration for Toastify messages
const toastSuccessConfig = { duration: 4000, gravity: "bottom", position: "right", style: { background: "linear-gradient(to right, #00b09b, #96c93d)" } };
const toastErrorConfig = { duration: 4000, gravity: "bottom", position: "right", style: { background: "linear-gradient(to right, #ff5f6d, #ffc371)" } };

// Function to format dates nicely
function formatRelativeDate(isoDateString) {
    const date = new Date(isoDateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return `Today, ${date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    }
    if (date.toDateString() === yesterday.toDateString()) {
        return `Yesterday, ${date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    }
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}


// --------------------------------------------------
// 1. STATE MANAGEMENT (USING localStorage)
// --------------------------------------------------

// Function to get the current state from localStorage
function getState() {
    const defaultState = {
        depositAmount: 2000,
        depositDate: new Date(new Date().setDate(new Date().getDate() - 28)).toISOString(),
        referrals: [
            { name: "Priya S.", date: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(), status: "Completed", bonus: 200 },
            { name: "Arjun Verma", date: new Date(new Date().setDate(new hạn() - 3)).toISOString(), status: "Completed", bonus: 200 },
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

// Function to save the updated state to localStorage
function saveState(newState) {
    localStorage.setItem('cryptoWinState', JSON.stringify(newState));
}


// --------------------------------------------------
// 2. GOOGLE SHEET API FUNCTIONS
// --------------------------------------------------

/**
 * Fetches the user's real wallet balance from the Google Sheet via GAS.
 * This is used on dashboard and myaccount pages.
 */
async function fetchUserWalletBalance(identifier) {
    if (!identifier) {
        console.error("User identifier not found. Cannot fetch balance.");
        return 0;
    }
    
    const endpoint = `${WEB_APP_URL}?action=getWalletBalance&identifier=${encodeURIComponent(identifier)}`;

    try {
        const response = await fetch(endpoint, { method: 'GET' });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.status === 'success') {
            const balance = parseFloat(result.balance) || 0;
            return balance;
        } else {
            console.error("API Error fetching balance:", result.message);
            return 0;
        }

    } catch (error) {
        console.error("Network or API call failed:", error);
        return 0;
    }
}


// --------------------------------------------------
// 3. AUTH & DEPOSIT LOGIC (handleSignup/handleLogin/handleWithdrawal)
// --------------------------------------------------

function handleSignup() {
    const signupForm = document.getElementById('signup-form');
    if (!signupForm) return;

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('signup-username').value.trim();
        const password = document.getElementById('signup-password').value.trim();
        const identifier = username; // Using Username as the unique identifier for demo

        if (!username || !password) {
            Toastify({ text: "❌ Please fill in all fields.", ...toastErrorConfig }).showToast();
            return;
        }

        const btn = signupForm.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Processing...';

        try {
            const response = await fetch(WEB_APP_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'signup', 
                    username: username, 
                    password: password,
                    identifier: identifier 
                })
            });

            const result = await response.json();
            
            if (result.status === 'success') {
                Toastify({ text: "✅ Signup successful! Redirecting to login...", ...toastSuccessConfig }).showToast();
                
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('currentUser', username);
                localStorage.setItem('currentUserIdentifier', identifier); 
                
                setTimeout(() => {
                    window.location.href = './index.html';
                }, 1000); 
                
            } else {
                Toastify({ text: `❌ ${result.message}`, ...toastErrorConfig }).showToast();
            }
        } catch (error) {
            Toastify({ text: "❌ Network error. Check API URL or CORS settings.", ...toastErrorConfig }).showToast();
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
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value.trim();
        
        if (!username || !password) {
            Toastify({ text: "Please fill in all fields.", ...toastErrorConfig }).showToast();
            return;
        }

        const btn = loginForm.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Processing...';

        try {
            const response = await fetch(WEB_APP_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'login', username, password })
            });

            const result = await response.json();
            
            if (result.status === 'success' || result.message.includes('Login successful')) { 
                Toastify({ text: "🎉 Login successful! Welcome back.", ...toastSuccessConfig }).showToast();
                
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('currentUser', username);
                localStorage.setItem('currentUserIdentifier', username); 
                
                setTimeout(() => {
                    window.location.href = './index.html';
                }, 1000);
            } else {
                Toastify({ text: `❌ Login failed: Invalid credentials.`, ...toastErrorConfig }).showToast();
            }
        } catch (error) {
            Toastify({ text: "❌ Network error. Check API URL.", ...toastErrorConfig }).showToast();
        } finally {
            btn.disabled = false;
            btn.textContent = 'Log In';
        }
    });
}

function handleWithdrawal() {
    // This logic handles the fictional referral bonus withdrawal using local state, 
    // but should integrate with GAS for real balance reduction in a production app.
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

        setTimeout(() => {
            let state = getState();
            const totalBonus = state.referrals.reduce((sum, ref) => sum + (ref.status === 'Completed' ? ref.bonus : 0), 0);
            
            state.activities.push({
                type: 'Withdrawal', from: 'Referral Bonus', amount: -totalBonus, date: new Date().toISOString()
            });
            state.referrals = state.referrals.filter(ref => ref.status !== 'Completed');
            saveState(state);

            Toastify({ text: `✅ Withdrawal of ₹${totalBonus.toLocaleString('en-IN')} successful!`, duration: 4000, gravity: "bottom", position: "right", style: { background: "linear-gradient(to right, #00b09b, #96c93d)"} }).showToast();

            document.getElementById('referral-bonus').textContent = '₹0.00';
            withdrawBonusBtn.textContent = 'Bonus Withdrawn';
            renderActivities();
        }, 1500); 
    });
}


// --------------------------------------------------
// 4. RENDERING & CHART LOGIC (Dashboard/Referrals)
// --------------------------------------------------

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
    const state = getState();
    const tableContainer = document.getElementById('referral-history-container');
    const emptyState = document.getElementById('empty-state-referrals');
    const tableBodyEl = document.querySelector('#referral-history-table tbody');
    const completedReferrals = state.referrals.filter(ref => ref.status === 'Completed').length;

    // --- Prize Tracking Logic ---
    const prizes = [
        { target: 5, label: "Wireless Powerbank"},
        { target: 30, label: "iPhone 15 or Earpods"},
        { target: 50, label: "PS5 or 50K Cash"}
    ];

    document.querySelectorAll('.md\\:grid-cols-3 > div').forEach((prizeEl, index) => {
        const prize = prizes[index];
        const progress = Math.min(100, (completedReferrals / prize.target) * 100).toFixed(0);
        
        const badgeEl = prizeEl.querySelector('.mt-3.text-xs');
        if (badgeEl) {
             badgeEl.textContent = `Target Achieved: ${completedReferrals}/${prize.target} (${progress}%)`;
             badgeEl.className = 'mt-3 text-xs font-semibold px-3 py-1 rounded-full';
             if (progress >= 100) {
                 badgeEl.classList.add('bg-cyan-500/20', 'text-cyan-300');
             } else if (progress > 0) {
                 badgeEl.classList.add('bg-green-500/20', 'text-green-300');
             } else {
                 badgeEl.classList.add('bg-red-500/20', 'text-red-300');
             }
        }
    });

    // --- Referral Table Rendering ---
    if (!tableContainer) return;

    if (state.referrals.length === 0) {
        tableContainer.classList.add('hidden');
        emptyState.classList.remove('hidden');
    } else {
        tableContainer.classList.remove('hidden');
        emptyState.classList.add('hidden');
        tableBodyEl.innerHTML = state.referrals.map(ref => {
            const statusClass = ref.status === 'Completed' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300';
            return `<tr class="border-b border-white/10"><td class="p-3 font-semibold">${ref.name}</td><td class="p-3 text-gray-300">${new Date(ref.date).toLocaleDateString('en-IN')}</td><td class="p-3"><span class="text-xs font-semibold ${statusClass} px-2 py-1 rounded-full">${ref.status}</span></td><td class="p-3 text-right font-bold text-green-400">+ ₹${ref.bonus.toLocaleString('en-IN')}</td></tr>`;
        }).join('');
    }
}

function renderProfitChart() {
    // Logic for 30-Day Profit Growth Chart (using Chart.js)
    // Implement here based on previous requests' logic if needed
}

function renderAssetAllocationChart() {
    // Logic for Asset Allocation Chart (using Chart.js)
    // Implement here based on previous requests' logic if needed
}

function initDashboardLogic() {
    const state = getState();
    const totalProfitEl = document.getElementById('total-profit');
    const countdownTimerEl = document.getElementById('countdown-timer');
    const referralBonusEl = document.getElementById('referral-bonus');
    const userIdentifier = localStorage.getItem('currentUserIdentifier') || localStorage.getItem('currentUser');

    if (userIdentifier) {
        // Fetch and display the actual wallet balance
        fetchUserWalletBalance(userIdentifier).then(balance => {
            const balanceEl = document.getElementById('wallet-balance-display-dashboard'); // Assuming an ID for dashboard balance
            if (balanceEl) {
                balanceEl.textContent = `₹${balance.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
            }
        });
    }

    const totalBonus = state.referrals.reduce((sum, ref) => sum + (ref.status === 'Completed' ? ref.bonus : 0), 0);
    if(referralBonusEl) referralBonusEl.textContent = `₹${totalBonus.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;

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

        if (timeLeft <= 0) {
            countdownTimerEl.textContent = "Ready to Withdraw!";
            return;
        }
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


// --------------------------------------------------
// 5. GLOBAL INITIALIZATION
// --------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Auth handlers (handleSignup/handleLogin) for pages that contain those forms
    handleSignup();
    handleLogin();
});