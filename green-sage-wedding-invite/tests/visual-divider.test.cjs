const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const context = { console, crypto: { randomUUID: () => 'divider-id' }, setTimeout, clearTimeout };
context.globalThis = context;
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'visual-document.js'), 'utf8'), context);
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'visual-proof-fixture.js'), 'utf8'), context);
const model = context.GreenSageVisualDocument;
const plain = (value) => JSON.parse(JSON.stringify(value));
const fixture = () => context.StorielVisualProofFixture.cloneDefault();
const addDivider = (state, overrides = {}) => {
  const divider = model.createDividerElement({ id: 'divider-one', sectionId: 'proof-section', ...overrides });
  state.elements[divider.id] = divider;
  state.sections['proof-section'].elementOrder.push(divider.id);
  return divider;
};

test('divider normalization preserves authored frame, color, opacity, visibility, and permissions', () => {
  const state = fixture();
  addDivider(state, {
    frame: { x: 24, y: 310, width: 180, height: 1 }, opacity: 0.42, visible: false,
    style: { color: '#D8CEC1' }, permissions: { locked: true }
  });
  const divider = model.normalize(state).elements['divider-one'];
  assert.equal(divider.type, 'divider');
  assert.deepEqual(plain(divider.frame), { x: 24, y: 310, width: 180, height: 1 });
  assert.equal(divider.style.color, '#D8CEC1');
  assert.equal(divider.opacity, 0.42);
  assert.equal(divider.visible, false);
  assert.equal(divider.permissions.locked, true);
});

test('divider malformed values follow bounded schema-4 normalization', () => {
  const state = fixture();
  addDivider(state, { frame: { x: 'bad', y: 12, width: 0, height: 'bad' }, opacity: 9, visible: 'sometimes', style: { color: 'sage' } });
  const divider = model.normalize(state).elements['divider-one'];
  assert.deepEqual(plain(divider.frame), { x: 115, y: 12, width: 1, height: 1 });
  assert.equal(divider.style.color, '#6B6A54');
  assert.equal(divider.opacity, 1);
  assert.equal(Object.hasOwn(divider, 'visible'), false);
});

test('divider resolves base and sparse responsive frame and visibility overrides', () => {
  const state = fixture();
  const divider = addDivider(state, { frame: { x: 115, y: 309, width: 160, height: 2 } });
  divider.responsive.overrides = {
    ipad: { frame: { x: 300, y: 120, width: 1, height: 112 }, visible: true },
    desktop: { frame: { x: 480, width: 1, height: 120 }, visible: false }
  };
  const normalized = model.normalize(state);
  assert.deepEqual(plain(model.resolveElement(normalized.elements['divider-one'], 'mobile').frame), { x: 115, y: 309, width: 160, height: 2 });
  assert.deepEqual(plain(model.resolveElement(normalized.elements['divider-one'], 'ipad').frame), { x: 300, y: 120, width: 1, height: 112 });
  assert.equal(model.resolveElement(normalized.elements['divider-one'], 'ipad').visible, true);
  assert.equal(model.resolveElement(normalized.elements['divider-one'], 'desktop').visible, false);
});

test('divider frame and visibility mutations route independently by responsive view', () => {
  const state = fixture(); addDivider(state);
  assert.equal(model.writeAuthoredProperty(state, { targetType: 'element', targetId: 'divider-one', path: 'frame.x', value: 100, scope: 'responsive', responsiveView: 'mobile' }), true);
  assert.equal(model.writeAuthoredProperty(state, { targetType: 'element', targetId: 'divider-one', path: 'frame.x', value: 320, scope: 'responsive', responsiveView: 'ipad' }), true);
  assert.equal(model.writeAuthoredProperty(state, { targetType: 'element', targetId: 'divider-one', path: 'frame.x', value: 560, scope: 'responsive', responsiveView: 'desktop' }), true);
  assert.equal(model.writeAuthoredProperty(state, { targetType: 'element', targetId: 'divider-one', path: 'visible', value: false, scope: 'responsive', responsiveView: 'ipad' }), true);
  const divider = model.normalize(state).elements['divider-one'];
  assert.equal(divider.frame.x, 100);
  assert.deepEqual(plain(divider.responsive.overrides.ipad), { frame: { x: 320 }, visible: false });
  assert.deepEqual(plain(divider.responsive.overrides.desktop), { frame: { x: 560 } });
  assert.equal(model.resolveElement(divider, 'mobile').visible, true);
  assert.equal(model.resolveElement(divider, 'ipad').visible, false);
});

