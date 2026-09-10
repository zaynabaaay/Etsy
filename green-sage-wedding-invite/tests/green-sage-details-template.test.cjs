const assert = require('node:assert/strict');
const crypto = require('node:crypto');
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
const digest = (value) => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const authored = model.normalize(template.cloneDefault());
const textIds = [
  'details-label',
  'details-dress-code-title', 'details-dress-code-copy',
  'details-parking-title', 'details-parking-copy',
  'details-adults-only-title', 'details-adults-only-copy'
];
const dividerIds = ['details-divider-1', 'details-divider-2'];
const orderedIds = [
  'details-label',
  'details-dress-code-title', 'details-dress-code-copy',
  'details-divider-1', 'details-parking-title', 'details-parking-copy',
  'details-divider-2', 'details-adults-only-title', 'details-adults-only-copy'
];
const storage = () => {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)) };
};

test('Details follows The Day in the Green Sage section order', () => {
  assert.deepEqual(plain(authored.document.sectionOrder), ['opening', 'ceremony', 'the-day', 'details']);
  assert.deepEqual(plain(authored.sections.details.elementOrder), orderedIds);
  assert.equal(new Set(authored.sections.details.elementOrder).size, orderedIds.length);
});

test('Details preserves the exact live title and three title-copy groups', () => {
  assert.equal(authored.elements['details-label'].content, 'DETAILS');
  assert.deepEqual([
    ['details-dress-code-title', 'details-dress-code-copy'],
    ['details-parking-title', 'details-parking-copy'],
    ['details-adults-only-title', 'details-adults-only-copy']
  ].map(([titleId, copyId]) => [authored.elements[titleId].content, authored.elements[copyId].content]), [
    ['Dress Code', 'Formal attire'],
    ['Parking', 'Complimentary parking is available on site.'],
    ['Adults Only', 'We kindly request an adults-only celebration.']
  ]);
});

test('Details uses stable semantic IDs and standard element permissions', () => {
  textIds.forEach((id) => {
    assert.equal(authored.elements[id].id, id);
    assert.equal(authored.elements[id].sectionId, 'details');
    assert.equal(authored.elements[id].type, 'text');
    assert.deepEqual(plain(authored.elements[id].permissions), { editable: true, movable: true, resizable: true, deletable: true, locked: false });
  });
  dividerIds.forEach((id) => {
    assert.equal(authored.elements[id].id, id);
    assert.equal(authored.elements[id].sectionId, 'details');
    assert.equal(authored.elements[id].type, 'divider');
    assert.deepEqual(plain(authored.elements[id].permissions), { editable: true, movable: true, resizable: true, deletable: true, locked: false });
  });
});

test('Mobile is the authored vertical Details base', () => {
  const mobile = model.resolveDocument(authored, 'mobile');
  assert.equal(mobile.sections.details.height, 423.09);
  assert.equal(mobile.sections.details.heightPreset, 'custom');
  assert.deepEqual(textIds.map((id) => plain(mobile.elements[id].frame)), [
    { x: 24, y: 78, width: 342, height: 32 },
    { x: 24, y: 133, width: 342, height: 32 },
    { x: 24, y: 160.9, width: 310, height: 32 },
    { x: 24, y: 211.7, width: 342, height: 32 },
    { x: 24, y: 239.6, width: 310, height: 32 },
    { x: 24, y: 290.4, width: 342, height: 32 },
    { x: 24, y: 318.3, width: 310, height: 32 }
  ]);
  textIds.forEach((id) => assert.equal(mobile.elements[id].style.textAlign, 'left'));
  dividerIds.forEach((id) => assert.equal(mobile.elements[id].visible, false));
});

