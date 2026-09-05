const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const context = { console, crypto: { randomUUID: () => 'test-id' }, setTimeout, clearTimeout };
context.globalThis = context;
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'visual-document.js'), 'utf8'), context);
const model = context.GreenSageVisualDocument;
const plain = (value) => JSON.parse(JSON.stringify(value));

test('schema 3 migrates to schema 4 without responsive overrides or geometry changes', () => {
  const source = model.cloneDefaults();
  source.schemaVersion = 3;
  delete source.sections['proof-section'].responsive;
  source.sections['proof-section'].height = 901;
  source.elements['proof-heading'].frame = { x: 35, y: 100, width: 320, height: 80 };
  const normalized = model.normalize(source);

  assert.equal(normalized.schemaVersion, 4);
  assert.equal(normalized.document.canvas.baseWidth, 390);
  assert.equal(normalized.sections['proof-section'].height, 901);
  assert.deepEqual(plain(normalized.elements['proof-heading'].frame), source.elements['proof-heading'].frame);
  assert.deepEqual(plain(normalized.document.sectionOrder), plain(source.document.sectionOrder));
  assert.deepEqual(plain(normalized.sections['proof-section'].elementOrder), plain(source.sections['proof-section'].elementOrder));
  assert.equal(normalized.sections['proof-section'].id, 'proof-section');
  assert.equal(normalized.elements['proof-heading'].id, 'proof-heading');
  assert.equal(normalized.sections['proof-section'].responsive.overrides, undefined);
  assert.equal(normalized.elements['proof-heading'].responsive.overrides, undefined);
});

test('known breakpoint overrides stay sparse and unsupported fields are stripped', () => {
  const source = model.cloneDefaults();
  source.elements['proof-heading'].responsive.overrides = {
    ipad: {
      frame: { x: 120, width: 500 },
      style: { fontSize: 55 },
      content: 'Blocked', opacity: 0.4, rotation: 30,
      permissions: { locked: true }, crop: { zoom: 2 }
    },
    desktop: {},
    futureWide: { frame: { x: 333 }, experimental: true }
  };
  source.sections['proof-section'].responsive = { overrides: {
    desktop: { height: 700, background: { focalY: 60, color: '#000000' }, elementOrder: [] },
    ipad: {}
  } };
  const normalized = model.normalize(source);

  assert.deepEqual(plain(normalized.elements['proof-heading'].responsive.overrides.ipad), {
    frame: { x: 120, width: 500 }, style: { fontSize: 55 }
  });
  assert.equal(normalized.elements['proof-heading'].responsive.overrides.desktop, undefined);
  assert.deepEqual(plain(normalized.elements['proof-heading'].responsive.overrides.futureWide), { frame: { x: 333 }, experimental: true });
  assert.deepEqual(plain(normalized.sections['proof-section'].responsive.overrides.desktop), { height: 700, background: { focalY: 60 } });
  assert.equal(normalized.sections['proof-section'].responsive.overrides.ipad, undefined);
});

test('resolver inherits sparse frame, text, crop, and section overrides', () => {
  const source = model.cloneDefaults();
  source.elements['proof-heading'].frame = { x: 35, y: 100, width: 320, height: 80 };
  source.elements['proof-heading'].style.fontSize = 46;
  source.elements['proof-heading'].style.lineHeight = 1.04;
  source.elements['proof-heading'].responsive.overrides = {
    ipad: { frame: { x: 120, width: 500 } },
    desktop: { style: { fontSize: 64 } }
  };
  const image = model.createImageElement({ id: 'image-one', sectionId: 'proof-section', assetId: 'asset-one', crop: { focalX: 50, focalY: 50, zoom: 1 } });
  image.responsive.overrides = { ipad: { crop: { focalX: 42, zoom: 1.2 } } };
  source.elements['image-one'] = image;
  source.sections['proof-section'].elementOrder.push('image-one');
  source.sections['proof-section'].responsive = { overrides: { desktop: { height: 700, background: { focalY: 60 } } } };
  const normalized = model.normalize(source);

  const ipad = model.resolveDocument(normalized, 'ipad');
  assert.deepEqual(plain(ipad.elements['proof-heading'].frame), { x: 120, y: 100, width: 500, height: 80 });
  assert.deepEqual(plain({ focalX: ipad.elements['image-one'].crop.focalX, focalY: ipad.elements['image-one'].crop.focalY, zoom: ipad.elements['image-one'].crop.zoom }), { focalX: 42, focalY: 50, zoom: 1.2 });

  const desktop = model.resolveDocument(normalized, 'desktop');
  assert.equal(desktop.elements['proof-heading'].style.fontSize, 64);
  assert.equal(desktop.elements['proof-heading'].style.lineHeight, 1.04);
  assert.equal(desktop.sections['proof-section'].height, 700);
  assert.equal(desktop.sections['proof-section'].background.focalX, 50);
  assert.equal(desktop.sections['proof-section'].background.focalY, 60);
});

