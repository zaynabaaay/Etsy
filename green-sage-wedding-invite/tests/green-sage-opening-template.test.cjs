const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const context = { console, crypto: { randomUUID: () => 'test-id' }, setTimeout, clearTimeout };
context.globalThis = context;
['visual-document.js', 'green-sage-visual-template.js', 'visual-template-loader.js'].forEach((file) => {
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context);
});
const model = context.GreenSageVisualDocument;
const template = context.GreenSageVisualTemplate;
const loader = context.StorielVisualTemplateLoader;
const plain = (value) => JSON.parse(JSON.stringify(value));
const authored = model.normalize(template.cloneDefault());
const ids = ['opening-intro-1', 'opening-intro-2', 'opening-isabella', 'opening-and', 'opening-julian', 'opening-date', 'opening-location', 'opening-scroll'];
const ceremonyIds = ['ceremony-label', 'ceremony-time', 'ceremony-glasshouse', 'ceremony-venue', 'ceremony-address', 'ceremony-note'];
const storage = () => {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)) };
};

test('Green Sage keeps Opening and Ceremony before The Day, Details, and Our Story', () => {
  assert.deepEqual(plain(authored.document.sectionOrder), ['opening', 'ceremony', 'the-day', 'details', 'our-story']);
  assert.deepEqual(Object.keys(authored.sections), ['opening', 'ceremony', 'the-day', 'details', 'our-story']);
  assert.equal(authored.sections['green-sage-placeholder'], undefined);
});

test('Opening contains the stable editable text elements exactly once', () => {
  assert.deepEqual(plain(authored.sections.opening.elementOrder), ids);
  assert.equal(new Set(authored.sections.opening.elementOrder).size, ids.length);
  ids.forEach((id) => {
    assert.equal(authored.elements[id].id, id);
    assert.equal(authored.elements[id].sectionId, 'opening');
    assert.equal(authored.elements[id].type, 'text');
  });
  assert.deepEqual(ids.map((id) => authored.elements[id].content), [
    'Together with their families', 'invite you to celebrate the marriage of', 'ISABELLA', 'and', 'JULIAN',
    'Tuesday, August 24, 2027', 'Ottawa, Ontario', 'Scroll to view'
  ]);
});

test('Opening uses the exact registered live background with inherited crop', () => {
  assert.deepEqual(plain(model.getTemplateAsset('background-green-sage-opening')), {
    id: 'background-green-sage-opening', name: 'Green Sage Opening', kind: 'background',
    url: 'invitation-assets/green-sage-opening-background.jpg', width: 853, height: 1280
  });
  assert.ok(fs.existsSync(path.join(__dirname, '..', 'invitation-assets/green-sage-opening-background.jpg')));
  assert.deepEqual(plain(authored.sections.opening.background), {
    kind: 'image', color: '#F4EFE7', assetId: 'background-green-sage-opening', assetKind: 'template', focalX: 50, focalY: 50, zoom: 1
  });
  assert.equal(authored.sections.opening.responsive.overrides.ipad.background, undefined);
  assert.equal(authored.sections.opening.responsive.overrides.desktop.background, undefined);
  ['mobile', 'ipad', 'desktop'].forEach((view) => {
    const background = model.resolveSection(authored.sections.opening, view).background;
    assert.equal(background.focalX, 50); assert.equal(background.focalY, 50); assert.equal(background.zoom, 1);
  });
});

