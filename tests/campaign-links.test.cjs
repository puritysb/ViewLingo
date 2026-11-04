const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { campaignLink } = require('../js/common.js');
const { campaignForURL } = require('../js/common.js');
const root = 'https://puritysb.github.io/ViewLingo/';
const store = 'https://apps.apple.com/app/apple-store/id6749508592?pt=128040795&ct=web&mt=12';
const qa = root + '?campaign=vl_qa_260913&utm_source=google&gclid=private-test';
const channelRoutes = [
    ['vl_meta_kr_awareness_20261104', 'utm_source=meta&utm_medium=paid_social&utm_campaign=vl_meta_kr_awareness_20261104&utm_content=screen_translation_a'],
    ['vl_kakao_kr_pc_cpm_20261105', 'utm_source=kakao&utm_medium=display&utm_campaign=vl_kakao_kr_pc_cpm_20261105&utm_content=icon_a'],
    ['vl_google_tw_s01', 'campaign=vl_google_tw_s01&utm_source=google&utm_medium=cpc&utm_campaign=vl_google_tw_s01&utm_content=screen_text_a']
];

test('registered channel UTMs become fixed Apple ct and survive every locale/policy route', () => {
    for (const [campaign, query] of channelRoutes) {
        assert.ok(campaign.length <= 30);
        const entry = root + 'ko/?' + query + '&fbclid=private-test&email=never-forward';
        assert.equal(campaignForURL(entry), campaign);
        for (const locale of ['', 'ko/', 'ja/', 'zh-hans/', 'zh-hant/']) {
            for (const page of ['index.html', 'faq.html', 'privacy.html']) {
                const next = campaignLink(root + locale + page + '?email=private#details', entry);
                assert.equal(new URL(next).search, '?campaign=' + campaign);
                assert.equal(new URL(next).hash, '#details');
                const target = locale === 'ja/' ? store.replace('/app/apple-store/', '/jp/app/') : store;
                assert.equal(campaignLink(target, next), target.replace('ct=web', 'ct=' + campaign));
                assert.equal(campaignForURL(next), campaign);
            }
        }
        assert.equal(campaignLink('privacy.html', entry), root + 'ko/privacy.html?campaign=' + campaign);
        assert.equal(campaignLink('../guide.html', entry), root + 'guide.html?campaign=' + campaign);
        assert.equal(campaignLink(store, entry), store.replace('ct=web', 'ct=' + campaign));
        assert.equal(campaignLink('#features', entry), '#features');
        assert.equal(campaignLink('https://example.com/', entry), 'https://example.com/');
    }
});

test('new UTM routes reject missing, conflicting, duplicate and lookalike metadata', () => {
    for (const [campaign, query] of channelRoutes) {
        for (const bad of [query.replace('utm_source=', 'other_source='),
            query.replace('utm_medium=', 'UTM_medium='), query.replace('utm_content=', 'other_content='),
            query + '&utm_source=meta', query + '&utm_campaign=' + campaign,
            query.replace(campaign, campaign + '_extra'), query + '&campaign=unknown',
            query + '&campaign=', query + '&campaign=' + campaign + '&campaign=' + campaign]) {
            assert.equal(campaignLink(store, root + 'ko/?' + bad), store);
        }
        const other = channelRoutes.find(r => r[0] !== campaign);
        assert.equal(campaignLink(store, root + 'ko/?campaign=' + campaign + '&' + other[1]), store);
        assert.equal(campaignLink(store, root + 'ko/?campaign=' + campaign + '&utm_source=meta'), store);
        assert.equal(campaignLink(store, 'https://user:password@puritysb.github.io/ViewLingo/ko/?' + query), store);
    }
});

test('actual HTML Store anchors get channel attribution offline, without running any SDK', () => {
    const code = fs.readFileSync(path.join(__dirname, '../js/common.js'), 'utf8');
    for (const [campaign, query] of channelRoutes) {
        for (const locale of ['', 'ko/', 'ja/', 'zh-hans/', 'zh-hant/']) {
            for (const page of ['index.html', 'faq.html', 'privacy.html', ...(locale ? [] : ['guide.html', 'featuring.html', 'translate-japanese-games-on-mac.html'])]) {
                const html = fs.readFileSync(path.join(__dirname, '..', locale, page), 'utf8');
                const links = [...html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>/g)].map(m => ({
                    href: m[1].replace(/&amp;/g, '&'), getAttribute() { return this.href; },
                    setAttribute(n,v) { this.href=v; }, hasAttribute() { return false; }
                }));
                vm.runInNewContext(code, {URL, window:{location:{href:root+locale+page+'?'+query}},
                    document:{readyState:'complete',currentScript:{hasAttribute:()=>true},querySelectorAll:()=>links}});
                const stores = links.filter(l=>/^https:\/\/apps.apple.com\//.test(l.href));
                if (page === 'index.html') assert.ok(stores.length > 0);
                for (const link of stores) {
                    const u = new URL(link.href);
                    assert.equal(u.search, '?pt=128040795&ct='+campaign+'&mt=12');
                    assert.equal(u.pathname.startsWith('/jp/'), locale==='ja/');
                }
            }
        }
    }
});

