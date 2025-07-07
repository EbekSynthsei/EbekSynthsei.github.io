class TestimonialCarousel {
    constructor(container) {
        this.carousel = container;
        this.wrapper = container.querySelector('.testimonial-wrapper');
        this.slides = container.querySelectorAll('.testimonial-slide');
        this.dots = container.querySelectorAll('.pagination-dot');
        this.prevBtn = container.querySelector('.prev-btn');
        this.nextBtn = container.querySelector('.next-btn');
        
        this.currentSlide = 0;
        this.totalSlides = this.slides.length;
        this.autoPlayInterval = null;
        
        this.init();
    }
    
    init() {
        // Set up event listeners
        this.prevBtn.addEventListener('click', () => this.prevSlide());
        this.nextBtn.addEventListener('click', () => this.nextSlide());
        
        // Dot navigation
        this.dots.forEach((dot, index) => {
            dot.addEventListener('click', () => this.goToSlide(index));
        });
        
        // Pause on hover
        this.carousel.addEventListener('mouseenter', () => this.pauseAutoPlay());
        this.carousel.addEventListener('mouseleave', () => this.startAutoPlay());
        
        // Keyboard navigation
        this.carousel.addEventListener('keydown', (e) => this.handleKeydown(e));
        
        // Touch/swipe support
        this.addTouchSupport();
        
        // Start autoplay
        this.startAutoPlay();
        
        // Initialize first slide
        this.updateSlider();
    }
    
    updateSlider() {
        // Calculate transform value
        const translateX = -this.currentSlide * (100 / this.totalSlides);
        this.wrapper.style.transform = `translateX(${translateX}%)`;

        // Update slide states
        this.slides.forEach((slide, index) => {
            slide.classList.toggle('active', index === this.currentSlide);
            slide.setAttribute('aria-hidden', index !== this.currentSlide);
        });

        // Update dots
        this.dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentSlide);
            dot.setAttribute('aria-selected', index === this.currentSlide);
        });
    }
    
    nextSlide() {
        console.log('Next slide:', this.currentSlide);
        this.currentSlide = (this.currentSlide + 1) % this.totalSlides;
        this.updateSlider();
    }
    
    prevSlide() {
        console.log('Previous slide:', this.currentSlide);
        this.currentSlide = (this.currentSlide - 1 + this.totalSlides) % this.totalSlides;
        this.updateSlider();
    }
    
    goToSlide(index) {
        console.log('Go to slide:', index);
        if (index !== this.currentSlide) {
            this.currentSlide = index;
            this.updateSlider();
        }
    }
    
    startAutoPlay() {
        this.pauseAutoPlay(); // Clear any existing interval
        this.autoPlayInterval = setInterval(() => {
            this.nextSlide();
        }, 4000);
    }
    
    pauseAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
    }
    
    handleKeydown(e) {
        switch(e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                this.prevSlide();
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.nextSlide();
                break;
            case ' ': // Spacebar
                e.preventDefault();
                if (this.autoPlayInterval) {
                    this.pauseAutoPlay();
                } else {
                    this.startAutoPlay();
                }
                break;
        }
    }
    
    addTouchSupport() {
        let startX = 0;
        let endX = 0;
        const minSwipeDistance = 50;
        
        this.carousel.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        }, { passive: true });
        
        this.carousel.addEventListener('touchend', (e) => {
            endX = e.changedTouches[0].clientX;
            const swipeDistance = Math.abs(endX - startX);
            
            if (swipeDistance > minSwipeDistance) {
                if (endX < startX) {
                    this.nextSlide(); // Swipe left = next
                } else {
                    this.prevSlide(); // Swipe right = previous
                }
            }
        }, { passive: true });
    }
}

// Initialize carousel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const carouselElement = document.querySelector('.testimonial-carousel');
    if (carouselElement) {
        carouselElement.carouselInstance = new TestimonialCarousel(carouselElement);
    }
});

// Handle window resize for responsiveness
window.addEventListener('resize', () => {
    const carousel = document.querySelector('.testimonial-carousel');
    if (carousel && carousel.carouselInstance) {
        carousel.carouselInstance.updateSlider();
    }
});
