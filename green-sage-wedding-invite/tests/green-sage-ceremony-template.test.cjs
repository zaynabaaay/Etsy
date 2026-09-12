const assert = require('node:assert/strict');
const crypto = require('node:crypto');
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
const ids = ['ceremony-label', 'ceremony-glasshouse', 'ceremony-venue', 'ceremony-time', 'ceremony-address'];

test('Green Sage default retains Ceremony between Opening and The Day before Details', () => {
  assert.deepEqual(plain(authored.document.sectionOrder), ['opening', 'ceremony', 'the-day', 'details', 'our-story']);
  assert.deepEqual(Object.keys(authored.sections), ['opening', 'ceremony', 'the-day', 'details', 'our-story']);
  assert.equal(authored.sections['green-sage-placeholder'], undefined);
  assert.equal(Object.values(authored.elements).filter((item) => item.sectionId === 'ceremony').length, ids.length);
  ids.forEach((id) => assert.ok(authored.elements[id], `missing ${id}`));
});

test('Ceremony layer order contains every stable element ID exactly once', () => {
  assert.deepEqual(plain(authored.sections.ceremony.elementOrder), ids);
  assert.equal(new Set(authored.sections.ceremony.elementOrder).size, ids.length);
  ids.forEach((id) => assert.equal(authored.elements[id].sectionId, 'ceremony'));
});

test('Glasshouse resolves to the exact supplied recolorable SVG metadata', () => {
  const asset = model.getTemplateAsset('venue-glasshouse');
  assert.deepEqual(plain(asset), {
    id: 'venue-glasshouse', name: 'Glasshouse', kind: 'decorative',
    url: 'invitation-assets/venue-glasshouse.svg', width: 1796, height: 876,
    recolorable: true, defaultColor: '#605D42'
  });
  assert.equal(authored.elements['ceremony-glasshouse'].type, 'decorative');
  assert.equal(authored.elements['ceremony-glasshouse'].assetId, asset.id);
  assert.equal(authored.elements['ceremony-glasshouse'].opacity, 0.58);
  assert.equal(authored.elements['ceremony-glasshouse'].crop.fit, 'contain');
  const svg = fs.readFileSync(path.join(__dirname, '..', asset.url), 'utf8');
  assert.match(svg, /<svg[^>]*width="1796"[^>]*height="876"[^>]*viewBox="0 0 1796 876"/);
  assert.match(svg, /fill="#[0-9a-f]{6}"/i);
  assert.match(svg, /<g[^>]*opacity="0\.240"/);
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
  assert.equal(mobile.elements['ceremony-time'].style.fontSize, 13);
  assert.equal(ipad.elements['ceremony-time'].style.fontSize, 13);
  assert.equal(desktop.elements['ceremony-time'].style.fontSize, 14);
  assert.equal(mobile.elements['ceremony-address'].style.fontSize, 12);
  assert.equal(ipad.elements['ceremony-address'].style.fontSize, 12);
  assert.equal(desktop.elements['ceremony-address'].style.fontSize, 13);
  assert.deepEqual(plain(authored.elements['ceremony-label'].responsive.overrides.ipad), { frame: { x: 284, y: 321 } });
  assert.equal(authored.elements['ceremony-label'].responsive.overrides.ipad.style, undefined);
  assert.deepEqual(plain(authored.elements['ceremony-glasshouse'].responsive.overrides.desktop.frame), { x: 300, y: 360, width: 600, height: 292.5 });
  assert.deepEqual(plain(authored.elements['ceremony-address'].responsive.overrides.desktop.style), { fontSize: 13 });
});

test('Ceremony text, background, and hierarchy match the refined authored composition', () => {
  assert.deepEqual(ids.filter((id) => authored.elements[id].type === 'text').map((id) => authored.elements[id].content), [
    'CEREMONY', 'The Glasshouse', '3:00 PM', '123 Example Street\nOttawa, Ontario'
  ]);
  assert.equal(authored.sections.ceremony.background.color, '#EFECE7');
  assert.equal(authored.elements['ceremony-note'], undefined);
  assert.ok(!Object.values(authored.elements).some((element) => element.content === 'Please arrive 15 minutes early.'));
  assert.equal(authored.elements['ceremony-label'].style.fontFamily, 'Instrument Sans');
  assert.equal(authored.elements['ceremony-time'].style.fontFamily, 'Instrument Sans');
  assert.equal(authored.elements['ceremony-venue'].style.fontFamily, 'Instrument Serif');
});

