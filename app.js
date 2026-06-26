/**
 * BrainLab - Landing Page v1
 * Retro Cyber Terminal Aesthetic
 * Pure Vanilla JavaScript
 */

// ============================================
// TYPING ANIMATION
// ============================================

class TypingAnimation {
    constructor(element, text, speed = 100) {
        this.element = element;
        this.text = text;
        this.speed = speed;
        this.index = 0;
    }

    async start() {
        // Clear existing text
        this.element.textContent = '';
        
        // Type each character
        for (this.index = 0; this.index < this.text.length; this.index++) {
            this.element.textContent += this.text[this.index];
            
            // Add slight variation to typing speed for more natural feel
            const delay = this.speed + (Math.random() * 50 - 25);
            await this.sleep(delay);
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize typing animation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const typingElement = document.querySelector('.typing-text');
    if (typingElement) {
        const typing = new TypingAnimation(typingElement, 'BrainLab', 100);
        typing.start();
    }
});

// ============================================
// SCROLL ANIMATIONS (AOS - Animate On Scroll)
// ============================================

class ScrollAnimationObserver {
    constructor(options = {}) {
        this.options = {
            threshold: options.threshold || 0.1,
            rootMargin: options.rootMargin || '0px 0px -100px 0px',
        };
        
        this.observer = new IntersectionObserver(
            (entries) => this.observerCallback(entries),
            this.options
        );
        
        this.init();
    }

    init() {
        // Observe all elements with data-aos attribute
        const elements = document.querySelectorAll('[data-aos]');
        elements.forEach(el => this.observer.observe(el));
    }

    observerCallback(entries) {
        entries.forEach(entry => {
            // When element enters viewport
            if (entry.isIntersecting) {
                this.animateElement(entry.target);
                // Stop observing after animation
                this.observer.unobserve(entry.target);
            }
        });
    }

    animateElement(element) {
        // Get animation type from data-aos
        const animationType = element.getAttribute('data-aos');
        
        // Add aos-animate class to trigger CSS animation
        element.classList.add('aos-animate');
        
        // Optional: Add delay based on element index
        const delay = element.getAttribute('data-aos-delay') || 0;
        if (delay) {
            element.style.animationDelay = `${delay}ms`;
        }
    }
}

// Initialize scroll animations when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ScrollAnimationObserver({
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    });
});

// ============================================
// SMOOTH SCROLL POLYFILL & ENHANCEMENTS
// ============================================

class SmoothScroll {
    constructor() {
        this.init();
    }

    init() {
        // Add smooth scroll behavior to navigation links
        this.setupNavLinks();
        this.setupScrollEnhancements();
    }

    setupNavLinks() {
        const navLinks = document.querySelectorAll('a[href^="#"]');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    setupScrollEnhancements() {
        // Add scroll active state to navigation
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-links a');
        
        window.addEventListener('scroll', () => {
            let current = '';
            
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.clientHeight;
                
                if (window.pageYOffset >= sectionTop - 200) {
                    current = section.getAttribute('id');
                }
            });
            
            // Update active nav link
            navLinks.forEach(link => {
                link.classList.remove('active');
                const href = link.getAttribute('href').substring(1);
                if (href === current) {
                    link.classList.add('active');
                }
            });
        });
    }
}

// Initialize smooth scroll when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SmoothScroll();
});

// ============================================
// INTERACTIVE ELEMENTS
// ============================================

class InteractiveElements {
    constructor() {
        this.init();
    }

    init() {
        this.setupButtonEffects();
        this.setupCardEffects();
        this.setupMouseTracking();
    }

    setupButtonEffects() {
        const buttons = document.querySelectorAll('.btn');
        
        buttons.forEach(button => {
            button.addEventListener('mouseenter', () => {
                this.createRipple(button);
            });
            
            button.addEventListener('mousemove', (e) => {
                const rect = button.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                // Create glow effect at mouse position
                button.style.setProperty('--mouse-x', `${x}px`);
                button.style.setProperty('--mouse-y', `${y}px`);
            });
        });
    }

