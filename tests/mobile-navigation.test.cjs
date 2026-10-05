const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('js/common.js', 'utf8');

function harness() {
    function node() {
        const classes = new Set();
        return {
            attributes: {}, listeners: {},
            classList: {
                contains: c => classes.has(c),
                remove: c => classes.delete(c),
                toggle(c) { if (classes.has(c)) { classes.delete(c); return false; } classes.add(c); return true; }
            },
            setAttribute(k, v) { this.attributes[k] = v; },
            addEventListener(k, fn) { this.listeners[k] = fn; },
            focus() { this.focused = true; }
        };
    }
    const links = node();
    const button = node();
    const nav = { insertBefore() {}, contains: target => target === button || target === links };
    const docEvents = {}, winEvents = {};
    const document = {
        currentScript: { hasAttribute: () => false }, readyState: 'complete',
        body: { style: { overflow: '' } },
        querySelectorAll: () => [], getElementById: () => null,
        querySelector: selector => selector === 'header nav' ? nav : selector === '.nav-links' ? links : null,
        createElement: () => button,
        addEventListener: (event, fn) => { docEvents[event] = fn; }
    };
    const window = { innerWidth: 390, matchMedia: () => ({ matches: true }),
        addEventListener: (event, fn) => { winEvents[event] = fn; } };
    vm.runInNewContext(source, { URL, document, window });
    return { links, button, document, window, docEvents, winEvents,
        toggle: () => button.listeners.click({ stopPropagation() {} }) };
}

test('mobile navigation opens and Escape restores scroll and focus', () => {
    const h = harness(); h.toggle();
    assert.equal(h.button.attributes['aria-expanded'], 'true');
    assert.equal(h.document.body.style.overflow, 'hidden');
    h.docEvents.keydown({ key: 'Escape' });
    assert.equal(h.links.classList.contains('active'), false);
    assert.equal(h.button.attributes['aria-expanded'], 'false');
    assert.equal(h.document.body.style.overflow, '');
    assert.equal(h.button.focused, true);
});

test('navigation links and outside clicks dismiss the mobile drawer', () => {
    const h = harness(); h.toggle();
    h.links.listeners.click({ target: { tagName: 'A' } });
    assert.equal(h.document.body.style.overflow, '');
    h.toggle(); h.docEvents.click({ target: {} });
    assert.equal(h.links.classList.contains('active'), false);
});

test('resizing an open mobile drawer to desktop restores document scrolling', () => {
    const h = harness(); h.toggle();
    h.window.innerWidth = 1440; h.winEvents.resize();
    assert.equal(h.document.body.style.overflow, '');
    assert.equal(h.button.attributes['aria-expanded'], 'false');
    assert.equal(h.links.classList.contains('active'), false);
});
