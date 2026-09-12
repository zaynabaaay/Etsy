const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const context = { console, crypto: { randomUUID: () => 'test-id' }, setTimeout, clearTimeout };
context.globalThis = context;
['visual-document.js', 'green-sage-visual-template.js', 'visual-template-loader.js'].forEach((file) => vm.runInNewContext(read(file), context));
const model = context.GreenSageVisualDocument;
const template = context.GreenSageVisualTemplate;
const loader = context.StorielVisualTemplateLoader;
const plain = (value) => JSON.parse(JSON.stringify(value));
const authored = model.normalize(template.cloneDefault());
const section = authored.sections.rsvp;
const resolve = (view, id) => model.resolveElement(authored.elements[id], view);

const elementOrder = [
  'rsvp-label', 'rsvp-motif', 'rsvp-heading', 'rsvp-body',
  'rsvp-deadline-prefix', 'rsvp-deadline', 'rsvp-deadline-period',
  'rsvp-respond', 'rsvp-respond-underline'
];

test('RSVP is the sixth and final Green Sage visual-document section', () => {
  assert.deepEqual(plain(authored.document.sectionOrder), ['opening', 'ceremony', 'the-day', 'details', 'our-story', 'rsvp']);
  assert.equal(authored.document.sectionOrder.at(-1), 'rsvp');
  assert.equal(section.id, 'rsvp');
  assert.equal(section.name, 'RSVP');
  assert.deepEqual(plain(section.elementOrder), elementOrder);
});

test('RSVP preserves the exact public copy and centered hierarchy', () => {
  assert.equal(authored.elements['rsvp-label'].content, 'RSVP');
  assert.equal(authored.elements['rsvp-heading'].content, 'Will You Join Us?');
  assert.equal(authored.elements['rsvp-body'].content, 'We would be so honored to celebrate this day with you.');
  assert.equal(
    authored.elements['rsvp-deadline-prefix'].content + authored.elements['rsvp-deadline'].content + authored.elements['rsvp-deadline-period'].content,
    'Please reply by June 30, 2027.'
  );
  assert.equal(authored.elements['rsvp-respond'].content, 'Respond Here');
  const hierarchy = ['rsvp-label', 'rsvp-motif', 'rsvp-heading', 'rsvp-body', 'rsvp-deadline-prefix', 'rsvp-respond', 'rsvp-respond-underline'];
  for (const view of ['mobile', 'ipad', 'desktop']) {
    hierarchy.slice(1).forEach((id, index) => assert.ok(resolve(view, id).frame.y > resolve(view, hierarchy[index]).frame.y, `${view} ${id}`));
  }
});

test('RSVP uses the measured public background, section heights, typography, and colors', () => {
  assert.equal(section.background.kind, 'color');
  assert.equal(section.background.color, '#E6E3DC');
  assert.deepEqual(['mobile', 'ipad', 'desktop'].map((view) => model.resolveSection(section, view).height), [474.02, 798.72, 780]);
  assert.equal(authored.elements['rsvp-label'].style.fontFamily, 'Libre Baskerville');
  assert.equal(authored.elements['rsvp-heading'].style.fontFamily, 'Cormorant Garamond');
  ['rsvp-body', 'rsvp-deadline-prefix', 'rsvp-deadline', 'rsvp-deadline-period', 'rsvp-respond'].forEach((id) => assert.equal(authored.elements[id].style.fontFamily, 'Libre Baskerville'));
  assert.deepEqual(['mobile', 'ipad', 'desktop'].map((view) => resolve(view, 'rsvp-heading').style.fontSize), [46.02, 48, 66]);
  assert.deepEqual(['mobile', 'ipad', 'desktop'].map((view) => resolve(view, 'rsvp-body').style.fontSize), [13.5, 13, 13.824]);
  assert.equal(authored.elements['rsvp-body'].style.color, '#3F4037');
  assert.equal(authored.elements['rsvp-deadline'].style.color, '#626753');
});

test('the exact line and four-point-star motif is a normal editable decorative element', () => {
  const motif = authored.elements['rsvp-motif'];
  assert.equal(motif.type, 'decorative');
  assert.equal(motif.assetId, 'our-story-motif');
  assert.equal(motif.assetKind, 'template');
  assert.equal(motif.svgColor, '#626753');
  assert.equal(motif.opacity, 0.56);
  assert.deepEqual(plain(motif.permissions), { editable: true, movable: true, resizable: true, deletable: true, locked: false });
  const svg = read('invitation-assets/our-story-motif.svg');
  assert.match(svg, /<line x1="0" y1="9" x2="91" y2="9"/);
  assert.match(svg, /M110 2c1\.5 4 3 5\.5 7 7/);
  assert.match(svg, /<line x1="129" y1="9" x2="220" y2="9"/);
  assert.equal(model.getTemplateAsset(motif.assetId).recolorable, true);
});