test('global fields cannot be overridden and resolved projections are isolated', () => {
  const source = model.cloneDefaults();
  source.elements['proof-heading'].responsive.overrides = { ipad: {
    content: 'Blocked', assetId: 'blocked', rotation: 90, opacity: 0,
    permissions: { locked: true }, style: { fontFamily: 'Inter', color: '#000000' },
    crop: { flipX: true }, frame: { x: 0 }
  } };
  const image = model.createImageElement({ id: 'image-one', sectionId: 'proof-section', assetId: 'asset-one' });
  image.responsive.overrides = { ipad: { crop: { focalX: 42 } } };
  source.elements['image-one'] = image;
  source.sections['proof-section'].elementOrder.push('image-one');
  source.sections['proof-section'].responsive = { overrides: { ipad: { elementOrder: [], height: 700 } } };
  const normalized = model.normalize(source);
  const authoredBefore = JSON.stringify(normalized);
  const mobile = model.resolveDocument(normalized, 'mobile');
  const resolved = model.resolveDocument(normalized, 'ipad');
  const desktop = model.resolveDocument(normalized, 'desktop');

  assert.equal(resolved.elements['proof-heading'].content, normalized.elements['proof-heading'].content);
  assert.equal(resolved.elements['proof-heading'].rotation, normalized.elements['proof-heading'].rotation);
  assert.equal(resolved.elements['proof-heading'].opacity, normalized.elements['proof-heading'].opacity);
  assert.equal(resolved.elements['proof-heading'].style.fontFamily, normalized.elements['proof-heading'].style.fontFamily);
  assert.equal(resolved.elements['proof-heading'].style.color, normalized.elements['proof-heading'].style.color);
  assert.deepEqual(plain(resolved.sections['proof-section'].elementOrder), plain(normalized.sections['proof-section'].elementOrder));

  resolved.elements['proof-heading'].frame.x = 999;
  resolved.elements['proof-heading'].style.fontSize = 1;
  resolved.elements['image-one'].crop.focalX = 1;
  resolved.sections['proof-section'].background.focalX = 1;
  resolved.sections['proof-section'].elementOrder.reverse();
  mobile.elements['proof-heading'].frame.x = 888;
  desktop.sections['proof-section'].background.focalY = 2;
  assert.equal(JSON.stringify(normalized), authoredBefore);
  model.resolveDocument(normalized, 'desktop');
  assert.equal(JSON.stringify(normalized), authoredBefore);
  assert.equal(JSON.stringify(model.normalize(JSON.parse(authoredBefore))), authoredBefore);
});

const write = (state, options) => {
  const next = model.clone(state);
  assert.equal(model.writeAuthoredProperty(next, options), true);
  return model.normalize(next);
};

