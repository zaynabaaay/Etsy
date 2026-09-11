const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const canvas = read('visual-canvas.js');
const styles = read('visual-canvas.css');
const helperStart = canvas.indexOf('  const recoveryHandlePosition =');
const helperEnd = canvas.indexOf('  const positionRecoveryHandles =', helperStart);
assert.notEqual(helperStart, -1);
assert.notEqual(helperEnd, -1);
const helperSource = canvas.slice(helperStart, helperEnd);

const context = {};
context.globalThis = context;
vm.runInNewContext(`${canvas.slice(helperStart, helperEnd)}\n  globalThis.recoveryHandlePosition = recoveryHandlePosition;`, context);
const position = (left, top, size = 32) => context.recoveryHandlePosition({ left, top, width: size, height: size }, { left: 0, top: 0, right: 390, bottom: 700 }, size, 4);

test('right-edge overflow keeps the full resize target inside the iframe viewport', () => {
  assert.deepEqual({ ...position(400, 200) }, { left: 354, top: 200 });
});

test('left-edge overflow keeps the full resize target inside the iframe viewport', () => {
  assert.deepEqual({ ...position(-40, 200) }, { left: 4, top: 200 });
});

test('top-edge overflow keeps the full resize target inside the iframe viewport', () => {
  assert.deepEqual({ ...position(160, -40) }, { left: 160, top: 4 });
});

test('bottom-edge overflow keeps the full resize target inside the iframe viewport', () => {
  assert.deepEqual({ ...position(160, 710) }, { left: 160, top: 664 });
});

test('text, image, decorative SVG, and divider retain their existing handle sets', () => {
  assert.match(canvas, /item\.type === 'decorative' \? \['nw', 'ne', 'se', 'sw'\]/);
  assert.match(canvas, /item\.type === 'divider' \? \['n', 'e', 's', 'w'\] : resizeDirections/);
  assert.match(canvas, /const resizeDirections = \['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'\]/);
  assert.match(canvas, /startResize\(event, item, frame, direction\)/);
});

test('only out-of-bounds selections switch from original to recovery handles', () => {
  assert.match(canvas, /!isOutside\(item\)\) return/);
  assert.match(canvas, /frame\.classList\.add\('has-recovery-handles'\)/);
  assert.match(styles, /\.element-frame\.has-recovery-handles > \.resize-handle\s*\{[^}]*visibility:\s*hidden/s);
  assert.match(styles, /\.recovery-resize-handles \.resize-handle\[data-direction\]\s*\{[^}]*position:\s*fixed[^}]*pointer-events:\s*auto/s);
});

test('persisted oversized geometry is not altered merely to render recovery controls', () => {
  const recovery = canvas.slice(canvas.indexOf('const recoveryHandlePosition'), canvas.indexOf('const startBackgroundReframe'));
  assert.doesNotMatch(recovery, /sendPatch|applyFrame|writeAuthored|item\.frame\s*=/);
  assert.match(recovery, /source\.getBoundingClientRect\(\)/);
});

test('normal and proportional resize math remain unchanged and responsive writes stay external', () => {
  const resize = canvas.slice(canvas.indexOf('const startResize'), canvas.indexOf('const recoveryHandlePosition'));
  assert.match(resize, /const factor = Math\.max\(40 \/ start\.frame\.width, 32 \/ start\.frame\.height, 1 \+ projected\)/);
  assert.match(resize, /if \(direction\.includes\('e'\)\) next\.width = Math\.max\(minWidth, start\.frame\.width \+ dx\)/);
  assert.match(resize, /applyFrame\(item, frame, next\)/);
  assert.doesNotMatch(helperSource, /responsive|override/);
});
