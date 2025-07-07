/**
 * Dark Mode Toggler
 * Handles toggling between light and dark mode
 */
function initDarkModeToggle() {
    console.log('Initializing dark mode toggle...');
    const darkModeToggle = document.querySelector('.dark-mode-toggle');
    if (!darkModeToggle) return;

    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDarkMode);

        // Dispatch a custom event to notify about the dark mode toggle
        const event = new Event('darkModeToggled');
        document.dispatchEvent(event);
    });

    // Initialize dark mode state from localStorage
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
    }
}