test('responsive writes create independent sparse frame overrides', () => {
  let state = model.cloneDefaults();
  state = write(state, { targetType: 'element', targetId: 'proof-heading', path: 'frame.x', value: 100, scope: 'responsive', responsiveView: 'ipad' });
  assert.equal(state.elements['proof-heading'].frame.x, 35);
  assert.deepEqual(plain(state.elements['proof-heading'].responsive.overrides.ipad), { frame: { x: 100 } });

  state = write(state, { targetType: 'element', targetId: 'proof-heading', path: 'frame.x', value: 220, scope: 'responsive', responsiveView: 'desktop' });
  state = write(state, { targetType: 'element', targetId: 'proof-heading', path: 'frame.y', value: 140, scope: 'responsive', responsiveView: 'desktop' });
  assert.deepEqual(plain(state.elements['proof-heading'].responsive.overrides.ipad), { frame: { x: 100 } });
  assert.deepEqual(plain(state.elements['proof-heading'].responsive.overrides.desktop), { frame: { x: 220, y: 140 } });
  assert.equal(state.elements['proof-heading'].responsive.overrides.desktop.frame.width, undefined);
  assert.equal(state.elements['proof-heading'].responsive.overrides.desktop.frame.height, undefined);
});

test('redundant breakpoint writes prune only the edited override path', () => {
  let state = model.cloneDefaults();
  state = write(state, { targetType: 'element', targetId: 'proof-heading', path: 'style.fontSize', value: 64, scope: 'responsive', responsiveView: 'desktop' });
  state = write(state, { targetType: 'element', targetId: 'proof-heading', path: 'frame.x', value: 200, scope: 'responsive', responsiveView: 'desktop' });
  state = write(state, { targetType: 'element', targetId: 'proof-heading', path: 'style.fontSize', value: 46, scope: 'responsive', responsiveView: 'desktop' });
  assert.deepEqual(plain(state.elements['proof-heading'].responsive.overrides.desktop), { frame: { x: 200 } });
  state = write(state, { targetType: 'element', targetId: 'proof-heading', path: 'frame.x', value: 35, scope: 'responsive', responsiveView: 'desktop' });
  assert.equal(state.elements['proof-heading'].responsive.overrides, undefined);
});

test('Mobile base writes preserve explicit overrides and update inherited views', () => {
  let state = model.cloneDefaults();
  state = write(state, { targetType: 'element', targetId: 'proof-heading', path: 'style.fontSize', value: 64, scope: 'responsive', responsiveView: 'desktop' });
  state = write(state, { targetType: 'element', targetId: 'proof-heading', path: 'style.fontSize', value: 50, scope: 'responsive', responsiveView: 'mobile' });
  assert.equal(state.elements['proof-heading'].style.fontSize, 50);
  assert.equal(model.resolveElement(state.elements['proof-heading'], 'mobile').style.fontSize, 50);
  assert.equal(model.resolveElement(state.elements['proof-heading'], 'ipad').style.fontSize, 50);
  assert.equal(model.resolveElement(state.elements['proof-heading'], 'desktop').style.fontSize, 64);
  assert.equal(state.elements['proof-heading'].responsive.overrides.desktop.style.fontSize, 64);
});

test('global writes stay shared in every view and never create overrides', () => {
  let state = model.cloneDefaults();
  const rejected = model.clone(state);
  assert.equal(model.writeAuthoredProperty(rejected, { targetType: 'element', targetId: 'proof-heading', path: 'opacity', value: 0.5, scope: 'responsive', responsiveView: 'desktop' }), false);
  assert.equal(rejected.elements['proof-heading'].responsive.overrides, undefined);
  state = write(state, { targetType: 'element', targetId: 'proof-heading', path: 'content', value: 'Shared responsive invitation', scope: 'global', responsiveView: 'desktop' });
  assert.equal(state.elements['proof-heading'].responsive.overrides, undefined);
  ['mobile', 'ipad', 'desktop'].forEach((view) => assert.equal(model.resolveElement(state.elements['proof-heading'], view).content, 'Shared responsive invitation'));
});

