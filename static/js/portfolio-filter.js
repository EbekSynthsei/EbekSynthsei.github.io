/**
 * Portfolio Filtering
 * Filters portfolio items based on category
 */
function initPortfolioFilter() {
    const filterButtons = document.querySelectorAll('.portfolio-filter button');
    const portfolioItems = document.querySelectorAll('.portfolio-item');
    
    if (!filterButtons.length || !portfolioItems.length) return;
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            const filterValue = button.getAttribute('data-filter');
            
            // Show/hide portfolio items based on filter
            portfolioItems.forEach(item => {
                if (filterValue === 'all') {
                    item.style.display = 'block';
                    
                    // Add animation for smooth appearance
                    setTimeout(() => {
                        item.classList.add('show');
                    }, 50);
                } else if (item.getAttribute('data-category').includes(filterValue)) {
                    item.style.display = 'block';
                    
                    // Add animation for smooth appearance
                    setTimeout(() => {
                        item.classList.add('show');
                    }, 50);
                } else {
                    item.classList.remove('show');
                    
                    // Add delay before hiding to allow animation
                    setTimeout(() => {
                        item.style.display = 'none';
                    }, 300);
                }
            });
        });
    });
    
    // Trigger "all" filter on page load
    const allFilterButton = document.querySelector('.portfolio-filter button[data-filter="all"]');
    if (allFilterButton) {
        allFilterButton.classList.add('active');
    }
    
    // Show all items initially with animation
    portfolioItems.forEach(item => {
        item.style.display = 'block';
        setTimeout(() => {
            item.classList.add('show');
        }, 50);
    });
}