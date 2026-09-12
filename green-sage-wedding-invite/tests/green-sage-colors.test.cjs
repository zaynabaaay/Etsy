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
  assert.deepEqual(plain(authored.document.colors), ['#F4EFE7', '#EFECE7', '#858977', '#626753', '#44463D', '#5F6051']);
  assert.deepEqual(plain(model.templatePalette.map(({ name, value }) => ({ name, value }))), [
    { name: 'Main Ivory', value: '#F4EFE7' }, { name: 'Soft Paper', value: '#EFECE7' },
    { name: 'Muted Sage', value: '#858977' }, { name: 'Deep Olive', value: '#626753' },
    { name: 'Deep Neutral', value: '#44463D' }, { name: 'Quiet Olive', value: '#5F6051' }
  ]);
  assert.equal(new Set(authored.document.colors).size, authored.document.colors.length);

  const colors = (ids) => Object.fromEntries(ids.map((id) => [id, authored.elements[id].style.color]));
  assert.deepEqual(colors(['opening-intro-1', 'opening-intro-2', 'opening-isabella', 'opening-and', 'opening-julian', 'opening-date', 'opening-location', 'opening-scroll']), {
    'opening-intro-1': '#5F6051', 'opening-intro-2': '#5F6051', 'opening-isabella': '#44463D', 'opening-and': '#626753',
    'opening-julian': '#44463D', 'opening-date': '#44463D', 'opening-location': '#5F6051', 'opening-scroll': '#5F6051'
  });
  assert.equal(authored.sections.ceremony.background.color, '#EFECE7');
  assert.deepEqual(colors(['ceremony-label', 'ceremony-time', 'ceremony-venue', 'ceremony-address']), {
    'ceremony-label': '#626753', 'ceremony-time': '#626753', 'ceremony-venue': '#44463D',
    'ceremony-address': '#44463D'
  });
  assert.equal(authored.sections['the-day'].background.color, '#858977');
  Object.values(authored.elements).filter((element) => element.sectionId === 'the-day').forEach((element) => {
    assert.equal(element.style.color, '#F4EFE7');
    if (element.type === 'divider') assert.equal(element.opacity, 0.18);
  });
});

test('Opening fallback reuses the primary ivory while Our Story contributes only its public colors', () => {
  assert.equal(
    digest(fs.readFileSync(path.join(root, 'invitation-assets/green-sage-opening-background.jpg'))),
    '08f15870be58403ee5093b2a1ea170bf35e657c2f9fffbde285407535d81dfff'
  );
  assert.equal(authored.sections.opening.background.color, '#F4EFE7');

  const normalized = model.normalize(authored);
  assert.deepEqual(plain(normalized.document.colors), ['#F4EFE7', '#EFECE7', '#858977', '#626753', '#44463D', '#5F6051', '#F3F2ED', '#AD9B78', '#3F4037', '#D2CEC5']);
  assert.equal(normalized.document.colors.includes('#ECE6DF'), false);
});

test('palette reconciliation preserves custom colors and recolorable SVG color aggregation', () => {
  const customized = model.clone(authored);
  customized.document.colors.push('#123ABC');
  customized.elements['ceremony-glasshouse'].svgColor = '#ABCDEF';

  const normalized = model.normalize(customized);
  assert.ok(normalized.document.colors.includes('#123ABC'));
  assert.ok(normalized.document.colors.includes('#ABCDEF'));
  assert.equal(normalized.elements['ceremony-glasshouse'].svgColor, '#ABCDEF');
  assert.equal(model.getTemplateAsset('venue-glasshouse').recolorable, true);
});

test('authored geometry retains the approved sections plus Details and Our Story', () => {
  const geometry = {
    order: authored.document.sectionOrder,
    sections: Object.fromEntries(Object.entries(authored.sections).map(([id, section]) => [id, {
      height: section.height, heightPreset: section.heightPreset, responsive: section.responsive, elementOrder: section.elementOrder
    }])),
    elements: Object.fromEntries(Object.entries(authored.elements).map(([id, element]) => [id, {
      sectionId: element.sectionId, frame: element.frame, responsive: element.responsive
    }]))
  };
  assert.equal(digest(JSON.stringify(geometry)), 'bb96c861b23d147e83cf40b13788cc4927a23e9a65b4df4cee4e69cf4520ae95');
});

test('authored asset references and crops match the approved template including Our Story', () => {
  const assets = {
    sections: Object.fromEntries(Object.entries(authored.sections).map(([id, section]) => [id, {
      kind: section.background.kind, assetId: section.background.assetId, assetKind: section.background.assetKind,
      focalX: section.background.focalX, focalY: section.background.focalY, zoom: section.background.zoom
    }])),
    elements: Object.fromEntries(Object.entries(authored.elements).filter(([, element]) => element.assetId).map(([id, element]) => [id, {
      assetId: element.assetId, assetKind: element.assetKind, type: element.type, crop: element.crop
    }]))
  };
  assert.equal(digest(JSON.stringify(assets)), '22b90e1219175b72dedaa990e084b644258732ebe60777f9d06014d4a59527e7');
  assert.equal(model.getTemplateAsset('background-green-sage-opening').url, 'invitation-assets/green-sage-opening-background.jpg');
  assert.equal(model.getTemplateAsset('venue-glasshouse').url, 'invitation-assets/venue-glasshouse.svg');
});

test('venue SVG source strengths remain approved while recoloring stays non-destructive', () => {
  const expected = {
    'venue-glasshouse.svg': '044a07def5be6dd9068f44b9f95324e2ccb716a63dd75c04fa3abb6ad0efeae3',
    'venue-mansion.svg': '24ad2a846bddc5c39f8e7a2f3a4e7ef9236ad3989c2cb7850b8edfc1077e52ff',
    'venue-pergola.svg': '1e0fb492bbe3343965eb8cb4e2288ec5952b126d06b0ad80888593f488be3e41',
    'venue-barn.svg': 'eef4c0aeac988be687f3f077e4121063590e7962afd11e2850eee2201d554fa0'
  };
  Object.entries(expected).forEach(([file, hash]) => {
    assert.equal(digest(fs.readFileSync(path.join(root, 'invitation-assets', file))), hash);
  });
  const editor = fs.readFileSync(path.join(root, 'visual-editor.js'), 'utf8');
  assert.doesNotMatch(editor, /DOMParser|setAttribute\(['"](?:fill|stroke)/i);
});
