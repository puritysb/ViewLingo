/* Separate, optional website Analytics purpose. No app telemetry or purchase tracking. */
(function () {
    'use strict';
    var script = document.currentScript;
    // Set only from the verified owned web stream. Empty/unverified configuration fails closed.
    var ID = script && script.getAttribute('data-measurement-id') || '';
    if (!/^G-[A-Z0-9]+$/.test(ID) || !window.ViewLingoGoogle ||
        !window.ViewLingoCampaign || typeof window.ViewLingoCampaign.metadata !== 'function') return;
    var KEY = 'viewlingo_analytics_v2', OLD_KEY = 'viewlingo_analytics_v1', TTL = 60 * 24 * 60 * 60 * 1000;
    var page = new URL(location.href);
    if (!/^\/ViewLingo\/(?:(?:ko|ja|zh-hans|zh-hant)\/)?(?:index\.html|faq\.html|privacy\.html|guide\.html|featuring\.html|translate-japanese-games-on-mac\.html)?$/.test(page.pathname)) return;
    var pagePath = page.pathname.replace(/index\.html$/, '');
    var qa = !window.ViewLingoCampaign || typeof window.ViewLingoCampaign.isQA !== 'function' ||
        window.ViewLingoCampaign.isQA(location);
    var qaChoice = null;
    var blocked = navigator.globalPrivacyControl === true || navigator.doNotTrack === '1';
    var granted = false, started = false, pageSent = false, landingSent = false, storeSent = false;
    var meta = window.ViewLingoCampaign.metadata(location.href);
    var copy = {
        en: ['Optional website analytics', 'Separately allow Google Analytics to measure page views after consent, landing arrivals and App Store button clicks by public campaign? Google may use cookies and receive IP, browser/network and page information. No entered text, translation content or customer ID is sent. Clicks have value 0 and are not purchases. This choice lasts 60 days and is independent of ad measurement.', 'Allow analytics', 'Decline analytics', 'Analytics settings', 'Privacy policy'],
        ko: ['선택적 웹 분석', '공개 캠페인별 동의 후 페이지 조회·랜딩 도달·App Store 버튼 클릭을 Google Analytics로 집계하도록 별도로 허용할까요? Google이 쿠키를 사용하고 IP·브라우저·네트워크·페이지 정보를 받을 수 있습니다. 입력 텍스트·번역 내용·고객 ID는 보내지 않습니다. 클릭은 가치 0이며 구매가 아닙니다. 이 선택은 60일간 저장되며 광고 측정 선택과 별개입니다.', '분석 허용', '분석 거부', '웹 분석 설정', '개인정보 처리방침'],
        ja: ['任意のサイト分析', '公開キャンペーン別の同意後のページ表示・ページ到達・App StoreボタンのクリックをGoogle Analyticsで集計することを別途許可しますか？GoogleはCookieを使用し、IP・ブラウザ・ネットワーク・ページ情報を受け取る場合があります。入力文・翻訳内容・顧客IDは送りません。クリックは価値0で、購入ではありません。この選択は60日間保存され、広告測定の選択とは独立しています。', '分析を許可', '分析を拒否', 'サイト分析の設定', 'プライバシーポリシー'],
        'zh-hans': ['可选网站分析', '是否另行允许Google Analytics按公开广告系列统计同意后的页面浏览、页面到达和App Store按钮点击？Google可能使用Cookie并接收IP、浏览器、网络及页面信息。不发送输入文字、翻译内容或客户ID。点击价值为0，并非购买。此选择保存60天，与广告衡量选择独立。', '允许分析', '拒绝分析', '网站分析设置', '隐私政策'],
        'zh-hant': ['選用網站分析', '是否另行允許Google Analytics按公開廣告活動統計同意後的頁面瀏覽、頁面到達和App Store按鈕點擊？Google可能使用Cookie並接收IP、瀏覽器、網路及頁面資訊。不傳送輸入文字、翻譯內容或客戶ID。點擊價值為0，並非購買。此選擇儲存60天，與廣告評估選擇獨立。', '允許分析', '拒絕分析', '網站分析設定', '隱私權政策']
    };
    var t = copy[document.documentElement.lang.toLowerCase()] || copy.en;
    function saved() {
        if (qa) return qaChoice;
        try {
            var v = JSON.parse(localStorage.getItem(KEY));
            if (v && v.expires > Date.now() && /^(granted|denied)$/.test(v.choice)) return v.choice;
            // Preserve a refusal; earlier arrival/click permission needs a fresh choice for page views.
            var old = JSON.parse(localStorage.getItem(OLD_KEY));
            return old && old.expires > Date.now() && old.choice === 'denied' ? 'denied' : null;
        } catch (_) { return null; }
    }
    function remember(choice) {
        if (qa) { qaChoice = choice; return; }
        try { localStorage.setItem(KEY, JSON.stringify({choice: choice, expires: Date.now() + TTL})); } catch (_) {}
    }
    function ctaLocation(link) {
        // Fixed layout buckets only: never read anchor text, IDs, data attributes or URLs.
        var slots = [['header', 'navigation'], ['footer', 'footer'], ['.hero', 'hero'],
            ['.purchase-fit', 'proof'], ['.purchase-section', 'purchase']];
        for (var i = 0; i < slots.length; i++) {
            if (link.closest && link.closest(slots[i][0])) return slots[i][1];
        }
        return 'body';
    }
    function fields(slot) {
        return {send_to: ID, value: 0, vl_source: meta.source, vl_medium: meta.medium,
            vl_campaign: meta.campaign, vl_content: meta.content,
            vl_page_path: pagePath, vl_cta_location: slot || 'none',
            page_location: page.origin + pagePath, page_referrer: '', page_title: 'ViewLingo'};
    }
    function event(name, slot, callback) {
        if (!granted || blocked) return;
        if (name === 'page_view') {
            if (pageSent) return;
            pageSent = true;
        } else if (name === 'landing_arrival') {
            if (landingSent) return;
            try { if (document.referrer && window.ViewLingoCampaign.internalPage(new URL(document.referrer), page)) return; } catch (_) { return; }
            landingSent = true;
        } else {
            if (storeSent) return;
            storeSent = true;
        }
        var params = fields(slot);
        if (qa) document.dispatchEvent(new CustomEvent('viewlingo:analytics-qa', {detail: {event: name, params: params}}));
        else {
            if (callback) { params.event_callback = callback; params.event_timeout = 700; }
            window.ViewLingoGoogle.event(name, params);
        }
    }
    function enable() {
        if (blocked) return;
        granted = true;
        if (!started) {
            started = true;
            if (!qa) window.ViewLingoGoogle.analytics(ID, {
                send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false,
                cookie_domain: 'puritysb.github.io', cookie_path: '/ViewLingo/', cookie_prefix: 'vl',
                cookie_expires: TTL / 1000, cookie_update: false,
                page_location: page.origin + pagePath, page_referrer: '', page_title: 'ViewLingo',
                campaign_source: meta.source, campaign_medium: meta.medium,
                campaign_name: meta.campaign, campaign_content: meta.content
            });
        }
        event('page_view');
        event('landing_arrival');
    }
    function revoke() {
        granted = false;
        if (qa) return;
        // Unload rather than send denied-mode pings. Other purpose choices survive reload.
        window['ga-disable-' + ID] = true;
        document.cookie.split(';').forEach(function (part) {
            var name = part.trim().split('=')[0];
            if (!/^vl_ga(?:_|$)/.test(name)) return;
            ['; domain=puritysb.github.io', ''].forEach(function (domain) {
                ['/ViewLingo/', '/'].forEach(function (path) { document.cookie = name + '=; Max-Age=0; path=' + path + domain + '; SameSite=Lax'; });
            });
        });
        if (window.dataLayer) {
            for (var i = window.dataLayer.length - 1; i >= 0; i--) {
                var c = window.dataLayer[i];
                if ((c[0] === 'config' && c[1] === ID) || (c[0] === 'event' && c[2] && c[2].send_to === ID)) window.dataLayer.splice(i, 1);
            }
        }
        if (started) location.reload();
    }
    function init() {
        var box = document.createElement('section'); box.className = 'measurement-consent'; box.setAttribute('aria-label', t[0]);
        var title = document.createElement('strong'); title.textContent = t[0]; box.appendChild(title);
        var text = document.createElement('p'); text.textContent = t[1]; box.appendChild(text);
        var actions = document.createElement('div'); actions.className = 'measurement-actions'; box.appendChild(actions);
        function button(label, fn) { var b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.addEventListener('click', fn); actions.appendChild(b); }
        button(t[2], function () { if (blocked) return; remember('granted'); box.hidden = true; enable(); });
        button(t[3], function () { remember('denied'); box.hidden = true; revoke(); });
        var policy = document.createElement('a'); policy.href = window.ViewLingoCampaign.link('privacy.html', location.href); policy.textContent = t[5]; actions.appendChild(policy);
        var main = document.querySelector('main');
        if (main) main.parentNode.insertBefore(box, main); else document.body.appendChild(box);
        var settings = document.createElement('button'); settings.type = 'button'; settings.className = 'measurement-settings'; settings.textContent = t[4];
        settings.addEventListener('click', function () { box.hidden = blocked; if (!blocked) { box.scrollIntoView({block: 'start', behavior: 'instant'}); box.querySelector('button').focus({preventScroll: true}); } });
        (document.querySelector('footer') || document.body).appendChild(settings);
        var choice = saved(); box.hidden = !!choice || blocked;
        if (choice === 'granted') enable();
        window.ViewLingoStore.register({
            enabled: function () { return granted && !blocked && !storeSent; },
            send: function (link, done) { event('store_cta_click', ctaLocation(link), done); }
        });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
}());
