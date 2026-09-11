const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('visual-editor.html');
const source = read('visual-editor.js');
const styles = read('visual-editor.css');
const context = { console, crypto: { randomUUID: () => 'test-id' }, setTimeout, clearTimeout };
context.globalThis = context;
['visual-document.js', 'green-sage-visual-template.js'].forEach((file) => vm.runInNewContext(read(file), context));
const model = context.GreenSageVisualDocument;
const template = context.GreenSageVisualTemplate;
const plain = (value) => JSON.parse(JSON.stringify(value));
const digest = (value) => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const between = (value, start, end) => {
  const from = value.indexOf(start); const to = value.indexOf(end, from + start.length);
  assert.notEqual(from, -1, `Missing start marker: ${start}`); assert.notEqual(to, -1, `Missing end marker: ${end}`);
  return value.slice(from, to);
};

const expectedSourceNames = [
  'hanger', 'parking-circle', 'users', 'bed', 'bus', 'gift', 'heart', 'diamond', 'calendar-event', 'clock',
  'map-pin', 'map', 'navigation', 'car', 'caravan', 'train', 'plane', 'walk', 'building', 'home',
  'building-cottage', 'glass-cocktail', 'bottle', 'cake', 'tools-kitchen-2', 'music', 'microphone',
  'speakerphone', 'camera', 'photo', 'sun', 'cloud-rain', 'trees', 'flower', 'wheelchair', 'baby-carriage',
  'user-heart', 'message', 'mail', 'phone'
];

