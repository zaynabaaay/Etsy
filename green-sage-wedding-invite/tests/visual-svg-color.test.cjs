const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const editor = read('visual-editor.js');
const canvas = read('visual-canvas.js');
const html = read('visual-editor.html');
const styles = read('visual-canvas.css');
const context = { console, crypto: { randomUUID: () => 'test-id' }, setTimeout, clearTimeout };
context.globalThis = context;
['visual-document.js', 'green-sage-visual-template.js', 'visual-template-loader.js'].forEach((file) => vm.runInNewContext(read(file), context));
const model = context.GreenSageVisualDocument;
const template = context.GreenSageVisualTemplate;
const loader = context.StorielVisualTemplateLoader;
const plain = (value) => JSON.parse(JSON.stringify(value));
const between = (value, start, end) => {
  const from = value.indexOf(start); const to = value.indexOf(end, from + start.length);
  assert.notEqual(from, -1, `Missing start marker: ${start}`); assert.notEqual(to, -1, `Missing end marker: ${end}`);
  return value.slice(from, to);
};
const recolorable = (item) => item.assetKind === 'template' && model.getTemplateAsset(item.assetId)?.recolorable === true;

test('venues and all six Details icons opt in through general asset metadata', () => {
  const expected = {
    'venue-glasshouse': '#605D42', 'venue-mansion': '#8C887C', 'venue-pergola': '#827D6A', 'venue-barn': '#888273',
    'details-icon-dress-code': '#626753', 'details-icon-parking': '#626753', 'details-icon-adults-only': '#626753',
    'details-icon-accommodation': '#626753', 'details-icon-transportation': '#626753', 'details-icon-gifts': '#626753'
  };
  Object.entries(expected).forEach(([id, defaultColor]) => assert.deepEqual(plain({ recolorable: model.getTemplateAsset(id).recolorable, defaultColor: model.getTemplateAsset(id).defaultColor }), { recolorable: true, defaultColor }));
  assert.equal(model.getTemplateAsset('background-green-sage-opening').recolorable, undefined);
});

