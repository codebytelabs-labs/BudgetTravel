document.addEventListener('DOMContentLoaded', function() {
    // Search functionality
    const searchToggle = document.getElementById('searchToggle');
    const searchBox = document.getElementById('searchBox');
    const searchClose = document.getElementById('searchClose');
    const searchInput = searchBox.querySelector('input');

    if (searchToggle && searchBox && searchClose) {
        searchToggle.addEventListener('click', function() {
            searchBox.classList.add('active');
            searchInput.focus();
        });

        searchClose.addEventListener('click', function() {
            searchBox.classList.remove('active');
            searchInput.value = '';
        });

        // Close search box when clicking outside
        document.addEventListener('click', function(e) {
            if (!searchBox.contains(e.target) && !searchToggle.contains(e.target)) {
                searchBox.classList.remove('active');
            }
        });

        // Close search box with Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && searchBox.classList.contains('active')) {
                searchBox.classList.remove('active');
                searchInput.value = '';
            }
        });
    }

    // App Buttons Click Prevention
    document.querySelectorAll('.app-button').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
        });
    });

    // Hamburger Menu functionality
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    const navMenu = document.getElementById('navMenu');
    const body = document.body;

    if (hamburgerMenu && navMenu) {
        hamburgerMenu.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            hamburgerMenu.classList.toggle('active');
            navMenu.classList.toggle('active');
            body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!navMenu.contains(e.target) && !hamburgerMenu.contains(e.target)) {
                hamburgerMenu.classList.remove('active');
                navMenu.classList.remove('active');
                body.style.overflow = '';
            }
        });

        // Close menu when clicking on a link
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', function() {
                hamburgerMenu.classList.remove('active');
                navMenu.classList.remove('active');
                body.style.overflow = '';
            });
        });
    }
}); 