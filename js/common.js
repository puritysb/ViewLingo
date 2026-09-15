/* ViewLingo shared behaviour: mobile navigation, language selector, smooth scroll.
   Loaded by public home, FAQ, privacy and guide pages. Optional website measurement is isolated in measurement.js. */

(function () {
    'use strict';

    // Only registered, non-personal campaign names may cross the store boundary.
    var CAMPAIGNS = ['vl_google_us_l01', 'vl_dg_us_01', 'vl_dg_qa_01', 'vl_qa_260913'];
    function campaignLink(href, currentURL) {
        var current = new URL(currentURL);
        var values = current.searchParams.getAll('campaign');
        if (values.length !== 1 || CAMPAIGNS.indexOf(values[0]) === -1 || href.charAt(0) === '#') {
            return href;
        }
        var target;
        try { target = new URL(href, current); } catch (error) { return href; }
        if (target.origin === 'https://apps.apple.com' &&
            target.pathname === '/app/apple-store/id6749508592') {
            return 'https://apps.apple.com/app/apple-store/id6749508592?pt=128040795&ct=' + values[0] + '&mt=8';
        }
        if (target.origin === current.origin && (
            /^\/ViewLingo\/(?:index\.html|guide\.html|faq\.html|privacy\.html)?$/.test(target.pathname) ||
            /^\/ViewLingo\/(?:ko|ja|zh-hans|zh-hant)\/(?:index\.html|faq\.html|privacy\.html)?$/.test(target.pathname))) {
            target.searchParams.set('campaign', values[0]);
            return target.href;
        }
        return href;
    }

    // Node's built-in test runner can exercise URL boundaries without a browser or dependencies.
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { campaignLink: campaignLink };
    }
    if (typeof document === 'undefined') { return; }

    var campaignOnly = document.currentScript && document.currentScript.hasAttribute('data-campaign-only');

    function setUpCampaignLinks() {
        document.querySelectorAll('a[href]').forEach(function (link) {
            if (!link.hasAttribute('download')) {
                var href = link.getAttribute('href');
                var updated = campaignLink(href, window.location.href);
                if (updated !== href) { link.setAttribute('href', updated); }
            }
        });
    }

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
        var target = lang === 'en' ? prefix + 'index.html' : prefix + lang + '/index.html';
        window.location.href = campaignLink(target, window.location.href);
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
        setUpCampaignLinks();
        if (campaignOnly) { return; }
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
