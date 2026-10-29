const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('js/media.js', 'utf8');

function harness(lang = 'ko', supported = true) {
    function node(tag) {
        const result = {
            tagName: tag.toUpperCase(), children: [], attributes: {}, listeners: {}, style: {}, isConnected: true,
            classList: { add() {} },
            append(...children) { this.children.push(...children); },
            appendChild(child) { this.children.push(child); },
            setAttribute(k, v) { this.attributes[k] = v; },
            getAttribute(k) { return this.attributes[k]; },
            hasAttribute(k) { return k in this.attributes; },
            removeAttribute(k) { delete this.attributes[k]; },
            addEventListener(k, fn) { this.listeners[k] = fn; },
            focus() { document.activeElement = this; },
            getBoundingClientRect() { return { left: 20, top: 20, right: 800, bottom: 600 }; }
        };
        if (tag === 'dialog') {
            result.showModal = function () { this.open = true; };
            result.close = function () { this.open = false; this.listeners.close(); };
        }
        return result;
    }
    const thumbnail = node('img'); thumbnail.alt = 'Settings screenshot';
    const link = node('a'); link.href = 'https://example.com/settings.jpg?v=2';
    link.attributes.href = link.href;
    link.querySelector = () => thumbnail;
    link.closest = () => ({ querySelector: () => ({ textContent: 'Actual settings' }) });
    const videos = [node('video'), node('video')];
    videos.forEach(v => { v.paused = false; v.pause = () => { v.paused = true; }; });
    const document = {
        documentElement: { lang }, readyState: 'complete', body: node('body'), listeners: {},
        querySelectorAll: s => s === 'video' ? videos : [link], createElement: node,
        addEventListener(k, fn) { this.listeners[k] = fn; },
        dispatchEvent(event) { if (this.listeners[event.type]) this.listeners[event.type](event); }
    };
    document.body.style.overflow = 'scroll';
    vm.runInNewContext(source, { document, Event, HTMLDialogElement: supported ? function () {} : undefined });
    const viewer = document.body.children[0];
    const event = overrides => ({ button: 0, preventDefault() { this.prevented = true; }, ...overrides });
    return { document, link, videos, viewer, event, open() { const e = event(); link.listeners.click(e); return e; } };
}

test('image preview keeps navigation in place, pauses videos and restores focus and scroll', () => {
    const h = harness();
    assert.equal(h.link.attributes['aria-haspopup'], 'dialog');
    assert.equal(h.open().prevented, true);
    assert.equal(h.viewer.open, true);
    assert.equal(h.document.body.style.overflow, 'hidden');
    assert.ok(h.videos.every(v => v.paused));
    const close = h.viewer.children[0].children[1];
    assert.equal(h.document.activeElement, close);
    assert.equal(close.attributes['aria-label'], '닫기');
    assert.equal(h.viewer.children[1].src, h.link.href);
    close.listeners.click();
    assert.equal(h.viewer.open, false);
    assert.equal(h.document.body.style.overflow, 'scroll');
    assert.equal(h.document.activeElement, h.link);
});

test('new-tab gestures and unsupported dialog browsers keep ordinary image links', () => {
    const h = harness();
    for (const override of [{ metaKey: true }, { ctrlKey: true }, { button: 1 }, { shiftKey: true }]) {
        const e = h.event(override); h.link.listeners.click(e);
        assert.equal(e.prevented, undefined); assert.equal(h.viewer.open, undefined);
    }
    const fallback = harness('en', false);
    assert.equal(fallback.viewer, undefined);
    assert.equal(fallback.link.listeners.click, undefined);
});

test('only a complete backdrop gesture closes; image drags and inner padding do not', () => {
    const h = harness(); h.open();
    const outside = { target: h.viewer, clientX: 5, clientY: 5 };
    const inside = { target: h.viewer, clientX: 50, clientY: 50 };
    h.viewer.listeners.pointerdown(inside); h.viewer.listeners.click(outside);
    assert.equal(h.viewer.open, true);
    h.viewer.listeners.pointerdown(outside); h.viewer.listeners.click(inside);
    assert.equal(h.viewer.open, true);
    h.viewer.listeners.pointerdown(outside); h.viewer.listeners.click(outside);
    assert.equal(h.viewer.open, false);
});

test('late-created hero video play pauses earlier players without pausing itself', () => {
    const h = harness();
    h.document.listeners.play({ target: h.videos[1] });
    assert.equal(h.videos[0].paused, true);
    assert.equal(h.videos[1].paused, false);
});

test('viewer labels match all five site languages', () => {
    for (const [lang, close] of Object.entries({ en: 'Close', ko: '닫기', ja: '閉じる', 'zh-Hans': '关闭', 'zh-Hant': '關閉' })) {
        const h = harness(lang);
        assert.equal(h.viewer.children[0].children[1].attributes['aria-label'], close);
    }
});


test('opening an image closes the mobile drawer before saving its scroll state', () => {
    const h = harness();
    h.document.body.style.overflow = 'hidden';
    h.document.addEventListener('viewlingo:before-image-preview', () => { h.document.body.style.overflow = ''; });
    h.open();
    assert.equal(h.document.body.style.overflow, 'hidden');
    h.viewer.close();
    assert.equal(h.document.body.style.overflow, '');
});
