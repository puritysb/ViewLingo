const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function harness(locale = 'en') {
    class Element {
        constructor(tag) {
            this.tag = tag; this.children = []; this.attributes = {}; this.style = {};
            this.listeners = {}; this.className = ''; this.textContent = ''; this.clientWidth = 800;
            this.classList = {
                add: value => { this.className = [...new Set([...this.className.split(' '), value])].join(' ').trim(); },
                remove: value => { this.className = this.className.split(' ').filter(c => c !== value).join(' '); },
                contains: value => this.className.split(' ').includes(value)
            };
        }
        setAttribute(key, value) { this.attributes[key] = value; }
        getAttribute(key) { return this.attributes[key] || null; }
        appendChild(child) { this.children.push(child); child.parent = this; return child; }
        addEventListener(event, callback) { this.listeners[event] = callback; }
        remove() { this.parent.children = this.parent.children.filter(child => child !== this); }
        querySelectorAll(selector) {
            return this.children.flatMap(child => [
                ...(child.classList.contains(selector.slice(1)) ? [child] : []),
                ...child.querySelectorAll(selector)
            ]);
        }
        getBoundingClientRect() {
            if (this.classList.contains('vl-demo__content')) return { left: 20, top: 50, right: 780, bottom: 450 };
            if (this.classList.contains('vl-seg')) {
                const top = 70 + Number(this.attributes['data-i']) * 50;
                return { left: 30, top, right: 770, bottom: top + 40 };
            }
            return { left: 0, top: 0, right: 800, bottom: 500, width: 800, height: 500 };
        }
        get offsetLeft() { return parseFloat(this.style.left) || 0; }
        get offsetTop() { return parseFloat(this.style.top) || 0; }
        get offsetWidth() { return parseFloat(this.style.width) || 0; }
        get offsetHeight() { return parseFloat(this.style.height) || 0; }
    }
    const root = new Element('div'); root.attributes['data-locale'] = locale;
    const timers = new Map(), events = {}; let nextTimer = 0;
    const document = { readyState: 'complete', querySelectorAll: () => [root], createElement: tag => new Element(tag) };
    vm.runInNewContext(fs.readFileSync('assets/demo-interactive.js', 'utf8'), {
        document, location: { pathname: '/' }, window: { addEventListener: (key, callback) => { events[key] = callback; } },
        getComputedStyle: () => ({ fontSize: '16px' }),
        setTimeout: callback => { timers.set(++nextTimer, callback); return nextTimer; },
        clearTimeout: id => timers.delete(id)
    });
    const find = className => root.querySelectorAll('.' + className)[0];
    return { root, timers, events, find,
        example: () => find('vl-demo__example').listeners.click(),
        reset: () => find('vl-demo__reset').listeners.click(),
        finish: () => { for (const callback of timers.values()) callback(); timers.clear(); } };
}

test('all five locales offer a native-button path to the example translation', () => {
    const labels = { en: 'Show example translation', ko: '예시 번역 보기', ja: '翻訳の例を見る',
        'zh-hans': '查看示例翻译', 'zh-hant': '查看範例翻譯' };
    for (const [locale, label] of Object.entries(labels)) {
        const h = harness(locale), button = h.find('vl-demo__example');
        assert.equal(button.tag, 'button'); assert.equal(button.type, 'button'); assert.equal(button.textContent, label);
        h.example(); assert.equal(h.timers.size, 6); h.finish();
        const overlays = h.root.querySelectorAll('.vl-overlay');
        assert.equal(overlays.length, 6);
        assert.ok(overlays.every(node => node.textContent.length > 0 && node.attributes.lang === locale));
        assert.equal(h.find('vl-demo__content').attributes.lang, locale === 'ja' ? 'ko' : 'ja');
    }
});

test('Reset removes the selected frame and cancels pending translation reveals', () => {
    const h = harness(); h.example(); h.reset();
    assert.equal(h.find('vl-demo__rect').style.display, 'none');
    assert.equal(h.find('vl-demo__rect').classList.contains('vl-demo__rect--locked'), false);
    assert.equal(h.root.classList.contains('vl-demo--used'), false);
    assert.equal(h.timers.size, 0); h.finish();
    assert.equal(h.root.querySelectorAll('.vl-overlay').length, 0);
    h.example(); h.finish(); assert.equal(h.root.querySelectorAll('.vl-overlay').length, 6);
});

test('width changes clear stale overlay geometry, while height-only resize preserves it', () => {
    const h = harness(); h.example(); h.finish(); h.events.resize();
    assert.equal(h.root.querySelectorAll('.vl-overlay').length, 6);
    h.find('vl-demo__screen').clientWidth = 390; h.events.resize();
    assert.equal(h.root.querySelectorAll('.vl-overlay').length, 0);
    assert.equal(h.find('vl-demo__rect').style.display, 'none');
});

test('cancelled touch and interrupted drag leave no active selection', () => {
    const h = harness(), screen = h.find('vl-demo__screen');
    screen.listeners.touchstart({ touches: [{ clientX: 10, clientY: 20 }] });
    screen.listeners.touchcancel();
    assert.equal(h.find('vl-demo__rect').style.display, 'none');
    screen.listeners.mousedown({ button: 0, clientX: 10, clientY: 20 });
    h.events.blur(); h.events.mousemove({ clientX: 100, clientY: 120 }); h.events.mouseup();
    assert.equal(h.find('vl-demo__rect').style.display, 'none'); assert.equal(h.timers.size, 0);
});

test('FAQ answers use native disclosures in every language, without a click-only script', () => {
    for (const [path, count] of [['faq.html', 21], ['ko/faq.html', 19], ['ja/faq.html', 18],
        ['zh-hans/faq.html', 18], ['zh-hant/faq.html', 18]]) {
        const html = fs.readFileSync(path, 'utf8');
        assert.equal((html.match(/<details class="faq-item">/g) || []).length, count, path);
        assert.equal((html.match(/<summary class="faq-question">/g) || []).length, count, path);
        assert.equal((html.match(/<\/details>/g) || []).length, count, path);
        assert.equal((html.match(/<div class="faq-answer">/g) || []).length, count, path);
        assert.doesNotMatch(html, /<div class="faq-question"|answer\.style\.display/);
    }
});
