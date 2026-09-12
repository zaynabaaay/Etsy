const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const context = { console, crypto: { randomUUID: () => 'test-id' }, setTimeout, clearTimeout };
context.globalThis = context;
['visual-document.js', 'visual-proof-fixture.js', 'green-sage-visual-template.js', 'visual-template-loader.js'].forEach((file) => {
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context);
});
const model = context.GreenSageVisualDocument;
const template = context.GreenSageVisualTemplate;
const loader = context.StorielVisualTemplateLoader;
const plain = (value) => JSON.parse(JSON.stringify(value));
const permissions = { editable: true, movable: true, resizable: true, deletable: true, locked: false };
const storage = (saved) => {
  const values = new Map(saved ? [[template.storageKey, JSON.stringify(saved)]] : []);
  let writes = 0;
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { writes += 1; values.set(key, String(value)); },
    value: () => values.get(template.storageKey),
    writes: () => writes
  };
};
const historicalText = (id, content, frame, style, overrides = {}) => ({
  id, sectionId: 'our-story', type: 'text', content, frame, rotation: 0, opacity: 1,
  style: { fontWeight: 400, fontStyle: 'normal', textAlign: 'left', ...style },
  responsive: { strategy: 'scale', anchorX: 'center', ...(Object.keys(overrides).length ? { overrides } : {}) },
  permissions: { ...permissions }
});
const historicalDivider = (id, frame, opacity, color, overrides) => ({
  id, sectionId: 'our-story', type: 'divider', frame, rotation: 0, opacity, style: { color },
  responsive: { strategy: 'scale', anchorX: 'center', overrides }, permissions: { ...permissions }
});
const historicalFrames = () => ({
  'our-story-offset-top': historicalDivider('our-story-offset-top', { x: 39.3, y: 581.27, width: 335.4, height: 1 }, 0.38, '#AD9B78', { ipad: { frame: { x: 404.27, y: 150.02, width: 320 } }, desktop: { frame: { x: 664, y: 126, width: 470 } } }),
  'our-story-offset-right': historicalDivider('our-story-offset-right', { x: 373.7, y: 581.27, width: 1, height: 419.24 }, 0.38, '#AD9B78', { ipad: { frame: { x: 723.27, y: 150.02, height: 400 } }, desktop: { frame: { x: 1133, y: 126, height: 587.5 } } }),
  'our-story-offset-bottom': historicalDivider('our-story-offset-bottom', { x: 39.3, y: 999.51, width: 335.4, height: 1 }, 0.38, '#AD9B78', { ipad: { frame: { x: 404.27, y: 549.02, width: 320 } }, desktop: { frame: { x: 664, y: 712.5, width: 470 } } }),
  'our-story-offset-left': historicalDivider('our-story-offset-left', { x: 39.3, y: 581.27, width: 1, height: 419.24 }, 0.38, '#AD9B78', { ipad: { frame: { x: 404.27, y: 150.02, height: 400 } }, desktop: { frame: { x: 664, y: 126, height: 587.5 } } }),
  'our-story-border-top': historicalDivider('our-story-border-top', { x: 27.3, y: 569.27, width: 335.4, height: 1 }, 1, '#D2CEC5', { ipad: { frame: { x: 386.27, y: 132.02, width: 320 } }, desktop: { frame: { x: 646, y: 108, width: 470 } } }),
  'our-story-border-right': historicalDivider('our-story-border-right', { x: 361.7, y: 569.27, width: 1, height: 419.24 }, 1, '#D2CEC5', { ipad: { frame: { x: 705.27, y: 132.02, height: 400 } }, desktop: { frame: { x: 1115, y: 108, height: 587.5 } } }),
  'our-story-border-bottom': historicalDivider('our-story-border-bottom', { x: 27.3, y: 987.51, width: 335.4, height: 1 }, 1, '#D2CEC5', { ipad: { frame: { x: 386.27, y: 531.02, width: 320 } }, desktop: { frame: { x: 646, y: 694.5, width: 470 } } }),
  'our-story-border-left': historicalDivider('our-story-border-left', { x: 27.3, y: 569.27, width: 1, height: 419.24 }, 1, '#D2CEC5', { ipad: { frame: { x: 386.27, y: 132.02, height: 400 } }, desktop: { frame: { x: 646, y: 108, height: 587.5 } } })
});
const preRefinementDocument = () => {
  const document = template.cloneDefault();
  delete document.document.templateRevision;
  document.sections['our-story'] = {
    id: 'our-story', name: 'Our Story', height: 1081, heightPreset: 'custom',
    background: { kind: 'color', color: '#F3F2ED', assetId: '', assetKind: 'template', focalX: 50, focalY: 50, zoom: 1 },
    elementOrder: [
      'our-story-offset-top', 'our-story-offset-right', 'our-story-offset-bottom', 'our-story-offset-left',
      'our-story-label', 'our-story-motif', 'our-story-heading', 'our-story-body-1', 'our-story-body-2',
      'our-story-body-3', 'our-story-signoff', 'our-story-photo',
      'our-story-border-top', 'our-story-border-right', 'our-story-border-bottom', 'our-story-border-left'
    ],
    responsive: { overrides: { ipad: { height: 1024 }, desktop: { height: 1000 } } }
  };
  document.elements['our-story-label'] = historicalText('our-story-label', 'OUR STORY', { x: 24, y: 82, width: 342, height: 18 },
    { fontFamily: 'Libre Baskerville', fontSize: 10, color: '#626753', lineHeight: 1.45, letterSpacing: 3.4 },
    { ipad: { frame: { x: 56, y: 88, width: 280.27 } }, desktop: { frame: { x: 84, y: 185.16, width: 457.91 } } });
  document.elements['our-story-motif'].frame = { x: 24, y: 112.34, width: 118, height: 9.65 };
  document.elements['our-story-motif'].responsive.overrides = { ipad: { frame: { x: 56, y: 118.5 } }, desktop: { frame: { x: 84, y: 217.66, width: 132, height: 10.8 } } };
  document.elements['our-story-heading'] = historicalText('our-story-heading', 'How We Met', { x: 24, y: 145.98, width: 342, height: 58 },
    { fontFamily: 'Cormorant Garamond', fontSize: 50.7, color: '#3F4037', lineHeight: 0.94, letterSpacing: -1.2675 },
    { ipad: { frame: { x: 56, y: 156.15, width: 280.27 }, style: { fontSize: 52, letterSpacing: -1.3 } }, desktop: { frame: { x: 84, y: 258.46, width: 457.91, height: 64 }, style: { fontSize: 61.8, letterSpacing: -1.545 } } });
  document.elements['our-story-body-1'] = historicalText('our-story-body-1', 'We met the way the best things often happen — unexpectedly, and at exactly the right time.', { x: 24, y: 219.64, width: 342, height: 50 },
    { fontFamily: 'Libre Baskerville', fontSize: 14, color: '#3F4037', lineHeight: 1.78, letterSpacing: 0 },
    { ipad: { frame: { x: 56, y: 233.02, width: 280.27, height: 77 }, style: { lineHeight: 1.82 } }, desktop: { frame: { x: 84, y: 347.74, width: 457.91, height: 51 }, style: { lineHeight: 1.82 } } });
  document.elements['our-story-body-2'] = historicalText('our-story-body-2', 'What started with easy conversation became long walks, shared plans, and the kind of everyday moments that quietly turn into a life together.', { x: 24, y: 285.47, width: 342, height: 100 },
    { fontFamily: 'Libre Baskerville', fontSize: 14, color: '#3F4037', lineHeight: 1.78, letterSpacing: 0 },
    { ipad: { frame: { x: 56, y: 327.45, width: 280.27, height: 102 }, style: { lineHeight: 1.82 } }, desktop: { frame: { x: 84, y: 416.7, width: 457.91, height: 77 }, style: { lineHeight: 1.82 } } });
  document.elements['our-story-body-3'] = historicalText('our-story-body-3', 'Now we get to celebrate the next chapter with the people who have been part of our story along the way.', { x: 24, y: 401.13, width: 342, height: 75 },
    { fontFamily: 'Libre Baskerville', fontSize: 14, color: '#3F4037', lineHeight: 1.78, letterSpacing: 0 },
    { ipad: { frame: { x: 56, y: 447.36, width: 280.27, height: 77 }, style: { lineHeight: 1.82 } }, desktop: { frame: { x: 84, y: 511.13, width: 457.91, height: 51 }, style: { lineHeight: 1.82 } } });
  document.elements['our-story-signoff'] = historicalText('our-story-signoff', 'With love, Isabella & Julian', { x: 24, y: 499.87, width: 342, height: 36 },
    { fontFamily: 'Allura', fontSize: 28, color: '#626753', lineHeight: 1.05, letterSpacing: 0 },
    { ipad: { frame: { x: 56, y: 549.79, width: 280.27 }, style: { fontSize: 25 } }, desktop: { frame: { x: 84, y: 592.08, width: 457.91 }, style: { fontSize: 25 } } });
  document.elements['our-story-photo'].frame = { x: 27.3, y: 569.27, width: 335.4, height: 419.24 };
  document.elements['our-story-photo'].responsive.overrides = { ipad: { frame: { x: 386.27, y: 132.02, width: 320, height: 400 } }, desktop: { frame: { x: 646, y: 108, width: 470, height: 587.5 } } };
  Object.assign(document.elements, historicalFrames());
  const normalized = model.normalize(document);
  delete normalized.document.templateRevision;
  return normalized;
};

