const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const canvasSource = fs.readFileSync(path.join(__dirname, '..', 'visual-canvas.js'), 'utf8');
const helperStart = canvasSource.indexOf('  const countTextLines =');
const helperEnd = canvasSource.indexOf('  const updateOverflow =', helperStart);
assert.notEqual(helperStart, -1);
assert.notEqual(helperEnd, -1);

const loadOverflowCheck = ({ lineHeight, lineRects }) => {
  const context = {
    document: {
      createRange: () => ({
        selectNodeContents() {},
        getClientRects: () => lineRects,
      }),
    },
    getComputedStyle: () => ({ lineHeight: String(lineHeight) }),
  };
  context.globalThis = context;
  vm.runInNewContext(`${canvasSource.slice(helperStart, helperEnd)}\n  globalThis.textExceedsFrame = textExceedsFrame;`, context);
  return context.textExceedsFrame;
};

const content = ({ text = 'Text', clientWidth = 300, clientHeight = 54, scrollWidth = clientWidth, scrollHeight = clientHeight } = {}) => ({
  textContent: text,
  clientWidth,
  clientHeight,
  scrollWidth,
  scrollHeight,
});

test('approved ISABELLA and JULIAN line boxes fit in Mobile, iPad, and Desktop', () => {
  const measured = [
    { text: 'ISABELLA', lineHeight: 53.544, clientWidth: 303, clientHeight: 54, scrollHeight: 64, inkHeight: 75 },
    { text: 'ISABELLA', lineHeight: 52.992, clientWidth: 300, clientHeight: 53, scrollHeight: 64, inkHeight: 74.5 },
    { text: 'ISABELLA', lineHeight: 93.2659, clientWidth: 529, clientHeight: 93, scrollHeight: 112, inkHeight: 131 },
    { text: 'JULIAN', lineHeight: 56.304, clientWidth: 236, clientHeight: 56, scrollHeight: 68, inkHeight: 79 },
    { text: 'JULIAN', lineHeight: 56.58, clientWidth: 237, clientHeight: 57, scrollHeight: 68, inkHeight: 79.5 },
    { text: 'JULIAN', lineHeight: 99.5808, clientWidth: 418, clientHeight: 100, scrollHeight: 120, inkHeight: 140 },
  ];
  measured.forEach((item) => {
    const check = loadOverflowCheck({ lineHeight: `${item.lineHeight}px`, lineRects: [{ top: -11, width: item.clientWidth - 1, height: item.inkHeight }] });
    // Chromium's Baskervville ink/scroll boxes are larger than its fitted CSS line box.
    assert.equal(check({}, content({ ...item, scrollWidth: item.clientWidth })), false, item.text);
  });
});

test('Opening conjunction remains contained with Cormorant Garamond italic ink overhang', () => {
  const check = loadOverflowCheck({
    lineHeight: '19.2px',
    lineRects: [{ top: -3, width: 28.21, height: 25 }],
  });
  assert.equal(check({}, content({ clientWidth: 179, clientHeight: 32, scrollWidth: 179, scrollHeight: 32 })), false);
});

test('a genuinely undersized text frame still reports vertical overflow', () => {
  const check = loadOverflowCheck({
    lineHeight: '53.544px',
    lineRects: [{ top: -11, width: 302.27, height: 75 }],
  });
  assert.equal(check({}, content({ clientWidth: 303, clientHeight: 40, scrollWidth: 303, scrollHeight: 64 })), true);
});

test('wrapped lines and horizontal layout overflow still report overflow', () => {
  const wrapped = loadOverflowCheck({
    lineHeight: '22px',
    lineRects: [{ top: 10, width: 120, height: 28 }, { top: 10, width: 0, height: 28 }, { top: 32, width: 100, height: 28 }],
  });
  assert.equal(wrapped({}, content({ clientHeight: 32 })), true);

  const tooWide = loadOverflowCheck({ lineHeight: '20px', lineRects: [{ top: 10, width: 120, height: 25 }] });
  assert.equal(tooWide({}, content({ clientWidth: 100, scrollWidth: 120 })), true);
});

test('overflow is measured only after requested web fonts are ready', () => {
  const fontsReady = canvasSource.indexOf('await Promise.allSettled(fonts); await document.fonts?.ready;');
  const renderSections = canvasSource.indexOf('root.replaceChildren(...state.document.sectionOrder.map', fontsReady);
  const measureOverflow = canvasSource.indexOf('Object.values(state.elements).forEach(updateOverflow);', renderSections);
  assert.ok(fontsReady >= 0 && renderSections > fontsReady && measureOverflow > renderSections);
});
