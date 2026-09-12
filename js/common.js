/* ViewLingo shared behaviour: mobile navigation, language selector, smooth scroll.
   Loaded by the homepage and every localized homepage. */

(function () {
    'use strict';

    var LOCALES = ['ko', 'ja', 'zh-hans', 'zh-hant'];

    /* 'en' at the site root, otherwise the locale directory we are inside.
       Works for /ViewLingo/ko/index.html and for the directory URL /ViewLingo/ko/. */
    function currentLocale() {
        var segments = window.location.pathname.split('/').filter(Boolean);
        for (var i = 0; i < segments.length; i++) {
            if (LOCALES.indexOf(segments[i]) !== -1) {
                return segments[i];
            }
        }
        return 'en';
    }

    /* Relative navigation only. The site is served from a project page
       (puritysb.github.io/ViewLingo/), so a root-absolute '/ko/index.html'
       would leave the site entirely. */
    function changeLanguage(lang) {
        var prefix = currentLocale() === 'en' ? '' : '../';
        window.location.href = lang === 'en' ? prefix + 'index.html' : prefix + lang + '/index.html';
    }

    function setUpLanguageSelector() {
        var selector = document.getElementById('languageSelector');
        if (!selector) {
            return;
        }
        selector.value = currentLocale();
        selector.addEventListener('change', function () {
            changeLanguage(this.value);
        });
    }

    /* The menu button is created here so every page gets it by loading this
       file, without hand-editing each nav. */
    function setUpMobileMenu() {
        var nav = document.querySelector('header nav');
        var navLinks = document.querySelector('.nav-links');
        if (!nav || !navLinks || document.querySelector('.menu-toggle')) {
            return;
        }

        var toggle = document.createElement('button');
        toggle.className = 'menu-toggle';
        toggle.type = 'button';
        toggle.setAttribute('aria-label', 'Toggle navigation menu');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-controls', navLinks.id || 'primary-navigation');
        toggle.innerHTML = '<span></span><span></span><span></span>';
        if (!navLinks.id) {
            navLinks.id = 'primary-navigation';
        }
        nav.insertBefore(toggle, navLinks);

        function close() {
            navLinks.classList.remove('active');
            toggle.classList.remove('active');
            toggle.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        }

        toggle.addEventListener('click', function (event) {
            event.stopPropagation();
            var open = navLinks.classList.toggle('active');
            toggle.classList.toggle('active', open);
            toggle.setAttribute('aria-expanded', String(open));
            document.body.style.overflow = open ? 'hidden' : '';
        });

        navLinks.addEventListener('click', function (event) {
            if (event.target.tagName === 'A') {
                close();
            }
        });

        document.addEventListener('click', function (event) {
            if (navLinks.classList.contains('active') && !nav.contains(event.target)) {
                close();
            }
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && navLinks.classList.contains('active')) {
                close();
                toggle.focus();
            }
        });
    }

    function setUpSmoothScroll() {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return;
        }
        document.querySelectorAll('a[href^="#"]').forEach(function (link) {
            link.addEventListener('click', function (event) {
                var href = this.getAttribute('href');
                if (!href || href === '#') {
                    return;
                }
                var target = document.querySelector(href);
                if (!target) {
                    return;
                }
                event.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                /* Move keyboard focus with the viewport. */
                if (!target.hasAttribute('tabindex')) {
                    target.setAttribute('tabindex', '-1');
                }
                target.focus({ preventScroll: true });
            });
        });
    }

    function init() {
        setUpLanguageSelector();
        setUpMobileMenu();
        setUpSmoothScroll();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
}());