test('store link forwards only registered campaign and fixed provider, never click identifiers', () => {
    assert.equal(campaignLink(store, qa),
        'https://apps.apple.com/app/apple-store/id6749508592?pt=128040795&ct=vl_qa_260913&mt=12');
    assert.match(campaignLink(store, root + '?campaign=vl_google_us_l01'), /ct=vl_google_us_l01&mt=12$/);
    for (const query of ['', '?campaign=unknown', '?ct=vl_qa_260913',
        '?campaign=vl_qa_260913&campaign=unknown', '?campaign=__proto__']) {
        assert.equal(campaignLink(store, root + query), store);
    }
});

test('all languages and supported internal routes retain campaign across round trips', () => {
    for (const locale of ['', 'ko/', 'ja/', 'zh-hans/', 'zh-hant/']) {
        for (const page of ['', 'index.html', 'faq.html', 'privacy.html']) {
            const destination = new URL(campaignLink(root + locale + page, qa));
            assert.equal(destination.search, '?campaign=vl_qa_260913');
            assert.equal(new URL(campaignLink('/ViewLingo/guide.html', destination.href)).search,
                '?campaign=vl_qa_260913');
            assert.match(campaignLink(store, destination.href), /ct=vl_qa_260913/);
        }
    }
    assert.equal(campaignLink('../index.html#features', root + 'ko/?campaign=vl_qa_260913'),
        root + 'index.html?campaign=vl_qa_260913#features');
});

test('external sites, other apps, files and fragment navigation stay untouched', () => {
    for (const href of ['#features', 'https://github.com/puritysb/ViewLingo',
        'https://apps.apple.com.evil.example/app/apple-store/id6749508592',
        'https://apps.apple.com/app/apple-store/id111', 'mailto:support@example.com',
        'javascript:void(0)', '/ViewLingo-other/index.html', '/other/index.html',
        'assets/demo.mp4', 'demo/index.html']) {
        assert.equal(campaignLink(href, qa), href);
    }
});

test('game guide preserves registered attribution through guide, locale and store navigation', () => {
    const page = root + 'translate-japanese-games-on-mac.html';
    const landing = campaignLink(page + '#setup', qa);
    assert.equal(landing, page + '?campaign=vl_qa_260913#setup');
    const korean = campaignLink('ko/index.html', landing);
    assert.equal(korean, root + 'ko/index.html?campaign=vl_qa_260913');
    const back = campaignLink('../translate-japanese-games-on-mac.html', korean);
    assert.equal(back, page + '?campaign=vl_qa_260913');
    const guideStore = store.replace('ct=web', 'ct=web_game_guide');
    assert.equal(campaignLink(guideStore, page), guideStore);
    assert.match(campaignLink(guideStore, back), /ct=vl_qa_260913&mt=12$/);
    for (const target of [page + '.bak', page.replace('/ViewLingo/', '/other/')]) {
        assert.equal(campaignLink(target, qa), target);
    }
});

test('page initialization rewrites actual HTML anchors and skips downloads', () => {
    const code = fs.readFileSync(path.join(__dirname, '../js/common.js'), 'utf8');
    for (const locale of ['', 'ko/', 'ja/', 'zh-hans/', 'zh-hant/']) {
        for (const page of ['index.html', 'faq.html', 'privacy.html', ...(locale ? [] : ['guide.html', 'translate-japanese-games-on-mac.html'])]) {
            const html = fs.readFileSync(path.join(__dirname, '..', locale, page), 'utf8');
            assert.match(html, /src="(?:\.\.\/)?js\/common\.js(?:\?v=\d+)?"/);
            const links = [...html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>/g)].map(m => ({
                href: m[1], getAttribute() { return this.href; },
                setAttribute(name, value) { this.href = value; }, hasAttribute() { return false; }
            }));
            const download = { href: 'index.html', getAttribute() { return this.href; },
                hasAttribute() { return true; }, setAttribute() { assert.fail('download mutated'); } };
            vm.runInNewContext(code, { URL, window: { location: { href: root + locale + page + '?campaign=vl_qa_260913' } },
                document: { readyState: 'complete', currentScript: { hasAttribute: () => true },
                    querySelectorAll: () => [...links, download] } });
            for (const link of links.filter(l => /apps\.apple\.com\/(?:jp\/)?app\/(?:apple-store\/)?id6749508592/.test(l.href))) {
                assert.match(link.href, /ct=vl_qa_260913&mt=12$/);
            }
        }
    }
});


