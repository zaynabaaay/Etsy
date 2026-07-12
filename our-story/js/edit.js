/* ══════════════════════════════════════════════════════════════════
   OUR STORY · Edit Mode
   Lets a non-technical owner make the story their own — replace photos,
   rewrite any words, add or remove lines, and remove whole sections they
   don't want — with nothing but clicks. Every change is remembered on
   this device and can be baked into a finished page with "Download my
   site".

   How it's remembered: the story's structure + words are saved as ONE
   clean HTML snapshot, so adding or removing elements can never scramble
   things. Photos, which are large, live separately in IndexedDB keyed by
   their filename.

   This file loads BEFORE js/main.js, so the snapshot is restored before
   the animations are bound to the final DOM.

   Nothing in here needs editing to use the template.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const FLAG = 'ourstory:editing';
  const SNAP = 'ourstory:snapshot';
  const editing = localStorage.getItem(FLAG) === '1';

  const grain = () => document.querySelector('.grain');
  const allSections = () => Array.from(document.querySelectorAll('body > section'));
  /* only real, replaceable photos — never the decorative art (the thread
     etc., which are also <img>/inline svg) */
  const PHOTO_SEL = '.polaroid img, .mframe img, .close-photo img';
  const allPhotos = () => Array.from(document.querySelectorAll(PHOTO_SEL));

  /* ── 1 · restore the saved structure + words (in EVERY mode) ──
     Runs synchronously, before main.js, so the animations bind to the
     owner's final page — their added lines, their removed sections. */
  let savedSnap = localStorage.getItem(SNAP);
  /* migration: a snapshot saved before the current memories structure
     (the old camera-montage, or memories without the sticky stage) can't
     be styled or animated by today's CSS/JS. Swap just that section for
     the fresh markup — the owner's photos come back on their own, since
     they're keyed by filename in IndexedDB. */
  if (savedSnap) {
    const box = document.createElement('div');
    box.innerHTML = savedSnap;
    const oldSec = box.querySelector('.scene-montage');
    if (oldSec && !(oldSec.querySelector('.montage-sticky .memory') && oldSec.querySelector('.montage-sticky .montage-exit'))) {
      const freshSec = document.querySelector('.scene-montage');
      if (freshSec) {
        const clone = freshSec.cloneNode(true);
        if (oldSec.classList.contains('is-removed')) clone.classList.add('is-removed');
        oldSec.replaceWith(clone);
        savedSnap = box.innerHTML;
        try { localStorage.setItem(SNAP, savedSnap); } catch (e) {}
      }
    }
  }
  if (savedSnap) {
    const host = grain();
    allSections().forEach((s) => s.remove());
    if (host) host.insertAdjacentHTML('afterend', savedSnap);
  }

  /* ── tiny IndexedDB store (photos can be large, so not localStorage) ── */
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

  /* ── every photo gets a stable key from its filename, and remembers its
        original src so the snapshot can stay small ── */
  function keyPhotos() {
    allPhotos().forEach((img) => {
      if (!img.dataset.origSrc) img.dataset.origSrc = img.getAttribute('src') || '';
      if (!img.dataset.photoKey) {
        const m = img.dataset.origSrc.match(/([^/]+)\.(jpg|jpeg|png|webp|gif)$/i);
        img.dataset.photoKey = m ? m[1] : 'photo-' + Math.random().toString(36).slice(2, 8);
      }
    });
  }
  keyPhotos();

  /* ── restore saved photos in EVERY mode, so the finished experience
        shows the owner's pictures too ── */
  const restored = dbAll().then((saved) => {
    allPhotos().forEach((img) => {
      if (saved[img.dataset.photoKey]) img.src = saved[img.dataset.photoKey];
    });
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }).catch(() => {});

  /* ── the editable pieces of text (the element that holds the words;
        for masked/animated lines that's the inner span) ── */
  const TEXT_SELECTORS = [
    '.intro-title .tline',
    '.opening-line .mask-inner',
    '.chapter-label', '.chapter-title .mask-inner', '.chapter-sub',
    '.moment-date', '.polaroid-caption', '.moment-text',
    '.counter-script', '.counter-label', '.counter-note',
    '.memory-title',
    '.quiet-line .mask-inner', '.quiet-small',
    '.letter-label', '.lp', '.sign-pre', '.sign-name',
    '.close-line .mask-inner', '.close-script', '.close-title', '.close-date',
  ];

  /* ── build ONE clean HTML snapshot of every section (no edit chrome) ── */
  function snapshotHTML() {
    const box = document.createElement('div');
    allSections().forEach((s) => box.appendChild(s.cloneNode(true)));
    box.querySelectorAll('.ephoto-hint, .ed-add, .ed-del').forEach((n) => n.remove());
    box.querySelectorAll('[contenteditable]').forEach((n) => {
      n.removeAttribute('contenteditable'); n.removeAttribute('spellcheck'); n.classList.remove('etext');
    });
    box.querySelectorAll('.ephoto').forEach((n) => {
      n.classList.remove('ephoto');
      if (n.style.position === 'relative') n.style.position = '';
      if (!n.getAttribute('style')) n.removeAttribute('style');
    });
    /* photos revert to their filename — the real picture lives in IndexedDB */
    box.querySelectorAll('img[data-orig-src]').forEach((img) => { img.setAttribute('src', img.dataset.origSrc); });
    return box.innerHTML;
  }
  function save() { try { localStorage.setItem(SNAP, snapshotHTML()); } catch (e) {} }

  /* ── the always-present "Make it yours" button ── */
  const fab = document.createElement('button');
  fab.className = 'edit-fab';
  fab.type = 'button';
  fab.innerHTML = '<span class="edit-fab-heart">♥</span> Make it yours';
  fab.addEventListener('click', () => { localStorage.setItem(FLAG, '1'); location.reload(); });
  document.body.appendChild(fab);

  if (!editing) return; // view mode: just the button + restored edits

  /* ═══════════════ editing mode ═══════════════ */
  document.body.classList.add('editing');

  /* top bar */
  const bar = document.createElement('div');
  bar.className = 'edit-bar';
  bar.innerHTML =
    '<span class="edit-bar-msg"><strong>Editing</strong> · tap anything to change it</span>' +
    '<span class="edit-bar-actions">' +
      '<button class="edit-btn" id="ed-sections" type="button">Sections</button>' +
      '<button class="edit-btn edit-btn-primary" id="ed-download" type="button">Download my site</button>' +
      '<button class="edit-btn" id="ed-done" type="button">Done</button>' +
    '</span>';
  document.body.appendChild(bar);
  bar.querySelector('#ed-done').addEventListener('click', () => { localStorage.removeItem(FLAG); location.reload(); });
  bar.querySelector('#ed-download').addEventListener('click', exportSite);

  /* ── make each photo clickable-to-replace ── */
  function bindPhoto(img) {
    const frame = img.closest('.polaroid, .mframe, .close-photo') || img.parentElement;
    frame.classList.add('ephoto');
    if (getComputedStyle(frame).position === 'static') frame.style.position = 'relative';
    if (!frame.querySelector('.ephoto-hint')) {
      const hint = document.createElement('div');
      hint.className = 'ephoto-hint';
      hint.textContent = '＋  Tap to add your photo';
      frame.appendChild(hint);
    }
    frame.addEventListener('click', (e) => { e.preventDefault(); pickFor(img); });
  }
  allPhotos().forEach(bindPhoto);

  /* ── make each piece of text tappable-to-edit ── */
  function bindText(el) {
    if (el.classList.contains('etext')) return;
    el.classList.add('etext');
    el.setAttribute('contenteditable', 'true');
    el.setAttribute('spellcheck', 'false');
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); el.blur(); }
    });
    el.addEventListener('blur', () => { save(); if (window.ScrollTrigger) ScrollTrigger.refresh(); });
  }
  document.querySelectorAll(TEXT_SELECTORS.join(',')).forEach(bindText);

  /* ── add / remove repeatable lines ──
     The Letter's paragraphs, the opening confession, and The Quiet's
     little-things are all lists the owner can grow or trim. The reveals
     in main.js are built from whatever lines exist, so any count works. */
  function bindTextTree(root) {
    const sel = TEXT_SELECTORS.join(',');
    if (root.matches(sel)) bindText(root);
    root.querySelectorAll(sel).forEach(bindText);
  }
  function focusFirstEditable(root) {
    const el = root.matches('.etext') ? root : root.querySelector('.etext');
    if (!el) return;
    el.focus();
    const r = document.createRange();
    r.selectNodeContents(el);
    const sel = window.getSelection();
    sel.removeAllRanges(); sel.addRange(r);
  }
  function addItemDelete(item, label, place) {
    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'ed-del';
    del.textContent = label;
    del.addEventListener('click', (e) => { e.stopPropagation(); del.remove(); item.remove(); save(); });
    if (place) place(del, item); else item.insertAdjacentElement('afterend', del);
  }
  function enableAddRemove(items, makeItem, addLabel, delLabel, onNew, place) {
    items = Array.from(items);
    if (!items.length) return;
    items.forEach((it) => addItemDelete(it, delLabel, place));
    const add = document.createElement('button');
    add.type = 'button';
    add.className = 'ed-add';
    add.textContent = addLabel;
    /* sit after the last item's delete control, so "Add" is always last */
    const last = items[items.length - 1];
    const lastDel = last.nextElementSibling && last.nextElementSibling.classList.contains('ed-del')
      ? last.nextElementSibling : last;
    lastDel.insertAdjacentElement('afterend', add);
    add.addEventListener('click', () => {
      const el = makeItem();
      add.insertAdjacentElement('beforebegin', el);
      bindTextTree(el);
      if (onNew) onNew(el);
      addItemDelete(el, delLabel, place);
      save();
      focusFirstEditable(el);
    });
  }

  /* a memory's remove control sits as a small chip on its photo's corner,
     so it clearly belongs to that photo instead of floating in the layout */
  const placeMomentDelete = (del, moment) => {
    del.classList.add('ed-del-corner');
    (moment.querySelector('.polaroid') || moment).appendChild(del);
  };

  const makeLp = () => { const p = document.createElement('p'); p.className = 'lp'; p.textContent = 'Write your next line here.'; return p; };
  const makeOpeningLine = () => { const d = document.createElement('div'); d.className = 'opening-line'; d.innerHTML = '<span class="mask"><span class="mask-inner">Write your next line here.</span></span>'; return d; };
  const makeQuietSmall = () => { const p = document.createElement('p'); p.className = 'quiet-small'; p.textContent = 'another little thing,'; return p; };

  /* a soft placeholder photo for a freshly-added memory (the owner taps it
     to drop in their own picture) */
  const PHOTO_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600'%3E%3Crect width='100%25' height='100%25' fill='%23e7ddc6'/%3E%3Ctext x='50%25' y='50%25' font-family='Georgia,serif' font-size='34' fill='%23a2906f' text-anchor='middle' dominant-baseline='middle'%3EYour photo%3C/text%3E%3C/svg%3E";
  let addedSeq = 0;
  const makeMoment = () => {
    /* a clear tilt that alternates side to side like the originals
       (-3, 2.5, -2.5…) — never landing near straight */
    const n = document.querySelectorAll('.moments .moment').length;
    const mag = 2.5 + Math.random();
    const tilt = (n % 2 === 0 ? -mag : mag).toFixed(1);
    const art = document.createElement('article');
    art.className = 'moment';
    art.innerHTML =
      '<p class="moment-date">Month 00 · Year</p>' +
      '<div class="polaroid" data-tilt="' + tilt + '">' +
        '<span class="tape" aria-hidden="true"></span>' +
        '<img alt="" loading="lazy">' +
        '<p class="polaroid-caption">a caption</p>' +
      '</div>' +
      '<p class="moment-text">Tell the story of this moment.</p>';
    const img = art.querySelector('img');
    img.dataset.photoKey = 'added-' + Date.now() + '-' + (addedSeq++);
    img.dataset.origSrc = PHOTO_PLACEHOLDER;
    img.src = PHOTO_PLACEHOLDER;
    return art;
  };

  /* ── The Moments That Made Us: a stack of memories, each a title over
        1–3 photos. Whole memories can be added (stacking underneath) or
        removed; within one, photos can be added up to three or removed
        down to one. ── */
  const makeMemoryPhoto = () => {
    const fig = document.createElement('figure');
    fig.className = 'memory-photo';
    fig.innerHTML = '<div class="mframe"><img alt="" loading="lazy"></div>';
    const img = fig.querySelector('img');
    img.dataset.photoKey = 'added-' + Date.now() + '-' + (addedSeq++);
    img.dataset.origSrc = PHOTO_PLACEHOLDER;
    img.src = PHOTO_PLACEHOLDER;
    return fig;
  };
  const makeMemory = () => {
    const art = document.createElement('article');
    art.className = 'memory';
    art.innerHTML = '<h3 class="memory-title">Name this memory</h3><div class="memory-photos"></div>';
    art.querySelector('.memory-photos').appendChild(makeMemoryPhoto());
    return art;
  };
  /* the 1–3 photo controls inside one memory */
  function bindMemoryPhotos(mem) {
    const row = mem.querySelector('.memory-photos');
    if (!row) return;
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'ed-add ed-add-photo';
    addBtn.textContent = '＋ Add a photo';
    const sync = () => {
      const figs = row.querySelectorAll('.memory-photo');
      row.querySelectorAll('.ed-photo-del').forEach((b) => { b.style.display = figs.length > 1 ? '' : 'none'; });
      addBtn.style.display = figs.length >= 3 ? 'none' : '';
    };
    const addDelChip = (fig) => {
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'ed-del ed-del-corner ed-photo-del';
      del.textContent = '× photo';
      del.addEventListener('click', (e) => { e.stopPropagation(); fig.remove(); sync(); save(); });
      fig.appendChild(del);
    };
    row.querySelectorAll('.memory-photo').forEach(addDelChip);
    row.insertAdjacentElement('afterend', addBtn);
    addBtn.addEventListener('click', () => {
      const fig = makeMemoryPhoto();
      row.appendChild(fig);
      fig.querySelectorAll('img').forEach(bindPhoto);
      addDelChip(fig);
      sync();
      save();
    });
    sync();
  }
  document.querySelectorAll('.memories-list .memory').forEach(bindMemoryPhotos);
  /* the whole-memory remove chip sits on the memory's top corner */
  const placeMemoryDelete = (del, mem) => { del.classList.add('ed-del-corner'); mem.appendChild(del); };
  enableAddRemove(
    document.querySelectorAll('.memories-list .memory'), makeMemory,
    '＋ Add a memory', '× Remove memory',
    (el) => {
      el.querySelectorAll('img').forEach((img) => bindPhoto(img));
      bindMemoryPhotos(el);
    },
    placeMemoryDelete
  );

  const letterBody = document.querySelector('.letter-body');
  if (letterBody) enableAddRemove(letterBody.querySelectorAll('.lp'), makeLp, '＋ Add a line', '× remove line');
  enableAddRemove(document.querySelectorAll('.opening-line'), makeOpeningLine, '＋ Add a line', '× remove line');
  enableAddRemove(document.querySelectorAll('.quiet-stack .quiet-small'), makeQuietSmall, '＋ Add a little thing', '× remove');
  enableAddRemove(
    document.querySelectorAll('.moments .moment'), makeMoment,
    '＋ Add a memory', '× Remove',
    (el) => {
      el.querySelectorAll('img').forEach((img) => bindPhoto(img));
      /* angle it now too, so it matches the others while editing */
      const pol = el.querySelector('.polaroid');
      if (pol && window.gsap) gsap.set(pol, { rotation: parseFloat(pol.dataset.tilt || 0) });
    },
    placeMomentDelete
  );

  /* ── show / hide whole sections, from one tidy panel in the top bar ──
     (no controls cluttering the page; hidden sections simply don't appear
     and are left out of the finished site) ── */
  const panel = document.createElement('div');
  panel.className = 'ed-panel';
  panel.hidden = true;
  panel.innerHTML = '<div class="ed-panel-head">Sections</div>';
  const list = document.createElement('ul');
  list.className = 'ed-panel-list';
  allSections().forEach((sec) => {
    const li = document.createElement('li');
    li.className = 'ed-srow';
    const name = document.createElement('span');
    name.className = 'ed-srow-name';
    name.textContent = sec.dataset.label || sec.id || 'Section';
    const tog = document.createElement('button');
    tog.type = 'button';
    tog.className = 'ed-toggle';
    tog.setAttribute('role', 'switch');
    tog.setAttribute('aria-label', 'Show ' + name.textContent);
    const sync = () => {
      const shown = !sec.classList.contains('is-removed');
      tog.setAttribute('aria-checked', shown ? 'true' : 'false');
      li.classList.toggle('is-off', !shown);
    };
    tog.addEventListener('click', () => { sec.classList.toggle('is-removed'); sync(); save(); });
    li.appendChild(name);
    li.appendChild(tog);
    list.appendChild(li);
    sync();
  });
  panel.appendChild(list);
  const note = document.createElement('p');
  note.className = 'ed-panel-note';
  note.textContent = 'Turn a section off to leave it out of your finished site — turn it back on any time.';
  panel.appendChild(note);
  document.body.appendChild(panel);

  const sectionsBtn = bar.querySelector('#ed-sections');
  function togglePanel(open) {
    panel.hidden = open === undefined ? !panel.hidden : !open;
    sectionsBtn.classList.toggle('is-active', !panel.hidden);
  }
  sectionsBtn.addEventListener('click', (e) => { e.stopPropagation(); togglePanel(); });
  document.addEventListener('click', (e) => {
    if (panel.hidden || panel.contains(e.target) || sectionsBtn.contains(e.target)) return;
    togglePanel(false);
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
        save();
        if (window.ScrollTrigger) ScrollTrigger.refresh();
      };
      reader.readAsDataURL(file);
    });
    inp.click();
  }

  /* ── build a finished, shareable copy with the photos baked in ── */
  async function exportSite() {
    await restored;
    const doc = document.documentElement.cloneNode(true);

    /* sections the owner removed are gone for good in the finished site */
    doc.querySelectorAll('section.is-removed').forEach((n) => n.remove());

    /* strip every trace of edit mode */
    doc.querySelectorAll('.edit-fab, .edit-bar, .ed-panel, .ephoto-hint, .ed-add, .ed-del').forEach((n) => n.remove());
    doc.querySelectorAll('.ephoto').forEach((n) => {
      n.classList.remove('ephoto');
      if (n.style.position === 'relative') n.style.position = '';
      if (!n.getAttribute('style')) n.removeAttribute('style');
    });
    doc.querySelectorAll('script[src*="edit.js"], link[href*="edit.css"]').forEach((n) => n.remove());
    doc.querySelectorAll('[contenteditable]').forEach((n) => {
      n.removeAttribute('contenteditable'); n.removeAttribute('spellcheck'); n.classList.remove('etext');
    });
    const body = doc.querySelector('body');
    body.classList.remove('editing', 'reduced-motion');

    /* bake the current (possibly replaced) photo into each img */
    const liveByKey = {};
    allPhotos().forEach((img) => { liveByKey[img.dataset.photoKey] = img.src; });
    doc.querySelectorAll('section img[data-photo-key]').forEach((img) => {
      const src = liveByKey[img.dataset.photoKey];
      if (src) img.setAttribute('src', src);
      img.removeAttribute('data-orig-src');
      img.removeAttribute('data-photo-key');
    });

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
