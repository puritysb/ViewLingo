const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const locales = { 'en-US': 'index.html', ko: 'ko/index.html', ja: 'ja/index.html', 'zh-Hans': 'zh-hans/index.html', 'zh-Hant': 'zh-hant/index.html' };
const mediaRoot = 'assets/acquisition/20261029-localized';
const manifest = JSON.parse(fs.readFileSync(`${mediaRoot}/manifest.json`, 'utf8'));

test('each homepage uses its own hero, showreel, use-case video and settings language', () => {
    for (const [locale, file] of Object.entries(locales)) {
        const html = fs.readFileSync(file, 'utf8');
        assert.match(html, new RegExp(`data-video="[^\"]*20261027/${locale}/demo.mp4"`), file);
        const sources = [...html.matchAll(/<source src="([^\"]+)"/g)].map(match => match[1].split('?')[0]);
        assert.equal(sources.length, 2, file);
        for (const name of ['showreel.mp4', 'use-cases.mp4']) {
            assert(sources.some(src => src.endsWith(`${mediaRoot}/${locale}/${name}`)), `${file}: ${name}`);
        }
        for (const name of ['poster.jpg', 'use-cases-poster.jpg', 'settings.jpg']) {
            assert(html.includes(`${mediaRoot}/${locale}/${name}`), `${file}: ${name}`);
        }
        assert(!html.includes('20261028-v3/'), `${file}: obsolete Korean comparison is no longer the default localized demo`);
        for (const match of html.matchAll(/(?:src|poster)="([^\"]+)"/g)) {
            const url = match[1].split('?')[0];
            if (!url.startsWith('http') && !url.startsWith('data:')) {
                assert(fs.existsSync(path.resolve(path.dirname(file), url)), `${file}: missing ${url}`);
            }
        }
    }
});

test('published localized showreels and settings match their reviewed manifest', () => {
    assert.deepEqual(manifest.map(row => row.locale).sort(), Object.keys(locales).sort());
    for (const row of manifest) {
        const digest = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
        assert.equal(digest(row.showreel), row.sha256, row.locale);
        assert.equal(digest(row.settings), row.settingsSHA256, row.locale);
        assert.equal(digest(`${mediaRoot}/${row.locale}/poster.jpg`), row.posterSHA256, row.locale);
        assert.equal(row.fullDecodePassed, true);
        assert.equal(row.brandName, 'ViewLingo');
        assert.equal(row.editorialBrandLabel, 'ViewLingo 3.0');
        assert.equal(row.width, 1920);
        assert.equal(row.height, 1080);
        assert(row.duration >= 26.9 && row.duration < 28, row.locale);
        assert.deepEqual(row.segments[1].sourceRange, row.locale === 'ja' ? [2.5, 10] : [0.3, 7.8]);
        assert(row.segments.at(-1).scope.includes(row.locale));
    }
});

test('all localized homepages load the shared media viewer and updated interactive demo', () => {
    for (const file of Object.values(locales)) {
        const html = fs.readFileSync(file, 'utf8');
        for (const asset of ['js/media.js', 'js/common.js', 'css/common.css', 'css/acquisition.css', 'assets/demo-interactive.js', 'assets/demo-interactive.css']) {
            const revision = asset === 'css/acquisition.css' ? '2026102903' : asset === 'js/common.js' ? '2026103001' : '2026102902';
            assert(html.includes(`${asset}?v=${revision}`), `${file}: ${asset}`);
        }
    }
});

test('changed baked-brand media bypasses the previous published browser cache', () => {
    for (const [locale, file] of Object.entries(locales)) {
        const html = fs.readFileSync(file, 'utf8');
        for (const name of ['showreel.mp4', 'settings.jpg']) {
            assert(html.includes(`${mediaRoot}/${locale}/${name}?v=2026102903`), `${file}: ${name}`);
        }
    }
});

test('restored use-case montages match reviewed files and exclude obsolete privacy endings', () => {
    const montage = JSON.parse(fs.readFileSync(`${mediaRoot}/use-cases-manifest.json`, 'utf8'));
    assert.deepEqual(montage.assets.map(row => row.locale).sort(), Object.keys(locales).sort());
    for (const row of montage.assets) {
        assert.equal(row.file, `${mediaRoot}/${row.locale}/use-cases.mp4`);
        const bytes = fs.readFileSync(row.file);
        assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), row.sha256, row.locale);
        assert.equal(bytes.length, row.bytes, row.locale);
        assert.equal(row.old_privacy_and_brand_ending_excluded, true, row.locale);
        assert(row.selected_end_seconds >= 15, row.locale);
        assert.equal(row.source_duration_seconds - row.selected_end_seconds, 4.75, row.locale);
        assert(row.preserved_source_video_packets > 0, row.locale);
    }
});
