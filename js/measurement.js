/* Optional website-only Google Ads measurement. The Mac app does not use this code. */
(function () {
    'use strict';
    var ID = 'AW-18451009544';
    var LABELS = {visit: 'IRJzCMus2vccEIigkN5E', store: 'ZHS8CP6MqvgcEIigkN5E'};
    var KEY = 'viewlingo_ad_measurement_v1';
    var TTL = 180 * 24 * 60 * 60 * 1000;
    var qa = location.hostname === 'localhost' || location.hostname === '127.0.0.1' ||
        new URL(location.href).searchParams.get('measurement_qa') === '1';
    var blocked = navigator.globalPrivacyControl === true || navigator.doNotTrack === '1';
    var granted = false, started = false, visited = false;
    var lang = document.documentElement.lang.toLowerCase();
    var texts = {
        en: ['Optional ad measurement', 'Allow Google Ads to measure visits and App Store button clicks using cookies and advertising identifiers? Google receives browser and network information. This does not measure purchases or collect screen or translation content from the app. Your choice lasts 180 days.', 'Allow', 'Decline', 'Ad measurement settings', 'Privacy policy'],
        ko: ['선택적 광고 측정', '쿠키와 광고 식별자를 사용해 Google Ads에서 웹 방문과 App Store 버튼 클릭을 측정하도록 허용할까요? 브라우저·네트워크 정보가 Google에 전달됩니다. 구매 여부나 앱의 화면·번역 내용은 수집하지 않습니다. 선택은 180일간 유지됩니다.', '허용', '거부', '광고 측정 설정', '개인정보 처리방침'],
        ja: ['任意の広告測定', 'Cookie と広告識別子を使い、Google Ads でサイト訪問と App Store ボタンのクリックを測定しますか？ブラウザ・ネットワーク情報が Google に送信されます。購入やアプリの画面・翻訳内容は収集しません。選択は180日間保存されます。', '許可', '拒否', '広告測定の設定', 'プライバシーポリシー'],
        'zh-hans': ['可选广告衡量', '是否允许 Google Ads 使用 Cookie 和广告标识符衡量网页访问与 App Store 按钮点击？浏览器和网络信息会发送给 Google。不收集购买情况或应用的屏幕、翻译内容。选择保留180天。', '允许', '拒绝', '广告衡量设置', '隐私政策'],
        'zh-hant': ['選用廣告評估', '是否允許 Google Ads 使用 Cookie 和廣告識別碼評估網頁造訪與 App Store 按鈕點擊？瀏覽器與網路資訊會傳送給 Google。不收集購買情況或 App 的螢幕、翻譯內容。選擇保留180天。', '允許', '拒絕', '廣告評估設定', '隱私權政策']
    };
    var t = texts[lang] || texts.en;
    function saved() {
        try {
            var value = JSON.parse(localStorage.getItem(KEY));
            return value && value.expires > Date.now() ? value.choice : null;
        } catch (_) { return null; }
    }
    function remember(choice) {
        try { localStorage.setItem(KEY, JSON.stringify({choice: choice, expires: Date.now() + TTL})); } catch (_) {}
    }
    function gtag() { window.dataLayer.push(arguments); }
    function event(kind, callback) {
        if (!granted || blocked) return;
        // QA executes the same consent/event path, but never loads Google or emits a request.
        if (qa) {
            document.dispatchEvent(new CustomEvent('viewlingo:measurement-qa', {detail: {event: kind, send_to: ID + '/' + LABELS[kind]}}));
            return;
        }
        gtag('event', 'conversion', {send_to: ID + '/' + LABELS[kind], value: 0, currency: 'KRW', event_callback: callback, event_timeout: 700});
    }
    function enable() {
        if (blocked) return;
        granted = true;
        if (!started) {
            started = true;
            if (!qa) {
                window.dataLayer = window.dataLayer || [];
                gtag('consent', 'default', {ad_storage: 'denied', analytics_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied'});
                gtag('consent', 'update', {ad_storage: 'granted', analytics_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'denied'});
                gtag('js', new Date());
                var page = new URL(location.href);
                var safe = new URL(page.origin + page.pathname);
                ['campaign', 'gclid', 'gbraid', 'wbraid'].forEach(function (key) {
                    var value = page.searchParams.get(key);
                    if (value && /^[a-zA-Z0-9_.-]{1,256}$/.test(value)) safe.searchParams.set(key, value);
                });
                gtag('config', ID, {send_page_view: false, allow_ad_personalization_signals: false,
                    allow_google_signals: false, cookie_domain: 'puritysb.github.io', cookie_path: '/ViewLingo/',
                    page_location: safe.href, page_referrer: '', page_title: document.title});
                var script = document.createElement('script');
                script.async = true;
                script.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
                document.head.appendChild(script);
            }
        }
        if (!visited) { visited = true; event('visit'); }
    }
    function revoke() {
        granted = false;
        // Reload unloads the tag entirely. No denied-mode pings are sent after withdrawal.
        document.cookie.split(';').forEach(function (part) {
            var name = part.trim().split('=')[0];
            if (!/^_gcl_/.test(name)) return;
            ['; domain=puritysb.github.io', ''].forEach(function (domain) {
                document.cookie = name + '=; Max-Age=0; path=/ViewLingo/' + domain + '; SameSite=Lax';
            });
        });
        if (started) location.reload();
    }
    function init() {
        var box = document.createElement('section');
        box.className = 'measurement-consent';
        box.setAttribute('aria-label', t[0]);
        var title = document.createElement('strong'); title.textContent = t[0]; box.appendChild(title);
        var body = document.createElement('p'); body.textContent = t[1]; box.appendChild(body);
        var actions = document.createElement('div'); actions.className = 'measurement-actions'; box.appendChild(actions);
        function button(label, handler) {
            var b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.addEventListener('click', handler); actions.appendChild(b); return b;
        }
        button(t[2], function () { remember('granted'); box.hidden = true; enable(); });
        button(t[3], function () { remember('denied'); box.hidden = true; revoke(); });
        var policy = document.createElement('a'); policy.href = 'privacy.html'; policy.textContent = t[5]; actions.appendChild(policy);
        document.body.appendChild(box);
        var settings = document.createElement('button'); settings.type = 'button'; settings.className = 'measurement-settings'; settings.textContent = t[4];
        settings.addEventListener('click', function () { box.hidden = false; box.querySelector('button').focus(); });
        (document.querySelector('footer') || document.body).appendChild(settings);
        var choice = saved(); box.hidden = !!choice || blocked;
        if (choice === 'granted') enable();
        document.addEventListener('click', function (e) {
            var link = e.target.closest && e.target.closest('a[href]');
            if (!link || e.defaultPrevented) return;
            var url;
            try { url = new URL(link.href, location.href); } catch (_) { return; }
            if (url.origin === 'https://apps.apple.com' && url.pathname === '/app/apple-store/id6749508592') {
                if (granted && !blocked && !qa && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey &&
                    (!link.target || link.target === '_self') && e.button === 0) {
                    e.preventDefault();
                    var navigated = false;
                    function proceed() { if (!navigated) { navigated = true; location.assign(link.href); } }
                    setTimeout(proceed, 700); // A blocked or slow tag must never block the store link.
                    event('store', proceed);
                } else { event('store'); }
            }
        });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
}());
