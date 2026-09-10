const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('visual-editor.html');
const editor = read('visual-editor.js');
const canvas = read('visual-canvas.js');
const canvasStyles = read('visual-canvas.css');
const context = { console, crypto: { randomUUID: () => 'test-id' }, setTimeout, clearTimeout };
context.globalThis = context;
['visual-document.js', 'green-sage-visual-template.js', 'visual-template-loader.js'].forEach((file) => vm.runInNewContext(read(file), context));
const model = context.GreenSageVisualDocument;
const template = context.GreenSageVisualTemplate;
const loader = context.StorielVisualTemplateLoader;
const plain = (value) => JSON.parse(JSON.stringify(value));
const between = (value, start, end) => {
  const from = value.indexOf(start); const to = value.indexOf(end, from + start.length);
  assert.notEqual(from, -1, `Missing start marker: ${start}`);
  assert.notEqual(to, -1, `Missing end marker: ${end}`);
  return value.slice(from, to);
};
const storage = () => {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)) };
};

test('exposed image background selects the existing section background target', () => {
  const sectionRenderer = between(canvas, 'const createSection = (section) => {', 'const render = async');
  assert.match(sectionRenderer, /section\.background\.kind === 'image' \? 'green-sage-visual:select-background' : 'green-sage-visual:select-section'/);
  assert.match(editor, /message\.type === 'green-sage-visual:select-background'.*selectBackground\(message\.sectionId, true\)/);
  const selection = between(editor, 'const selectBackground = (sectionId, sync = true) => {', 'const applyBackgroundAsset');
  assert.match(selection, /current\?\.background\.kind !== 'image'/);
  assert.match(selection, /selectedElementId = null/);
  assert.match(selection, /backgroundEditSectionId = sectionId/);
});

test('foreground elements retain pointer priority while a background is selected', () => {
  const sectionRenderer = between(canvas, 'const createSection = (section) => {', 'const render = async');
  assert.ok(sectionRenderer.indexOf('canvas.append(background)') < sectionRenderer.indexOf('canvas.append(node)'));
  assert.match(canvas, /green-sage-visual:select-element/);
  assert.doesNotMatch(canvasStyles, /is-background-editing\s*>\s*\.element-frame\s*\{[^}]*pointer-events:\s*none/);
  assert.match(editor, /const selectElement = .*backgroundEditSectionId = null/);
});

test('selected background drag reuses the focal transaction and touch-safe gesture path', () => {
  const drag = between(canvas, 'const startBackgroundReframe =', 'const placeCaret');
  assert.match(drag, /sendStart\('section', section\.id, 'Reframe background'\)/);
  assert.match(drag, /section\.background\.focalX = focalX; section\.background\.focalY = focalY/);
  assert.match(drag, /sendPatch\(\{ background: \{ focalX, focalY \} \}\)/);
  assert.match(drag, /trackGesture\(event, background, move\)/);
  assert.match(canvasStyles, /\.section-background\.is-editing\s*\{[^}]*touch-action:\s*none/);
});

