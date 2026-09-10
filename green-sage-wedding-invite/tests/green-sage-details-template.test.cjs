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
const groups = [
  ['dress-code', 'Dress Code', 'Formal attire', 'details-icon-dress-code'],
  ['parking', 'Parking', 'Complimentary parking is available on site.', 'details-icon-parking'],
  ['adults-only', 'Adults Only', 'We kindly request an adults-only celebration.', 'details-icon-adults-only'],
  ['accommodation', 'Accommodation', 'A list of nearby hotels is available on our website.', 'details-icon-accommodation'],
  ['transportation', 'Transportation', 'Shuttle service will be provided to and from the venue.', 'details-icon-transportation'],
  ['gifts', 'Gifts', 'Your presence is the greatest gift. A registry is available for those who wish to contribute.', 'details-icon-gifts']
];
const textIds = ['details-label', 'details-subtitle', ...groups.flatMap(([key]) => [`details-${key}-title`, `details-${key}-copy`])];
const iconIds = groups.map(([key]) => `details-${key}-icon`);
const dividerIds = ['details-divider-column-1', 'details-divider-column-2', 'details-divider-row-1', 'details-divider-row-2'];
const orderedIds = [
  'details-label', 'details-subtitle',
  ...groups.flatMap(([key]) => [`details-${key}-icon`, `details-${key}-title`, `details-${key}-copy`]),
  ...dividerIds
];
const storage = () => {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)) };
};

test('Details remains fourth and contains the complete editorial element order', () => {
  assert.deepEqual(plain(authored.document.sectionOrder), ['opening', 'ceremony', 'the-day', 'details']);
  assert.deepEqual(plain(authored.sections.details.elementOrder), orderedIds);
  assert.equal(new Set(authored.sections.details.elementOrder).size, orderedIds.length);
});

test('Details contains the requested heading and six exact information groups', () => {
  assert.equal(authored.elements['details-label'].content, 'DETAILS');
  assert.equal(authored.elements['details-subtitle'].content, 'A few things to know');
  assert.deepEqual(groups.map(([key]) => [
    authored.elements[`details-${key}-title`].content,
    authored.elements[`details-${key}-copy`].content,
    authored.elements[`details-${key}-icon`].assetId
  ]), groups.map(([, title, copy, assetId]) => [title, copy, assetId]));
});

test('Details uses stable semantic IDs and standard editable element behavior', () => {
  textIds.forEach((id) => {
    assert.equal(authored.elements[id].id, id);
    assert.equal(authored.elements[id].sectionId, 'details');
    assert.equal(authored.elements[id].type, 'text');
  });
  iconIds.forEach((id) => {
    assert.equal(authored.elements[id].id, id);
    assert.equal(authored.elements[id].sectionId, 'details');
    assert.equal(authored.elements[id].type, 'decorative');
    assert.equal(authored.elements[id].crop.fit, 'contain');
  });
  dividerIds.forEach((id) => assert.equal(authored.elements[id].type, 'divider'));
  orderedIds.forEach((id) => assert.deepEqual(plain(authored.elements[id].permissions), {
    editable: true, movable: true, resizable: true, deletable: true, locked: false
  }));
});

test('Details uses the supplied botanical paper background and increased responsive heights', () => {
  assert.deepEqual(plain(authored.sections.details.background), {
    kind: 'image', color: '#F4EFE7', assetId: 'background-green-sage-opening', assetKind: 'template', fit: 'cover', focalX: 50, focalY: 50, zoom: 1
  });
  assert.equal(model.resolveDocument(authored, 'mobile').sections.details.height, 844);
  assert.equal(model.resolveDocument(authored, 'ipad').sections.details.height, 760);
  assert.equal(model.resolveDocument(authored, 'desktop').sections.details.height, 760);
  assert.deepEqual(plain(authored.sections.details.responsive.overrides), { ipad: { height: 760 }, desktop: { height: 760 } });
});

test('Mobile resolves to a centered two-column by three-row layout', () => {
  const mobile = model.resolveDocument(authored, 'mobile');
  assert.deepEqual(iconIds.map((id) => plain(mobile.elements[id].frame)), [
    { x: 81, y: 170, width: 48, height: 48 }, { x: 262, y: 170, width: 48, height: 48 },
    { x: 81, y: 370, width: 48, height: 48 }, { x: 262, y: 370, width: 48, height: 48 },
    { x: 81, y: 570, width: 48, height: 48 }, { x: 262, y: 570, width: 48, height: 48 }
  ]);
  assert.deepEqual(groups.map(([key]) => plain(mobile.elements[`details-${key}-title`].frame)), [
    { x: 22, y: 217, width: 166, height: 32 }, { x: 202, y: 217, width: 166, height: 32 },
    { x: 22, y: 417, width: 166, height: 32 }, { x: 202, y: 417, width: 166, height: 32 },
    { x: 22, y: 617, width: 166, height: 32 }, { x: 202, y: 617, width: 166, height: 32 }
  ]);
  textIds.forEach((id) => assert.equal(mobile.elements[id].style.textAlign, 'center'));
});

test('iPad resolves to a balanced three-column by two-row layout', () => {
  const ipad = model.resolveDocument(authored, 'ipad');
  assert.deepEqual(iconIds.map((id) => plain(ipad.elements[id].frame)), [
    { x: 125, y: 197, width: 48, height: 48 }, { x: 360, y: 197, width: 48, height: 48 }, { x: 595, y: 197, width: 48, height: 48 },
    { x: 125, y: 437, width: 48, height: 48 }, { x: 360, y: 437, width: 48, height: 48 }, { x: 595, y: 437, width: 48, height: 48 }
  ]);
  assert.deepEqual(groups.map(([key]) => plain(ipad.elements[`details-${key}-title`].frame)), [
    { x: 54, y: 245, width: 190, height: 32 }, { x: 289, y: 245, width: 190, height: 32 }, { x: 524, y: 245, width: 190, height: 32 },
    { x: 54, y: 485, width: 190, height: 32 }, { x: 289, y: 485, width: 190, height: 32 }, { x: 524, y: 485, width: 190, height: 32 }
  ]);
});