test('crop and section writes resolve independently without materializing inherited values', () => {
  let state = model.cloneDefaults();
  const image = model.createImageElement({ id: 'image-one', sectionId: 'proof-section', assetId: 'asset-one', crop: { focalX: 50, focalY: 50, zoom: 1 } });
  state.elements['image-one'] = image; state.sections['proof-section'].elementOrder.push('image-one'); state = model.normalize(state);
  state = write(state, { targetType: 'element', targetId: 'image-one', path: 'crop.focalX', value: 42, scope: 'responsive', responsiveView: 'ipad' });
  state = write(state, { targetType: 'element', targetId: 'image-one', path: 'crop.zoom', value: 1.4, scope: 'responsive', responsiveView: 'desktop' });
  state = write(state, { targetType: 'section', targetId: 'proof-section', path: 'height', value: 700, scope: 'responsive', responsiveView: 'ipad' });

  assert.deepEqual(plain(state.elements['image-one'].responsive.overrides.ipad), { crop: { focalX: 42 } });
  assert.deepEqual(plain(state.elements['image-one'].responsive.overrides.desktop), { crop: { zoom: 1.4 } });
  assert.equal(model.resolveElement(state.elements['image-one'], 'mobile').crop.focalX, 50);
  assert.equal(model.resolveElement(state.elements['image-one'], 'ipad').crop.focalX, 42);
  assert.equal(model.resolveElement(state.elements['image-one'], 'desktop').crop.zoom, 1.4);
  assert.deepEqual(plain(state.sections['proof-section'].responsive.overrides.ipad), { height: 700 });
  assert.equal(model.resolveSection(state.sections['proof-section'], 'mobile').height, 844);
  assert.equal(model.resolveSection(state.sections['proof-section'], 'ipad').height, 700);
  assert.equal(model.resolveSection(state.sections['proof-section'], 'desktop').height, 844);
});

test('canonical snapshots undo and redo first-override creation exactly', () => {
  const before = model.cloneDefaults();
  const after = write(before, { targetType: 'element', targetId: 'proof-heading', path: 'frame.x', value: 100, scope: 'responsive', responsiveView: 'ipad' });
  let current = model.clone(before);
  assert.equal(current.elements['proof-heading'].responsive.overrides, undefined);
  current = model.clone(after);
  assert.deepEqual(plain(current.elements['proof-heading'].responsive.overrides.ipad), { frame: { x: 100 } });
  assert.deepEqual(plain(before), plain(model.cloneDefaults()));
});

const insertFixtureElement = ({ view, type = 'text', baseFrame, assetId = '', assetMetadata = null, index = 0 }) => {
  const before = model.cloneDefaults();
  const next = model.clone(before);
  const section = next.sections['proof-section'];
  const id = `inserted-${view}-${type}`;
  const mobileFrame = model.getDefaultElementPlacement({ type, view: 'mobile', section, baseFrame, assetMetadata, index, safeMargin: next.document.canvas.safeMargin });
  const activeFrame = model.getDefaultElementPlacement({ type, view, section: model.resolveSection(section, view), baseFrame, assetMetadata, index, safeMargin: next.document.canvas.safeMargin });
  const element = type === 'text'
    ? model.createTextElement({ id, sectionId: section.id, content: 'Inserted once', frame: mobileFrame })
    : model.createImageElement({ id, sectionId: section.id, type, assetId, assetKind: type === 'decorative' ? 'template' : 'upload', frame: mobileFrame, crop: { fit: type === 'decorative' ? 'contain' : 'cover' } });
  next.elements[id] = element;
  section.elementOrder.push(id);
  if (view !== 'mobile') {
    ['x', 'y', 'width', 'height'].forEach((key) => assert.equal(model.writeAuthoredProperty(next, {
      targetType: 'element', targetId: id, path: `frame.${key}`, value: activeFrame[key], scope: 'responsive', responsiveView: view
    }), true));
  }
  return { before, state: model.normalize(next), id, mobileFrame, activeFrame };
};

test('Mobile insertion preserves the existing preset and creates no breakpoint overrides', () => {
  const result = insertFixtureElement({ view: 'mobile', baseFrame: { x: 35, y: 120, width: 320, height: 80 } });
  assert.deepEqual(plain(result.state.elements[result.id].frame), { x: 35, y: 120, width: 320, height: 80 });
  assert.equal(result.state.elements[result.id].responsive.overrides, undefined);
  assert.equal(result.state.sections['proof-section'].elementOrder.filter((id) => id === result.id).length, 1);
});

