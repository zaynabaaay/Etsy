const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const editorHtml = read('visual-editor.html');
const editor = read('visual-editor.js');
const previewHtml = read('visual-preview.html');
const canvas = read('visual-canvas.js');
const canvasCss = read('visual-canvas.css');
const bootstrap = read('visual-editor-bootstrap.js');

test('visual editor exposes a distinct Preview action in its application chrome', () => {
  assert.match(editorHtml, /class="storiel-global-actions"[\s\S]*id="recipientPreviewButton"[^>]*href="visual-preview\.html"[^>]*target="_blank"[^>]*>Preview<\/a>/);
  assert.match(editor, /ui\.recipientPreview\.addEventListener\('click', openRecipientPreview\)/);
  assert.doesNotMatch(editorHtml, /recipientPreviewButton[^>]*aria-disabled/);
});

test('Preview reuses the visual canvas renderer and never loads legacy invitation files', () => {
  assert.match(previewHtml, /data-editor-surface="preview"/);
  assert.match(previewHtml, /id="canvasRoot"/);
  assert.match(bootstrap, /preview:\s*\{[\s\S]*'visual-document\.js'[\s\S]*'green-sage-visual-template\.js'[\s\S]*'visual-template-loader\.js'[\s\S]*'visual-assets\.js'[\s\S]*'visual-canvas\.js'/);
  assert.doesNotMatch(previewHtml + bootstrap + canvas, /invitation\.html|invitation\.js/);
});

test('Preview flushes the latest in-memory editor state synchronously before opening', () => {
  const opener = editor.slice(editor.indexOf('const openRecipientPreview'), editor.indexOf('const transactionValue'));
  assert.match(opener, /finishTransaction\(false\)/);
  assert.match(opener, /flushPendingSave\(true\)/);
  assert.match(opener, /if \(!flushPendingSave\(true\)\) event\.preventDefault\(\)/);
  assert.match(editor, /templateLoader\.save\(activeTemplate\.templateId, committedState\)/);
  assert.match(canvas, /previewAuthoredState = loader\.load\(template\.templateId\)/);
});

test('Preview renders the persisted current document in exact section order', () => {
  const context = { console };
  context.globalThis = context;
  vm.runInNewContext(read('visual-document.js'), context);
  vm.runInNewContext(read('green-sage-visual-template.js'), context);
  const state = context.GreenSageVisualDocument.normalize(context.GreenSageVisualTemplate.cloneDefault());
  assert.deepEqual(JSON.parse(JSON.stringify(state.document.sectionOrder)), ['opening', 'ceremony', 'the-day', 'details', 'our-story', 'rsvp']);
  assert.match(canvas, /state\.document\.sectionOrder\.map\(\(id\) => createSection\(state\.sections\[id\]\)\)/);
});

test('Preview resolves Mobile, iPad, and Desktop from its viewport with shared document overrides', () => {
  assert.match(canvas, /responsiveViewForWidth = \(width\) => width >= 1101 \? 'desktop' : width >= 760 \? 'ipad' : 'mobile'/);
  assert.match(canvas, /model\.resolveDocument\(previewAuthoredState, activeResponsiveView\)/);
  assert.match(canvas, /window\.addEventListener\('resize', previewMode \? renderPreviewViewport : render\)/);
});

test('Preview has no editor chrome or interaction affordances and scrolls as a normal page', () => {
  assert.doesNotMatch(previewHtml, /storiel-nav|storiel-panel|storiel-context-bar|preview-frame|visualCanvas/);
  assert.match(canvas, /if \(!previewMode\) document\.body\.append\(quickActions\)/);
  assert.match(canvas, /if \(!previewMode\) document\.body\.append\(recoveryHandles\)/);
  assert.match(canvasCss, /data-editor-surface="preview"[\s\S]*overflow-y: auto/);
  assert.match(canvasCss, /data-editor-surface="preview"[\s\S]*\.canvas-page[\s\S]*padding: 0/);
  assert.match(canvasCss, /data-editor-surface="preview"[\s\S]*\.element-frame[\s\S]*pointer-events: none/);
});

test('Preview restores uploaded assets while normal editor transactions remain intact', () => {
  assert.match(canvas, /await previewAssets\.list\(\)/);
  assert.match(canvas, /previewAssets\.getRecordBlob\(record\)/);
  assert.match(canvas, /URL\.createObjectURL/);
  assert.match(editor, /green-sage-visual:transaction-start/);
  assert.match(editor, /green-sage-visual:transaction-patch/);
  assert.match(editor, /green-sage-visual:transaction-commit/);
});
