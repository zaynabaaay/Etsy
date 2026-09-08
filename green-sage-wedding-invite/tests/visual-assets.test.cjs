const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const createHarness = () => {
  const records = new Map();
  let transactionCount = 0;
  const request = (result) => {
    const listeners = new Map();
    const value = { result, error: null, addEventListener: (type, listener) => listeners.set(type, listener) };
    queueMicrotask(() => listeners.get('success')?.());
    return value;
  };
  const database = {
    objectStoreNames: { contains: () => true },
    transaction: () => {
      transactionCount += 1;
      return { objectStore: () => ({
        put: (record) => { records.set(record.id, record); return request(record.id); },
        getAll: () => request([...records.values()]),
        get: (id) => request(records.get(id)),
        delete: (id) => { records.delete(id); return request(undefined); }
      }) };
    },
    close: () => {}
  };
  const indexedDB = { open: () => request(database) };
  const context = { ArrayBuffer, Blob, File, console, crypto: { randomUUID: () => 'test-id' }, indexedDB, queueMicrotask };
  context.globalThis = context;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'visual-assets.js'), 'utf8'), context);
  return { assets: context.StorielVisualAssets, records, transactionCount: () => transactionCount };
};

const bytes = async (blob) => [...new Uint8Array(await blob.arrayBuffer())];

test('new uploads read bytes before the transaction and persist no raw Blob/File', async () => {
  const harness = createHarness();
  const original = new File([Uint8Array.from([0, 1, 2, 127, 255])], 'photo.jpg', { type: 'image/jpeg' });
  let readBeforeTransaction = false;
  const file = new Proxy(original, {
    get(target, property) {
      if (property === 'arrayBuffer') return async () => { readBeforeTransaction = harness.transactionCount() === 0; return target.arrayBuffer(); };
      const value = Reflect.get(target, property, target);
      return typeof value === 'function' ? value.bind(target) : value;
    }
  });

  const added = await harness.assets.addFile(file);
  const record = harness.records.get(added.id);
  assert.equal(readBeforeTransaction, true);
  assert.deepEqual({ ...added }, { id: 'upload-test-id', name: 'photo.jpg', type: 'image/jpeg', size: 5, createdAt: record.createdAt });
  assert.deepEqual(Object.keys(record).sort(), ['bytes', 'createdAt', 'id', 'name', 'size', 'type']);
  assert.equal(Object.hasOwn(record, 'blob'), false);
  assert.equal(record.bytes.byteLength, original.size);
  assert.deepEqual([...new Uint8Array(record.bytes)], await bytes(original));
});

test('bytes records reconstruct a Blob with matching type, size, and content', async () => {
  const { assets } = createHarness();
  const source = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const blob = assets.getRecordBlob({ type: 'image/png', bytes: source.buffer });
  assert.equal(blob instanceof Blob, true);
  assert.equal(blob.type, 'image/png');
  assert.equal(blob.size, source.byteLength);
  assert.deepEqual(await bytes(blob), [...source]);
});

test('legacy Blob and File records remain readable and are not rewritten', async () => {
  const { assets, records } = createHarness();
  const legacyBlob = new Blob([Uint8Array.from([4, 5, 6])], { type: 'image/png' });
  const legacyFile = new File([Uint8Array.from([7, 8, 9])], 'legacy.jpg', { type: 'image/jpeg' });
  const blobRecord = { id: 'legacy-blob', type: 'image/png', blob: legacyBlob };
  const fileRecord = { id: 'legacy-file', type: 'image/jpeg', blob: legacyFile };
  records.set(blobRecord.id, blobRecord); records.set(fileRecord.id, fileRecord);

  assert.equal(assets.getRecordBlob(blobRecord), legacyBlob);
  assert.equal(assets.getRecordBlob(fileRecord), legacyFile);
  await assets.list();
  assert.equal(records.get(blobRecord.id), blobRecord);
  assert.equal(records.get(fileRecord.id), fileRecord);
  assert.equal(Object.hasOwn(records.get(fileRecord.id), 'bytes'), false);
});

test('bytes are preferred, malformed records fail independently, and both formats delete', async () => {
  const { assets, records } = createHarness();
  const valid = { id: 'bytes', type: 'image/png', bytes: Uint8Array.from([1, 2]).buffer, blob: new Blob([Uint8Array.from([9])]) };
  const legacy = { id: 'legacy', type: 'image/jpeg', blob: new Blob([Uint8Array.from([3])]) };
  const malformed = { id: 'malformed', type: 'image/png' };
  records.set(valid.id, valid); records.set(legacy.id, legacy); records.set(malformed.id, malformed);

  assert.deepEqual(await bytes(assets.getRecordBlob(valid)), [1, 2]);
  const prepared = (await assets.list()).map((record) => {
    try { return { record, blob: assets.getRecordBlob(record) }; }
    catch (error) { return { record: { ...record, missing: true }, error }; }
  });
  assert.equal(prepared.find((item) => item.record.id === 'bytes').blob.size, 2);
  assert.equal(prepared.find((item) => item.record.id === 'legacy').blob.size, 1);
  assert.equal(prepared.find((item) => item.record.id === 'malformed').record.missing, true);
  assert.match(prepared.find((item) => item.record.id === 'malformed').error.message, /binary data is unavailable/);

  await assets.remove(valid.id); await assets.remove(legacy.id);
  assert.equal(records.has(valid.id), false);
  assert.equal(records.has(legacy.id), false);
  assert.equal(records.has(malformed.id), true);
});
