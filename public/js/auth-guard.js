// js/auth-guard.js
(function() {
    // Check if the user is logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

    // Get the current page filename
    const currentPage = window.location.pathname.split('/').pop();

    // Pages that do NOT require login
    const publicPages = ['login.html', 'signup.html', 'terms.html', 'privacy.html'];

    // If user is NOT logged in AND is trying to access a protected page
    if (!isLoggedIn && !publicPages.includes(currentPage)) {
        // Redirect to login page
        window.location.href = './login.html';
    }
})();