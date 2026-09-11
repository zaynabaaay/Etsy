const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'visual-editor.html'), 'utf8');
const source = fs.readFileSync(path.join(root, 'visual-editor.js'), 'utf8');
const templateSource = fs.readFileSync(path.join(root, 'green-sage-visual-template.js'), 'utf8');

const between = (value, start, end) => {
  const from = value.indexOf(start);
  const to = value.indexOf(end, from + start.length);
  assert.notEqual(from, -1, `Missing start marker: ${start}`);
  assert.notEqual(to, -1, `Missing end marker: ${end}`);
  return value.slice(from, to);
};

const context = { globalThis: {} };
vm.runInNewContext(templateSource, context);
const template = context.globalThis.GreenSageVisualTemplate.defaultDocument;
const runtime = { console, crypto: { randomUUID: () => 'test-id' }, setTimeout, clearTimeout };
runtime.globalThis = runtime;
['visual-document.js', 'green-sage-visual-template.js', 'visual-template-loader.js'].forEach((file) => {
  vm.runInNewContext(fs.readFileSync(path.join(root, file), 'utf8'), runtime);
});
const plain = (value) => JSON.parse(JSON.stringify(value));

test('Replace is a direct contextual action for image and decorative elements', () => {
  const imageToolbar = between(html, 'id="imageContext"', 'id="dividerContext"');
  assert.match(imageToolbar, /id="replaceImageButton"[^>]*>Replace</);
  const renderer = between(source, 'const renderContext = () => {', 'const assetUrl');
  assert.match(renderer, /ui\.replace\.hidden = !isImageLike\(selected\)/);
  assert.match(source, /item\?\.type === 'image' \|\| item\?\.type === 'decorative'/);
  assert.doesNotMatch(html, /id="replaceImageInput"/);
});

test('entering Replace mode retains the selected target and opens Media', () => {
  const listener = between(source, "ui.replace.addEventListener('click'", "ui.cancelMediaReplace.addEventListener");
  assert.match(listener, /replaceTargetElementId = source\.id/);
  assert.match(listener, /setPanel\('media'\)/);
  assert.match(listener, /ui\.cancelMediaReplace\.focus/);
  assert.match(html, /id="mediaReplaceBanner"[\s\S]*Replacing selected image[\s\S]*id="cancelMediaReplaceButton">Cancel/);
});

test('Media cards switch their primary action label during Replace mode', () => {
  const supplied = between(source, 'const renderTemplateMedia = () => {', 'const renderIcons = () => {');
  const uploads = between(source, 'const renderUploads = () => {', 'const deleteUpload = async');
  for (const renderer of [supplied, uploads]) {
    assert.match(renderer, /target \? 'replace' : 'insert'/);
    assert.match(renderer, /target \? 'Replace' : 'Add to section'/);
    assert.match(renderer, /classList\.toggle\('is-replace', Boolean\(target\)\)/);
  }
  assert.match(supplied, /if \(!target\).*media-manage/);
  assert.match(uploads, /if \(!target && !asset\.missing\).*media-manage/);
});

test('supplied and uploaded cards route replacement through one mutation helper', () => {
  const supplied = between(source, "ui.templateMedia.addEventListener('click'", 'ui.addDivider.addEventListener');
  const uploads = between(source, "ui.uploadLibrary.addEventListener('click'", 'ui.addSection.addEventListener');
  assert.match(supplied, /case 'replace': replaceElementAsset\(asset\.id, 'template'\)/);
  assert.match(uploads, /case 'replace': replaceElementAsset\(card\.dataset\.assetId, 'upload'\)/);
  const helper = between(source, 'const replaceElementAsset = (assetId, assetKind) => {', 'const setSectionHeightPreset');
  assert.match(helper, /mutate\('Replace image'/);
  assert.match(helper, /next\.elements\[targetId\]\.assetId = assetId/);
  assert.match(helper, /next\.elements\[targetId\]\.assetKind = assetKind/);
  const mutation = helper.match(/mutate\('Replace image',[\s\S]*?\}, \{ sectionId, elementId: targetId \}\);/)?.[0] || '';
  assert.doesNotMatch(mutation, /\.frame|\.overrides|\.elementOrder|\.type\s*=/);
  assert.match(helper, /replaceTargetElementId = null/);
});

