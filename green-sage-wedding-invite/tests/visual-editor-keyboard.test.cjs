const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const canvas = read('visual-canvas.js');
const editor = read('visual-editor.js');
const template = read('green-sage-visual-template.js');
const helperStart = canvas.indexOf('  const minimumVisibilityScroll =');
const helperEnd = canvas.indexOf('  const keepEditingElementVisible =', helperStart);
assert.notEqual(helperStart, -1);
assert.notEqual(helperEnd, -1);

const context = {};
context.globalThis = context;
vm.runInNewContext(`${canvas.slice(helperStart, helperEnd)}\n  globalThis.minimumVisibilityScroll = minimumVisibilityScroll;`, context);
const scrollFor = (top, bottom, viewport = { top: 0, bottom: 400 }) => context.minimumVisibilityScroll({ top, bottom }, viewport, 16);

test('reduced visual viewport reveals only the obscured portion plus breathing room', () => {
  assert.equal(scrollFor(360, 430), 46);
  assert.equal(scrollFor(-20, 40), -36);
});

test('already-visible editing targets do not move the canvas', () => {
  assert.equal(scrollFor(40, 120), 0);
  assert.equal(scrollFor(16, 384), 0);
});

test('partially offscreen and later-section bounds use viewport coordinates', () => {
  assert.equal(scrollFor(385, 445), 61);
  assert.equal(scrollFor(760, 820, { top: 120, bottom: 520 }), 316);
});

test('top-level visual viewport height and offset are translated into iframe coordinates', () => {
  assert.match(editor, /const viewportTop = viewport\?\.offsetTop \|\| 0/);
  assert.match(editor, /viewportTop \+ \(viewport\?\.height \|\| window\.innerHeight\)/);
  assert.match(editor, /Math\.max\(frame\.top, viewportTop\)/);
  assert.match(editor, /Math\.min\(frame\.bottom, viewportBottom\)/);
  assert.match(editor, /ui\.canvas\.clientHeight \/ frame\.height/);
});

test('editing start, target switching, and viewport changes all request a fresh visibility check', () => {
  assert.match(canvas, /placeCaret\(content, event\.clientX, event\.clientY\); reportTextEditing\(true\)/);
  assert.match(canvas, /const enterEdit = .*exitEdit\(\)/s);
  assert.match(editor, /message\.type === 'green-sage-visual:text-editing'.*requestAnimationFrame\(syncEditingViewport\)/);
  assert.match(editor, /visualViewport\?\.addEventListener\('resize', syncEditingViewport\)/);
  assert.match(editor, /visualViewport\?\.addEventListener\('scroll', syncEditingViewport\)/);
});

test('editing end stops viewport work and preserves authored geometry', () => {
  assert.match(canvas, /reportTextEditing\(false\)/);
  assert.match(editor, /if \(!canvasReady \|\| !canvasTextEditing\) return/);
  assert.doesNotMatch(canvas.slice(helperStart, canvas.indexOf('const syncEditableContent')), /sendPatch|applyFrame|frame\.style/);
  assert.doesNotMatch(editor.slice(editor.indexOf('const syncEditingViewport'), editor.indexOf('const finishTransaction')), /writeAuthoredProperty|commit\(|routeTransactionProperty/);
  assert.match(template, /schemaVersion:\s*4/);
});

test('caret, text mutation, history, and overflow paths remain intact', () => {
  assert.match(canvas, /content\.focus\(\{ preventScroll: true \}\)/);
  assert.match(canvas, /sendStart\('element', item\.id, 'Edit text'\)/);
  assert.match(canvas, /sendPatch\(\{ content: current\.content \}\)/);
  assert.match(canvas, /updateOverflow\(latest\)/);
  assert.match(canvas, /if \(transaction\?\.label === 'Edit text'\) sendCommit\(\)/);
});
