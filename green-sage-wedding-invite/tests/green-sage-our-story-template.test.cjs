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
const section = authored.sections['our-story'];
const resolve = (view, id) => model.resolveElement(authored.elements[id], view);
const storage = () => {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)) };
};

const storyCopy = [
  'OUR STORY',
  'How We Met',
  'We first met unexpectedly, and what started as an easy conversation quickly turned into hours together. After that came long walks, shared dinners, and the kind of friendship that slowly became something more.',
  'A few years later, we’re beginning our next chapter together — and we’re so happy to celebrate it with the people we love most.',
  'With love, Isabella & Julian'
];
const copyIds = ['our-story-label', 'our-story-heading', 'our-story-body-1', 'our-story-body-2', 'our-story-signoff'];
const offsetIds = ['our-story-offset-top', 'our-story-offset-right', 'our-story-offset-bottom', 'our-story-offset-left'];
const borderIds = ['our-story-border-top', 'our-story-border-right', 'our-story-border-bottom', 'our-story-border-left'];

test('Our Story remains after Details in visual-document order without RSVP', () => {
  assert.deepEqual(plain(authored.document.sectionOrder), ['opening', 'ceremony', 'the-day', 'details', 'our-story']);
  assert.equal(section.name, 'Our Story');
  assert.equal(authored.sections.rsvp, undefined);
});

test('Our Story uses the exact concise first-person copy in two paragraphs', () => {
  assert.deepEqual(copyIds.map((id) => authored.elements[id].content), storyCopy);
  assert.equal(authored.elements['our-story-body-3'], undefined);
  assert.equal(storyCopy.filter((copy) => copy.startsWith('We ') || copy.startsWith('A few years')).length, 2);
});

test('Our Story photo keeps its editable identity and uses the supplied near-4:5 portrait', () => {
  const photo = authored.elements['our-story-photo'];
  assert.equal(photo.type, 'image');
  assert.equal(photo.assetKind, 'template');
  assert.deepEqual(plain(photo.permissions), { editable: true, movable: true, resizable: true, deletable: true, locked: false });
  assert.deepEqual(plain(photo.crop), { flipX: false, flipY: false, fit: 'cover', focalX: 50, focalY: 50, zoom: 1 });
  assert.ok(Math.abs(photo.frame.width / photo.frame.height - 0.8) < 0.001);
  assert.deepEqual(plain(model.getTemplateAsset('our-story-photo')), {
    id: 'our-story-photo', name: 'Our Story Photo', kind: 'image',
    url: 'invitation-assets/couple-portrait-optimized.jpg', width: 1122, height: 1402
  });
  assert.ok(fs.existsSync(path.join(root, 'invitation-assets/couple-portrait-optimized.jpg')));
});

test('photo border and every offset-frame element are completely removed', () => {
  [...offsetIds, ...borderIds].forEach((id) => {
    assert.equal(authored.elements[id], undefined);
    assert.equal(section.elementOrder.includes(id), false);
  });
  assert.deepEqual(plain(section.elementOrder), [
    'our-story-label', 'our-story-motif', 'our-story-heading',
    'our-story-body-1', 'our-story-body-2', 'our-story-signoff', 'our-story-photo'
  ]);
});

test('exact public line and four-point-star motif is a normal editable decorative element', () => {
  const motif = authored.elements['our-story-motif'];
  assert.equal(motif.type, 'decorative');
  assert.equal(motif.assetId, 'our-story-motif');
  assert.equal(motif.svgColor, '#626753');
  assert.equal(motif.permissions.editable, true);
  assert.ok(section.elementOrder.includes(motif.id));
  const svg = read('invitation-assets/our-story-motif.svg');
  assert.match(svg, /<line x1="0" y1="9" x2="91" y2="9"/);
  assert.match(svg, /M110 2c1\.5 4 3 5\.5 7 7/);
  assert.match(svg, /<line x1="129" y1="9" x2="220" y2="9"/);
});