    createRipple(button) {
        const ripple = document.createElement('span');
        ripple.style.position = 'absolute';
        ripple.style.borderRadius = '50%';
        ripple.style.background = 'rgba(0, 255, 65, 0.3)';
        ripple.style.width = '20px';
        ripple.style.height = '20px';
        ripple.style.top = '50%';
        ripple.style.left = '50%';
        ripple.style.transform = 'translate(-50%, -50%)';
        ripple.style.pointerEvents = 'none';
        ripple.style.animation = 'rippleEffect 0.6s ease-out';
        
        button.style.position = 'relative';
        button.style.overflow = 'visible';
        button.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    }

    setupCardEffects() {
        const cards = document.querySelectorAll('.game-card, .feature-card');
        
        cards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const rotateX = (y - centerY) * 0.02;
                const rotateY = (centerX - x) * 0.02;
                
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
            });
        });
    }

    setupMouseTracking() {
        // Track mouse position for potential future effects
        document.addEventListener('mousemove', (e) => {
            const x = e.clientX / window.innerWidth;
            const y = e.clientY / window.innerHeight;
            
            document.documentElement.style.setProperty('--mouse-x', `${x * 100}%`);
            document.documentElement.style.setProperty('--mouse-y', `${y * 100}%`);
        });
    }
}

// Initialize interactive elements when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new InteractiveElements();
});

// ============================================
// PAGE LOAD ANIMATION
// ============================================

class PageLoader {
    constructor() {
        this.init();
    }

    init() {
        // Add animation to page load
        document.body.style.animation = 'pageLoad 0.8s ease-out';
        
        // Animate navbar
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            navbar.style.animation = 'slideDownIn 0.6s ease-out';
        }
        
        // Animate hero section
        const hero = document.querySelector('.hero');
        if (hero) {
            hero.style.animation = 'fadeIn 0.8s ease-out 0.2s both';
        }
    }
}

// Initialize page loader when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PageLoader();
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Debounce function for performance optimization
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function for performance optimization
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Check if device is mobile
 */
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Get viewport dimensions
 */
function getViewportDimensions() {
    return {
        width: Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
        height: Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
    };
}

// ============================================
// PERFORMANCE OPTIMIZATIONS
// ============================================

// Optimize animations for mobile devices
if (isMobileDevice()) {
    // Reduce animation complexity on mobile
    const style = document.createElement('style');
    style.textContent = `
        @media (max-width: 768px) {
            * {
                animation-duration: 0.5s !important;
            }
            
            [data-aos] {
                animation-duration: 0.4s !important;
            }
        }
    `;
    document.head.appendChild(style);
}

// Optimize scroll performance
window.addEventListener('scroll', throttle(() => {
    // Scroll event handler
}, 16), { passive: true });

// ============================================
// ACCESSIBILITY ENHANCEMENTS
// ============================================

// Respect user's prefers-reduced-motion setting
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (prefersReducedMotion.matches) {
    document.documentElement.style.scrollBehavior = 'auto';
    
    const style = document.createElement('style');
    style.textContent = `
        * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
        }
    `;
    document.head.appendChild(style);
}

// Add keyboard navigation support
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        // Handle escape key if needed
        document.activeElement.blur();
    }
});

// ============================================
// ERROR HANDLING & LOGGING
// ============================================

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Error:', event.error);
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});

// ============================================
// INITIALIZATION
// ============================================

console.log('%c🧠 BrainLab v1.0 - Initialized', 'color: #00ff41; font-size: 14px; font-weight: bold; text-shadow: 0 0 10px #00ff41;');
console.log('%cRetro Cyber Terminal Aesthetic', 'color: #00d4ff; font-size: 12px;');
console.log('%cBuilt with pure HTML5, CSS3, and Vanilla JavaScript', 'color: #a000ff; font-size: 12px;');