test('new Green Sage documents start at the current template revision without changing schema or storage identity', () => {
  assert.equal(template.templateRevision, 1);
  assert.equal(template.defaultDocument.schemaVersion, 4);
  assert.equal(template.defaultDocument.document.templateRevision, 1);
  assert.equal(template.storageKey, 'storiel-visual-document:green-sage:v1');
});

test('template revisions run sequentially and skip every completed step', () => {
  const calls = [];
  const resource = {
    templateId: 'green-sage', templateRevision: 3,
    templateMigrations: [
      { revision: 3, migrate: (state) => { calls.push(3); state.document.third = true; return state; } },
      { revision: 1, migrate: (state) => { calls.push(1); state.document.first = true; return state; } },
      { revision: 2, migrate: (state) => { calls.push(2); state.document.second = true; return state; } }
    ]
  };
  const state = preRefinementDocument();
  state.document.templateRevision = 1;
  const result = loader.applyTemplateMigrations(resource, state);
  assert.deepEqual(calls, [2, 3]);
  assert.equal(result.state.document.templateRevision, 3);
  assert.equal(result.state.document.first, undefined);
  assert.equal(result.state.document.second, true);
  assert.equal(result.state.document.third, true);
  calls.length = 0;
  assert.equal(loader.applyTemplateMigrations(resource, result.state).migrated, false);
  assert.deepEqual(calls, []);
});

