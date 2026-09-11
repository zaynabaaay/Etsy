const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const parent = read('visual-editor.html');
const canvas = read('visual-canvas.html');
const bootstrap = read('visual-editor-bootstrap.js');
const manifest = JSON.parse(read('visual-editor-version.json'));
const criticalFiles = [
  'visual-editor.css', 'visual-document.js', 'green-sage-visual-template.js',
  'visual-template-loader.js', 'visual-assets.js', 'visual-editor.js',
  'visual-canvas.html', 'visual-canvas.css', 'visual-canvas.js'
];

test('one valid editor version manifest is the cache update point', () => {
  assert.match(manifest.version, /^[a-z0-9._-]+$/i);
  assert.match(bootstrap, /fetch\(manifestUrl, \{ cache: 'no-store', credentials: 'same-origin' \}\)/);
  assert.match(bootstrap, /manifestUrl\.searchParams\.set\('refresh', String\(Date\.now\(\)\)\)/);
});

test('stale parent and canvas entry documents re-enter through the current versioned URL', () => {
  for (const markup of [parent, canvas]) {
    assert.match(markup, /visual-editor-bootstrap\.js\?refresh=\$\{Date\.now\(\)\}/);
  }
  assert.match(bootstrap, /entryUrl\.searchParams\.get\('v'\) !== version/);
  assert.match(bootstrap, /entryUrl\.searchParams\.set\('v', version\)/);
  assert.match(bootstrap, /window\.location\.replace\(entryUrl\.href\)/);
});

test('all critical parent dependencies receive the shared manifest version', () => {
  assert.match(parent, /data-editor-surface="parent"/);
  assert.match(parent, /<link rel="stylesheet" id="editorStylesheet">/);
  for (const file of ['visual-editor.css', 'visual-document.js', 'green-sage-visual-template.js', 'visual-template-loader.js', 'visual-assets.js', 'visual-editor.js']) {
    assert.match(bootstrap, new RegExp(`['"]${file.replace('.', '\\.')}`));
  }
  assert.match(bootstrap, /await loadStylesheet\(config\.stylesheet, version\)/);
  assert.match(bootstrap, /stylesheet\.addEventListener\('load', resolve/);
  assert.match(bootstrap, /loadScript\(script, version\)/);
});

test('the parent versions the iframe entry and the canvas versions its own dependencies', () => {
  assert.match(parent, /data-entry="visual-canvas\.html\?editor=1"/);
  assert.match(bootstrap, /frame\.src = versionedUrl\(frame\.dataset\.entry, version\)/);
  assert.match(canvas, /data-editor-surface="canvas"/);
  assert.match(canvas, /<link rel="stylesheet" id="editorStylesheet">/);
  for (const file of ['visual-canvas.css', 'visual-document.js', 'visual-canvas.js']) {
    assert.match(bootstrap, new RegExp(`['"]${file.replace('.', '\\.')}`));
  }
});

test('versioned URLs retain existing static GitHub Pages files', () => {
  criticalFiles.forEach((file) => assert.ok(fs.existsSync(path.join(root, file)), file));
  assert.doesNotMatch(parent + canvas, /\?v=2026\d+|keyboard-visibility|svg-color|shell-scroll/);
});

test('the editor has no service-worker, app-cache, or PWA precache path', () => {
  const scripts = criticalFiles.filter((file) => file.endsWith('.js')).map(read).join('\n');
  assert.doesNotMatch(parent + canvas, /manifest\.webmanifest|application-cache|service-worker/i);
  assert.doesNotMatch(scripts, /serviceWorker\.register|caches\.open|workbox/i);
});