test('Respond Here and its thin underline use existing editable element types', () => {
  const respond = authored.elements['rsvp-respond'];
  const underline = authored.elements['rsvp-respond-underline'];
  assert.equal(respond.type, 'text');
  assert.equal(respond.style.color, '#626753');
  assert.equal(respond.style.textAlign, 'center');
  assert.deepEqual(['mobile', 'ipad', 'desktop'].map((view) => resolve(view, respond.id).style.fontSize), [9, 9, 10.368]);
  assert.equal(underline.type, 'divider');
  assert.equal(underline.frame.height, 1);
  assert.equal(underline.opacity, 0.34);
  assert.equal(underline.style.color, '#626753');
  assert.deepEqual(plain(underline.permissions), { editable: true, movable: true, resizable: true, deletable: true, locked: false });
  Object.values(authored.elements).forEach((element) => assert.ok(['text', 'image', 'decorative', 'divider'].includes(element.type)));
});

test('Mobile, iPad, and Desktop retain the measured centered composition inside section bounds', () => {
  const expectedCenters = { mobile: 195, ipad: 384, desktop: 600 };
  for (const view of ['mobile', 'ipad', 'desktop']) {
    const height = model.resolveSection(section, view).height;
    const width = model.getCanvasMetrics(view).logicalWidth;
    section.elementOrder.forEach((id) => {
      const frame = resolve(view, id).frame;
      assert.ok(frame.x >= 0 && frame.y >= 0, `${view} ${id} starts out of bounds`);
      assert.ok(frame.x + frame.width <= width + 0.01, `${view} ${id} exceeds width`);
      assert.ok(frame.y + frame.height <= height + 0.01, `${view} ${id} exceeds height`);
    });
    ['rsvp-label', 'rsvp-motif', 'rsvp-heading', 'rsvp-body', 'rsvp-respond', 'rsvp-respond-underline'].forEach((id) => {
      const frame = resolve(view, id).frame;
      assert.ok(Math.abs(frame.x + frame.width / 2 - expectedCenters[view]) < 0.02, `${view} ${id} is not centered`);
    });
  }
  assert.deepEqual(plain(section.responsive.overrides), { ipad: { height: 798.72 }, desktop: { height: 780 } });
});

test('revision-2 persistence upgrades Editor and Preview to the same RSVP state while preserving old sections', () => {
  const saved = template.cloneDefault();
  saved.document.templateRevision = 2;
  saved.document.sectionOrder.pop();
  delete saved.sections.rsvp;
  Object.keys(saved.elements).forEach((id) => { if (saved.elements[id].sectionId === 'rsvp') delete saved.elements[id]; });
  saved.elements['ceremony-time'].content = 'Customer time';
  const normalizedSaved = model.normalize(saved);
  const before = Object.fromEntries(['opening', 'ceremony', 'the-day', 'details', 'our-story'].map((id) => [id, plain({ section: normalizedSaved.sections[id], elements: Object.values(normalizedSaved.elements).filter((element) => element.sectionId === id) })]));
  const makeStorage = () => {
    let value = JSON.stringify(saved);
    return { getItem: () => value, setItem: (_key, next) => { value = next; } };
  };
  const editor = loader.load('green-sage', makeStorage());
  const preview = loader.load('green-sage', makeStorage());
  assert.deepEqual(plain(editor), plain(preview));
  assert.equal(editor.document.templateRevision, 3);
  assert.equal(editor.elements['ceremony-time'].content, 'Customer time');
  Object.entries(before).forEach(([id, expected]) => assert.deepEqual(plain({ section: editor.sections[id], elements: Object.values(editor.elements).filter((element) => element.sectionId === id) }), expected, id));
});

test('Opening, Ceremony, The Day, Details, and Our Story remain byte-for-byte unchanged', () => {
  const expected = {
    opening: '52cb6c6bd4e8a903ec8245089da74c3772f61342985395e63a133373639353f7',
    ceremony: 'a73f2d26a071e170327004a6c2cd9baba63d7296142c70498a757341fc8bf560',
    'the-day': 'c76c5c20412e0d508591268f18d75abd3d99b2308a11228f17bbaad697d5ae6b',
    details: '5f8a903d8bb1e1d3f6967e0acf9969205757e0ef6d1f02900de24138164c075b',
    'our-story': 'bbb0f47d631284770bae8754f9dd3e768a8d43b59cb010784079f22a9f554550'
  };
  Object.entries(expected).forEach(([id, digest]) => {
    const payload = { section: authored.sections[id], elements: authored.sections[id].elementOrder.map((elementId) => authored.elements[elementId]) };
    assert.equal(crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex'), digest, id);
  });
});

test('visual RSVP stands alone without legacy runtime files or a new action schema', () => {
  const sources = [read('green-sage-visual-template.js'), read('visual-document.js'), read('visual-canvas.js')].join('\n');
  assert.doesNotMatch(sources, /invitation\.html|invitation\.js|section5-overrides\.css/);
  assert.doesNotMatch(read('green-sage-visual-template.js'), /type:\s*['"](?:button|link|action)['"]/);
});
