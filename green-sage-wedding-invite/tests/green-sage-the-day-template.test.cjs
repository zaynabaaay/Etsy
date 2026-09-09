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
const textIds = ['the-day-label', ...Array.from({ length: 5 }, (_, index) => `the-day-time-${index + 1}`), ...Array.from({ length: 5 }, (_, index) => `the-day-event-${index + 1}`)];
const dividerIds = Array.from({ length: 4 }, (_, index) => `the-day-divider-${index + 1}`);
const allIds = [...textIds, ...dividerIds];
const storage = () => {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)) };
};

test('Green Sage section order ends with the migrated The Day section', () => {
  assert.deepEqual(plain(authored.document.sectionOrder), ['opening', 'ceremony', 'the-day']);
  assert.deepEqual(Object.keys(authored.sections), ['opening', 'ceremony', 'the-day']);
  assert.equal(authored.sections['the-day'].background.color, '#858977');
});

test('The Day has one label, five editable times, five editable event names, and four dividers', () => {
  assert.equal(authored.elements['the-day-label'].content, 'THE DAY');
  assert.deepEqual(Array.from({ length: 5 }, (_, index) => authored.elements[`the-day-time-${index + 1}`].content), ['3:00 PM', '4:00 PM', '5:30 PM', '7:00 PM', '10:00 PM']);
  assert.deepEqual(Array.from({ length: 5 }, (_, index) => authored.elements[`the-day-event-${index + 1}`].content), ['Ceremony', 'Cocktail Hour', 'Dinner', 'Dancing', 'Late Night']);
  textIds.forEach((id) => { assert.equal(authored.elements[id].sectionId, 'the-day'); assert.equal(authored.elements[id].type, 'text'); });
  dividerIds.forEach((id) => { assert.equal(authored.elements[id].sectionId, 'the-day'); assert.equal(authored.elements[id].type, 'divider'); });
});

test('The Day elementOrder contains every authored element exactly once', () => {
  const order = authored.sections['the-day'].elementOrder;
  assert.equal(order.length, allIds.length);
  assert.equal(new Set(order).size, allIds.length);
  assert.deepEqual([...order].sort(), [...allIds].sort());
});

test('Mobile resolves the measured stacked schedule with hidden dividers', () => {
  const mobile = model.resolveDocument(authored, 'mobile');
  assert.equal(mobile.sections['the-day'].height, 450.25);
  assert.deepEqual(plain(mobile.elements['the-day-label'].frame), { x: 24, y: 80, width: 342, height: 32 });
  assert.deepEqual(plain(mobile.elements['the-day-time-1'].frame), { x: 24, y: 144, width: 82, height: 32 });
  assert.deepEqual(plain(mobile.elements['the-day-event-5'].frame), { x: 130, y: 336, width: 236, height: 32 });
  dividerIds.forEach((id) => assert.equal(mobile.elements[id].visible, false));
});

test('iPad resolves the measured five-column composition from sparse overrides', () => {
  const ipad = model.resolveDocument(authored, 'ipad');
  assert.equal(ipad.sections['the-day'].height, 500);
  assert.deepEqual(plain(ipad.elements['the-day-time-2'].frame), { x: 182.4, y: 254.4, width: 134.4, height: 32 });
  assert.deepEqual(plain(ipad.elements['the-day-event-5'].frame), { x: 585.6, y: 285.1, width: 134.4, height: 32 });
  assert.equal(ipad.elements['the-day-event-1'].style.fontSize, 22);
  dividerIds.forEach((id) => assert.equal(ipad.elements[id].visible, true));
  assert.deepEqual(plain(authored.elements['the-day-divider-1'].responsive.overrides.ipad), { visible: true, frame: { x: 182.4, y: 227.5 } });
});

test('Desktop resolves its independent measured composition and divider geometry', () => {
  const desktop = model.resolveDocument(authored, 'desktop');
  assert.equal(desktop.sections['the-day'].height, 540);
  assert.deepEqual(plain(desktop.elements['the-day-time-4'].frame), { x: 710.4, y: 275.7, width: 220.8, height: 32 });
  assert.deepEqual(plain(desktop.elements['the-day-event-2'].frame), { x: 268.8, y: 308.4, width: 220.8, height: 32 });
  assert.equal(desktop.elements['the-day-event-1'].style.fontSize, 22.8);
  dividerIds.forEach((id) => {
    assert.equal(desktop.elements[id].visible, true);
    assert.equal(desktop.elements[id].frame.width, 1);
    assert.equal(desktop.elements[id].frame.height, 120);
    assert.equal(desktop.elements[id].style.color, '#F4EFE7');
    assert.equal(desktop.elements[id].opacity, 0.18);
  });
});

test('Reset removes the wider divider overrides and a history snapshot restores them', () => {
  const state = model.clone(authored);
  const beforeReset = model.clone(state);
  assert.equal(model.resetResponsiveView(state, 'desktop'), true);
  dividerIds.forEach((id) => {
    assert.equal(state.elements[id].responsive.overrides?.desktop, undefined);
    assert.equal(model.resolveElement(state.elements[id], 'desktop').visible, false);
  });
  const undoState = model.clone(beforeReset);
  dividerIds.forEach((id) => assert.equal(model.resolveElement(undoState.elements[id], 'desktop').visible, true));
  assert.deepEqual(plain(undoState.elements['the-day-divider-1'].responsive.overrides.desktop), plain(authored.elements['the-day-divider-1'].responsive.overrides.desktop));
});

test('Opening, Ceremony, and The Day survive persistence with stable sparse data', () => {
  const store = storage();
  assert.equal(loader.save('green-sage', authored, store), true);
  const restored = loader.load('green-sage', store);
  assert.deepEqual(plain(restored.document.sectionOrder), ['opening', 'ceremony', 'the-day']);
  assert.deepEqual(plain(restored.sections['the-day'].elementOrder), plain(authored.sections['the-day'].elementOrder));
  allIds.forEach((id) => assert.equal(restored.elements[id].id, id));
  dividerIds.forEach((id) => assert.deepEqual(plain(restored.elements[id].responsive), plain(authored.elements[id].responsive)));
  assert.deepEqual(plain(restored.sections.opening), plain(authored.sections.opening));
  assert.deepEqual(plain(restored.sections.ceremony), plain(authored.sections.ceremony));
});