test('venue replacement preserves the complete authored element slot', () => {
  const original = plain(template.elements['ceremony-glasshouse']);
  const ceremonyOrder = plain(template.sections.ceremony.elementOrder);
  const replaced = plain(original);
  replaced.assetId = 'venue-mansion';
  replaced.assetKind = 'template';

  const originalSlot = plain(original); const replacedSlot = plain(replaced);
  delete originalSlot.assetId; delete originalSlot.assetKind;
  delete replacedSlot.assetId; delete replacedSlot.assetKind;
  assert.deepEqual(replacedSlot, originalSlot);
  assert.deepEqual(ceremonyOrder, plain(template.sections.ceremony.elementOrder));
  assert.equal(replaced.id, 'ceremony-glasshouse');
  assert.equal(replaced.type, 'decorative');
  assert.equal(replaced.assetId, 'venue-mansion');
});

test('Cancel, Escape, selection changes, and leaving Media exit without mutation', () => {
  const cancel = between(source, 'const cancelReplaceMode =', 'const setPositionTab');
  assert.match(cancel, /replaceTargetElementId = null/);
  assert.doesNotMatch(cancel, /mutate\(/);
  assert.match(source, /event\.key === 'Escape' && replaceTargetElementId[\s\S]*cancelReplaceMode\(true\)/);
  const panel = between(source, 'const setPanel = (name) => {', 'const cancelReplaceMode');
  assert.match(panel, /activePanel === 'media' && name !== 'media'/);
  assert.match(panel, /replaceTargetElementId = null/);
  assert.match(source, /const selectSection = .*replaceTargetElementId = null/);
  assert.match(source, /const selectBackground = [\s\S]*replaceTargetElementId = null/);
});

test('replacement uses normal history/autosave commit and preserves responsive geometry', () => {
  const helper = between(source, 'const replaceElementAsset = (assetId, assetKind) => {', 'const setSectionHeightPreset');
  assert.match(helper, /mutate\('Replace image'/);
  const commit = between(source, 'const commit =', 'const mutate =');
  assert.match(commit, /pushHistory\(before\)/);
  assert.match(commit, /scheduleSave\(\)/);
  assert.match(commit, /selectedElementId = selection\.elementId/);
  assert.doesNotMatch(helper, /writeAuthoredProperty|responsiveView|overrides/);
  assert.match(source, /replaceTargetElementId = null; backgroundEditSectionId = null; imageEditElementId = null/);
});

test('replacement asset identity round-trips through undo, redo, and template persistence', () => {
  const model = runtime.GreenSageVisualDocument;
  const loader = runtime.StorielVisualTemplateLoader;
  const resource = runtime.GreenSageVisualTemplate;
  const values = new Map();
  const storage = { getItem: (key) => values.get(key) || null, setItem: (key, value) => values.set(key, String(value)) };
  const original = loader.load('green-sage', storage);
  const undoSnapshot = model.clone(original);
  const replaced = model.clone(original);
  replaced.elements['ceremony-glasshouse'].assetId = 'venue-mansion';
  replaced.elements['ceremony-glasshouse'].assetKind = 'template';
  const redoSnapshot = model.normalize(replaced);

  assert.equal(loader.save('green-sage', redoSnapshot, storage), true);
  const restored = loader.load('green-sage', storage);
  assert.equal(restored.elements['ceremony-glasshouse'].assetId, 'venue-mansion');
  assert.deepEqual(plain(restored.elements['ceremony-glasshouse'].frame), plain(original.elements['ceremony-glasshouse'].frame));
  assert.deepEqual(plain(restored.elements['ceremony-glasshouse'].responsive), plain(original.elements['ceremony-glasshouse'].responsive));
  assert.equal(model.normalize(undoSnapshot).elements['ceremony-glasshouse'].assetId, 'venue-glasshouse');
  assert.equal(model.normalize(redoSnapshot).elements['ceremony-glasshouse'].assetId, 'venue-mansion');
  assert.equal(values.has(resource.storageKey), true);
});

test('normal Media insertion and background Replace remain separate', () => {
  assert.match(source, /case 'insert': addImage\(asset\.id, 'template'/);
  assert.match(source, /case 'insert': addImage\(card\.dataset\.assetId\)/);
  assert.match(source, /ui\.replaceBackground\.addEventListener\('click', \(\) => setPanel\('media'\)\)/);
  assert.match(source, /const applyBackgroundAsset = [\s\S]*mutate\('Change section background'/);
  assert.doesNotMatch(between(source, 'const replaceElementAsset =', 'const setSectionHeightPreset'), /background/);
});
