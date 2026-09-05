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
