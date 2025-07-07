/**
 * Smooth Scrolling for Navigation Links
 * Provides smooth scrolling to section anchors
 */


// Wrap existing functions with logging
function initSmoothScrolling() {
    console.log('Entering function: initSmoothScrolling');
    const navLinks = document.querySelectorAll('a[href^="#"]:not([href="#"])');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            console.log('Entering event listener for smooth scrolling');
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                const headerHeight = document.querySelector('header').offsetHeight;
                const targetPosition = targetSection.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                history.pushState(null, null, targetId);
            }
            console.log('Exiting event listener for smooth scrolling');
        });
    });
    console.log('Exiting function: initSmoothScrolling');
}