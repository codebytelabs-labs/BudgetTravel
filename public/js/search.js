document.addEventListener('DOMContentLoaded', function() {
    const searchToggle = document.getElementById('searchToggle');
    const searchBox = document.getElementById('searchBox');
    const searchClose = document.getElementById('searchClose');
    const searchInput = searchBox.querySelector('input');

    // Arama çubuğunu aç
    searchToggle.addEventListener('click', function() {
        searchBox.classList.add('active');
        searchInput.focus();
    });

    // Arama çubuğunu kapat
    searchClose.addEventListener('click', function() {
        searchBox.classList.remove('active');
        searchInput.value = '';
    });

    // ESC tuşu ile kapatma
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && searchBox.classList.contains('active')) {
            searchBox.classList.remove('active');
            searchInput.value = '';
        }
    });

    // Sayfa dışına tıklandığında kapatma
    document.addEventListener('click', function(e) {
        if (!searchBox.contains(e.target) && !searchToggle.contains(e.target)) {
            searchBox.classList.remove('active');
        }
    });

    // App Buttons Click Prevention
    document.querySelectorAll('.app-button').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
        });
    });
}); 