test('responsive divider insertion creates one logical element and sparse active placement', () => {
  const state = fixture(); const section = state.sections['proof-section'];
  const baseFrame = model.getDefaultElementPlacement({ type: 'divider', view: 'mobile', section, baseFrame: { x: 115, y: 0, width: 160, height: 2 } });
  const activeFrame = model.getDefaultElementPlacement({ type: 'divider', view: 'desktop', section: model.resolveSection(section, 'desktop'), baseFrame: { x: 115, y: 0, width: 160, height: 2 } });
  addDivider(state, { frame: baseFrame });
  for (const key of ['x', 'y', 'width', 'height']) model.writeAuthoredProperty(state, { targetType: 'element', targetId: 'divider-one', path: `frame.${key}`, value: activeFrame[key], scope: 'responsive', responsiveView: 'desktop' });
  const normalized = model.normalize(state); const divider = normalized.elements['divider-one'];
  assert.equal(Object.keys(normalized.elements).filter((id) => id === 'divider-one').length, 1);
  assert.equal(normalized.sections['proof-section'].elementOrder.filter((id) => id === 'divider-one').length, 1);
  assert.deepEqual(plain(divider.responsive.overrides.desktop), { frame: { x: 520 } });
});

test('existing lock, duplicate, delete, layer, history, and persistence semantics retain dividers', () => {
  const before = fixture(); const divider = addDivider(before, { style: { color: '#A3A792' }, opacity: 0.5 });
  divider.permissions.locked = true;
  const inserted = model.normalize(before); const after = model.clone(inserted);
  const copy = model.clone(after.elements['divider-one']); copy.id = 'divider-copy'; copy.permissions.locked = false; copy.frame.x += 12;
  after.elements[copy.id] = copy; after.sections['proof-section'].elementOrder.push(copy.id);
  const persisted = model.normalize(JSON.parse(JSON.stringify(after)));
  assert.equal(persisted.elements['divider-one'].permissions.locked, true);
  assert.equal(persisted.elements['divider-copy'].style.color, '#A3A792');
  assert.equal(persisted.sections['proof-section'].elementOrder.at(-1), 'divider-copy');
  const undo = model.clone(inserted); assert.equal(undo.elements['divider-copy'], undefined);
  const redo = model.clone(persisted); delete redo.elements['divider-copy']; redo.sections['proof-section'].elementOrder = redo.sections['proof-section'].elementOrder.filter((id) => id !== 'divider-copy');
  assert.equal(redo.elements['divider-copy'], undefined);
  assert.equal(redo.sections['proof-section'].elementOrder.includes('divider-copy'), false);
});

test('visibility pruning and Reset this view restore inheritance without losing the divider', () => {
  const state = fixture(); addDivider(state);
  model.writeAuthoredProperty(state, { targetType: 'element', targetId: 'divider-one', path: 'visible', value: false, scope: 'responsive', responsiveView: 'ipad' });
  const beforeReset = model.normalize(state);
  assert.equal(model.hasResponsiveOverrides(beforeReset, 'ipad'), true);
  const reset = model.clone(beforeReset);
  assert.equal(model.resetResponsiveView(reset, 'ipad'), true);
  assert.equal(reset.elements['divider-one'] != null, true);
  assert.equal(model.resolveElement(reset.elements['divider-one'], 'ipad').visible, true);
  assert.equal(reset.elements['divider-one'].responsive.overrides, undefined);
  const undo = model.clone(beforeReset);
  assert.equal(model.resolveElement(undo.elements['divider-one'], 'ipad').visible, false);
  model.writeAuthoredProperty(undo, { targetType: 'element', targetId: 'divider-one', path: 'visible', value: true, scope: 'responsive', responsiveView: 'ipad' });
  assert.equal(undo.elements['divider-one'].responsive.overrides, undefined);
});

test('existing schema-4 text and image elements do not gain authored visibility fields', () => {
  const before = fixture(); const normalized = model.normalize(before);
  assert.equal(Object.hasOwn(normalized.elements['proof-heading'], 'visible'), false);
  assert.equal(Object.hasOwn(normalized.elements['proof-copy'], 'visible'), false);
  assert.equal(model.resolveElement(normalized.elements['proof-heading'], 'mobile').visible, true);
});
