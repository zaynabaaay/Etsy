const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'visual-editor.html'), 'utf8');
const source = fs.readFileSync(path.join(root, 'visual-editor.js'), 'utf8');

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
  assert.match(renderer, /'Set as background'/);
  assert.doesNotMatch(renderer, /filter\(\(asset\) => asset\.kind/);

  const listener = between(source, "ui.templateMedia.addEventListener('click'", 'ui.addDivider.addEventListener');
  assert.match(listener, /asset\.kind === 'decorative' \? 'decorative' : 'image'/);
  assert.match(listener, /applyBackgroundAsset\(asset\.id, 'template'\)/);
});

test('uploads retain one record identity for insertion and background assignment', () => {
  const listener = between(source, "ui.uploadLibrary.addEventListener('click'", 'ui.addSection.addEventListener');
  assert.match(listener, /case 'insert': addImage\(card\.dataset\.assetId\)/);
  assert.match(listener, /case 'background': uploadMenuId = null; applyBackgroundAsset\(card\.dataset\.assetId, 'upload'\)/);

  const backgroundMutation = between(source, 'const applyBackgroundAsset = (assetId, assetKind) => {', 'const setSectionHeightPreset');
  assert.match(backgroundMutation, /mutate\('Change section background'/);
  assert.match(backgroundMutation, /kind: 'image', assetId, assetKind, focalX: 50, focalY: 50, zoom: 1/);
  assert.doesNotMatch(backgroundMutation, /assets\.|addFile|addFiles|put\(/);
});

test('Design shows current background controls and delegates replacement to Media', () => {
  const design = between(html, 'data-panel-view="design"', 'data-panel-view="media"');
  assert.match(design, /id="backgroundCurrent"/);
  assert.match(design, /id="chooseBackgroundButton"/);
  assert.match(design, /id="editBackgroundButton"/);
  assert.match(design, /id="removeBackgroundButton"/);
  assert.doesNotMatch(design, /templateMedia|uploadLibrary|templateBackgrounds|uploadedBackgrounds/);
  assert.match(source, /ui\.chooseBackground\.addEventListener\('click', \(\) => setPanel\('media'\)\)/);
});

test('upload cards keep Add to section primary and background/delete secondary', () => {
  const renderer = between(source, 'const renderUploads = () => {', 'const deleteUpload = async');
  assert.match(renderer, /button\('insert', 'Add to section'\)/);
  assert.match(renderer, /menu\.append\(button\('background', 'Set as background'\), button\('delete'/);
  assert.match(renderer, /upload-delete-confirmation/);
  assert.match(renderer, /Image unavailable/);
});
