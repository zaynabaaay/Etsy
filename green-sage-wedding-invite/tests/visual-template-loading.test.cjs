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
const proof = context.StorielVisualProofFixture;
const greenSage = context.GreenSageVisualTemplate;
const loader = context.StorielVisualTemplateLoader;
const plain = (value) => JSON.parse(JSON.stringify(value));
const storage = (entries = {}) => {
  const values = new Map(Object.entries(entries));
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    value: (key) => values.get(key)
  };
};

test('Green Sage and proof have separate stable schema-4 identities', () => {
  assert.equal(greenSage.defaultDocument.schemaVersion, 4);
  assert.equal(greenSage.templateId, 'green-sage');
  assert.equal(greenSage.defaultDocument.document.templateId, 'green-sage');
  assert.equal(greenSage.defaultDocument.document.id, 'green-sage-visual-template');
  assert.equal(greenSage.defaultDocument.document.title, 'Green Sage invitation');
  assert.equal(proof.templateId, 'visual-proof');
  assert.notEqual(proof.storageKey, greenSage.storageKey);
  assert.ok(proof.defaultDocument.sections['proof-section']);
  assert.equal(greenSage.defaultDocument.sections['proof-section'], undefined);
  assert.ok(greenSage.defaultDocument.sections.ceremony);

  const proofClone = proof.cloneDefault();
  const greenClone = greenSage.cloneDefault();
  proofClone.document.title = 'Changed proof';
  greenClone.document.title = 'Changed Green Sage';
  assert.equal(proof.defaultDocument.document.title, 'Visual editor proof fixture');
  assert.equal(greenSage.defaultDocument.document.title, 'Green Sage invitation');
});

test('proof fixture remains independently loadable through its own storage boundary', () => {
  const saved = proof.cloneDefault();
  saved.elements['proof-heading'].content = 'Saved development proof';
  const store = storage({ [proof.storageKey]: JSON.stringify(saved) });
  const restored = loader.load('visual-proof', store);
  assert.equal(restored.document.templateId, 'visual-proof');
  assert.equal(restored.elements['proof-heading'].content, 'Saved development proof');
  assert.equal(store.value(greenSage.storageKey), undefined);
});

test('Green Sage falls back to its dedicated default with no save or corrupt data', () => {
  const empty = storage();
  const initial = loader.load('green-sage', empty);
  assert.equal(initial.document.templateId, 'green-sage');
  assert.deepEqual(plain(initial.document.sectionOrder), ['ceremony']);
  assert.equal(initial.elements['proof-heading'], undefined);

  const corrupt = storage({ [greenSage.storageKey]: '{bad json' });
  const fallback = loader.load('green-sage', corrupt);
  assert.deepEqual(plain(fallback), plain(initial));
  assert.equal(corrupt.value(greenSage.storageKey), '{bad json');
});

test('valid Green Sage state restores and keeps its identity', () => {
  const saved = greenSage.cloneDefault();
  saved.sections.ceremony.name = 'Saved Green Sage section';
  const store = storage({ [greenSage.storageKey]: JSON.stringify(saved) });
  const restored = loader.load('green-sage', store);
  assert.equal(restored.document.templateId, 'green-sage');
  assert.equal(restored.sections.ceremony.name, 'Saved Green Sage section');
});

test('proof storage and wrong-template saved state cannot replace Green Sage', () => {
  const proofSaved = proof.cloneDefault();
  proofSaved.elements['proof-heading'].content = 'Persisted proof';
  const proofSerialized = JSON.stringify(proofSaved);
  const wrongTemplate = proof.cloneDefault();
  const wrongSerialized = JSON.stringify(wrongTemplate);
  const store = storage({
    [proof.storageKey]: proofSerialized,
    [greenSage.storageKey]: wrongSerialized
  });

  const loaded = loader.load('green-sage', store);
  assert.equal(loaded.document.templateId, 'green-sage');
  assert.equal(loaded.elements['proof-heading'], undefined);
  assert.equal(store.value(proof.storageKey), proofSerialized);
  assert.equal(store.value(greenSage.storageKey), wrongSerialized);
});

test('Green Sage save is isolated and round-trips responsive authored state', () => {
  const store = storage({ [proof.storageKey]: JSON.stringify(proof.cloneDefault()) });
  const proofBefore = store.value(proof.storageKey);
  const authored = loader.load('green-sage', store);
  authored.sections.ceremony.responsive.overrides.ipad.height = 700;
  assert.equal(loader.save('green-sage', authored, store), true);
  assert.equal(store.value(proof.storageKey), proofBefore);

  const restored = loader.load('green-sage', store);
  assert.equal(restored.sections.ceremony.responsive.overrides.ipad.height, 700);
  assert.equal(model.resolveSection(restored.sections.ceremony, 'mobile').height, 844);
  assert.equal(model.resolveSection(restored.sections.ceremony, 'ipad').height, 700);
  assert.equal(model.resolveSection(restored.sections.ceremony, 'desktop').height, 1000);
});

test('save rejects a mismatched template without overwriting Green Sage storage', () => {
  const store = storage({ [greenSage.storageKey]: 'keep-me' });
  assert.equal(loader.save('green-sage', proof.cloneDefault(), store), false);
  assert.equal(store.value(greenSage.storageKey), 'keep-me');
});
