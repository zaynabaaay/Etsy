const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const context = { console, crypto: { randomUUID: () => 'test-id' }, setTimeout, clearTimeout };
context.globalThis = context;
['visual-document.js', 'green-sage-visual-template.js'].forEach((file) => {
  vm.runInNewContext(fs.readFileSync(path.join(root, file), 'utf8'), context);
});
const model = context.GreenSageVisualDocument;
const authored = context.GreenSageVisualTemplate.cloneDefault();
const plain = (value) => JSON.parse(JSON.stringify(value));
const digest = (value) => crypto.createHash('sha256').update(value).digest('hex');

test('Green Sage authored colors use the reconciled restrained palette', () => {
  assert.deepEqual(plain(authored.document.colors), ['#F4EFE7', '#E6E5DF', '#858977', '#626753', '#44463D', '#5F6051']);
  assert.deepEqual(plain(model.templatePalette.map(({ name, value }) => ({ name, value }))), [
    { name: 'Main Ivory', value: '#F4EFE7' }, { name: 'Cool Stone', value: '#E6E5DF' },
    { name: 'Muted Sage', value: '#858977' }, { name: 'Deep Olive', value: '#626753' },
    { name: 'Deep Neutral', value: '#44463D' }, { name: 'Quiet Olive', value: '#5F6051' }
  ]);
  assert.equal(new Set(authored.document.colors).size, authored.document.colors.length);

  const colors = (ids) => Object.fromEntries(ids.map((id) => [id, authored.elements[id].style.color]));
  assert.deepEqual(colors(['opening-intro-1', 'opening-intro-2', 'opening-isabella', 'opening-and', 'opening-julian', 'opening-date', 'opening-location', 'opening-scroll']), {
    'opening-intro-1': '#5F6051', 'opening-intro-2': '#5F6051', 'opening-isabella': '#44463D', 'opening-and': '#626753',
    'opening-julian': '#44463D', 'opening-date': '#44463D', 'opening-location': '#5F6051', 'opening-scroll': '#5F6051'
  });
  assert.equal(authored.sections.ceremony.background.color, '#E6E5DF');
  assert.deepEqual(colors(['ceremony-label', 'ceremony-time', 'ceremony-venue', 'ceremony-address', 'ceremony-note']), {
    'ceremony-label': '#626753', 'ceremony-time': '#626753', 'ceremony-venue': '#44463D',
    'ceremony-address': '#44463D', 'ceremony-note': '#44463D'
  });
  assert.equal(authored.sections['the-day'].background.color, '#858977');
  Object.values(authored.elements).filter((element) => element.sectionId === 'the-day').forEach((element) => {
    assert.equal(element.style.color, '#F4EFE7');
    if (element.type === 'divider') assert.equal(element.opacity, 0.18);
  });
});

test('authored geometry retains the approved palette-era structure plus the Mobile The Day shift', () => {
  const geometry = {
    order: authored.document.sectionOrder,
    sections: Object.fromEntries(Object.entries(authored.sections).map(([id, section]) => [id, {
      height: section.height, heightPreset: section.heightPreset, responsive: section.responsive, elementOrder: section.elementOrder
    }])),
    elements: Object.fromEntries(Object.entries(authored.elements).map(([id, element]) => [id, {
      sectionId: element.sectionId, frame: element.frame, responsive: element.responsive
    }]))
  };
  assert.equal(digest(JSON.stringify(geometry)), 'd426a160d50a62ed88ec2f315463ce45a40aa0fadf33ff73b37e170e9ce6d72d');
});

test('palette reconciliation changes no authored asset reference, crop, or supplied path', () => {
  const assets = {
    sections: Object.fromEntries(Object.entries(authored.sections).map(([id, section]) => [id, {
      kind: section.background.kind, assetId: section.background.assetId, assetKind: section.background.assetKind,
      focalX: section.background.focalX, focalY: section.background.focalY, zoom: section.background.zoom
    }])),
    elements: Object.fromEntries(Object.entries(authored.elements).filter(([, element]) => element.assetId).map(([id, element]) => [id, {
      assetId: element.assetId, assetKind: element.assetKind, type: element.type, crop: element.crop
    }]))
  };
  assert.equal(digest(JSON.stringify(assets)), '4ae74c8a16ec4055129b79a81adedba2d07dd2b9518a3f552a5cfd837b7916ca');
  assert.equal(model.getTemplateAsset('background-green-sage-opening').url, 'invitation-assets/green-sage-opening-background.jpg');
  assert.equal(model.getTemplateAsset('venue-glasshouse').url, 'invitation-assets/venue-glasshouse.svg');
});

test('venue SVG sources remain byte-identical and no SVG recoloring path exists', () => {
  const expected = {
    'venue-glasshouse.svg': '8ca3f725913251a229b1381e759181df3833a1725ab2b72c8b2df68b86747e9b',
    'venue-mansion.svg': '24ad2a846bddc5c39f8e7a2f3a4e7ef9236ad3989c2cb7850b8edfc1077e52ff',
    'venue-pergola.svg': '1e0fb492bbe3343965eb8cb4e2288ec5952b126d06b0ad80888593f488be3e41',
    'venue-barn.svg': 'eef4c0aeac988be687f3f077e4121063590e7962afd11e2850eee2201d554fa0'
  };
  Object.entries(expected).forEach(([file, hash]) => {
    assert.equal(digest(fs.readFileSync(path.join(root, 'invitation-assets', file))), hash);
  });
  const editor = fs.readFileSync(path.join(root, 'visual-editor.js'), 'utf8');
  assert.doesNotMatch(editor, /svg(?:Fill|Stroke)|(?:fill|stroke)Svg|setAttribute\(['"](?:fill|stroke)/i);
});
