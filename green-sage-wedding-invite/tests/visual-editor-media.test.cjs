const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'visual-editor.html'), 'utf8');
const source = fs.readFileSync(path.join(root, 'visual-editor.js'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'visual-editor.css'), 'utf8');

const between = (value, start, end) => {
  const from = value.indexOf(start);
  const to = value.indexOf(end, from + start.length);
  assert.notEqual(from, -1, `Missing start marker: ${start}`);
  assert.notEqual(to, -1, `Missing end marker: ${end}`);
  return value.slice(from, to);
};

test('left rail destinations are exactly Design, Media, Text, and Sections', () => {
  const rail = between(html, '<nav class="storiel-nav"', '</nav>');
  const destinations = [...rail.matchAll(/data-panel="([^"]+)"[^>]*>[\s\S]*?<span>([^<]+)<\/span><\/button>/g)]
    .map((match) => [match[1], match[2]]);
  assert.deepEqual(destinations, [
    ['design', 'Design'],
    ['media', 'Media'],
    ['text', 'Text'],
    ['sections', 'Sections']
  ]);
  assert.doesNotMatch(rail, /Elements|Uploads|data-panel="elements"|data-panel="uploads"/);
});

test('Media exposes the three product groups in order without nested panel destinations', () => {
  const panel = between(html, 'data-panel-view="media"', 'data-panel-view="text"');
  const headings = [...panel.matchAll(/<h2[^>]*>([^<]+)<\/h2>/g)].map((match) => match[1]);
  assert.deepEqual(headings, ['Included with template', 'Basic', 'Your uploads']);
  assert.ok(panel.indexOf('id="templateMedia"') < panel.indexOf('id="addDividerButton"'));
  assert.ok(panel.indexOf('id="addDividerButton"') < panel.indexOf('id="uploadInput"'));
  assert.match(panel, /for="uploadInput">Upload images<\/label>/);
  assert.doesNotMatch(html, /data-panel-view="elements"|data-panel-view="uploads"/);
});

