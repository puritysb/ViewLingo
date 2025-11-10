// ViewLingo Common JavaScript

// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', function() {
    // Create and add menu toggle button if it doesn't exist
    const nav = document.querySelector('nav');
    const navLinks = document.querySelector('.nav-links');

    if (nav && navLinks && !document.querySelector('.menu-toggle')) {
        const menuToggle = document.createElement('button');
        menuToggle.className = 'menu-toggle';
        menuToggle.setAttribute('aria-label', 'Toggle navigation menu');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.innerHTML = '<span></span><span></span><span></span>';

        // Insert before nav-links
        nav.insertBefore(menuToggle, navLinks);

        // Toggle menu
        menuToggle.addEventListener('click', function() {
            const isActive = navLinks.classList.toggle('active');
            menuToggle.classList.toggle('active');
            menuToggle.setAttribute('aria-expanded', isActive);

            // Prevent body scroll when menu is open
            document.body.style.overflow = isActive ? 'hidden' : '';
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!nav.contains(event.target) && navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                menuToggle.classList.remove('active');
                menuToggle.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            }
        });

        // Close menu on escape key
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' && navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                menuToggle.classList.remove('active');
                menuToggle.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            }
        });
    }
});

// Language Selector
function changeLanguage(lang) {
    try {
        if (lang === 'en') {
            const currentPage = window.location.pathname.split('/').pop() || 'index.html';
            window.location.href = `/${currentPage}`;
        } else {
            const currentPage = window.location.pathname.split('/').pop() || 'index.html';
            window.location.href = `/${lang}/${currentPage}`;
        }
    } catch (error) {
        console.error('Error changing language:', error);
    }
}

// Detect and set current language in selector
function detectLanguage() {
    const selector = document.getElementById('languageSelector');
    if (!selector) return;

    const path = window.location.pathname;
    const langMap = {
        '/ko/': 'ko',
        '/ja/': 'ja',
        '/zh-hans/': 'zh-hans',
        '/zh-hant/': 'zh-hant'
    };

    for (const [pattern, lang] of Object.entries(langMap)) {
        if (path.includes(pattern)) {
            selector.value = lang;
            return;
        }
    }

    selector.value = 'en';
}

// Initialize language detection when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', detectLanguage);
} else {
    detectLanguage();
}

// Lazy loading for images and videos
function addLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    const videos = document.querySelectorAll('video[data-src]');

    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;

                if (element.tagName === 'IMG') {
                    element.src = element.dataset.src;
                    element.removeAttribute('data-src');
                } else if (element.tagName === 'VIDEO') {
                    element.src = element.dataset.src;
                    element.load();
                    element.removeAttribute('data-src');
                }

                observer.unobserve(element);
            }
        });
    }, {
        rootMargin: '50px'
    });

    images.forEach(img => imageObserver.observe(img));
    videos.forEach(video => imageObserver.observe(video));
}

// Initialize lazy loading
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addLazyLoading);
} else {
    addLazyLoading();
}

// Smooth scroll for anchor links
document.addEventListener('DOMContentLoaded', function() {
    const anchorLinks = document.querySelectorAll('a[href^="#"]');

    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;

            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });

                // Update focus for accessibility
                target.setAttribute('tabindex', '-1');
                target.focus();
            }
        });
    });
});
