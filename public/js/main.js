// js/main.js - Add at the very top
window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        preloader.style.opacity = '0';
        setTimeout(() => { preloader.style.display = 'none'; }, 500);
    }
});
// js/main.js
document.addEventListener("DOMContentLoaded", function() {
    const loadComponent = (selector, url) => {
        fetch(url)
            .then(response => response.ok ? response.text() : Promise.reject('Component not found'))
            .then(data => {
                document.querySelector(selector).innerHTML = data;
            })
            .then(() => {
                if (selector === '#header-container') {
                    handleNotificationLogic();
                }
                if (selector === '#sidebar-container') {
                    handleSidebarLogic();
                    highlightActiveLink();
                }
            })
            .catch(error => console.error(`Error loading ${url}:`, error));
    };

    // Load components
    loadComponent("#sidebar-container", "./components/sidebar.html");
    loadComponent("#header-container", "./components/header.html");
    loadComponent("#footer-container", "./components/footer.html");

    function highlightActiveLink() {
        const currentPage = window.location.pathname.split('/').pop();
        const sidebarLinks = document.querySelectorAll('.sidebar-link');
        sidebarLinks.forEach(link => {
            if (link.getAttribute('href').includes(currentPage)) {
                link.classList.add('bg-white/10', 'text-white');
            }
        });
    }

    function handleSidebarLogic() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        document.body.addEventListener('click', function(event) {
            if (event.target.closest('#sidebar-open-btn')) {
                sidebar.classList.remove('-translate-x-full');
                overlay.classList.remove('hidden');
            }
            if (event.target.closest('#sidebar-close-btn') || event.target.id === 'sidebar-overlay') {
                sidebar.classList.add('-translate-x-full');
                overlay.classList.add('hidden');
            }
        });
    }

    function handleNotificationLogic() {
        const btn = document.getElementById('notification-btn');
        const panel = document.getElementById('notification-panel');
        const dot = document.getElementById('notification-dot');

        if (!btn) return;

        btn.addEventListener('click', (event) => {
            event.stopPropagation();
            panel.classList.toggle('hidden');
            if (dot) dot.classList.add('hidden');
        });

        // Close dropdown if clicked outside
        document.addEventListener('click', (event) => {
            if (panel && !panel.contains(event.target) && !btn.contains(event.target)) {
                panel.classList.add('hidden');
            }
        });
    }
});
// js/main.js - Add this new function at the bottom
function initEntranceAnimations() {
    const animatedElements = document.querySelectorAll('.animate-on-load');
    animatedElements.forEach((el, index) => {
        setTimeout(() => {
            el.classList.add('is-visible');
        }, index * 100); // Staggered delay
    });
}

// And call it inside DOMContentLoaded
document.addEventListener("DOMContentLoaded", function() {
    //... (your existing code for loadComponent)
    initEntranceAnimations(); // Call the new animation function
});