test('all supplied assets share one Media renderer with insertion and background actions', () => {
  const renderer = between(source, 'const renderTemplateMedia = () => {', 'const uploadUsage = () => {');
  assert.match(renderer, /model\.templateAssets\.forEach/);
  assert.match(renderer, /'Add to section'/);
  assert.match(renderer, /aria-haspopup', 'menu'/);
  assert.doesNotMatch(renderer, /Set as background|media-management|append\(menu\)/);
  assert.doesNotMatch(renderer, /filter\(\(asset\) => asset\.kind/);

  const listener = between(source, "ui.templateMedia.addEventListener('click'", 'ui.addDivider.addEventListener');
  assert.match(listener, /asset\.kind === 'decorative' \? 'decorative' : 'image'/);
  assert.match(listener, /openMediaActionPopover\(action, 'template', asset\.id, asset\.name\)/);
});

test('uploads retain one record identity for insertion and background assignment', () => {
  const listener = between(source, "ui.uploadLibrary.addEventListener('click'", 'ui.addSection.addEventListener');
  assert.match(listener, /case 'insert': addImage\(card\.dataset\.assetId\)/);
  assert.match(listener, /openMediaActionPopover\(action, 'upload', card\.dataset\.assetId/);

  const backgroundMutation = between(source, 'const applyBackgroundAsset = (assetId, assetKind) => {', 'const setSectionHeightPreset');
  assert.match(backgroundMutation, /mutate\('Change section background'/);
  assert.match(backgroundMutation, /kind: 'image', assetId, assetKind, fit: 'cover', focalX: 50, focalY: 50, zoom: 1/);
  assert.doesNotMatch(backgroundMutation, /assets\.|addFile|addFiles|put\(/);
});

test('Design retains solid color controls without a duplicate image-management block', () => {
  const design = between(html, 'data-panel-view="design"', 'data-panel-view="media"');
  assert.match(design, /id="sectionBackgroundColor"/);
  assert.match(design, /id="sectionBackgroundHex"/);
  assert.doesNotMatch(design, /Background image|backgroundCurrent|chooseBackgroundButton|editBackgroundButton|removeBackgroundButton|backgroundPositionControls/);
  assert.doesNotMatch(design, /templateMedia|uploadLibrary|templateBackgrounds|uploadedBackgrounds/);
  assert.match(source, /ui\.replaceBackground\.addEventListener\('click', \(\) => setPanel\('media'\)\)/);
});

test('upload cards keep Add to section primary and background/delete secondary', () => {
  const renderer = between(source, 'const renderUploads = () => {', 'const deleteUpload = async');
  assert.match(renderer, /button\('insert', 'Add to section'\)/);
  assert.match(renderer, /aria-haspopup', 'menu'/);
  assert.doesNotMatch(renderer, /Set as background|media-management|append\(menu\)/);
  assert.match(renderer, /upload-delete-confirmation/);
  assert.match(renderer, /Image unavailable/);
});

test('Media secondary actions use the existing anchored popover mechanism', () => {
  const opener = between(source, 'const openMediaActionPopover = (trigger, assetKind, assetId, assetName) => {', "$$('.context-tools')");
  assert.match(html, /id="mediaActionPopover" role="menu"/);
  assert.match(opener, /togglePopover\(ui\.mediaActionPopover, trigger\)/);
  assert.doesNotMatch(opener, /getBoundingClientRect|style\.left|style\.top/);
  assert.match(opener, /replaceChildren\(action\('background', 'Set as background'\)\)/);
  assert.match(opener, /assetKind === 'upload'.*action\('delete', 'Delete'\)/);
});

test('opening another Media menu closes the first without changing card structure', () => {
  const opener = between(source, 'const openMediaActionPopover = (trigger, assetKind, assetId, assetName) => {', "$$('.context-tools')");
  assert.match(opener, /if \(!ui\.mediaActionPopover\.hidden\) closePopovers\(\)/);
  assert.match(opener, /sameTrigger/);
  assert.equal((html.match(/id="mediaActionPopover"/g) || []).length, 1);
  const mediaPanel = between(html, 'data-panel-view="media"', 'data-panel-view="text"');
  assert.doesNotMatch(mediaPanel, /mediaActionPopover|role="menu"/);
});

test('Media popover closes for outside click, Escape, navigation, and panel scroll', () => {
  assert.match(source, /ui\.panel\.addEventListener\('scroll'.*mediaActionPopover.*closePopovers/);
  assert.match(source, /if \(name !== activePanel\) closePopovers\(\)/);
  assert.match(source, /event\.key === 'Escape' && openPopover.*restoreFocus: true/);
  assert.match(source, /document\.addEventListener\('pointerdown'.*\.media-manage.*closePopovers/);
  const close = between(source, 'const closePopovers = (except = null, options = {}) => {', 'const positionOpenPopover');
  assert.match(close, /returnFocus\?\.isConnected.*focus\(\{ preventScroll: true \}\)/);
});

test('popover actions retain background mutation and upload deletion flows', () => {
  const listener = between(source, "ui.mediaActionPopover.addEventListener('click'", 'ui.addSection.addEventListener');
  assert.match(listener, /applyBackgroundAsset\(target\.assetId, target\.assetKind\)/);
  assert.match(listener, /target\.assetKind === 'upload'.*deleteUpload\(target\.assetId\)/);
  const deletion = between(source, 'const deleteUpload = async', 'const renderSections');
  assert.match(deletion, /uploadUsage\(\)\.get\(assetId\)/);
  assert.match(deletion, /uploadDeleteId = assetId; renderUploads\(\)/);
});

test('Media menu rows and touch triggers retain touch-friendly sizing', () => {
  assert.match(styles, /\.media-action-popover button \{[^}]*min-height:44px/);
  assert.match(styles, /@media \(pointer:\s*coarse\) \{\s*\.media-manage \{\s*min-width:44px;\s*min-height:44px;/);
});
