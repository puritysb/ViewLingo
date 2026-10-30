/* Optional website-only Google Ads and Yahoo Ads measurement. The Mac app does not use this code. */
(function () {
    'use strict';
    var ID = 'AW-18451009544';
    var LABELS = {visit: 'IRJzCMus2vccEIigkN5E', store: 'ZHS8CP6MqvgcEIigkN5E'};
    // A Google-only grant never authorizes the additional Yahoo recipient.
    var KEY = 'viewlingo_ad_measurement_v2';
    var OLD_KEY = 'viewlingo_ad_measurement_v1';
    var LANDING_KEY = 'viewlingo_yahoo_landing_v1';
    var TTL = 180 * 24 * 60 * 60 * 1000;
    var qa = location.hostname === 'localhost' || location.hostname === '127.0.0.1' ||
        new URL(location.href).searchParams.get('measurement_qa') === '1';
    var blocked = navigator.globalPrivacyControl === true || navigator.doNotTrack === '1';
    var granted = false, started = false, visited = false, storeSent = false, yahooStarted = false, landingSent = false;
    var lang = document.documentElement.lang.toLowerCase();
    var texts = {
        en: ['Optional ad measurement', 'Allow Google Ads to measure visits and App Store button clicks, and Yahoo Ads (LINE Yahoo) to measure App Store button clicks for registered Yahoo campaigns? After you allow, their scripts may use cookies and receive page/campaign and advertising identifiers, IP address and browser/network information. Store clicks have value 0 and are not purchases. No app screens, translation content or entered text is sent. Your choice covers both providers and lasts 180 days.', 'Allow', 'Decline', 'Ad measurement settings', 'Privacy policy'],
        ko: ['선택적 광고 측정', 'Google Ads의 웹 방문·App Store 버튼 클릭 측정과 Yahoo Ads(LINE Yahoo)의 등록된 Yahoo 캠페인별 App Store 버튼 클릭 측정을 허용할까요? 허용 후 각 스크립트가 쿠키를 사용하고 페이지·캠페인·광고 식별자, IP 주소와 브라우저·네트워크 정보를 받을 수 있습니다. Store 이동은 가치 0의 보조 지표이며 구매가 아닙니다. 앱 화면·번역 내용·입력 텍스트는 보내지 않습니다. 이 선택은 두 제공자에 적용되며 180일간 유지됩니다.', '허용', '거부', '광고 측정 설정', '개인정보 처리방침'],
        ja: ['任意の広告測定', 'Google Adsによるサイト訪問・App Storeボタンのクリック測定と、Yahoo広告（LINEヤフー）による登録済みYahooキャンペーンのApp Storeボタンのクリック測定を許可しますか？許可後、各社のスクリプトがCookieを使い、ページ・キャンペーン・広告識別子、IPアドレス、ブラウザ・ネットワーク情報を受け取る場合があります。Storeへの移動は価値0の補助指標で、購入ではありません。アプリの画面・翻訳内容・入力したテキストは送信しません。この選択は両社に適用され、180日間保存されます。', '許可', '拒否', '広告測定の設定', 'プライバシーポリシー'],
        'zh-hans': ['可选广告衡量', '是否允许 Google Ads 衡量网页访问及 App Store 按钮点击，并允许 Yahoo Ads（LINE Yahoo）衡量已登记 Yahoo 广告系列的 App Store 按钮点击？允许后，两家的脚本可能使用 Cookie，接收页面、广告系列和广告标识符、IP 地址及浏览器和网络信息。前往 Store 是价值为0的辅助指标，并非购买。不发送应用屏幕、翻译内容或输入的文字。此选择适用于两家提供商，保留180天。', '允许', '拒绝', '广告衡量设置', '隐私政策'],
        'zh-hant': ['選用廣告評估', '是否允許 Google Ads 評估網頁造訪及 App Store 按鈕點擊，並允許 Yahoo Ads（LINE Yahoo）評估已登記 Yahoo 廣告活動的 App Store 按鈕點擊？允許後，兩家的指令碼可能使用 Cookie，接收頁面、廣告活動和廣告識別碼、IP 位址及瀏覽器和網路資訊。前往 Store 是價值為0的輔助指標，並非購買。不傳送 App 螢幕、翻譯內容或輸入的文字。此選擇適用於兩家提供者，保留180天。', '允許', '拒絕', '廣告評估設定', '隱私權政策']
    };
    var t = texts[lang] || texts.en;
    var landingTexts = {
        en: ['Additional Yahoo visit measurement', 'Also allow Yahoo Ads (LINE Yahoo) to measure your arrival on a registered campaign landing page? This adds a zero-value visit event, not a purchase. Yahoo may receive campaign/advertising identifiers, IP address and browser/network information. Your existing Store-click choice stays unchanged. This separate choice lasts 180 days.', 'Allow visit measurement', 'No visit measurement'],
        ko: ['Yahoo 방문 측정 추가 동의', 'Yahoo Ads(LINE Yahoo)가 등록된 캠페인 랜딩 도달도 측정하도록 허용할까요? 가치 0의 방문 이벤트가 추가되며 구매가 아닙니다. Yahoo가 캠페인·광고 식별자, IP 주소와 브라우저·네트워크 정보를 받을 수 있습니다. 기존 Store 클릭 선택은 유지됩니다. 이 별도 선택은 180일간 저장됩니다.', '방문 측정 허용', '방문 측정 거부'],
        ja: ['Yahooの訪問測定への追加同意', 'Yahoo広告（LINEヤフー）が登録済みキャンペーンのページへの到達も測定することを許可しますか？価値0の訪問イベントを追加します。購入ではありません。Yahooはキャンペーン・広告識別子、IPアドレス、ブラウザ・ネットワーク情報を受け取る場合があります。Storeクリックの既存の選択は変わりません。この別の選択は180日間保存します。', '訪問測定を許可', '訪問測定を拒否'],
        'zh-hans': ['另行同意Yahoo访问衡量', '是否也允许Yahoo Ads（LINE Yahoo）衡量您到达已登记广告系列页面的情况？这会增加价值为0的访问事件，并非购买。Yahoo可能接收广告系列及广告标识符、IP地址和浏览器及网络信息。原有Store点击选择保持不变。此单独选择保留180天。', '允许访问衡量', '拒绝访问衡量'],
        'zh-hant': ['另行同意Yahoo造訪評估', '是否也允許Yahoo Ads（LINE Yahoo）評估您到達已登記廣告活動頁面的情況？這會增加價值為0的造訪事件，並非購買。Yahoo可能接收廣告活動及廣告識別碼、IP位址和瀏覽器及網路資訊。原有Store點擊選擇保持不變。此獨立選擇保留180天。', '允許造訪評估', '拒絕造訪評估']
    };
    var lt = landingTexts[lang] || landingTexts.en;
    function savedLanding() {
        try {
            var value = JSON.parse(localStorage.getItem(LANDING_KEY));
            return value && value.expires > Date.now() && /^(granted|denied)$/.test(value.choice) ? value.choice : null;
        } catch (_) { return null; }
    }
    var landingGranted = savedLanding() === 'granted', landingBox;
    function rememberLanding(choice) {
        landingGranted = choice === 'granted';
        try { localStorage.setItem(LANDING_KEY, JSON.stringify({choice: choice, expires: Date.now() + TTL})); } catch (_) {}
    }
    function saved() {
        try {
            var value = JSON.parse(localStorage.getItem(KEY));
            if (value && value.expires > Date.now() && /^(granted|denied)$/.test(value.choice)) return value.choice;
            // Retain a refusal, but require a fresh choice for the expanded recipients.
            var old = JSON.parse(localStorage.getItem(OLD_KEY));
            return old && old.expires > Date.now() && old.choice === 'denied' ? 'denied' : null;
        } catch (_) { return null; }
    }
    function remember(choice) {
        try { localStorage.setItem(KEY, JSON.stringify({choice: choice, expires: Date.now() + TTL})); } catch (_) {}
    }
    function gtag() { window.dataLayer.push(arguments); }
    function yahooCampaign() {
        if (!window.ViewLingoCampaign) return '';
        var store = window.ViewLingoCampaign.link('https://apps.apple.com/jp/app/id6749508592?ct=web', location.href);
        var campaign = new URL(store).searchParams.get('ct');
        return campaign === 'vl_ly_jp_s01' || campaign === 'vl_ly_jp_d01' ? campaign : '';
    }
    // The official loader reads the current URL and document.referrer. Skip it if
    // either could carry arbitrary inputs; never forward user text to the tag.
    function safeYahooURL(value, isReferrer) {
        if (!value) return isReferrer;
        var url;
        try { url = new URL(value); } catch (_) { return false; }
        if (url.username || url.password || !/^https?:$/.test(url.protocol)) return false;
        var current = new URL(location.href);
        if (isReferrer && url.origin !== current.origin) {
            return url.pathname === '/' && !url.search && !url.hash;
        }
        if (!/^\/ViewLingo\/(?:(?:ko|ja|zh-hans|zh-hant)\/)?(?:index\.html|faq\.html|privacy\.html|guide\.html|featuring\.html|translate-japanese-games-on-mac\.html)?$/.test(url.pathname)) return false;
        if (url.hash && !document.getElementById(url.hash.slice(1))) return false;
        var valid = true;
        url.searchParams.forEach(function (value, key) {
            if (url.searchParams.getAll(key).length !== 1) { valid = false; return; }
            if (key === 'campaign') {
                var store = window.ViewLingoCampaign.link('https://apps.apple.com/app/id6749508592?ct=web', url.href);
                if (new URL(store).searchParams.get('ct') === 'web') valid = false;
            } else if (qa && key === 'measurement_qa' && value === '1') {
                // Local QA contract only; qa still blocks all provider commands and loaders.
            } else if (key !== 'yclid' || value.length > 256 || !/^(?:YSS\.(?:\d+\.)?[\w-]+|YSCPA\.[\w-]+|YJAD\.\d{10}\.[\w.-]+)$/.test(value)) valid = false;
        });
        return valid;
    }
    function safeYahooContext() {
        return !!yahooCampaign() && safeYahooURL(location.href, false) && safeYahooURL(document.referrer || '', true);
    }
    // Landing permission is a separate purpose. Existing Store consent never grants it.
    function funnelEvent(kind) {
        if (!granted || blocked || !safeYahooContext()) return;
        if (kind === 'landing_arrival') {
            if (!landingGranted) return;
            var page = new URL(location.href);
            if (!/^\/ViewLingo\/(?:(?:ko|ja|zh-hans|zh-hant)\/)?(?:index\.html)?$/.test(page.pathname)) return;
            if (document.referrer && new URL(document.referrer).origin === page.origin) return;
            if (landingSent) return;
            landingSent = true;
        }
        document.dispatchEvent(new CustomEvent('viewlingo:funnel', {detail: {
            event: kind, campaign: yahooCampaign(), value: 0, scope: 'consented_document'
        }}));
        if (kind === 'landing_arrival') yahooLanding();
    }
    function yahooTag() { window.yjDataLayer.push(arguments); }
    function enableYahoo() {
        if (qa || blocked || !granted || yahooStarted || !safeYahooContext()) return;
        yahooStarted = true;
        window.yjDataLayer = window.yjDataLayer || [];
        // Cookie attribution only; do not opt into Yahoo's additional localStorage copy.
        yahooTag({type: 'ycl_cookie', config: {ycl_use_non_cookie_storage: false}});
        var script = document.createElement('script');
        script.async = true;
        script.referrerPolicy = 'no-referrer';
        script.src = 'https://s.yimg.jp/images/listing/tool/cv/ytag.js';
        document.head.appendChild(script);
    }
    function yahooStore() {
        if (!granted || blocked) return;
        var campaign = yahooCampaign();
        if (!campaign) return;
        var tag = campaign === 'vl_ly_jp_s01' ? {
            type: 'yss_conversion', config: {
                yahoo_conversion_id: '1001415750', yahoo_conversion_label: 'xCqiCO3E6a4dELel-PZE', yahoo_conversion_value: '0'
            }
        } : {
            type: 'yjad_conversion', config: {
                yahoo_ydn_conv_io: 'bXRYjY70W0R9CKTd5ivIRA..', yahoo_ydn_conv_label: 'PO8USX4JWB9FXBVRAM1388944',
                yahoo_ydn_conv_transaction_id: '', yahoo_ydn_conv_value: '0'
            }
        };
        if (qa) {
            document.dispatchEvent(new CustomEvent('viewlingo:measurement-qa', {detail: {event: 'store', provider: 'yahoo', campaign: campaign, tag: tag}}));
            return;
        }
        if (!safeYahooContext()) return;
        enableYahoo();
        if (yahooStarted) yahooTag(tag);
    }
    function yahooLanding() {
        if (!granted || !landingGranted || blocked || !safeYahooContext()) return;
        var campaign = yahooCampaign();
        var tag = campaign === 'vl_ly_jp_s01' ? {
            type: 'yss_conversion', config: {
                yahoo_conversion_id: '1001415750', yahoo_conversion_label: '7ZqyCOKHhq8dELel-PZE', yahoo_conversion_value: '0'
            }
        } : {
            type: 'yjad_conversion', config: {
                yahoo_ydn_conv_io: 'bXRYjY70W0R9CKTd5ivIRA..', yahoo_ydn_conv_label: 'P2MNJGRW9YB00BZUKQ1388965',
                yahoo_ydn_conv_transaction_id: '', yahoo_ydn_conv_value: '0'
            }
        };
        if (qa) {
            document.dispatchEvent(new CustomEvent('viewlingo:measurement-qa', {detail: {event: 'landing', provider: 'yahoo', campaign: campaign, tag: tag}}));
            return;
        }
        enableYahoo();
        if (yahooStarted) yahooTag(tag);
    }
    function removeQueuedLanding() {
        var queue = window.yjDataLayer || [];
        for (var i = queue.length - 1; i >= 0; i--) {
            var config = queue[i] && queue[i][0] && queue[i][0].config;
            if (config && (config.yahoo_conversion_label === '7ZqyCOKHhq8dELel-PZE' || config.yahoo_ydn_conv_label === 'P2MNJGRW9YB00BZUKQ1388965')) queue.splice(i, 1);
        }
    }
    function event(kind, callback) {
        if (!granted || blocked) return;
        // A double click or a second CTA on this page is one Store movement, not a purchase.
        if (kind === 'store') {
            if (storeSent) { if (callback) callback(); return; }
            storeSent = true;
            funnelEvent('store_cta_click');
            yahooStore();
        }
        // QA executes the consent/event path without loading either provider or sending requests.
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
        enableYahoo();
        funnelEvent('landing_arrival');
        if (landingBox) landingBox.hidden = blocked || !yahooCampaign() || !!savedLanding();
        if (!visited) { visited = true; event('visit'); }
    }
    function revoke() {
        granted = false;
        if (landingBox) landingBox.hidden = true;
        // Reload unloads the tag entirely. No denied-mode pings are sent after withdrawal.
        document.cookie.split(';').forEach(function (part) {
            var name = part.trim().split('=')[0];
            if (!/^(?:_gcl_|_ycl(?:_|$)|_ycla(?:_|$)|_yjr_yjad$|_yjsu_yjad$)/.test(name)) return;
            ['; domain=puritysb.github.io', ''].forEach(function (domain) {
                ['/ViewLingo/', '/'].forEach(function (path) {
                    document.cookie = name + '=; Max-Age=0; path=' + path + domain + '; SameSite=Lax';
                });
            });
        });
        // Clear commands still waiting for a slow loader before unloading it.
        if (window.yjDataLayer) window.yjDataLayer.length = 0;
        if (started || yahooStarted) location.reload();
    }
    function init() {
        var box = document.createElement('section');
        box.className = 'measurement-consent';
        box.setAttribute('aria-label', t[0]);
        var title = document.createElement('strong'); title.textContent = t[0]; box.appendChild(title);
        var body = document.createElement('p'); body.textContent = t[1]; box.appendChild(body);
        var actions = document.createElement('div'); actions.className = 'measurement-actions'; box.appendChild(actions);
        function button(label, handler, parent) {
            var b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.addEventListener('click', handler); (parent || actions).appendChild(b); return b;
        }
        button(t[2], function () { remember('granted'); box.hidden = true; enable(); });
        button(t[3], function () { remember('denied'); box.hidden = true; revoke(); });
        var policy = document.createElement('a');
        policy.href = window.ViewLingoCampaign ? window.ViewLingoCampaign.link('privacy.html', location.href) : 'privacy.html';
        policy.textContent = t[5]; actions.appendChild(policy);
        // Keep the choice in document flow so no CTA or compatibility text is covered.
        var main = document.querySelector('main');
        if (main) main.parentNode.insertBefore(box, main);
        else document.body.appendChild(box);
        landingBox = document.createElement('section'); landingBox.className = 'measurement-consent';
        landingBox.setAttribute('aria-label', lt[0]); landingBox.hidden = true;
        var landingTitle = document.createElement('strong'); landingTitle.textContent = lt[0]; landingBox.appendChild(landingTitle);
        var landingBody = document.createElement('p'); landingBody.textContent = lt[1]; landingBox.appendChild(landingBody);
        var landingActions = document.createElement('div'); landingActions.className = 'measurement-actions'; landingBox.appendChild(landingActions);
        button(lt[2], function () {
            if (!granted || blocked) return;
            rememberLanding('granted'); landingBox.hidden = true; funnelEvent('landing_arrival');
        }, landingActions);
        button(lt[3], function () {
            rememberLanding('denied'); landingBox.hidden = true; removeQueuedLanding();
        }, landingActions);
        var landingPolicy = document.createElement('a'); landingPolicy.href = policy.href; landingPolicy.textContent = t[5]; landingActions.appendChild(landingPolicy);
        if (main) main.parentNode.insertBefore(landingBox, main);
        else document.body.appendChild(landingBox);
        var settings = document.createElement('button'); settings.type = 'button'; settings.className = 'measurement-settings'; settings.textContent = t[4];
        settings.addEventListener('click', function () {
            box.hidden = false;
            landingBox.hidden = !granted || blocked || !yahooCampaign();
            box.scrollIntoView({block: 'start', behavior: 'instant'});
            box.querySelector('button').focus({preventScroll: true});
        });
        (document.querySelector('footer') || document.body).appendChild(settings);
        var choice = saved(); box.hidden = !!choice || blocked;
        if (choice === 'granted') enable();
        document.addEventListener('click', function (e) {
            var link = e.target.closest && e.target.closest('a[href]');
            if (!link || e.defaultPrevented) return;
            var url;
            try { url = new URL(link.href, location.href); } catch (_) { return; }
            if (url.origin === 'https://apps.apple.com' && /^\/(?:jp\/)?app\/(?:apple-store\/)?id6749508592$/.test(url.pathname)) {
                if (granted && !blocked && !qa && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey &&
                    (!link.target || link.target === '_self') && e.button === 0) {
                    e.preventDefault();
                    var navigated = false;
                    function proceed() { if (!navigated) { navigated = true; location.assign(link.href); } }
                    setTimeout(proceed, 700); // A blocked or slow tag must never block the store link.
                    event('store'); // Allow both independent providers up to the same bounded navigation delay.
                } else { event('store'); }
            }
        });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
}());