test('background zoom uses the existing responsive section mutation path', () => {
  assert.match(html, /id="backgroundZoom"[^>]*min="1" max="4" step="0\.05"[^>]*aria-label="Background zoom"/);
  assert.match(editor, /bindTransactionalInput\(ui\.backgroundZoom, 'Adjust background crop'.*path: 'background\.zoom'.*scope: 'responsive'/);
  assert.match(editor, /\['focalX', 'focalY', 'zoom'\].*routeTransactionProperty\(next, `background\.\$\{key\}`/);
});

test('Fit and Fill reuse cover/contain and remain sparse per responsive view', () => {
  const state = model.normalize(template.cloneDefault());
  assert.equal(state.sections.opening.background.fit, undefined);
  assert.equal(model.writeAuthoredProperty(state, { targetType: 'section', targetId: 'opening', path: 'background.fit', value: 'contain', scope: 'responsive', responsiveView: 'ipad' }), true);
  const normalized = model.normalize(state);
  assert.equal(normalized.sections.opening.background.fit, undefined);
  assert.deepEqual(plain(normalized.sections.opening.responsive.overrides.ipad.background), { fit: 'contain' });
  assert.equal(model.resolveSection(normalized.sections.opening, 'mobile').background.fit, undefined);
  assert.equal(model.resolveSection(normalized.sections.opening, 'ipad').background.fit, 'contain');
  assert.equal(model.resolveSection(normalized.sections.opening, 'desktop').background.fit, undefined);
  assert.match(canvas, /objectFit: section\.background\.fit === 'contain' \? 'contain' : 'cover'/);
  assert.match(editor, /ui\.backgroundFit\.textContent = background\.fit === 'contain' \? 'Fill' : 'Fit'/);
});

test('Replace opens the existing Media library and preserves section background identity', () => {
  assert.match(html, /id="replaceBackgroundButton"[^>]*>Replace<\/button>/);
  assert.match(editor, /ui\.replaceBackground\.addEventListener\('click', \(\) => setPanel\('media'\)\)/);
  const replacement = between(editor, 'const applyBackgroundAsset = (assetId, assetKind) => {', 'const setSectionHeightPreset');
  assert.match(replacement, /next\.sections\[selectedSectionId\]\.background/);
  assert.match(replacement, /kind: 'image', assetId, assetKind, fit: 'cover'/);
  assert.doesNotMatch(replacement, /elementOrder|createImageElement|addImage/);
});

test('background selection intentionally does not introduce a second lock model', () => {
  const contextMarkup = between(html, 'id="backgroundEditContext"', 'id="morePopover"');
  assert.doesNotMatch(contextMarkup, /Lock|Unlock|backgroundLock/);
  const selection = between(editor, 'const selectBackground = (sectionId, sync = true) => {', 'const applyBackgroundAsset');
  assert.doesNotMatch(selection, /permissions|locked/);
  assert.match(editor, /next\.elements\[source\.id\]\.permissions\.locked/);
});

test('focal, zoom, and fit route independently to Mobile, iPad, and Desktop', () => {
  const source = model.normalize(template.cloneDefault());
  assert.equal(model.writeAuthoredProperty(source, { targetType: 'section', targetId: 'opening', path: 'background.focalX', value: 44, scope: 'responsive', responsiveView: 'mobile' }), true);
  assert.equal(model.writeAuthoredProperty(source, { targetType: 'section', targetId: 'opening', path: 'background.zoom', value: 1.4, scope: 'responsive', responsiveView: 'ipad' }), true);
  assert.equal(model.writeAuthoredProperty(source, { targetType: 'section', targetId: 'opening', path: 'background.fit', value: 'contain', scope: 'responsive', responsiveView: 'desktop' }), true);
  const normalized = model.normalize(source);
  assert.equal(normalized.sections.opening.background.focalX, 44);
  assert.deepEqual(plain(normalized.sections.opening.responsive.overrides.ipad.background), { zoom: 1.4 });
  assert.deepEqual(plain(normalized.sections.opening.responsive.overrides.desktop.background), { fit: 'contain' });
  assert.equal(model.resolveSection(normalized.sections.opening, 'ipad').background.focalX, 44);
  assert.equal(model.resolveSection(normalized.sections.opening, 'ipad').background.zoom, 1.4);
  assert.equal(model.resolveSection(normalized.sections.opening, 'desktop').background.fit, 'contain');
});

test('background edits retain canonical history transactions and persistence', () => {
  const transactionHandler = between(editor, "if (message.type === 'green-sage-visual:transaction-start')", "if (message.type === 'green-sage-visual:transaction-patch')");
  assert.match(transactionHandler, /before: snapshot/);
  assert.match(transactionHandler, /targetType, targetId/);
  assert.match(editor, /finishTransaction\(false\); renderAll\(\); syncCanvas\(\)/);

  const state = model.normalize(template.cloneDefault());
  model.writeAuthoredProperty(state, { targetType: 'section', targetId: 'opening', path: 'background.fit', value: 'contain', scope: 'responsive', responsiveView: 'desktop' });
  model.writeAuthoredProperty(state, { targetType: 'section', targetId: 'opening', path: 'background.zoom', value: 1.25, scope: 'responsive', responsiveView: 'desktop' });
  const store = storage();
  assert.equal(loader.save('green-sage', state, store), true);
  const restored = loader.load('green-sage', store);
  assert.equal(restored.sections.opening.responsive.overrides.desktop.background.fit, 'contain');
  assert.equal(restored.sections.opening.responsive.overrides.desktop.background.zoom, 1.25);
});

test('solid-color backgrounds stay section selections without image controls', () => {
  const sectionRenderer = between(canvas, 'const createSection = (section) => {', 'const render = async');
  assert.match(sectionRenderer, /section\.background\.kind === 'image' \? 'green-sage-visual:select-background' : 'green-sage-visual:select-section'/);
  const selection = between(editor, 'const selectBackground = (sectionId, sync = true) => {', 'const applyBackgroundAsset');
  assert.match(selection, /current\?\.background\.kind !== 'image'\) return/);
  assert.match(editor, /ui\.backgroundEditContext\.hidden = !editingBackground/);
});

test('Design image management is removed only after direct controls are present', () => {
  const design = between(html, 'data-panel-view="design"', 'data-panel-view="media"');
  const contextMarkup = between(html, 'id="backgroundEditContext"', 'id="morePopover"');
  assert.doesNotMatch(design, /Background image|Choose from Media|Edit \/ Reframe|Remove image|backgroundPositionControls/);
  assert.match(design, /id="sectionBackgroundColor"/);
  assert.match(contextMarkup, /replaceBackgroundButton/);
  assert.match(contextMarkup, /backgroundFitButton/);
  assert.match(contextMarkup, /backgroundZoom/);
  assert.match(contextMarkup, /doneBackgroundToolbarButton/);
});
