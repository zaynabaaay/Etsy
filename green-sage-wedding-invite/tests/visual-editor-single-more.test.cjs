const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('visual-editor.html');
const editor = read('visual-editor.js');
const canvas = read('visual-canvas.js');
const between = (value, start, end) => {
  const from = value.indexOf(start); const to = value.indexOf(end, from + start.length);
  assert.notEqual(from, -1, `Missing start marker: ${start}`); assert.notEqual(to, -1, `Missing end marker: ${end}`);
  return value.slice(from, to);
};

const textToolbar = between(html, 'id="textContext"', 'id="imageContext"');
const imageToolbar = between(html, 'id="imageContext"', 'id="dividerContext"');
const dividerToolbar = between(html, 'id="dividerContext"', 'id="sectionContext"');
const backgroundToolbar = between(html, 'id="backgroundEditContext"', 'id="morePopover"');
const morePopover = between(html, 'id="morePopover"', 'id="mediaActionPopover"');

test('text toolbar keeps direct controls without a top More trigger', () => {
  ['fontPickerButton', 'fontSize', 'textColorButton', 'boldButton', 'italicButton', 'alignmentButton', 'spacingButton'].forEach((id) => assert.match(textToolbar, new RegExp(`id="${id}"`)));
  assert.match(textToolbar, /data-open-position/);
  assert.doesNotMatch(textToolbar, /data-open-more|>More<\/button>/);
});

test('image and decorative SVG toolbar keeps direct controls without top More', () => {
  ['editImageButton', 'doneImageButton', 'imageReframeZoom', 'replaceImageButton', 'imageFitButton'].forEach((id) => assert.match(imageToolbar, new RegExp(`id="${id}"`)));
  assert.match(imageToolbar, /data-open-position/);
  assert.doesNotMatch(imageToolbar, /data-open-more|>More<\/button>/);
  assert.match(editor, /ui\.imageContext\.hidden = .*!\['image', 'decorative'\]\.includes\(selected\.type\)/);
});

test('divider toolbar keeps Color and Position without top More', () => {
  assert.match(dividerToolbar, /id="dividerColorButton"/);
  assert.match(dividerToolbar, /data-open-position/);
  assert.doesNotMatch(dividerToolbar, /data-open-more|>More<\/button>/);
});

test('floating quick actions remain Lock, Duplicate, Delete, and one ellipsis', () => {
  assert.match(canvas, /quickActionButton\('lock', 'lock', 'Lock'\)/);
  assert.match(canvas, /quickActionButton\('duplicate', 'copy', 'Duplicate'\)/);
  assert.match(canvas, /quickActionButton\('delete', 'trash2', 'Delete'\)/);
  assert.match(canvas, /quickActionButton\('more', 'ellipsis', 'More'\)/);
  assert.equal((html.match(/data-open-more/g) || []).length, 0);
});

test('floating ellipsis still opens the one shared selected-object popover', () => {
  assert.equal((html.match(/id="morePopover"/g) || []).length, 1);
  assert.match(canvas, /message\.action === 'more'.*message\.anchor = quickActions\.getBoundingClientRect\(\)\.toJSON\(\)/);
  assert.match(editor, /message\.action === 'more' && message\.anchor/);
  assert.match(editor, /togglePopover\(ui\.morePopover, trigger\)/);
  assert.match(editor, /const \{ popover, trigger \} = openPopover.*window\.visualViewport/s);
});

test('secondary actions remain selected-object specific', () => {
  assert.match(morePopover, /elementOpacity/);
  assert.match(morePopover, /elementRotation/);
  assert.match(morePopover, /elementVisible/);
  assert.match(morePopover, /textCaseControls/);
  assert.match(morePopover, /imageFlipControls/);
  assert.match(editor, /ui\.textCaseControls\.hidden = selected\.type !== 'text'/);
  assert.match(editor, /ui\.imageFlips\.hidden = !selected\?\.crop/);
});

test('outside click and Escape close the popover and Escape restores floating focus', () => {
  assert.match(editor, /document\.addEventListener\('pointerdown'.*closePopovers\(\)/);
  assert.match(editor, /event\.key === 'Escape' && openPopover.*restoreFocus: true/);
  assert.match(editor, /focus-object-action/);
  assert.match(canvas, /focus-object-action'.*quickMore\.focus\(\{ preventScroll: true \}\)/);
  assert.match(canvas, /object-action-expanded'.*quickMore\.setAttribute\('aria-expanded'/);
});

test('image-background controls remain unchanged and have no More entry', () => {
  ['replaceBackgroundButton', 'backgroundFitButton', 'backgroundZoom', 'doneBackgroundToolbarButton'].forEach((id) => assert.match(backgroundToolbar, new RegExp(`id="${id}"`)));
  assert.doesNotMatch(backgroundToolbar, /More|data-open-more/);
});