test('responsive composition remains stacked on Mobile and split on iPad/Desktop', () => {
  const mobilePhoto = resolve('mobile', 'our-story-photo').frame;
  const mobileSignoff = resolve('mobile', 'our-story-signoff').frame;
  assert.ok(mobilePhoto.y > mobileSignoff.y + mobileSignoff.height);
  for (const view of ['ipad', 'desktop']) {
    const photo = resolve(view, 'our-story-photo').frame;
    const copy = resolve(view, 'our-story-body-2').frame;
    assert.ok(photo.x > copy.x + copy.width);
    assert.ok(photo.y < resolve(view, 'our-story-signoff').frame.y);
  }
  assert.deepEqual(plain(section.responsive.overrides), { ipad: { height: 650 }, desktop: { height: 760 } });
  assert.equal(section.height, 1030);
  assert.equal(section.background.kind, 'color');
  assert.equal(section.background.color, '#F3F2ED');
});

test('all required Our Story frames remain inside authored section bounds at every breakpoint', () => {
  for (const view of ['mobile', 'ipad', 'desktop']) {
    const height = model.resolveSection(section, view).height;
    const width = model.getCanvasMetrics(view).logicalWidth;
    section.elementOrder.forEach((id) => {
      const frame = resolve(view, id).frame;
      assert.ok(frame.x >= 0 && frame.y >= 0, `${view} ${id} begins outside section`);
      assert.ok(frame.x + frame.width <= width + 0.01, `${view} ${id} exceeds section width`);
      assert.ok(frame.y + frame.height <= height + 0.01, `${view} ${id} exceeds section height`);
    });
  }
});

test('typography establishes a quiet label, restrained heading, breathable body, and soft sign-off', () => {
  assert.equal(authored.elements['our-story-label'].style.fontFamily, 'Instrument Sans');
  assert.equal(authored.elements['our-story-label'].style.fontSize, 10);
  assert.equal(authored.elements['our-story-label'].style.letterSpacing, 3.4);
  assert.equal(authored.elements['our-story-heading'].style.fontFamily, 'Cormorant Garamond');
  assert.deepEqual(['mobile', 'ipad', 'desktop'].map((view) => resolve(view, 'our-story-heading').style.fontSize), [42, 44, 50]);
  ['our-story-body-1', 'our-story-body-2'].forEach((id) => assert.equal(authored.elements[id].style.fontFamily, 'Libre Baskerville'));
  assert.deepEqual(['mobile', 'ipad', 'desktop'].map((view) => resolve(view, 'our-story-body-1').style.fontSize), [14, 13.5, 14]);
  assert.deepEqual(['mobile', 'ipad', 'desktop'].map((view) => resolve(view, 'our-story-body-1').style.lineHeight), [1.72, 1.7, 1.72]);
  assert.deepEqual(['mobile', 'ipad', 'desktop'].map((view) => resolve(view, 'our-story-body-1').frame.width), [326, 280, 430]);
  assert.equal(authored.elements['our-story-signoff'].style.fontFamily, 'Allura');
  assert.deepEqual(['mobile', 'ipad', 'desktop'].map((view) => resolve(view, 'our-story-signoff').style.fontSize), [22, 20, 20]);
  copyIds.forEach((id) => assert.ok(model.fontCatalog.some((font) => font.name === authored.elements[id].style.fontFamily)));
});

test('visual-document refinement has no dependency on legacy public invitation files', () => {
  const sources = [read('green-sage-visual-template.js'), read('visual-document.js')].join('\n');
  assert.doesNotMatch(sources, /invitation\.html|invitation\.js/);
});

test('Opening refinement and unchanged Ceremony, The Day, and Details match approved document-model objects', () => {
  const expected = {
    opening: '52cb6c6bd4e8a903ec8245089da74c3772f61342985395e63a133373639353f7',
    ceremony: 'a73f2d26a071e170327004a6c2cd9baba63d7296142c70498a757341fc8bf560',
    'the-day': 'c76c5c20412e0d508591268f18d75abd3d99b2308a11228f17bbaad697d5ae6b',
    details: '5f8a903d8bb1e1d3f6967e0acf9969205757e0ef6d1f02900de24138164c075b'
  };
  Object.entries(expected).forEach(([id, digest]) => {
    const payload = { section: authored.sections[id], elements: authored.sections[id].elementOrder.map((elementId) => authored.elements[elementId]) };
    assert.equal(crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex'), digest, id);
  });
});

test('Our Story survives autosave-style persistence with sparse responsive data', () => {
  const store = storage();
  assert.equal(loader.save('green-sage', authored, store), true);
  const restored = loader.load('green-sage', store);
  assert.deepEqual(plain(restored.sections['our-story']), plain(section));
  section.elementOrder.forEach((id) => assert.deepEqual(plain(restored.elements[id]), plain(authored.elements[id])));
});