test('Media exposes a searchable Icons collection with a compact touch-safe grid', () => {
  const panel = between(html, 'data-panel-view="media"', 'data-panel-view="text"');
  assert.match(panel, /id="iconsMediaHeading">Icons<\/h2>/);
  assert.match(panel, /id="iconSearch"[^>]*type="search"[^>]*placeholder="Search icons"/);
  assert.match(panel, /id="iconDefaultHeading">Used in this design/);
  assert.match(panel, /id="iconLibrary"/);
  assert.match(panel, /id="iconEmpty"[^>]*hidden>No icons used yet/);
  assert.match(styles, /\.icon-context-heading \{/);
  assert.match(styles, /\.icon-grid \{[^}]*grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(styles, /\.icon-tile \{[^}]*min-height:70px/);
  assert.doesNotMatch(panel, /icon categor|icon filter/i);
});

test('curated icon catalog contains 40 official Tabler outline assets through the shared catalog', () => {
  assert.equal(model.templateIcons.length, 40);
  assert.deepEqual(plain(model.templateIcons.map((asset) => asset.sourceName)), expectedSourceNames);
  model.templateIcons.forEach((asset) => {
    assert.equal(model.getTemplateAsset(asset.id), asset);
    assert.deepEqual(plain({ kind: asset.kind, collection: asset.collection, source: asset.source, width: asset.width, height: asset.height, recolorable: asset.recolorable, defaultColor: asset.defaultColor }), {
      kind: 'decorative', collection: 'icons', source: 'tabler', width: 24, height: 24, recolorable: true, defaultColor: '#626753'
    });
    assert.ok(asset.name && asset.keywords.length > 0);
    const svg = read(asset.url);
    assert.match(svg, /viewBox="0 0 24 24"/);
    assert.match(svg, /fill="none"/);
    assert.match(svg, /stroke="#626753"/);
    assert.match(svg, /stroke-width="1\.5"/);
    assert.doesNotMatch(svg, /<script|<foreignObject|javascript:|<image|\shref=/i);
  });
});

test('icon search is case-insensitive and includes friendly invitation synonyms', () => {
  const names = (query) => plain(model.searchTemplateIcons(query).map((asset) => asset.name));
  assert.deepEqual(names('DRESS CODE'), ['Hanger']);
  ['Bed', 'Building', 'Home'].forEach((name) => assert.ok(names('hotel').includes(name), name));
  ['Bus', 'Car', 'Van'].forEach((name) => assert.ok(names('shuttle').includes(name), name));
  ['Camera', 'Photo'].forEach((name) => assert.ok(names('photo').includes(name), name));
  assert.deepEqual(names('gift'), ['Gift']);
  assert.deepEqual(names('does not exist'), []);
});

test('empty-query icon selection derives used library assets in first document occurrence order', () => {
  const authored = template.cloneDefault();
  assert.deepEqual(plain(model.getUsedTemplateIcons(authored).map((asset) => asset.id)), [
    'details-icon-dress-code', 'details-icon-parking', 'details-icon-adults-only',
    'details-icon-accommodation', 'details-icon-transportation', 'details-icon-gifts'
  ]);

  authored.elements['opening-train'] = { ...authored.elements['details-transportation-icon'], id: 'opening-train', sectionId: 'opening', assetId: 'icon-tabler-train' };
  authored.sections.opening.elementOrder.push('opening-train');
  authored.elements['ceremony-heart'] = { ...authored.elements['details-transportation-icon'], id: 'ceremony-heart', sectionId: 'ceremony', assetId: 'icon-tabler-heart' };
  authored.sections.ceremony.elementOrder.push('ceremony-heart');
  authored.elements['details-train-repeat'] = { ...authored.elements['opening-train'], id: 'details-train-repeat', sectionId: 'details' };
  authored.sections.details.elementOrder.push('details-train-repeat');

  assert.deepEqual(plain(model.getUsedTemplateIcons(authored).map((asset) => asset.id)), [
    'icon-tabler-train', 'icon-tabler-heart',
    'details-icon-dress-code', 'details-icon-parking', 'details-icon-adults-only',
    'details-icon-accommodation', 'details-icon-transportation', 'details-icon-gifts'
  ]);
});

test('used icon selection updates after add and only removes the final document instance', () => {
  const authored = template.cloneDefault();
  const icon = { ...authored.elements['details-transportation-icon'], assetId: 'icon-tabler-train' };
  authored.elements['opening-train'] = { ...icon, id: 'opening-train', sectionId: 'opening' };
  authored.elements['ceremony-train'] = { ...icon, id: 'ceremony-train', sectionId: 'ceremony' };
  authored.sections.opening.elementOrder.push('opening-train');
  authored.sections.ceremony.elementOrder.push('ceremony-train');
  assert.ok(model.getUsedTemplateIcons(authored).some((asset) => asset.id === 'icon-tabler-train'));

  delete authored.elements['opening-train'];
  authored.sections.opening.elementOrder = authored.sections.opening.elementOrder.filter((id) => id !== 'opening-train');
  assert.ok(model.getUsedTemplateIcons(authored).some((asset) => asset.id === 'icon-tabler-train'));

  delete authored.elements['ceremony-train'];
  authored.sections.ceremony.elementOrder = authored.sections.ceremony.elementOrder.filter((id) => id !== 'ceremony-train');
  assert.ok(!model.getUsedTemplateIcons(authored).some((asset) => asset.id === 'icon-tabler-train'));
});

test('used icon selection ignores non-library assets and supports an empty document', () => {
  const authored = template.cloneDefault();
  Object.values(authored.sections).forEach((section) => {
    section.elementOrder = section.elementOrder.filter((id) => model.getTemplateAsset(authored.elements[id]?.assetId)?.collection !== 'icons');
  });
  Object.keys(authored.elements).forEach((id) => {
    if (model.getTemplateAsset(authored.elements[id]?.assetId)?.collection === 'icons') delete authored.elements[id];
  });
  assert.deepEqual(plain(model.getUsedTemplateIcons(authored)), []);
});

test('Icons renderer searches immediately and routes Add through the existing decorative insertion path', () => {
  const renderer = between(source, 'const renderIcons = () => {', 'const uploadUsage = () => {');
  assert.match(renderer, /const query = ui\.iconSearch\.value\.trim\(\)/);
  assert.match(renderer, /query \? model\.searchTemplateIcons\(query\) : model\.getUsedTemplateIcons\(state\)/);
  assert.match(renderer, /ui\.iconDefaultHeading\.hidden = Boolean\(query\)/);
  assert.match(renderer, /query \? 'No icons found' : 'No icons used yet'/);
  assert.match(renderer, /target \? 'replace' : 'insert'/);
  assert.match(renderer, /ui\.iconEmpty\.hidden = matches\.length > 0/);
  assert.match(source, /ui\.iconSearch\.addEventListener\('input', renderIcons\)/);
  const listener = between(source, "ui.iconLibrary.addEventListener('click'", 'ui.addDivider.addEventListener');
  assert.match(listener, /addImage\(asset\.id, 'template', 'decorative'\)/);

  const asset = model.getTemplateAsset('icon-tabler-heart');
  const state = model.normalize(template.cloneDefault());
  const frame = model.getDefaultElementPlacement({ type: 'decorative', view: 'mobile', section: state.sections.opening, assetMetadata: asset, baseFrame: { x: 65, y: 410, width: 260, height: 220 } });
  const created = model.createImageElement({ sectionId: 'opening', type: 'decorative', assetId: asset.id, assetKind: 'template', frame, crop: { fit: 'contain' } });
  assert.deepEqual(plain({ type: created.type, assetId: created.assetId, assetKind: created.assetKind, fit: created.crop.fit }), { type: 'decorative', assetId: 'icon-tabler-heart', assetKind: 'template', fit: 'contain' });
});

test('search reaches the full library and clearing it returns to the contextual used-icons path in Replace mode too', () => {
  assert.ok(model.searchTemplateIcons('train').some((asset) => asset.id === 'icon-tabler-train'));
  assert.ok(!model.getUsedTemplateIcons(template.cloneDefault()).some((asset) => asset.id === 'icon-tabler-train'));
  const renderer = between(source, 'const renderIcons = () => {', 'const uploadUsage = () => {');
  assert.match(renderer, /const target = replacementTarget\(\)/);
  assert.match(renderer, /query \? model\.searchTemplateIcons\(query\) : model\.getUsedTemplateIcons\(state\)/);
  assert.match(renderer, /tile\.dataset\.iconAction = target \? 'replace' : 'insert'/);
});

test('Icons participate in existing Replace and recolorable SVG behavior without icon-specific state', () => {
  const listener = between(source, "ui.iconLibrary.addEventListener('click'", 'ui.addDivider.addEventListener');
  assert.match(listener, /replaceElementAsset\(asset\.id, 'template'\)/);
  const authored = model.normalize(template.cloneDefault());
  const before = plain(authored.elements['details-transportation-icon']);
  const replaced = plain(before); replaced.assetId = 'icon-tabler-train';
  const beforeSlot = plain(before); const replacedSlot = plain(replaced); delete beforeSlot.assetId; delete replacedSlot.assetId;
  assert.deepEqual(replacedSlot, beforeSlot);
  replaced.svgColor = '#123ABC';
  const normalized = model.normalize({ ...authored, elements: { ...authored.elements, [replaced.id]: replaced } });
  assert.equal(normalized.elements[replaced.id].svgColor, '#123ABC');
  assert.equal(model.getTemplateAsset(replaced.assetId).recolorable, true);
});

test('authored Details icon identities and responsive geometry remain unchanged', () => {
  const authored = template.cloneDefault();
  const ids = ['dress-code', 'parking', 'adults-only', 'accommodation', 'transportation', 'gifts'].map((key) => `details-${key}-icon`);
  const snapshot = ids.map((id) => ({ id, assetId: authored.elements[id].assetId, frame: authored.elements[id].frame, responsive: authored.elements[id].responsive }));
  assert.equal(digest(snapshot), '50415b2bea3909f450e50a4bf0ba76bce80d0f420a39bcc446e23d96a5fe5eb6');
  assert.deepEqual(plain(ids), plain(authored.sections.details.elementOrder.filter((id) => id.endsWith('-icon'))));
});
