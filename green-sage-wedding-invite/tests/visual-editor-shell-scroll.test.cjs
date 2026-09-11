const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('visual-editor.html');
const styles = read('visual-editor.css');
const canvasStyles = read('visual-canvas.css');

test('the parent document is locked to the viewport instead of remaining a movable root surface', () => {
  assert.match(styles, /html, body \{[^}]*height:100%[^}]*overflow:hidden[^}]*overscroll-behavior:none/);
  assert.match(styles, /body \{[^}]*position:fixed[^}]*inset:0/);
  assert.match(styles, /\.storiel-editor \{[^}]*position:fixed[^}]*inset:0[^}]*height:100dvh[^}]*overflow:hidden/);
});

test('header, navigation rail, side panel, and workspace remain in one viewport-contained grid', () => {
  assert.match(html, /<main class="storiel-editor"[^>]*>[\s\S]*<header class="storiel-global-bar"/);
  assert.match(html, /<nav class="storiel-nav"/);
  assert.match(html, /<aside class="storiel-panel"/);
  assert.match(html, /<section class="storiel-workspace"/);
  assert.match(styles, /\.storiel-editor \{[^}]*grid-template:[^}]*minmax\(0,1fr\)/);
});

test('the white side panel retains independent contained vertical scrolling', () => {
  assert.match(styles, /\.storiel-panel \{[^}]*min-height:0[^}]*overflow-y:auto[^}]*overscroll-behavior:contain[^}]*-webkit-overflow-scrolling:touch/);
});

test('the workspace shell stays contained while the canvas iframe remains available', () => {
  assert.match(styles, /\.storiel-workspace \{[^}]*min-height:0[^}]*overflow:hidden[^}]*overscroll-behavior:none[^}]*touch-action:none/);
  assert.match(styles, /\.preview-frame iframe \{[^}]*width:100%[^}]*height:100%/);
  assert.match(html, /<iframe id="visualCanvas"[^>]*data-entry="visual-canvas\.html\?editor=1"/);
});

test('invitation navigation remains owned by the canvas document, not the parent shell', () => {
  assert.match(canvasStyles, /html \{[^}]*overflow-y: auto[^}]*overscroll-behavior-y: none/);
  assert.match(canvasStyles, /\.canvas-page \{[^}]*touch-action: pan-y/);
  assert.match(canvasStyles, /\.section-canvas \{[^}]*touch-action: pan-y/);
});