test('Ceremony authored frames preserve the centered focal stack across views', () => {
  const frames = (view) => {
    const resolved = model.resolveDocument(authored, view);
    return Object.fromEntries(ids.map((id) => [id, plain(resolved.elements[id].frame)]));
  };
  assert.deepEqual(frames('mobile'), {
    'ceremony-label': { x: 95, y: 228, width: 200, height: 32 },
    'ceremony-glasshouse': { x: 30, y: 306, width: 330, height: 160.875 },
    'ceremony-venue': { x: 35, y: 475, width: 320, height: 56 },
    'ceremony-time': { x: 95, y: 545, width: 200, height: 32 },
    'ceremony-address': { x: 70, y: 579, width: 250, height: 52 }
  });
  assert.deepEqual(frames('ipad')['ceremony-glasshouse'], { x: 174, y: 405, width: 420, height: 204.75 });
  assert.deepEqual(frames('ipad')['ceremony-time'], { x: 284, y: 686, width: 200, height: 32 });
  assert.deepEqual(frames('ipad')['ceremony-address'], { x: 259, y: 720, width: 250, height: 52 });
  assert.deepEqual(frames('desktop')['ceremony-glasshouse'], { x: 300, y: 360, width: 600, height: 292.5 });
  assert.deepEqual(frames('desktop')['ceremony-venue'], { x: 350, y: 661, width: 500, height: 74 });
  assert.deepEqual(frames('desktop')['ceremony-time'], { x: 500, y: 747, width: 200, height: 32 });
  assert.deepEqual(frames('desktop')['ceremony-address'], { x: 475, y: 781, width: 250, height: 52 });
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
    const address = resolved.elements['ceremony-address'].frame;
    assert.equal(image.x + image.width / 2, expected.center);
    assert.equal(image.width, expected.width);
    assert.ok(venue.y - (image.y + image.height) >= 8 && venue.y - (image.y + image.height) < 9);
    assert.ok(time.y - (venue.y + venue.height) >= 12 && time.y - (venue.y + venue.height) <= 14);
    assert.ok(address.y - (time.y + time.height) >= 0 && address.y - (time.y + time.height) <= 2);
    assert.ok(expected.sectionHeight - (address.y + address.height) >= expected.minBottomSpace);
  });
});

test('every Ceremony element remains inside the authored section bounds', () => {
  ['mobile', 'ipad', 'desktop'].forEach((view) => {
    const resolved = model.resolveDocument(authored, view);
    ids.forEach((id) => {
      const frame = resolved.elements[id].frame;
      assert.ok(frame.x >= 0 && frame.y >= 0, `${view} ${id} starts inside`);
      assert.ok(frame.x + frame.width <= model.getCanvasMetrics(view).logicalWidth, `${view} ${id} right`);
      assert.ok(frame.y + frame.height <= resolved.sections.ceremony.height, `${view} ${id} bottom`);
    });
  });
});

test('Ceremony elements retain the shared editor interaction permissions', () => {
  ids.forEach((id) => assert.deepEqual(plain(authored.elements[id].permissions), {
    editable: true, movable: true, resizable: true, deletable: true, locked: false
  }));
});

test('Opening, The Day, Details, and Our Story remain byte-for-byte stable', () => {
  const expected = {
    opening: '52cb6c6bd4e8a903ec8245089da74c3772f61342985395e63a133373639353f7',
    'the-day': 'c76c5c20412e0d508591268f18d75abd3d99b2308a11228f17bbaad697d5ae6b',
    details: '5f8a903d8bb1e1d3f6967e0acf9969205757e0ef6d1f02900de24138164c075b',
    'our-story': 'e045898bca9634a2eb414c4f7d2cbc19f7f8a09f4885585adcb06909cbe3f718'
  };
  Object.entries(expected).forEach(([id, digest]) => {
    const payload = { section: authored.sections[id], elements: authored.sections[id].elementOrder.map((elementId) => authored.elements[elementId]) };
    assert.equal(crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex'), digest, id);
  });
});

test('Ceremony IDs and sparse responsive data survive serialization', () => {
  const restored = model.normalize(JSON.parse(JSON.stringify(authored)));
  assert.deepEqual(plain(restored.document.sectionOrder), ['opening', 'ceremony', 'the-day', 'details', 'our-story']);
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