test('Opening resolves measured Mobile, iPad, and Desktop composition sparsely', () => {
  const mobile = model.resolveDocument(authored, 'mobile');
  const ipad = model.resolveDocument(authored, 'ipad');
  const desktop = model.resolveDocument(authored, 'desktop');
  assert.equal(mobile.sections.opening.height, 844);
  assert.equal(ipad.sections.opening.height, 1024);
  assert.equal(desktop.sections.opening.height, 1000);
  assert.deepEqual(plain(mobile.elements['opening-isabella'].frame), { x: 43.31, y: 295.67, width: 303.34, height: 53.55 });
  assert.equal(mobile.elements['opening-isabella'].style.fontSize, 54.7);
  assert.equal(ipad.elements['opening-isabella'].style.fontSize, 54.1);
  assert.deepEqual(plain(ipad.elements['opening-isabella'].frame), { x: 233.84, y: 371.47, width: 300.31, height: 52.98 });
  assert.equal(desktop.elements['opening-isabella'].style.fontSize, 95.3);
  assert.equal(mobile.elements['opening-julian'].style.fontSize, 57.5);
  assert.equal(ipad.elements['opening-julian'].style.fontSize, 57.8);
  assert.equal(desktop.elements['opening-julian'].style.fontSize, 101.75);
  assert.deepEqual(plain(desktop.elements['opening-julian'].frame), { x: 391.2, y: 456.84, width: 417.58, height: 99.56 });
  assert.deepEqual(plain(authored.elements['opening-date'].responsive.overrides.ipad), { frame: { x: 151.97, y: 554.52, width: 464.06 } });
  assert.equal(authored.elements['opening-date'].responsive.overrides.ipad.style, undefined);
  assert.equal(authored.elements['opening-scroll'].responsive.overrides.desktop.style, undefined);
});

test('Opening typography uses only existing live font families and shared content', () => {
  assert.equal(authored.elements['opening-isabella'].style.fontFamily, 'Baskervville');
  assert.equal(authored.elements['opening-julian'].style.fontFamily, 'Baskervville');
  assert.equal(authored.elements['opening-and'].style.fontFamily, 'Cormorant Garamond');
  assert.equal(authored.elements['opening-and'].style.fontStyle, 'italic');
  ['opening-intro-1', 'opening-intro-2', 'opening-date', 'opening-location', 'opening-scroll'].forEach((id) => {
    assert.equal(authored.elements[id].style.fontFamily, 'Instrument Sans');
  });
  Object.values(authored.elements).filter((item) => item.sectionId === 'opening').forEach((item) => {
    ['ipad', 'desktop'].forEach((view) => assert.equal(item.responsive.overrides?.[view]?.content, undefined));
  });
});

test('Opening and Ceremony survive Green Sage save and reload with stable responsive data', () => {
  const store = storage();
  assert.equal(loader.save('green-sage', authored, store), true);
  const restored = loader.load('green-sage', store);
  assert.deepEqual(plain(restored.document.sectionOrder), ['opening', 'ceremony', 'the-day', 'details', 'our-story']);
  assert.deepEqual(plain(restored.sections.opening.elementOrder), ids);
  assert.deepEqual(plain(restored.sections.ceremony.elementOrder), ceremonyIds);
  [...ids, ...ceremonyIds].forEach((id) => assert.equal(restored.elements[id].id, id));
  assert.deepEqual(plain(restored.sections.opening.responsive), plain(authored.sections.opening.responsive));
});

test('test-only Opening override resets without deleting either section', () => {
  const state = model.clone(authored);
  assert.equal(model.writeAuthoredProperty(state, { targetType: 'element', targetId: 'opening-date', path: 'style.fontSize', value: 18, scope: 'responsive', responsiveView: 'ipad' }), true);
  assert.equal(model.resolveElement(state.elements['opening-date'], 'ipad').style.fontSize, 18);
  assert.equal(model.resetResponsiveView(state, 'ipad'), true);
  assert.equal(model.resolveElement(state.elements['opening-date'], 'ipad').style.fontSize, 13);
  assert.ok(state.sections.opening); assert.ok(state.sections.ceremony);
  assert.deepEqual(plain(state.sections.ceremony.elementOrder), ceremonyIds);
});

test('Ceremony identity and styling remain unchanged around its refined geometry', () => {
  assert.deepEqual(plain(authored.sections.ceremony), {
    id: 'ceremony', name: 'Ceremony', height: 844, heightPreset: 'full',
    background: { kind: 'color', color: '#E6E5DF', assetId: '', assetKind: 'template', focalX: 50, focalY: 50, zoom: 1 },
    elementOrder: ceremonyIds,
    responsive: { overrides: { ipad: { height: 1024 }, desktop: { height: 1000 } } }
  });
  assert.deepEqual(plain(authored.elements['ceremony-glasshouse'].frame), { x: 30, y: 306, width: 330, height: 160.875 });
  assert.equal(authored.elements['ceremony-venue'].content, 'The Glasshouse');
  assert.equal(authored.elements['ceremony-venue'].style.fontSize, 46.8);
  assert.equal(authored.elements['ceremony-note'].content, 'Please arrive 15 minutes early.');
});
