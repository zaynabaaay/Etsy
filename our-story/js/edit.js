/* ══════════════════════════════════════════════════════════════════
   OUR STORY · Edit Mode
   Lets a non-technical owner replace every photo by clicking it — no
   files, no code. Replaced photos are remembered on this device and
   can be baked into a finished page with "Download my site".

   Nothing in here needs editing to use the template.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const FLAG = 'ourstory:editing';
  const editing = localStorage.getItem(FLAG) === '1';

  /* ---- tiny IndexedDB store (photos can be large, so not localStorage) ---- */
  const DB = 'ourstory', STORE = 'photos';
  function openDB() {
    return new Promise((res, rej) => {
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(STORE);
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  }
  async function dbSet(key, val) {
    const db = await openDB();
    return new Promise((res, rej) => {
      const t = db.transaction(STORE, 'readwrite');
      t.objectStore(STORE).put(val, key);
      t.oncomplete = res; t.onerror = () => rej(t.error);
    });
  }
  async function dbAll() {
    const db = await openDB();
    return new Promise((res, rej) => {
      const t = db.transaction(STORE, 'readonly');
      const s = t.objectStore(STORE);
      const ks = s.getAllKeys(), vs = s.getAll();
      t.oncomplete = () => res(Object.fromEntries(ks.result.map((k, i) => [k, vs.result[i]])));
      t.onerror = () => rej(t.error);
    });
  }

  /* ---- every photo in the story, with a stable key from its filename ---- */
  const photos = Array.from(document.querySelectorAll('section img'));
  photos.forEach((img) => {
    const m = (img.getAttribute('src') || '').match(/([^/]+)\.(jpg|jpeg|png|webp|gif)$/i);
    img.dataset.photoKey = m ? m[1] : 'photo-' + Math.random().toString(36).slice(2, 8);
  });

  /* ---- restore saved photos in EVERY mode, so the finished experience
          shows the owner's pictures too ---- */
  const restored = dbAll().then((saved) => {
    photos.forEach((img) => {
      if (saved[img.dataset.photoKey]) img.src = saved[img.dataset.photoKey];
    });
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }).catch(() => {});

  /* ---- every editable piece of text (the element that holds the words;
          for the masked/animated lines that's the inner span) ---- */
  const TEXT_SELECTORS = [
    '.intro-eyebrow', '.intro-title .tline',
    '.opening-line .mask-inner',
    '.chapter-label', '.chapter-title .mask-inner', '.chapter-sub',
    '.moment-date', '.polaroid-caption', '.moment-text',
    '.numbers-script',
    '.stat:not([data-count-from-date]) .stat-value', '.stat-label', '.stat-note',
    '.mcap',
    '.quiet-line .mask-inner', '.quiet-small',
    '.letter-label', '.lp', '.sign-pre', '.sign-name',
    '.close-line .mask-inner', '.close-script', '.close-title', '.close-date',
  ];
  const texts = Array.from(document.querySelectorAll(TEXT_SELECTORS.join(',')));
  texts.forEach((el, i) => { el.dataset.textKey = 't' + i; }); // stable while HTML is unchanged

  /* restore saved words in EVERY mode */
  const TKEY = 'ourstory:text:';
  texts.forEach((el) => {
    const saved = localStorage.getItem(TKEY + el.dataset.textKey);
    if (saved !== null) el.innerHTML = saved;
  });

  /* ---- the always-present "Make it yours" button ---- */
  const fab = document.createElement('button');
  fab.className = 'edit-fab';
  fab.type = 'button';
  fab.innerHTML = '<span class="edit-fab-heart">♥</span> Make it yours';
  fab.addEventListener('click', () => { localStorage.setItem(FLAG, '1'); location.reload(); });
  document.body.appendChild(fab);

  if (!editing) return; // view mode: just the button + restored photos

  /* ═══════════════ editing mode ═══════════════ */
  document.body.classList.add('editing');

  /* top bar */
  const bar = document.createElement('div');
  bar.className = 'edit-bar';
  bar.innerHTML =
    '<span class="edit-bar-msg"><strong>Editing</strong> · tap any photo or words to change them</span>' +
    '<span class="edit-bar-actions">' +
      '<button class="edit-btn edit-btn-primary" id="ed-download" type="button">Download my site</button>' +
      '<button class="edit-btn" id="ed-done" type="button">Done</button>' +
    '</span>';
  document.body.appendChild(bar);

  bar.querySelector('#ed-done').addEventListener('click', () => {
    localStorage.removeItem(FLAG); location.reload();
  });
  bar.querySelector('#ed-download').addEventListener('click', exportSite);

  /* make each photo clickable-to-replace */
  photos.forEach((img) => {
    const frame = img.closest('.polaroid, .mphoto, .close-photo') || img.parentElement;
    frame.classList.add('ephoto');
    if (getComputedStyle(frame).position === 'static') frame.style.position = 'relative';

    const hint = document.createElement('div');
    hint.className = 'ephoto-hint';
    hint.textContent = '＋  Tap to add your photo';
    frame.appendChild(hint);

    frame.addEventListener('click', (e) => { e.preventDefault(); pickFor(img); });
  });

  /* make each piece of text tappable-to-edit */
  texts.forEach((el) => {
    el.classList.add('etext');
    el.setAttribute('contenteditable', 'true');
    el.setAttribute('spellcheck', 'false');

    /* Enter finishes editing instead of inserting stray markup */
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); el.blur(); }
    });
    /* save on the way out */
    el.addEventListener('blur', () => {
      localStorage.setItem(TKEY + el.dataset.textKey, el.innerHTML.trim());
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    });
  });

  function pickFor(img) {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = 'image/*';
    inp.addEventListener('change', () => {
      const file = inp.files && inp.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async () => {
        img.src = reader.result;
        try { await dbSet(img.dataset.photoKey, reader.result); } catch (e) {}
        if (window.ScrollTrigger) ScrollTrigger.refresh();
      };
      reader.readAsDataURL(file);
    });
    inp.click();
  }

  /* ---- build a finished, shareable copy with the photos baked in ---- */
  async function exportSite() {
    await restored;
    const doc = document.documentElement.cloneNode(true);

    // strip every trace of edit mode
    doc.querySelectorAll('.edit-fab, .edit-bar, .ephoto-hint').forEach((n) => n.remove());
    doc.querySelectorAll('.ephoto').forEach((n) => {
      n.classList.remove('ephoto');
      if (n.style.position === 'relative') n.style.position = '';
      if (!n.getAttribute('style')) n.removeAttribute('style');
    });
    doc.querySelectorAll('script[src*="edit.js"], link[href*="edit.css"]').forEach((n) => n.remove());
    doc.querySelectorAll('[contenteditable]').forEach((n) => {
      n.removeAttribute('contenteditable');
      n.removeAttribute('spellcheck');
      n.classList.remove('etext');
    });
    const body = doc.querySelector('body');
    body.classList.remove('editing', 'reduced-motion');

    // carry the current (possibly replaced) photo into the exported markup
    const outImgs = doc.querySelectorAll('section img');
    photos.forEach((img, i) => { if (outImgs[i]) outImgs[i].setAttribute('src', img.src); });

    const html = '<!DOCTYPE html>\n' + doc.outerHTML;
    const blob = new Blob([html], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'our-story.html';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
})();
