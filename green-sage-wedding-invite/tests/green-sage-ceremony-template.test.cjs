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

test('Green Sage default retains the migrated Ceremony between Opening and The Day', () => {
  assert.deepEqual(plain(authored.document.sectionOrder), ['opening', 'ceremony', 'the-day']);
  assert.deepEqual(Object.keys(authored.sections), ['opening', 'ceremony', 'the-day']);
  assert.equal(authored.sections['green-sage-placeholder'], undefined);
  assert.equal(Object.values(authored.elements).filter((item) => item.sectionId === 'ceremony').length, ids.length);
  ids.forEach((id) => assert.ok(authored.elements[id], `missing ${id}`));
});

test('Ceremony layer order contains every stable element ID exactly once', () => {
  assert.deepEqual(plain(authored.sections.ceremony.elementOrder), ids);
  assert.equal(new Set(authored.sections.ceremony.elementOrder).size, ids.length);
  ids.forEach((id) => assert.equal(authored.elements[id].sectionId, 'ceremony'));
});

test('Glasshouse resolves to the exact supplied fixed-color SVG metadata', () => {
  const asset = model.getTemplateAsset('venue-glasshouse');
  assert.deepEqual(plain(asset), {
    id: 'venue-glasshouse', name: 'Glasshouse', kind: 'decorative',
    url: 'invitation-assets/venue-glasshouse.svg', width: 1796, height: 876
  });
  assert.equal(authored.elements['ceremony-glasshouse'].type, 'decorative');
  assert.equal(authored.elements['ceremony-glasshouse'].assetId, asset.id);
  assert.equal(authored.elements['ceremony-glasshouse'].crop.fit, 'contain');
  const svg = fs.readFileSync(path.join(__dirname, '..', asset.url), 'utf8');
  assert.match(svg, /<svg[^>]*width="1796"[^>]*height="876"[^>]*viewBox="0 0 1796 876"/);
  assert.match(svg, /fill="#[0-9a-f]{6}"/i);
  assert.doesNotMatch(svg, /<script|<foreignObject|javascript:|<image|\shref=/i);
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
  assert.deepEqual(plain(authored.elements['ceremony-glasshouse'].responsive.overrides.desktop.frame), { x: 300, y: 360, width: 600, height: 292.5 });
  assert.equal(authored.elements['ceremony-address'].responsive.overrides.desktop.style, undefined);
});

test('Ceremony text and global styling match the live authored content', () => {
  assert.deepEqual(ids.filter((id) => authored.elements[id].type === 'text').map((id) => authored.elements[id].content), [
    'CEREMONY', '3:00 PM', 'The Glasshouse', '123 Example Street\nOttawa, Ontario', 'Please arrive 15 minutes early.'
  ]);
  assert.equal(authored.sections.ceremony.background.color, '#E6E5DF');
  assert.equal(authored.elements['ceremony-label'].style.fontFamily, 'Instrument Sans');
  assert.equal(authored.elements['ceremony-time'].style.fontFamily, 'Instrument Sans');
  assert.equal(authored.elements['ceremony-venue'].style.fontFamily, 'Instrument Serif');
  assert.equal(authored.elements['ceremony-note'].style.fontStyle, 'italic');
});

test('Ceremony authored frames preserve the centered focal stack across views', () => {
  const frames = (view) => {
    const resolved = model.resolveDocument(authored, view);
    return Object.fromEntries(ids.map((id) => [id, plain(resolved.elements[id].frame)]));
  };
  assert.deepEqual(frames('mobile'), {
    'ceremony-label': { x: 95, y: 228, width: 200, height: 32 },
    'ceremony-time': { x: 95, y: 264, width: 200, height: 32 },
    'ceremony-glasshouse': { x: 30, y: 306, width: 330, height: 160.875 },
    'ceremony-venue': { x: 35, y: 475, width: 320, height: 56 },
    'ceremony-address': { x: 70, y: 545, width: 250, height: 52 },
    'ceremony-note': { x: 65, y: 612, width: 260, height: 32 }
  });
  assert.deepEqual(frames('ipad')['ceremony-glasshouse'], { x: 174, y: 405, width: 420, height: 204.75 });
  assert.deepEqual(frames('desktop')['ceremony-glasshouse'], { x: 300, y: 360, width: 600, height: 292.5 });
  assert.deepEqual(frames('desktop')['ceremony-venue'], { x: 350, y: 661, width: 500, height: 74 });
});

test('Glasshouse focal group stays centered, tight, and clear of the lower edge', () => {
  const expectations = {
    mobile: { center: 195, width: 330, sectionHeight: 844, minBottomSpace: 200 },
    ipad: { center: 384, width: 420, sectionHeight: 1024, minBottomSpace: 200 },
    desktop: { center: 600, width: 600, sectionHeight: 1000, minBottomSpace: 150 }
  };
  Object.entries(expectations).forEach(([view, expected]) => {
    const resolved = model.resolveDocument(authored, view);
    const image = resolved.elements['ceremony-glasshouse'].frame;
    const time = resolved.elements['ceremony-time'].frame;
    const venue = resolved.elements['ceremony-venue'].frame;
    const note = resolved.elements['ceremony-note'].frame;
    assert.equal(image.x + image.width / 2, expected.center);
    assert.equal(image.width, expected.width);
    assert.ok(image.y - (time.y + time.height) >= 8 && image.y - (time.y + time.height) <= 10);
    assert.ok(venue.y - (image.y + image.height) >= 8 && venue.y - (image.y + image.height) < 9);
    assert.ok(expected.sectionHeight - (note.y + note.height) >= expected.minBottomSpace);
  });
});

test('Ceremony elements retain the shared editor interaction permissions', () => {
  ids.forEach((id) => assert.deepEqual(plain(authored.elements[id].permissions), {
    editable: true, movable: true, resizable: true, deletable: true, locked: false
  }));
});

test('Ceremony IDs and sparse responsive data survive serialization', () => {
  const restored = model.normalize(JSON.parse(JSON.stringify(authored)));
  assert.deepEqual(plain(restored.document.sectionOrder), ['opening', 'ceremony', 'the-day']);
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
