/* ViewLingo shared behaviour: mobile navigation, language selector, smooth scroll.
   Loaded by public home, FAQ, privacy and guide pages. Optional website measurement is isolated in measurement.js. */

(function () {
    'use strict';

    // Only registered, non-personal campaign names may cross the store boundary.
    var CAMPAIGNS = ['vl_google_us_l01', 'vl_dg_us_01', 'vl_dg_qa_01', 'vl_qa_260913', 'vl_ly_jp_s01', 'vl_ly_jp_d01'];
    // Preserve already published ad URLs while staying below Apple's 30-character limit.
    var LEGACY_DISPLAY = 'vl_ly_jp_macfan_display_20261030';
    function campaignLink(href, currentURL) {
        var current = new URL(currentURL);
        var values = current.searchParams.getAll('campaign');
        var campaign = values.length === 1 ? values[0] : '';
        if (campaign === LEGACY_DISPLAY) { campaign = 'vl_ly_jp_d01'; }
        if (CAMPAIGNS.indexOf(campaign) === -1 || href.charAt(0) === '#') {
            return href;
        }
        var target;
        try { target = new URL(href, current); } catch (error) { return href; }
        if (target.origin === 'https://apps.apple.com' &&
            /^\/(?:jp\/)?app\/(?:apple-store\/)?id6749508592$/.test(target.pathname)) {
            var storePath = target.pathname.indexOf('/jp/') === 0 ? '/jp/app/id6749508592' : '/app/apple-store/id6749508592';
            return 'https://apps.apple.com' + storePath + '?pt=128040795&ct=' + campaign + '&mt=12';
        }
        if (target.origin === current.origin && (
            /^\/ViewLingo\/(?:index\.html|guide\.html|faq\.html|privacy\.html|featuring\.html|translate-japanese-games-on-mac\.html)?$/.test(target.pathname) ||
            /^\/ViewLingo\/(?:ko|ja|zh-hans|zh-hant)\/(?:index\.html|faq\.html|privacy\.html)?$/.test(target.pathname))) {
            target.searchParams.set('campaign', campaign);
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
        var menuLabels = { en: 'Navigation menu', ko: '탐색 메뉴', ja: 'ナビゲーションメニュー',
            'zh-hans': '导航菜单', 'zh-hant': '導覽選單' };
        toggle.setAttribute('aria-label', menuLabels[currentLocale()] || menuLabels.en);
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

        document.addEventListener('viewlingo:before-image-preview', function () {
            if (navLinks.classList.contains('active')) { close(); }
        });

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

        // A mobile drawer must not leave desktop scrolling locked after resize.
        window.addEventListener('resize', function () {
            if (window.innerWidth > 768 && navLinks.classList.contains('active')) {
                close();
            }
        });
    }

    function init() {
        setUpCampaignLinks();
        if (campaignOnly) { return; }
        setUpLanguageSelector();
        setUpMobileMenu();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
}());
