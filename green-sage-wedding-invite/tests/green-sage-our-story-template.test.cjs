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

const publicCopy = [
  'OUR STORY',
  'How We Met',
  'We met the way the best things often happen — unexpectedly, and at exactly the right time.',
  'What started with easy conversation became long walks, shared plans, and the kind of everyday moments that quietly turn into a life together.',
  'Now we get to celebrate the next chapter with the people who have been part of our story along the way.',
  'With love, Isabella & Julian'
];
const copyIds = ['our-story-label', 'our-story-heading', 'our-story-body-1', 'our-story-body-2', 'our-story-body-3', 'our-story-signoff'];
const offsetIds = ['our-story-offset-top', 'our-story-offset-right', 'our-story-offset-bottom', 'our-story-offset-left'];
const borderIds = ['our-story-border-top', 'our-story-border-right', 'our-story-border-bottom', 'our-story-border-left'];

test('Our Story exists after Details in the public invitation order without RSVP', () => {
  assert.deepEqual(plain(authored.document.sectionOrder), ['opening', 'ceremony', 'the-day', 'details', 'our-story']);
  assert.equal(section.name, 'Our Story');
  assert.equal(authored.sections.rsvp, undefined);
  const publicSource = read('invitation.js');
  assert.ok(publicSource.indexOf("document.querySelector('.details-section')") < publicSource.indexOf('our-story-section'));
  assert.ok(publicSource.indexOf('our-story-section') < publicSource.indexOf('rsvp-section'));
});

test('Our Story preserves the public copy exactly', () => {
  assert.deepEqual(copyIds.map((id) => authored.elements[id].content), publicCopy);
  const publicSource = read('invitation.js').replaceAll('&amp;', '&');
  assert.ok(publicSource.includes('>Our Story<')); // Public CSS renders this source label uppercase.
  publicCopy.slice(1).forEach((copy) => assert.ok(publicSource.includes(copy), `missing public copy: ${copy}`));
});

test('Our Story photo is a normal editable image with the public source and centered 4:5 cover crop', () => {
  const photo = authored.elements['our-story-photo'];
  assert.equal(photo.type, 'image');
  assert.equal(photo.assetKind, 'template');
  assert.deepEqual(plain(photo.permissions), { editable: true, movable: true, resizable: true, deletable: true, locked: false });
  assert.deepEqual(plain(photo.crop), { flipX: false, flipY: false, fit: 'cover', focalX: 50, focalY: 50, zoom: 1 });
  assert.ok(Math.abs(photo.frame.width / photo.frame.height - 0.8) < 0.001);
  assert.deepEqual(plain(model.getTemplateAsset('our-story-photo')), {
    id: 'our-story-photo', name: 'Our Story Photo', kind: 'image',
    url: 'https://images.unsplash.com/photo-1616687818402-c768b3638374?auto=format&fit=crop&fm=jpg&q=90&w=1800', width: 1800, height: 1200
  });
});

test('photo border and offset outline are separate editable geometry in explicit layer order', () => {
  [...offsetIds, ...borderIds].forEach((id) => {
    assert.equal(authored.elements[id].type, 'divider');
    assert.equal(authored.elements[id].permissions.editable, true);
    assert.equal(authored.elements[id].permissions.movable, true);
    assert.equal(authored.elements[id].permissions.resizable, true);
  });
  assert.ok(Math.max(...offsetIds.map((id) => section.elementOrder.indexOf(id))) < section.elementOrder.indexOf('our-story-photo'));
  assert.ok(section.elementOrder.indexOf('our-story-photo') < Math.min(...borderIds.map((id) => section.elementOrder.indexOf(id))));
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

test('responsive composition matches public stacked mobile and split iPad/Desktop layouts', () => {
  const mobilePhoto = resolve('mobile', 'our-story-photo').frame;
  const mobileSignoff = resolve('mobile', 'our-story-signoff').frame;
  assert.ok(mobilePhoto.y > mobileSignoff.y + mobileSignoff.height);
  for (const view of ['ipad', 'desktop']) {
    const photo = resolve(view, 'our-story-photo').frame;
    const copy = resolve(view, 'our-story-body-2').frame;
    assert.ok(photo.x > copy.x + copy.width);
    assert.ok(photo.y < resolve(view, 'our-story-signoff').frame.y);
  }
  assert.deepEqual(plain(section.responsive.overrides), { ipad: { height: 1024 }, desktop: { height: 1000 } });
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

test('typography maps public roles to supported editor fonts', () => {
  assert.equal(authored.elements['our-story-label'].style.fontFamily, 'Libre Baskerville');
  assert.equal(authored.elements['our-story-heading'].style.fontFamily, 'Cormorant Garamond');
  ['our-story-body-1', 'our-story-body-2', 'our-story-body-3'].forEach((id) => assert.equal(authored.elements[id].style.fontFamily, 'Libre Baskerville'));
  assert.equal(authored.elements['our-story-signoff'].style.fontFamily, 'Allura');
  copyIds.forEach((id) => assert.ok(model.fontCatalog.some((font) => font.name === authored.elements[id].style.fontFamily)));
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