test('Details authors only the iPad properties needed for its three-column layout', () => {
  assert.deepEqual(plain(authored.sections.details.responsive.overrides.ipad), { height: 500 });
  assert.deepEqual(plain(authored.elements['details-label'].responsive.overrides.ipad), { frame: { x: 48, y: 167.5, width: 672 } });
  assert.deepEqual(plain(authored.elements['details-parking-title'].responsive.overrides.ipad), {
    frame: { x: 302, y: 232.5, width: 164 }, style: { textAlign: 'center' }
  });
  assert.deepEqual(plain(authored.elements['details-parking-copy'].responsive.overrides.ipad), {
    frame: { x: 302, y: 264.4, width: 164, height: 42 },
    style: { fontSize: 12.5, textAlign: 'center', lineHeight: 1.65, letterSpacing: 0.3125 }
  });
  [...textIds, ...dividerIds].forEach((id) => {
    const override = authored.elements[id].responsive.overrides?.ipad;
    assert.equal(override?.content, undefined);
    assert.equal(override?.opacity, undefined);
    assert.equal(override?.rotation, undefined);
  });
});

test('Details authors only the Desktop properties needed for its three-column layout', () => {
  assert.deepEqual(plain(authored.sections.details.responsive.overrides.desktop), { height: 540 });
  assert.deepEqual(plain(authored.elements['details-label'].responsive.overrides.desktop), { frame: { x: 80, y: 182.5, width: 1040 } });
  assert.deepEqual(plain(authored.elements['details-adults-only-title'].responsive.overrides.desktop), {
    frame: { x: 815.33, y: 253.5, width: 262.67 },
    style: { fontSize: 13, textAlign: 'center', letterSpacing: 1.43 }
  });
  assert.deepEqual(plain(authored.elements['details-adults-only-copy'].responsive.overrides.desktop), {
    frame: { x: 821.67, y: 285.7, width: 250, height: 40 },
    style: { fontSize: 12, textAlign: 'center', lineHeight: 1.65, letterSpacing: 0.3 }
  });
  [...textIds, ...dividerIds].forEach((id) => {
    const override = authored.elements[id].responsive.overrides?.desktop;
    assert.equal(override?.content, undefined);
    assert.equal(override?.opacity, undefined);
    assert.equal(override?.rotation, undefined);
  });
});

test('iPad and Desktop resolve the measured live Details geometry', () => {
  const ipad = model.resolveDocument(authored, 'ipad');
  const desktop = model.resolveDocument(authored, 'desktop');
  assert.equal(ipad.sections.details.height, 500);
  assert.equal(desktop.sections.details.height, 540);
  assert.deepEqual(textIds.map((id) => plain(ipad.elements[id].frame)), [
    { x: 48, y: 167.5, width: 672, height: 32 },
    { x: 78, y: 232.5, width: 164, height: 32 },
    { x: 78, y: 264.4, width: 164, height: 42 },
    { x: 302, y: 232.5, width: 164, height: 32 },
    { x: 302, y: 264.4, width: 164, height: 42 },
    { x: 526, y: 232.5, width: 164, height: 32 },
    { x: 526, y: 264.4, width: 164, height: 42 }
  ]);
  assert.deepEqual(textIds.map((id) => plain(desktop.elements[id].frame)), [
    { x: 80, y: 182.5, width: 1040, height: 32 },
    { x: 122, y: 253.5, width: 262.67, height: 32 },
    { x: 128.33, y: 285.7, width: 250, height: 40 },
    { x: 468.67, y: 253.5, width: 262.67, height: 32 },
    { x: 475, y: 285.7, width: 250, height: 40 },
    { x: 815.33, y: 253.5, width: 262.67, height: 32 },
    { x: 821.67, y: 285.7, width: 250, height: 40 }
  ]);
});