test('iPad and Desktop insertion keep one shared element and sparse active-view placement', () => {
  const baseFrame = { x: 35, y: 120, width: 320, height: 80 };
  const ipad = insertFixtureElement({ view: 'ipad', baseFrame });
  assert.deepEqual(plain(ipad.state.elements[ipad.id].frame), baseFrame);
  assert.deepEqual(plain(ipad.state.elements[ipad.id].responsive.overrides), { ipad: { frame: { x: 224 } } });
  assert.equal(ipad.state.elements[ipad.id].responsive.overrides.desktop, undefined);
  assert.equal(ipad.state.sections['proof-section'].elementOrder.filter((id) => id === ipad.id).length, 1);

  const desktop = insertFixtureElement({ view: 'desktop', baseFrame });
  assert.deepEqual(plain(desktop.state.elements[desktop.id].frame), baseFrame);
  assert.deepEqual(plain(desktop.state.elements[desktop.id].responsive.overrides), { desktop: { frame: { x: 440 } } });
  assert.equal(desktop.state.elements[desktop.id].responsive.overrides.ipad, undefined);
  assert.deepEqual(plain(model.resolveElement(desktop.state.elements[desktop.id], 'desktop').frame), { x: 440, y: 120, width: 320, height: 80 });
  assert.deepEqual(plain(model.resolveElement(desktop.state.elements[desktop.id], 'ipad').frame), baseFrame);
  assert.deepEqual(plain(model.resolveElement(desktop.state.elements[desktop.id], 'mobile').frame), baseFrame);
});

test('wide-view image insertion remains conservatively sized with shared source data', () => {
  const result = insertFixtureElement({ view: 'desktop', type: 'image', assetId: 'upload-one', baseFrame: { x: 65, y: 410, width: 260, height: 220 } });
  const element = result.state.elements[result.id];
  assert.deepEqual(plain(element.frame), { x: 65, y: 410, width: 260, height: 220 });
  assert.deepEqual(plain(element.responsive.overrides), { desktop: { frame: { x: 470 } } });
  assert.equal(element.assetId, 'upload-one');
  assert.equal(element.responsive.overrides.desktop.assetId, undefined);
  assert.equal(model.resolveElement(element, 'desktop').frame.width, 260);
  assert.equal(model.resolveElement(element, 'desktop').frame.height, 220);
});

test('decorative insertion preserves natural ratio in Mobile and Desktop', () => {
  const asset = model.getTemplateAsset('asset-botanical-left');
  const result = insertFixtureElement({ view: 'desktop', type: 'decorative', assetId: asset.id, assetMetadata: asset, baseFrame: { x: 65, y: 410, width: 260, height: 220 } });
  const element = result.state.elements[result.id];
  const desktopFrame = model.resolveElement(element, 'desktop').frame;
  const ratio = asset.width / asset.height;
  assert.ok(Math.abs(element.frame.width / element.frame.height - ratio) < 1e-9);
  assert.ok(Math.abs(desktopFrame.width / desktopFrame.height - ratio) < 1e-9);
  assert.deepEqual(plain(element.responsive.overrides), { desktop: { frame: { x: 470 } } });
  assert.equal(element.assetId, asset.id);
  assert.equal(element.crop.fit, 'contain');
});

test('one insertion snapshot undoes and redoes element, override, and layer entry together', () => {
  const result = insertFixtureElement({ view: 'ipad', baseFrame: { x: 35, y: 120, width: 320, height: 80 } });
  let current = model.clone(result.state);
  assert.ok(current.elements[result.id]);
  assert.deepEqual(plain(current.elements[result.id].responsive.overrides), { ipad: { frame: { x: 224 } } });
  assert.ok(current.sections['proof-section'].elementOrder.includes(result.id));

  current = model.clone(result.before);
  assert.equal(current.elements[result.id], undefined);
  assert.equal(current.sections['proof-section'].elementOrder.includes(result.id), false);

  current = model.clone(result.state);
  assert.ok(current.elements[result.id]);
  assert.deepEqual(plain(current.elements[result.id].responsive.overrides), { ipad: { frame: { x: 224 } } });
  assert.equal(current.sections['proof-section'].elementOrder.filter((id) => id === result.id).length, 1);
});
