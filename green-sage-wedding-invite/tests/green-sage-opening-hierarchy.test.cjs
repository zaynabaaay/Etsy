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
['visual-document.js', 'green-sage-visual-template.js'].forEach((file) => vm.runInNewContext(read(file), context));
const model = context.GreenSageVisualDocument;
const authored = model.normalize(context.GreenSageVisualTemplate.cloneDefault());
const plain = (value) => JSON.parse(JSON.stringify(value));

test('Opening names use the restrained six-percent hierarchy adjustment at every breakpoint', () => {
  const expected = {
    mobile: { isabella: 54.7, julian: 57.5 },
    ipad: { isabella: 54.1, julian: 57.8 },
    desktop: { isabella: 95.3, julian: 101.75 }
  };
  Object.entries(expected).forEach(([view, sizes]) => {
    assert.equal(model.resolveElement(authored.elements['opening-isabella'], view).style.fontSize, sizes.isabella);
    assert.equal(model.resolveElement(authored.elements['opening-julian'], view).style.fontSize, sizes.julian);
  });
  assert.equal(authored.elements['opening-and'].style.fontFamily, 'Cormorant Garamond');
  assert.equal(authored.elements['opening-and'].style.fontStyle, 'italic');
  assert.ok(model.fontCatalog.some((font) => font.name === 'Cormorant Garamond' && font.styles.includes('italic')));
});

test('Opening geometry, supporting typography, background, and section heights remain unchanged', () => {
  assert.deepEqual(plain(authored.sections.opening), {
    id: 'opening', name: 'Opening', height: 844, heightPreset: 'full',
    background: { kind: 'image', color: '#F4EFE7', assetId: 'background-green-sage-opening', assetKind: 'template', focalX: 50, focalY: 50, zoom: 1 },
    elementOrder: ['opening-intro-1', 'opening-intro-2', 'opening-isabella', 'opening-and', 'opening-julian', 'opening-date', 'opening-location', 'opening-scroll'],
    responsive: { overrides: { ipad: { height: 1024 }, desktop: { height: 1000 } } }
  });
  const expectedFrames = {
    mobile: {
      isabella: { x: 43.31, y: 295.67, width: 303.34, height: 53.55 },
      julian: { x: 76.92, y: 386.72, width: 236.14, height: 56.3 }
    },
    ipad: {
      isabella: { x: 233.84, y: 371.47, width: 300.31, height: 52.98 },
      julian: { x: 265.36, y: 461.94, width: 237.27, height: 56.58 }
    },
    desktop: {
      isabella: { x: 335.73, y: 304.17, width: 528.52, height: 93.25 },
      julian: { x: 391.2, y: 456.84, width: 417.58, height: 99.56 }
    }
  };
  Object.entries(expectedFrames).forEach(([view, frames]) => {
    assert.deepEqual(plain(model.resolveElement(authored.elements['opening-isabella'], view).frame), frames.isabella);
    assert.deepEqual(plain(model.resolveElement(authored.elements['opening-julian'], view).frame), frames.julian);
  });
  const supporting = ['opening-intro-1', 'opening-intro-2', 'opening-date', 'opening-location', 'opening-scroll'];
  const expectedSizes = { mobile: [11, 11, 12, 10, 8], ipad: [11, 11, 12, 10, 8], desktop: [12, 12, 12, 10, 8] };
  Object.entries(expectedSizes).forEach(([view, sizes]) => supporting.forEach((id, index) => {
    assert.equal(model.resolveElement(authored.elements[id], view).style.fontSize, sizes[index]);
  }));
});

test('public Opening uses one calm grouped sequence that settles in 3.12 seconds', () => {
  const styles = read('styles.css');
  assert.match(styles, /hero-formal-copy p[\s\S]*?openingInvitationFade \.72s[^;]* \.18s both/);
  assert.match(styles, /couple-names > span[\s\S]*?openingInvitationFade \.86s[^;]* \.92s both/);
  assert.match(styles, /reference-date-row[\s\S]*?openingInvitationFade \.72s[^;]* 1\.80s both/);
  assert.match(styles, /reference-city[\s\S]*?openingInvitationFade \.72s[^;]* 1\.90s both/);
  assert.match(styles, /reference-scroll[\s\S]*?openingInvitationFade \.64s[^;]* 2\.48s both/);
  assert.match(styles, /@keyframes openingInvitationFade[\s\S]*?translateY\(6px\)[\s\S]*?translateY\(0\)/);
  assert.doesNotMatch(styles, /openingNameReveal|openingFirstNameReveal|translateY\(18px\)/);
});

test('the public reveal is excluded from the editor and reduced motion is immediately complete', () => {
  const styles = read('styles.css');
  const revealStart = styles.indexOf('/* Opening reveal: compact editorial pacing');
  const reducedStart = styles.indexOf('@media (prefers-reduced-motion: reduce)', revealStart);
  const reducedEnd = styles.indexOf('@media (min-width: 760px)', reducedStart);
  const reveal = styles.slice(revealStart, reducedEnd);
  assert.ok(revealStart > -1 && reducedStart > revealStart);
  assert.doesNotMatch(reveal, /editor-preview|visual-canvas|visual-editor/);
  assert.match(reveal, /html\.standalone-invitation\.opening-animation-ready/g);
  const reduced = styles.slice(reducedStart, reducedEnd);
  assert.match(reduced, /couple-names > span/);
  assert.match(reduced, /reference-scroll/);
  assert.match(reduced, /opacity: 1/);
  assert.match(reduced, /transform: none/);
  assert.match(reduced, /animation: none/);
  const critical = read('invitation.html').match(/<style id="opening-animation-critical">([\s\S]*?)<\/style>/)?.[1] || '';
  assert.match(critical, /couple-names > span/);
  assert.match(critical, /translateY\(6px\)/);
  assert.doesNotMatch(critical, /clip-path|translateY\(18px\)/);
});

test('Ceremony, The Day, Details, and Our Story remain byte-for-byte stable', () => {
  const expected = {
    ceremony: 'd4c0637d23ee291ec449348ae3926d93cd5558442d69bb86f766390a630305ae',
    'the-day': 'c76c5c20412e0d508591268f18d75abd3d99b2308a11228f17bbaad697d5ae6b',
    details: '5f8a903d8bb1e1d3f6967e0acf9969205757e0ef6d1f02900de24138164c075b',
    'our-story': 'e045898bca9634a2eb414c4f7d2cbc19f7f8a09f4885585adcb06909cbe3f718'
  };
  Object.entries(expected).forEach(([id, digest]) => {
    const payload = { section: authored.sections[id], elements: authored.sections[id].elementOrder.map((elementId) => authored.elements[elementId]) };
    assert.equal(crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex'), digest, id);
  });
});
