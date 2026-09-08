const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const context = { console, crypto: { randomUUID: () => 'test-id' }, setTimeout, clearTimeout };
context.globalThis = context;
['visual-document.js', 'green-sage-visual-template.js'].forEach((file) => {
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context);
});
const model = context.GreenSageVisualDocument;
const template = context.GreenSageVisualTemplate;
const plain = (value) => JSON.parse(JSON.stringify(value));
const authored = model.normalize(template.cloneDefault());
const ids = ['ceremony-label', 'ceremony-time', 'ceremony-glasshouse', 'ceremony-venue', 'ceremony-address', 'ceremony-note'];

test('Green Sage default retains the migrated Ceremony after Opening', () => {
  assert.deepEqual(plain(authored.document.sectionOrder), ['opening', 'ceremony']);
  assert.deepEqual(Object.keys(authored.sections), ['opening', 'ceremony']);
  assert.equal(authored.sections['green-sage-placeholder'], undefined);
  assert.equal(Object.values(authored.elements).filter((item) => item.sectionId === 'ceremony').length, ids.length);
  ids.forEach((id) => assert.ok(authored.elements[id], `missing ${id}`));
});

test('Ceremony layer order contains every stable element ID exactly once', () => {
  assert.deepEqual(plain(authored.sections.ceremony.elementOrder), ids);
  assert.equal(new Set(authored.sections.ceremony.elementOrder).size, ids.length);
  ids.forEach((id) => assert.equal(authored.elements[id].sectionId, 'ceremony'));
});

test('Glasshouse resolves to the exact supplied transparent PNG metadata', () => {
  const asset = model.getTemplateAsset('asset-glasshouse-line');
  assert.deepEqual(plain(asset), {
    id: 'asset-glasshouse-line', name: 'Glasshouse', kind: 'decorative',
    url: 'assets/glasshouse-line-transparent.png', width: 1280, height: 624
  });
  assert.equal(authored.elements['ceremony-glasshouse'].type, 'decorative');
  assert.equal(authored.elements['ceremony-glasshouse'].assetId, asset.id);
  assert.equal(authored.elements['ceremony-glasshouse'].crop.fit, 'contain');
  const png = fs.readFileSync(path.join(__dirname, '..', asset.url));
  assert.equal(png.subarray(1, 4).toString(), 'PNG');
  assert.equal(png.readUInt32BE(16), 1280);
  assert.equal(png.readUInt32BE(20), 624);
  assert.equal(png[25], 6, 'Glasshouse source must remain an RGBA PNG');
});

test('Ceremony responsive projection uses sparse measured overrides', () => {
  const mobile = model.resolveDocument(authored, 'mobile');
  const ipad = model.resolveDocument(authored, 'ipad');
  const desktop = model.resolveDocument(authored, 'desktop');
  assert.equal(mobile.sections.ceremony.height, 844);
  assert.equal(ipad.sections.ceremony.height, 1024);
  assert.equal(desktop.sections.ceremony.height, 1000);
  assert.equal(mobile.elements['ceremony-venue'].style.fontSize, 46.8);
  assert.equal(ipad.elements['ceremony-venue'].style.fontSize, 48);
  assert.equal(desktop.elements['ceremony-venue'].style.fontSize, 62.4);
  assert.deepEqual(plain(authored.elements['ceremony-label'].responsive.overrides.ipad), { frame: { x: 284, y: 321 } });
  assert.equal(authored.elements['ceremony-label'].responsive.overrides.ipad.style, undefined);
  assert.deepEqual(plain(authored.elements['ceremony-glasshouse'].responsive.overrides.desktop.frame), { x: 441.6, y: 356, width: 316.8, height: 154.44 });
  assert.equal(authored.elements['ceremony-address'].responsive.overrides.desktop.style, undefined);
});

test('Ceremony text and global styling match the live authored content', () => {
  assert.deepEqual(ids.filter((id) => authored.elements[id].type === 'text').map((id) => authored.elements[id].content), [
    'CEREMONY', '3:00 PM', 'The Glasshouse', '123 Example Street\nOttawa, Ontario', 'Please arrive 15 minutes early.'
  ]);
  assert.equal(authored.sections.ceremony.background.color, '#EAE2D7');
  assert.equal(authored.elements['ceremony-label'].style.fontFamily, 'Instrument Sans');
  assert.equal(authored.elements['ceremony-time'].style.fontFamily, 'Instrument Sans');
  assert.equal(authored.elements['ceremony-venue'].style.fontFamily, 'Instrument Serif');
  assert.equal(authored.elements['ceremony-note'].style.fontStyle, 'italic');
});

test('Ceremony authored frames reproduce the measured live centered stack', () => {
  const frames = (view) => {
    const resolved = model.resolveDocument(authored, view);
    return Object.fromEntries(ids.map((id) => [id, plain(resolved.elements[id].frame)]));
  };
  assert.deepEqual(frames('mobile'), {
    'ceremony-label': { x: 95, y: 228, width: 200, height: 32 },
    'ceremony-time': { x: 95, y: 265, width: 200, height: 32 },
    'ceremony-glasshouse': { x: 63, y: 303, width: 264, height: 128.7 },
    'ceremony-venue': { x: 35, y: 445, width: 320, height: 56 },
    'ceremony-address': { x: 70, y: 521, width: 250, height: 52 },
    'ceremony-note': { x: 65, y: 586, width: 260, height: 32 }
  });
  assert.deepEqual(frames('ipad')['ceremony-glasshouse'], { x: 252, y: 396, width: 264, height: 128.7 });
  assert.deepEqual(frames('desktop')['ceremony-glasshouse'], { x: 441.6, y: 356, width: 316.8, height: 154.44 });
  assert.deepEqual(frames('desktop')['ceremony-venue'], { x: 350, y: 528, width: 500, height: 74 });
});

test('Ceremony elements retain the shared editor interaction permissions', () => {
  ids.forEach((id) => assert.deepEqual(plain(authored.elements[id].permissions), {
    editable: true, movable: true, resizable: true, deletable: true, locked: false
  }));
});

test('Ceremony IDs and sparse responsive data survive serialization', () => {
  const restored = model.normalize(JSON.parse(JSON.stringify(authored)));
  assert.deepEqual(plain(restored.document.sectionOrder), ['opening', 'ceremony']);
  assert.deepEqual(plain(restored.sections.ceremony.elementOrder), ids);
  assert.deepEqual(plain(restored.sections.ceremony.responsive), plain(authored.sections.ceremony.responsive));
  ids.forEach((id) => assert.deepEqual(plain(restored.elements[id].responsive), plain(authored.elements[id].responsive)));
});

test('test-only Desktop edit resets to the authored Ceremony inheritance', () => {
  const state = model.clone(authored);
  assert.equal(model.writeAuthoredProperty(state, { targetType: 'element', targetId: 'ceremony-time', path: 'style.fontSize', value: 18, scope: 'responsive', responsiveView: 'desktop' }), true);
  assert.equal(model.resolveElement(state.elements['ceremony-time'], 'desktop').style.fontSize, 18);
  assert.equal(model.resetResponsiveView(state, 'desktop'), true);
  assert.equal(state.elements['ceremony-time'].responsive.overrides?.desktop, undefined);
  assert.equal(model.resolveElement(state.elements['ceremony-time'], 'desktop').style.fontSize, 13);
  assert.equal(state.elements['ceremony-time'].content, '3:00 PM');
});