test('Desktop resolves to a balanced three-column by two-row layout', () => {
  const desktop = model.resolveDocument(authored, 'desktop');
  assert.deepEqual(iconIds.map((id) => plain(desktop.elements[id].frame)), [
    { x: 226, y: 208, width: 48, height: 48 }, { x: 576, y: 208, width: 48, height: 48 }, { x: 926, y: 208, width: 48, height: 48 },
    { x: 226, y: 445, width: 48, height: 48 }, { x: 576, y: 445, width: 48, height: 48 }, { x: 926, y: 445, width: 48, height: 48 }
  ]);
  assert.deepEqual(groups.map(([key]) => plain(desktop.elements[`details-${key}-title`].frame)), [
    { x: 110, y: 258, width: 280, height: 32 }, { x: 460, y: 258, width: 280, height: 32 }, { x: 810, y: 258, width: 280, height: 32 },
    { x: 110, y: 495, width: 280, height: 32 }, { x: 460, y: 495, width: 280, height: 32 }, { x: 810, y: 495, width: 280, height: 32 }
  ]);
});

test('divider visibility changes from the Mobile grid to the wide grid without changing style', () => {
  const mobile = model.resolveDocument(authored, 'mobile');
  const ipad = model.resolveDocument(authored, 'ipad');
  const desktop = model.resolveDocument(authored, 'desktop');
  assert.deepEqual(dividerIds.map((id) => mobile.elements[id].visible), [true, false, true, true]);
  assert.deepEqual(dividerIds.map((id) => ipad.elements[id].visible), [true, true, true, false]);
  assert.deepEqual(dividerIds.map((id) => desktop.elements[id].visible), [true, true, true, false]);
  assert.deepEqual(dividerIds.map((id) => plain(ipad.elements[id].frame)), [
    { x: 266, y: 195, width: 1, height: 430 }, { x: 501, y: 195, width: 1, height: 430 },
    { x: 54, y: 400, width: 660, height: 1 }, { x: 28, y: 550, width: 334, height: 1 }
  ]);
  assert.deepEqual(dividerIds.map((id) => plain(desktop.elements[id].frame)), [
    { x: 425, y: 202, width: 1, height: 430 }, { x: 775, y: 202, width: 1, height: 430 },
    { x: 110, y: 405, width: 980, height: 1 }, { x: 28, y: 550, width: 334, height: 1 }
  ]);
  dividerIds.forEach((id) => {
    assert.equal(authored.elements[id].style.color, '#858977');
    assert.equal(authored.elements[id].opacity, 0.22);
  });
});

test('Details icon assets are safe, crisp, consistent fixed-color SVGs', () => {
  groups.forEach(([, , , assetId]) => {
    const asset = model.getTemplateAsset(assetId);
    assert.deepEqual([asset.kind, asset.width, asset.height], ['decorative', 24, 24]);
    const svg = fs.readFileSync(path.join(__dirname, '..', asset.url), 'utf8');
    assert.match(svg, /viewBox="0 0 24 24"/);
    assert.match(svg, /stroke="#626753"/);
    assert.match(svg, /stroke-width="1\.4"/);
    assert.doesNotMatch(svg, /<script|<foreignObject|javascript:|<image|\shref=/i);
  });
});

test('Details uses only approved palette roles and established typography', () => {
  assert.equal(authored.elements['details-label'].style.color, '#626753');
  assert.equal(authored.elements['details-subtitle'].style.color, '#44463D');
  groups.forEach(([key]) => {
    assert.equal(authored.elements[`details-${key}-title`].style.color, '#44463D');
    assert.equal(authored.elements[`details-${key}-copy`].style.color, '#5F6051');
    assert.equal(authored.elements[`details-${key}-title`].style.fontFamily, 'Instrument Serif');
    assert.equal(authored.elements[`details-${key}-copy`].style.fontFamily, 'Instrument Sans');
  });
  assert.deepEqual(plain(template.cloneDefault().document.colors), ['#F4EFE7', '#E6E5DF', '#858977', '#626753', '#44463D', '#5F6051']);
});

test('responsive authoring remains sparse and never duplicates content', () => {
  orderedIds.forEach((id) => {
    ['ipad', 'desktop'].forEach((view) => {
      const override = authored.elements[id].responsive.overrides?.[view];
      assert.equal(override?.content, undefined);
      assert.equal(override?.opacity, undefined);
      assert.equal(override?.rotation, undefined);
      assert.equal(override?.assetId, undefined);
    });
  });
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
  assert.equal(model.resolveElement(state.elements['details-parking-title'], 'ipad').frame.x, 202);

  const store = storage();
  assert.equal(loader.save('green-sage', authored, store), true);
  const restored = loader.load('green-sage', store);
  assert.deepEqual(plain(restored.sections.details), plain(authored.sections.details));
  orderedIds.forEach((id) => assert.deepEqual(plain(restored.elements[id]), plain(authored.elements[id])));

  const editorSource = fs.readFileSync(path.join(__dirname, '..', 'visual-editor.js'), 'utf8');
  assert.doesNotMatch(editorSource, /details-(?:label|subtitle|dress-code|parking|adults-only|accommodation|transportation|gifts|divider)/);
});