test('an exact pre-refinement schema-4 document migrates to the current authored Our Story and persists revision', () => {
  const historical = preRefinementDocument();
  const neighboringBefore = ['opening', 'ceremony', 'the-day', 'details'].map((id) => JSON.stringify({ section: historical.sections[id], elements: Object.values(historical.elements).filter((element) => element.sectionId === id) }));
  const store = storage(historical);
  const migrated = loader.load('green-sage', store);
  const current = model.normalize(template.cloneDefault());
  assert.deepEqual(plain(migrated.sections['our-story']), plain(current.sections['our-story']));
  assert.deepEqual(plain(Object.fromEntries(Object.entries(migrated.elements).filter(([, element]) => element.sectionId === 'our-story'))), plain(Object.fromEntries(Object.entries(current.elements).filter(([, element]) => element.sectionId === 'our-story'))));
  assert.equal(migrated.document.templateRevision, 1);
  assert.equal(JSON.parse(store.value()).document.templateRevision, 1);
  assert.equal(store.writes(), 1);
  ['our-story-body-3', ...Object.keys(historicalFrames())].forEach((id) => {
    assert.equal(migrated.elements[id], undefined);
    assert.equal(migrated.sections['our-story'].elementOrder.includes(id), false);
  });
  const neighboringAfter = ['opening', 'ceremony', 'the-day', 'details'].map((id) => JSON.stringify({ section: migrated.sections[id], elements: Object.values(migrated.elements).filter((element) => element.sectionId === id) }));
  assert.deepEqual(neighboringAfter, neighboringBefore);
});

