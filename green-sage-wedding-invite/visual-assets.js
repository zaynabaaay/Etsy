(() => {
  const DB_NAME = 'storiel-visual-assets-v1';
  const STORE_NAME = 'assets';
  const MAX_FILE_SIZE = 12 * 1024 * 1024;
  const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']);
  const openDatabase = () => new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) return reject(new Error('IndexedDB is unavailable'));
    const request = globalThis.indexedDB.open(DB_NAME, 1);
    request.addEventListener('upgradeneeded', () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
    });
    request.addEventListener('success', () => resolve(request.result), { once: true });
    request.addEventListener('error', () => reject(request.error), { once: true });
  });
  const run = async (mode, operation) => {
    const database = await openDatabase();
    try {
      return await new Promise((resolve, reject) => {
        const request = operation(database.transaction(STORE_NAME, mode).objectStore(STORE_NAME));
        request.addEventListener('success', () => resolve(request.result), { once: true });
        request.addEventListener('error', () => reject(request.error), { once: true });
      });
    } finally {
      database.close();
    }
  };
  const validateFile = (file) => {
    if (!file || !ACCEPTED_TYPES.has(file.type)) throw new Error('Choose a JPG, PNG, WebP, GIF, or SVG image.');
    if (file.size > MAX_FILE_SIZE) throw new Error('Images must be 12 MB or smaller.');
  };
  const addFile = async (file) => {
    validateFile(file);
    const id = `upload-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
    const record = { id, name: file.name || 'Uploaded image', type: file.type, size: file.size, createdAt: new Date().toISOString(), blob: file };
    await run('readwrite', (store) => store.put(record));
    return { id, name: record.name, type: record.type, size: record.size, createdAt: record.createdAt };
  };
  const addFiles = async (files) => {
    const results = [];
    for (const file of files) results.push(await addFile(file));
    return results;
  };
  const list = async () => (await run('readonly', (store) => store.getAll()))
    .sort((first, second) => String(second.createdAt).localeCompare(String(first.createdAt)));
  const remove = (id) => run('readwrite', (store) => store.delete(id));
  const get = (id) => run('readonly', (store) => store.get(id));
  globalThis.StorielVisualAssets = Object.freeze({ maxFileSize: MAX_FILE_SIZE, acceptedTypes: Object.freeze([...ACCEPTED_TYPES]), addFile, addFiles, list, remove, get });
})();