test('Details dividers are hidden on Mobile and match the two live wide separators', () => {
  const mobile = model.resolveDocument(authored, 'mobile');
  const ipad = model.resolveDocument(authored, 'ipad');
  const desktop = model.resolveDocument(authored, 'desktop');
  assert.deepEqual(dividerIds.map((id) => mobile.elements[id].visible), [false, false]);
  assert.deepEqual(dividerIds.map((id) => ({ visible: ipad.elements[id].visible, frame: plain(ipad.elements[id].frame) })), [
    { visible: true, frame: { x: 272, y: 230.5, width: 1, height: 102 } },
    { visible: true, frame: { x: 496, y: 230.5, width: 1, height: 102 } }
  ]);
  assert.deepEqual(dividerIds.map((id) => ({ visible: desktop.elements[id].visible, frame: plain(desktop.elements[id].frame) })), [
    { visible: true, frame: { x: 426.67, y: 251.5, width: 1, height: 106 } },
    { visible: true, frame: { x: 773.33, y: 251.5, width: 1, height: 106 } }
  ]);
  dividerIds.forEach((id) => {
    assert.equal(authored.elements[id].style.color, '#858977');
    assert.equal(authored.elements[id].opacity, 0.28);
  });
});

test('Details maps live semantic roles to the approved Green Sage palette', () => {
  assert.equal(authored.sections.details.background.color, '#F4EFE7');
  assert.equal(authored.elements['details-label'].style.color, '#626753');
  ['details-dress-code-title', 'details-parking-title', 'details-adults-only-title'].forEach((id) => assert.equal(authored.elements[id].style.color, '#44463D'));
  ['details-dress-code-copy', 'details-parking-copy', 'details-adults-only-copy'].forEach((id) => assert.equal(authored.elements[id].style.color, '#5F6051'));
  [...textIds, ...dividerIds].forEach((id) => assert.ok(authored.document.colors.includes(authored.elements[id].style.color)));
  assert.deepEqual(plain(template.cloneDefault().document.colors), ['#F4EFE7', '#E6E5DF', '#858977', '#626753', '#44463D', '#5F6051']);
});

test('Details uses the live Instrument Sans hierarchy without adding a font family', () => {
  textIds.forEach((id) => assert.equal(authored.elements[id].style.fontFamily, 'Instrument Sans'));
  assert.equal(authored.elements['details-label'].style.fontSize, 10);
  ['details-dress-code-title', 'details-parking-title', 'details-adults-only-title'].forEach((id) => assert.equal(authored.elements[id].style.fontSize, 13.5));
  ['details-dress-code-copy', 'details-parking-copy', 'details-adults-only-copy'].forEach((id) => assert.equal(authored.elements[id].style.fontSize, 13));
});

test('Opening, Ceremony, and The Day remain byte-for-byte equivalent as authored data', () => {
  const existingSectionIds = ['opening', 'ceremony', 'the-day'];
  const existing = {
    sections: Object.fromEntries(existingSectionIds.map((id) => [id, authored.sections[id]])),
    elements: Object.fromEntries(Object.entries(authored.elements).filter(([, element]) => existingSectionIds.includes(element.sectionId)))
  };
  assert.equal(digest(existing), '1d6f6bd21982a4b1185f1896f2c7a009345ee460d9f55441074c618cecd26937');
});

test('Details participates in generic responsive mutation, Reset, and persistence', () => {
  const state = model.clone(authored);
  assert.equal(model.writeAuthoredProperty(state, { targetType: 'element', targetId: 'details-parking-title', path: 'frame.x', value: 312, scope: 'responsive', responsiveView: 'ipad' }), true);
  assert.equal(model.resolveElement(state.elements['details-parking-title'], 'ipad').frame.x, 312);
  assert.equal(model.resetResponsiveTarget(state, { targetType: 'element', targetId: 'details-parking-title', responsiveView: 'ipad' }), true);
  assert.equal(model.resolveElement(state.elements['details-parking-title'], 'ipad').frame.x, 24);

  const store = storage();
  assert.equal(loader.save('green-sage', authored, store), true);
  const restored = loader.load('green-sage', store);
  assert.deepEqual(plain(restored.sections.details), plain(authored.sections.details));
  orderedIds.forEach((id) => assert.deepEqual(plain(restored.elements[id]), plain(authored.elements[id])));

  const editorSource = fs.readFileSync(path.join(__dirname, '..', 'visual-editor.js'), 'utf8');
  assert.doesNotMatch(editorSource, /details-(?:label|dress-code|parking|adults-only|divider)/);
});