test('Demand Gen identifiers stay separate from Search through language and guide navigation', () => {
    for (const id of ['vl_dg_us_01', 'vl_dg_qa_01']) {
        const landing = root + '?campaign=' + id;
        const korean = campaignLink('ko/index.html', landing);
        const guide = campaignLink('../guide.html', korean);
        assert.equal(new URL(guide).searchParams.get('campaign'), id);
        assert.equal(campaignLink(store, guide),
            'https://apps.apple.com/app/apple-store/id6749508592?pt=128040795&ct=' + id + '&mt=12');
    }
});

test('Japanese LY Search uses one campaign through FAQ, locales and Store without forwarding click IDs', () => {
    const landing = root + 'ja/?campaign=vl_ly_jp_s01&yclid=private-test&utm_content=copy_a';
    const faq = campaignLink('faq.html', landing);
    const english = campaignLink('../index.html', faq);
    const japanese = campaignLink('ja/index.html', english);
    assert.equal(new URL(japanese).search, '?campaign=vl_ly_jp_s01');
    assert.equal(campaignLink(store, japanese),
        'https://apps.apple.com/app/apple-store/id6749508592?pt=128040795&ct=vl_ly_jp_s01&mt=12');
    assert.equal(campaignLink(store, root + 'ja/?campaign=vl_ly_jp_s01&campaign=unknown'), store);
});


test('LY Display old and new landing URLs use the same short campaign on every public CTA', () => {
    for (const id of ['vl_ly_jp_d01', 'vl_ly_jp_macfan_display_20261030']) {
        for (const locale of ['', 'ko/', 'ja/', 'zh-hans/', 'zh-hant/']) {
            for (const page of ['index.html', 'faq.html', 'privacy.html', ...(locale ? [] : ['guide.html', 'featuring.html', 'translate-japanese-games-on-mac.html'])]) {
                const current = root + locale + page + '?campaign=' + id + '&yclid=private-test';
                const html = fs.readFileSync(path.join(__dirname, '..', locale, page), 'utf8');
                for (const match of html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>/g)) {
                    const href = match[1].replace(/&amp;/g, '&');
                    if (!/^https:\/\/apps.apple.com\/(?:jp\/)?app\/(?:apple-store\/)?id6749508592/.test(href)) continue;
                    const target = new URL(campaignLink(href, current));
                    assert.equal(target.pathname.startsWith('/jp/'), locale === 'ja/');
                    assert.equal(target.search, '?pt=128040795&ct=vl_ly_jp_d01&mt=12');
                }
                for (const destination of ['../index.html', root + 'ja/', root + 'featuring.html']) {
                    const target = new URL(campaignLink(destination, current), current);
                    if (target.pathname.startsWith('/ViewLingo/')) {
                        assert.equal(target.searchParams.get('campaign'), 'vl_ly_jp_d01');
                        assert.ok(!target.search.includes('yclid'));
                    }
                }
            }
        }
    }
});

test('Display input boundaries reject duplicates, lookalikes and unregistered tokens', () => {
    for (const query of ['campaign=vl_ly_jp_d01&campaign=vl_ly_jp_d01',
        'campaign=vl_ly_jp_macfan_display_20261030&campaign=vl_ly_jp_d01',
        'campaign=vl_ly_jp_d01_extra', 'campaign=VL_LY_JP_D01', 'campaign=constructor']) {
        assert.equal(campaignLink(store, root + '?' + query), store);
    }
});


test('Japanese storefront choice is retained without changing other languages',()=>{
  const jp='https://apps.apple.com/jp/app/id6749508592?pt=128040795&ct=web&mt=12';
  for(const campaign of ['vl_ly_jp_s01','vl_ly_jp_d01']){
    assert.equal(campaignLink(jp,root+'ja/?campaign='+campaign),
      'https://apps.apple.com/jp/app/id6749508592?pt=128040795&ct='+campaign+'&mt=12');
    assert.equal(new URL(campaignLink(store,root+'?campaign='+campaign)).pathname,'/app/apple-store/id6749508592');
  }
});

test('prepared Taiwan canonical token remains bounded without a UTM tuple',()=>{
    const entry=root+'zh-hant/?campaign=vl_google_tw_s01';
    assert.equal(campaignForURL(entry),'vl_google_tw_s01');
    assert.equal(new URL(campaignLink('privacy.html',entry)).search,'?campaign=vl_google_tw_s01');
    for(const bad of ['vl_google_tw_s01_extra','VL_GOOGLE_TW_S01','unknown','']) {
        assert.equal(campaignForURL(root+'zh-hant/?campaign='+bad),'');
    }
    assert.equal(campaignForURL(entry+'&campaign=vl_google_tw_s01'),'');
});