test('three-way migration preserves edited copy and individual typography while updating untouched values', () => {
  const saved = preRefinementDocument();
  saved.elements['our-story-body-1'].content = 'Our own edited story.';
  saved.elements['our-story-heading'].style.fontSize = 49;
  saved.elements['our-story-heading'].responsive.overrides.ipad.style.fontSize = 47;
  saved.elements['our-story-body-2'].style.lineHeight = 2;
  saved.elements['our-story-signoff'].responsive.overrides.desktop.style.fontSize = 23;
  const migrated = loader.load('green-sage', storage(saved));
  assert.equal(migrated.elements['our-story-body-1'].content, 'Our own edited story.');
  assert.equal(migrated.elements['our-story-heading'].style.fontSize, 49);
  assert.equal(migrated.elements['our-story-heading'].responsive.overrides.ipad.style.fontSize, 47);
  assert.equal(migrated.elements['our-story-heading'].responsive.overrides.desktop.style.fontSize, 50);
  assert.equal(migrated.elements['our-story-body-2'].style.lineHeight, 2);
  assert.equal(migrated.elements['our-story-body-2'].responsive.overrides.ipad.style.fontSize, 13.5);
  assert.equal(migrated.elements['our-story-signoff'].responsive.overrides.desktop.style.fontSize, 23);
});

test('three-way migration preserves edited geometry and crop while updating untouched geometry', () => {
  const saved = preRefinementDocument();
  saved.elements['our-story-heading'].frame.x = 41;
  saved.elements['our-story-photo'].crop.focalY = 72;
  saved.elements['our-story-photo'].responsive.overrides.ipad.frame.x = 410;
  const migrated = loader.load('green-sage', storage(saved));
  assert.equal(migrated.elements['our-story-heading'].frame.x, 41);
  assert.equal(migrated.elements['our-story-heading'].frame.y, 128);
  assert.equal(migrated.elements['our-story-photo'].crop.focalY, 72);
  assert.equal(migrated.elements['our-story-photo'].responsive.overrides.ipad.frame.x, 410);
  assert.equal(migrated.elements['our-story-photo'].frame.y, 574);
  assert.equal(migrated.elements['our-story-photo'].assetId, 'our-story-photo');
  assert.equal(migrated.elements['our-story-photo'].assetKind, 'template');
});

test('modified obsolete elements remain document-specific while untouched obsolete elements are removed', () => {
  const saved = preRefinementDocument();
  saved.elements['our-story-offset-top'].style.color = '#123456';
  saved.elements['our-story-body-3'].content = 'Customer-added third paragraph.';
  const migrated = loader.load('green-sage', storage(saved));
  assert.equal(migrated.elements['our-story-offset-top'].style.color, '#123456');
  assert.ok(migrated.sections['our-story'].elementOrder.includes('our-story-offset-top'));
  assert.equal(migrated.elements['our-story-body-3'].content, 'Customer-added third paragraph.');
  assert.ok(migrated.sections['our-story'].elementOrder.includes('our-story-body-3'));
  assert.equal(template.defaultDocument.elements['our-story-offset-top'], undefined);
  Object.keys(historicalFrames()).filter((id) => id !== 'our-story-offset-top').forEach((id) => assert.equal(migrated.elements[id], undefined));
});

test('migration is idempotent and removed elements do not return through normalization or reload', () => {
  const store = storage(preRefinementDocument());
  const first = loader.load('green-sage', store);
  const firstSerialized = JSON.stringify(first);
  assert.equal(store.writes(), 1);
  const second = loader.load('green-sage', store);
  assert.equal(JSON.stringify(second), firstSerialized);
  assert.equal(store.writes(), 1);
  assert.equal(second.elements['our-story-border-left'], undefined);
  assert.equal(second.sections['our-story'].elementOrder.includes('our-story-border-left'), false);
});

test('Editor and Preview loading paths resolve the identical migrated state', () => {
  const editorStore = storage(preRefinementDocument());
  const previewStore = storage(JSON.parse(editorStore.value()));
  const editorState = loader.load('green-sage', editorStore);
  const previewState = loader.load('green-sage', previewStore);
  assert.deepEqual(plain(previewState), plain(editorState));
});

test('corrupt and wrong-template saves retain existing fallback behavior', () => {
  const corrupt = { getItem: () => '{broken', setItem: () => assert.fail('corrupt state must not be overwritten') };
  assert.deepEqual(plain(loader.load('green-sage', corrupt)), plain(model.normalize(template.cloneDefault())));
  const wrong = preRefinementDocument();
  wrong.document.templateId = 'not-green-sage';
  const store = storage(wrong);
  const before = store.value();
  assert.deepEqual(plain(loader.load('green-sage', store)), plain(model.normalize(template.cloneDefault())));
  assert.equal(store.value(), before);
  assert.equal(store.writes(), 0);
});
