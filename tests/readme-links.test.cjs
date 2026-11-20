const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const docs = fs.readdirSync(path.join(root, 'docs'))
  .filter(name => /^README-.+\.md$/.test(name))
  .map(name => 'docs/' + name);
const english = fs.readFileSync(path.join(root, 'README.md'), 'utf8');

test('language navigation reaches all translated READMEs in both directions', () => {
  assert.ok(docs.length > 0);
  for (const name of docs) {
    assert.ok(english.includes('](' + name + ')'), name);
    const translated = fs.readFileSync(path.join(root, name), 'utf8');
    assert.ok(translated.includes('](../README.md)'), name);
  }
  for (const match of english.matchAll(/\]\((docs\/README-[^)]+\.md)\)/g)) {
    assert.ok(docs.includes(match[1]), match[1]);
  }
});

for (const name of ['README.md', ...docs]) {
  test(name + ' points users to the Store, support and version history', () => {
    const text = fs.readFileSync(path.join(root, name), 'utf8');
    const urls = Array.from(text.matchAll(/(?:\]\(|href=")([^)"\s]+)/g), match => match[1]);
    assert.ok(urls.some(url => /^https:\/\/apps\.apple\.com\/[^?#]*\/id6749508592(?:[?#]|$)/.test(url)), 'Mac App Store');
    assert.ok(urls.includes('https://puritysb.github.io/ViewLingo/CHANGELOG.html'), 'version history');
    assert.ok(urls.some(url => /^(?:.*\/)?SUPPORT(?:-ko)?\.md$/.test(url) ||
      /^https:\/\/github\.com\/puritysb\/ViewLingo\/(?:issues|discussions)(?:[/?#]|$)/.test(url)), 'support');
    assert.ok(!urls.some(url => /^https:\/\/github\.com\/puritysb\/ViewLingo\/(?:releases|tags)(?:[/?#]|$)/i.test(url)), 'retired release links');
  });
}