test('Color toolbar is capability-gated rather than extension- or type-gated', () => {
  const imageToolbar = between(html, 'id="imageContext"', 'id="dividerContext"');
  const renderContext = between(editor, 'const renderContext = () => {', 'const assetUrl');
  assert.match(imageToolbar, /id="replaceImageButton"[\s\S]*id="svgColorButton"[\s\S]*id="imageFitButton"[\s\S]*data-open-position/);
  assert.match(renderContext, /const svgAsset = recolorableAsset\(selected\)/);
  assert.match(renderContext, /ui\.svgColorButton\.hidden = !svgAsset/);
  assert.match(renderContext, /ui\.svgOriginalColor\.disabled = !selected\.svgColor \|\| locked/);
  assert.match(editor, /item\?\.assetKind === 'template'.*getTemplateAsset\(item\.assetId\)\?\.recolorable === true/);
  assert.doesNotMatch(editor, /endsWith\(['"]\.svg|\.svg['"]\)/);
});

test('authored SVG appearance remains the default until an override exists', () => {
  const authored = model.normalize(template.cloneDefault());
  const glasshouse = authored.elements['ceremony-glasshouse'];
  assert.equal(glasshouse.svgColor, undefined);
  assert.equal(model.getTemplateAsset(glasshouse.assetId).defaultColor, '#605D42');
  const renderColor = between(canvas, 'const applySvgColor =', 'const startImageReframe');
  assert.match(renderColor, /if \(!asset \|\| !color\) \{ image\.style\.opacity = ''; mask\?\.remove\(\); return; \}/);
});

test('custom venue and Details-icon colors normalize through the same sparse state', () => {
  const authored = template.cloneDefault();
  authored.elements['ceremony-glasshouse'].svgColor = '#123abc';
  authored.elements['details-parking-icon'].svgColor = '#abcdef';
  const normalized = model.normalize(authored);
  assert.equal(normalized.elements['ceremony-glasshouse'].svgColor, '#123ABC');
  assert.equal(normalized.elements['details-parking-icon'].svgColor, '#ABCDEF');
  assert.equal(normalized.elements['details-parking-icon'].type, 'decorative');
});

test('mask rendering recolors artwork without parsing or modifying source SVGs', () => {
  const renderColor = between(canvas, 'const applySvgColor =', 'const startImageReframe');
  assert.match(renderColor, /maskImage: `url/);
  assert.match(renderColor, /webkitMaskImage: `url/);
  assert.match(renderColor, /backgroundColor: color/);
  assert.match(renderColor, /image\.style\.opacity = '0'/);
  assert.match(styles, /\.svg-color-mask \{[\s\S]*mask-size: 100% 100%[\s\S]*-webkit-mask-size: 100% 100%/);
  assert.doesNotMatch(renderColor, /DOMParser|innerHTML|setAttribute\(['"](?:fill|stroke)/i);
});

test('mask geometry reuses the existing fitted image layout including flips', () => {
  const layout = between(canvas, 'const layoutImage =', 'const applySvgColor');
  assert.match(layout, /const fittedStyle =/);
  assert.match(layout, /width: `\$\{size\.width\}px`/);
  assert.match(layout, /height: `\$\{size\.height\}px`/);
  assert.match(layout, /focalX/);
  assert.match(layout, /scale\(\$\{item\.crop\.flipX/);
  assert.match(layout, /Object\.assign\(image\.style, fittedStyle\)/);
  assert.match(layout, /svg-color-mask.*Object\.assign\(mask\.style, fittedStyle\)/s);
});

test('Original color deletes only the sparse override through normal history', () => {
  const handler = between(editor, "ui.svgOriginalColor.addEventListener('click'", 'bindTransactionalInput(ui.lineHeight');
  assert.match(handler, /finishTransaction\(false\)/);
  assert.match(handler, /mutate\('Restore original artwork color'/);
  assert.match(handler, /delete next\.elements\[source\.id\]\.svgColor/);
  const state = template.cloneDefault(); state.elements['ceremony-glasshouse'].svgColor = '#123456';
  const before = model.normalize(state); const restored = model.clone(before); delete restored.elements['ceremony-glasshouse'].svgColor;
  assert.equal(model.normalize(restored).elements['ceremony-glasshouse'].svgColor, undefined);
  assert.equal(before.elements['ceremony-glasshouse'].svgColor, '#123456');
});

test('SVG color is global across views and creates no responsive override', () => {
  const authored = template.cloneDefault(); authored.elements['ceremony-glasshouse'].svgColor = '#123456';
  const normalized = model.normalize(authored);
  ['mobile', 'ipad', 'desktop'].forEach((view) => assert.equal(model.resolveDocument(normalized, view).elements['ceremony-glasshouse'].svgColor, '#123456'));
  assert.equal(normalized.elements['ceremony-glasshouse'].responsive.overrides?.mobile?.svgColor, undefined);
  assert.equal(normalized.elements['ceremony-glasshouse'].responsive.overrides?.ipad?.svgColor, undefined);
  assert.equal(normalized.elements['ceremony-glasshouse'].responsive.overrides?.desktop?.svgColor, undefined);
});

test('custom SVG colors join the existing Document Colors aggregation', () => {
  const authored = template.cloneDefault(); authored.elements['ceremony-glasshouse'].svgColor = '#123456';
  const normalized = model.normalize(authored);
  assert.ok(normalized.document.colors.includes('#123456'));
  assert.equal(new Set(normalized.document.colors).size, normalized.document.colors.length);
  assert.match(editor, /next\.document\.colors = \[\.\.\.new Set/);
});

test('SVG color survives persistence and canonical undo/redo snapshots', () => {
  const values = new Map(); const storage = { getItem: (key) => values.get(key) || null, setItem: (key, value) => values.set(key, String(value)) };
  const original = loader.load('green-sage', storage); const undo = model.clone(original);
  const changed = model.clone(original); changed.elements['ceremony-glasshouse'].svgColor = '#123456'; const redo = model.normalize(changed);
  assert.equal(loader.save('green-sage', redo, storage), true);
  assert.equal(loader.load('green-sage', storage).elements['ceremony-glasshouse'].svgColor, '#123456');
  assert.equal(model.normalize(undo).elements['ceremony-glasshouse'].svgColor, undefined);
  assert.equal(model.normalize(redo).elements['ceremony-glasshouse'].svgColor, '#123456');
});

test('Replace preserves dormant color state and activates it only for opted-in assets', () => {
  const source = template.cloneDefault().elements['ceremony-glasshouse']; source.svgColor = '#123456';
  source.assetId = 'venue-mansion'; assert.equal(recolorable(source), true); assert.equal(model.normalize({ ...template.cloneDefault(), elements: { ...template.cloneDefault().elements, [source.id]: source } }).elements[source.id].svgColor, '#123456');
  source.assetId = 'background-green-sage-opening'; assert.equal(recolorable(source), false); assert.equal(model.createImageElement(source).svgColor, '#123456');
  source.assetId = 'venue-pergola'; assert.equal(recolorable(source), true); assert.equal(model.createImageElement(source).svgColor, '#123456');
  const noOverride = model.createImageElement({ ...source, assetId: 'venue-barn', svgColor: undefined });
  assert.equal(noOverride.svgColor, undefined); assert.equal(model.getTemplateAsset(noOverride.assetId).defaultColor, '#888273');
  const replacement = between(editor, 'const replaceElementAsset =', 'const setSectionHeightPreset');
  assert.doesNotMatch(replacement, /svgColor/);
});

test('uploaded and unsupported assets never receive visual tint or the Color control', () => {
  const upload = model.createImageElement({ sectionId: 'ceremony', type: 'image', assetId: 'uploaded-svg', assetKind: 'upload', svgColor: '#123456' });
  const raster = model.createImageElement({ sectionId: 'ceremony', type: 'image', assetId: 'background-green-sage-opening', assetKind: 'template', svgColor: '#123456' });
  assert.equal(recolorable(upload), false);
  assert.equal(recolorable(raster), false);
  const renderColor = between(canvas, 'const applySvgColor =', 'const startImageReframe');
  assert.match(renderColor, /if \(!asset \|\| !color\)/);
});

test('existing image-like interactions remain wired alongside Color', () => {
  const imageToolbar = between(html, 'id="imageContext"', 'id="dividerContext"');
  ['replaceImageButton', 'svgColorButton', 'imageFitButton'].forEach((id) => assert.match(imageToolbar, new RegExp(`id="${id}"`)));
  assert.match(imageToolbar, /data-open-position/);
  assert.match(editor, /ui\.opacity\.value = selected\.opacity/);
  assert.match(editor, /ui\.rotation\.value = selected\.rotation/);
  assert.match(editor, /data-image-flip/);
  assert.match(canvas, /item\.type === 'decorative' \? \['nw', 'ne', 'se', 'sw'\]/);
});
