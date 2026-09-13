const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { campaignLink } = require('../js/common.js');
const root = 'https://puritysb.github.io/ViewLingo/';
const store = 'https://apps.apple.com/app/apple-store/id6749508592?pt=128040795&ct=web&mt=12';
const qa = root + '?campaign=vl_qa_260913&utm_source=google&gclid=private-test';

test('store link forwards only registered campaign and fixed provider, never click identifiers', () => {
    assert.equal(campaignLink(store, qa),
        'https://apps.apple.com/app/apple-store/id6749508592?pt=128040795&ct=vl_qa_260913&mt=8');
    assert.match(campaignLink(store, root + '?campaign=vl_google_us_l01'), /ct=vl_google_us_l01&mt=8$/);
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

test('page initialization rewrites actual HTML anchors and skips downloads', () => {
    const code = fs.readFileSync(path.join(__dirname, '../js/common.js'), 'utf8');
    for (const locale of ['', 'ko/', 'ja/', 'zh-hans/', 'zh-hant/']) {
        for (const page of ['index.html', 'faq.html', 'privacy.html', ...(locale ? [] : ['guide.html'])]) {
            const html = fs.readFileSync(path.join(__dirname, '..', locale, page), 'utf8');
            assert.match(html, /src="(?:\.\.\/)?js\/common\.js"/);
            const links = [...html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>/g)].map(m => ({
                href: m[1], getAttribute() { return this.href; },
                setAttribute(name, value) { this.href = value; }, hasAttribute() { return false; }
            }));
            const download = { href: 'index.html', getAttribute() { return this.href; },
                hasAttribute() { return true; }, setAttribute() { assert.fail('download mutated'); } };
            vm.runInNewContext(code, { URL, window: { location: { href: root + locale + page + '?campaign=vl_qa_260913' } },
                document: { readyState: 'complete', currentScript: { hasAttribute: () => true },
                    querySelectorAll: () => [...links, download] } });
            for (const link of links.filter(l => l.href.includes('apps.apple.com/app/apple-store/id6749508592'))) {
                assert.match(link.href, /ct=vl_qa_260913&mt=8$/);
            }
        }
    }
});
