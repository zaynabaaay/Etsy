const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const context = { console, crypto: { randomUUID: () => 'test-id' }, setTimeout, clearTimeout };
context.globalThis = context;
['visual-document.js', 'green-sage-visual-template.js'].forEach((file) => {
  vm.runInNewContext(fs.readFileSync(path.join(root, file), 'utf8'), context);
});
const model = context.GreenSageVisualDocument;
const authored = model.normalize(context.GreenSageVisualTemplate.cloneDefault());
const plain = (value) => JSON.parse(JSON.stringify(value));

const expectedIncludedAssets = [
  { id: 'background-green-sage-opening', name: 'Green Sage Opening', kind: 'background', url: 'invitation-assets/green-sage-opening-background.jpg', width: 853, height: 1280 },
  { id: 'our-story-photo', name: 'Our Story Photo', kind: 'image', url: 'https://images.unsplash.com/photo-1616687818402-c768b3638374?auto=format&fit=crop&fm=jpg&q=90&w=1800', width: 1800, height: 1200 },
  { id: 'our-story-motif', name: 'Our Story Motif', kind: 'decorative', url: 'invitation-assets/our-story-motif.svg', width: 220, height: 18, recolorable: true, defaultColor: '#626753' },
  { id: 'venue-glasshouse', name: 'Glasshouse', kind: 'decorative', url: 'invitation-assets/venue-glasshouse.svg', width: 1796, height: 876, recolorable: true, defaultColor: '#605D42' },
  { id: 'venue-mansion', name: 'Mansion', kind: 'decorative', url: 'invitation-assets/venue-mansion.svg', width: 1536, height: 768, recolorable: true, defaultColor: '#8C887C' },
  { id: 'venue-pergola', name: 'Pergola', kind: 'decorative', url: 'invitation-assets/venue-pergola.svg', width: 1536, height: 768, recolorable: true, defaultColor: '#827D6A' },
  { id: 'venue-barn', name: 'Barn', kind: 'decorative', url: 'invitation-assets/venue-barn.svg', width: 1536, height: 768, recolorable: true, defaultColor: '#888273' }
];

test('Included with template contains exactly the Green Sage-specific supplied assets', () => {
  assert.deepEqual(plain(model.templateAssets.filter((asset) => asset.collection !== 'icons')), expectedIncludedAssets);
  model.templateAssets.filter((asset) => !/^https?:/.test(asset.url)).forEach((asset) => assert.ok(fs.existsSync(path.join(root, asset.url)), `missing ${asset.url}`));
});

test('obsolete supplied assets are absent and no authored template reference is broken', () => {
  const obsolete = [
    'background-ivory-silk', 'background-sage-flatlay', 'background-botanical', 'background-opening-reference',
    'asset-botanical-left', 'asset-botanical-right', 'asset-botanical-accent', 'asset-deckled-frame', 'asset-glasshouse-line'
  ];
  obsolete.forEach((id) => assert.equal(model.getTemplateAsset(id), null));
  const references = [
    ...Object.values(authored.sections).filter((section) => section.background.kind === 'image' && section.background.assetKind === 'template').map((section) => section.background.assetId),
    ...Object.values(authored.elements).filter((element) => element.assetKind === 'template' && element.assetId).map((element) => element.assetId)
  ];
  references.forEach((id) => assert.ok(model.getTemplateAsset(id), `unregistered authored asset ${id}`));
});

test('venue SVG sources remain safe monochrome transparent artwork', () => {
  expectedIncludedAssets.filter((asset) => asset.id.startsWith('venue-')).forEach((asset) => {
    const svg = fs.readFileSync(path.join(root, asset.url), 'utf8');
    assert.match(svg, new RegExp(`viewBox="0 0 ${asset.width} ${asset.height}"`));
    assert.match(svg, /fill="#[0-9a-f]{6}"/i);
    assert.doesNotMatch(svg, /<script|<foreignObject|javascript:|<image|\shref=/i);
  });
  const editor = fs.readFileSync(path.join(root, 'visual-editor.js'), 'utf8');
  assert.doesNotMatch(editor, /DOMParser|setAttribute\(['"](?:fill|stroke)/i);
});

test('an optional venue uses the existing decorative natural-ratio placement', () => {
  const asset = model.getTemplateAsset('venue-mansion');
  const frame = model.getDefaultElementPlacement({
    view: 'desktop', type: 'decorative', assetMetadata: asset,
    section: authored.sections.ceremony, baseFrame: { x: 65, y: 410, width: 260, height: 220 }
  });
  const element = model.createImageElement({ sectionId: 'ceremony', type: 'decorative', assetId: asset.id, assetKind: 'template', frame, crop: { fit: 'contain' } });
  assert.equal(element.assetId, 'venue-mansion');
  assert.equal(element.assetKind, 'template');
  assert.equal(element.crop.fit, 'contain');
  assert.ok(Math.abs(element.frame.width / element.frame.height - asset.width / asset.height) < 1e-9);
});

test('Divider stays outside the supplied catalog under Media Basic', () => {
  const html = fs.readFileSync(path.join(root, 'visual-editor.html'), 'utf8');
  assert.match(html, /id="basicMediaHeading">Basic<\/h2><button[^>]*id="addDividerButton"[^>]*><span>Divider<\/span>/);
  assert.equal(model.getTemplateAsset('divider'), null);
});
