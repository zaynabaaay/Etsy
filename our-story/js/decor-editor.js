/* ══════════════════════════════════════════════════════════════════
   OUR STORY · Reusable botanical library
   Open with ?edit-flowers=1 to add unlimited copies of any plant to the
   section currently in view, then move, rotate, resize, flip, or delete
   every placed instance. Placements are saved in this browser.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const KEY = 'ourstory:decor-library:v2';
  const LEGACY_KEY = 'ourstory:decor-positions:v1';
  const params = new URLSearchParams(location.search);
  const arranging = params.get('edit-flowers') === '1';

  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(KEY) || localStorage.getItem(LEGACY_KEY) || '{}') || {};
  } catch (error) {
    saved = {};
  }

  const persist = () => {
    try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (error) {}
  };

  const anchoredPlants = [
    ['.cover-flower-left', 'cover-babys-breath-left', "Opening baby's breath — left", -48, -1],
    ['.cover-flower-right', 'cover-babys-breath-right', "Opening baby's breath — right", 8, 1],
    ['.moment-flower--one', 'beginning-babys-breath-one', "Beginning baby's breath — first photo", -12, 1],
    ['.moment-flower--two', 'beginning-babys-breath-two', "Beginning baby's breath — second photo", 14, -1],
    ['.moment-flower--three', 'beginning-botanical-three', 'Beginning leafy branch — third photo', -7, 1],
  ];

  anchoredPlants.forEach(([selector, id, name, baseAngle, baseFlip]) => {
    const el = document.querySelector(selector);
    if (!el) return;
    el.dataset.decorId = id;
    el.dataset.decorName = name;
    el.dataset.decorBaseAngle = baseAngle;
    el.dataset.decorBaseFlip = baseFlip;
  });

  const sourcePlants = Array.from(document.querySelectorAll('[data-decor-id]'));
  if (!sourcePlants.length) return;

  /* Build the reusable library before moving the original plants. Distinct
     source images become distinct library choices; duplicates are shown once. */
  const catalog = [];
  const seenSources = new Set();
  sourcePlants.forEach((el) => {
    const src = el.getAttribute('src');
    if (!src || seenSources.has(src)) return;
    seenSources.add(src);
    const filename = src.split('/').pop().replace(/\?.*$/, '').replace(/\.[^.]+$/, '');
    catalog.push({
      id: 'plant-' + filename.replace(/[^a-z0-9]+/gi, '-').toLowerCase(),
      src,
      name: el.dataset.decorName || filename.replace(/[-_]+/g, ' '),
      width: el.offsetWidth || parseFloat(getComputedStyle(el).width) || 150,
    });
  });

  const layer = document.createElement('div');
  layer.className = 'decor-global-layer';
  document.body.classList.add('decor-layer-active');
  document.body.appendChild(layer);

  const apply = (el, state) => {
    if (!state) return;
    if (Number.isFinite(state.left)) el.style.setProperty('--decor-left', state.left + 'px');
    if (Number.isFinite(state.top)) el.style.setProperty('--decor-top', state.top + 'px');
    if (Number.isFinite(state.width)) el.style.setProperty('--decor-width', state.width + 'px');
    el.style.setProperty('--decor-x', (Number(state.x) || 0) + 'px');
    el.style.setProperty('--decor-y', (Number(state.y) || 0) + 'px');
    el.style.setProperty('--decor-angle', (Number(state.angle) || 0) + 'deg');
    el.style.setProperty('--decor-scale', Number.isFinite(Number(state.scale)) ? Number(state.scale) : 1);
    el.style.setProperty('--decor-flip', Number(state.flip) === -1 ? -1 : 1);
  };

  /* Lift every original plant into the page-level layer. Paper sections can
     never cover this layer, even when a plant crosses a section boundary. */
  sourcePlants.forEach((el) => {
    const id = el.dataset.decorId;
    const stored = saved[id];
    if (stored && stored.deleted) {
      el.remove();
      return;
    }

    if (el.classList.contains('free-decor')) {
      const parent = el.offsetParent;
      const parentRect = parent ? parent.getBoundingClientRect() : { left: 0, top: 0 };
      const styles = getComputedStyle(el);
      const left = parseFloat(styles.left) || 0;
      const top = parseFloat(styles.top) || 0;
      el.style.setProperty('--decor-left', parentRect.left + window.scrollX + left + 'px');
      el.style.setProperty('--decor-top', parentRect.top + window.scrollY + top + 'px');
    } else {
      const rect = el.getBoundingClientRect();
      el.classList.add('layered-anchored-decor');
      el.style.setProperty('--decor-left', rect.left + window.scrollX + rect.width / 2 + 'px');
      el.style.setProperty('--decor-top', rect.top + window.scrollY + rect.height / 2 + 'px');
      el.style.setProperty('--decor-width', el.offsetWidth + 'px');
      el.style.setProperty('--decor-base-angle', (Number(el.dataset.decorBaseAngle) || 0) + 'deg');
      el.style.setProperty('--decor-base-flip', Number(el.dataset.decorBaseFlip) || 1);
    }

    layer.appendChild(el);
    if (stored) apply(el, stored);
  });

  /* Restore copies created from the library on earlier visits. */
  Object.entries(saved).forEach(([id, state]) => {
    if (!state || !state.added || state.deleted) return;
    const plant = catalog.find((item) => item.id === state.catalogId);
    if (!plant) return;
    const el = document.createElement('img');
    el.className = 'free-decor library-added-decor';
    el.src = plant.src;
    el.alt = '';
    el.draggable = false;
    el.dataset.decorId = id;
    el.dataset.decorName = plant.name;
    el.dataset.catalogId = plant.id;
    el.dataset.added = 'true';
    layer.appendChild(el);
    apply(el, state);
  });

  let decors = Array.from(layer.querySelectorAll('[data-decor-id]'));
  decors.forEach((el) => el.classList.add('movable-decor'));

  const cssNumber = (el, name, fallback) => {
    const value = parseFloat(getComputedStyle(el).getPropertyValue(name));
    return Number.isFinite(value) ? value : fallback;
  };

  const current = (el) => {
    const stored = saved[el.dataset.decorId] || {};
    return Object.assign({
      left: cssNumber(el, '--decor-left', 0),
      top: cssNumber(el, '--decor-top', 0),
      width: cssNumber(el, '--decor-width', el.offsetWidth || 150),
      x: cssNumber(el, '--decor-x', 0),
      y: cssNumber(el, '--decor-y', 0),
      angle: cssNumber(el, '--decor-angle', 0),
      scale: cssNumber(el, '--decor-scale', 1),
      flip: cssNumber(el, '--decor-flip', 1),
    }, stored);
  };

  const sizeLayer = () => {
    layer.style.height = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) + 'px';
  };
  sizeLayer();
  window.addEventListener('load', sizeLayer, { once: true });
  window.addEventListener('resize', sizeLayer);

  if (!arranging) return;
  document.body.classList.add('decor-editing');

  const panel = document.createElement('div');
  panel.className = 'decor-panel';
  panel.innerHTML =
    '<div class="decor-panel-head">Plant library</div>' +
    '<p class="decor-current-section">Adding to: <strong>this section</strong></p>' +
    '<details class="decor-library" open>' +
      '<summary>Add a plant</summary><div class="decor-library-grid"></div>' +
    '</details>' +
    '<details class="decor-placed">' +
      '<summary>Placed plants (<span class="decor-placed-count">0</span>)</summary><div class="decor-placed-list"></div>' +
    '</details>' +
    '<div class="decor-transform-controls">' +
      '<p class="decor-panel-name">Select a placed plant to adjust it.</p>' +
      '<label>Angle <output id="decor-angle-out">0°</output><input id="decor-angle" type="range" min="-180" max="180" step="1" value="0" disabled></label>' +
      '<label>Size <output id="decor-size-out">100%</output><input id="decor-size" type="range" min="0.35" max="2.2" step="0.01" value="1" disabled></label>' +
      '<div class="decor-panel-actions">' +
        '<button type="button" id="decor-flip" disabled>Flip</button>' +
        '<button type="button" id="decor-reset" disabled>Reset</button>' +
        '<button type="button" id="decor-delete" class="decor-delete" disabled>Delete</button>' +
        '<button type="button" id="decor-reset-all">Reset all</button>' +
        '<button type="button" id="decor-done" class="decor-done">Done</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(panel);

  const sectionLabel = panel.querySelector('.decor-current-section strong');
  const libraryGrid = panel.querySelector('.decor-library-grid');
  const placedList = panel.querySelector('.decor-placed-list');
  const placedCount = panel.querySelector('.decor-placed-count');
  const nameEl = panel.querySelector('.decor-panel-name');
  const angle = panel.querySelector('#decor-angle');
  const angleOut = panel.querySelector('#decor-angle-out');
  const size = panel.querySelector('#decor-size');
  const sizeOut = panel.querySelector('#decor-size-out');
  const flip = panel.querySelector('#decor-flip');
  const reset = panel.querySelector('#decor-reset');
  const deleteSelected = panel.querySelector('#decor-delete');
  let selected = null;
  let drag = null;
  let idCounter = 0;

  const visibleSection = () => {
    const middle = window.innerHeight * 0.5;
    const sections = Array.from(document.querySelectorAll('body > section:not(.is-removed)'));
    return sections.find((section) => {
      const rect = section.getBoundingClientRect();
      return rect.top <= middle && rect.bottom >= middle;
    }) || sections.reduce((best, section) => {
      const rect = section.getBoundingClientRect();
      const distance = Math.min(Math.abs(rect.top - middle), Math.abs(rect.bottom - middle));
      return !best || distance < best.distance ? { section, distance } : best;
    }, null)?.section;
  };

  const updateSectionLabel = () => {
    const section = visibleSection();
    sectionLabel.textContent = section?.dataset.label || section?.id || 'current section';
  };
  updateSectionLabel();
  window.addEventListener('scroll', updateSectionLabel, { passive: true });

  const updatePanel = () => {
    const active = !!selected && selected.isConnected;
    [angle, size, flip, reset, deleteSelected].forEach((control) => { control.disabled = !active; });
    if (!active) {
      nameEl.textContent = 'Select a placed plant to adjust it.';
      return;
    }
    const state = current(selected);
    nameEl.textContent = selected.dataset.decorName || 'Selected plant';
    angle.value = state.angle;
    size.value = state.scale;
    angleOut.textContent = Math.round(state.angle) + '°';
    sizeOut.textContent = Math.round(state.scale * 100) + '%';
  };

  const select = (el, shouldScroll) => {
    decors.forEach((item) => item.classList.toggle('is-selected', item === el));
    selected = el;
    updatePanel();
    if (shouldScroll) el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
  };

  const saveSelected = (state) => {
    if (!selected) return;
    const previous = saved[selected.dataset.decorId] || {};
    saved[selected.dataset.decorId] = Object.assign({}, previous, state);
    apply(selected, saved[selected.dataset.decorId]);
    persist();
    updatePanel();
  };

  const deleteDecor = (el) => {
    if (!el) return;
    const id = el.dataset.decorId;
    if (el.dataset.added === 'true') {
      delete saved[id];
    } else {
      saved[id] = Object.assign({}, current(el), { deleted: true });
    }
    if (selected === el) selected = null;
    el.remove();
    decors = decors.filter((item) => item !== el);
    persist();
    refreshPlacedList();
    updatePanel();
  };

  const bindDecor = (el) => {
    el.classList.add('movable-decor');
    el.removeAttribute('aria-hidden');
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', 'Move ' + (el.dataset.decorName || 'plant'));

    el.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      event.stopPropagation();
      select(el, false);
      const state = current(el);
      drag = { el, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, state };
      el.classList.add('is-dragging');
      el.setPointerCapture(event.pointerId);
    });

    el.addEventListener('pointermove', (event) => {
      if (!drag || drag.el !== el || drag.pointerId !== event.pointerId) return;
      const next = Object.assign({}, drag.state, {
        x: drag.state.x + event.clientX - drag.startX,
        y: drag.state.y + event.clientY - drag.startY,
      });
      const previous = saved[el.dataset.decorId] || {};
      saved[el.dataset.decorId] = Object.assign({}, previous, next);
      apply(el, saved[el.dataset.decorId]);
      updatePanel();
    });

    const endDrag = (event) => {
      if (!drag || drag.el !== el || drag.pointerId !== event.pointerId) return;
      el.classList.remove('is-dragging');
      drag = null;
      persist();
    };
    el.addEventListener('pointerup', endDrag);
    el.addEventListener('pointercancel', endDrag);
    el.addEventListener('click', (event) => { event.preventDefault(); select(el, false); });
    el.addEventListener('keydown', (event) => {
      const step = event.shiftKey ? 12 : 3;
      const delta = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[event.key];
      if (!delta) return;
      event.preventDefault();
      select(el, false);
      const state = current(el);
      state.x += delta[0];
      state.y += delta[1];
      saveSelected(state);
    });
  };

  const refreshPlacedList = () => {
    placedList.innerHTML = '';
    placedCount.textContent = decors.length;
    decors.forEach((el) => {
      const row = document.createElement('div');
      row.className = 'decor-placed-row';
      const choose = document.createElement('button');
      choose.type = 'button';
      choose.className = 'decor-placed-select';
      choose.textContent = el.dataset.decorName || 'Plant';
      choose.addEventListener('click', () => select(el, true));
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'decor-row-delete';
      remove.textContent = 'Delete';
      remove.setAttribute('aria-label', 'Delete ' + choose.textContent);
      remove.addEventListener('click', () => deleteDecor(el));
      row.append(choose, remove);
      placedList.appendChild(row);
    });
  };

  const addPlant = (plant) => {
    const section = visibleSection();
    const sectionRect = section?.getBoundingClientRect();
    const left = window.scrollX + window.innerWidth * 0.5;
    const visibleTop = Math.max(0, sectionRect?.top || 0);
    const visibleBottom = Math.min(window.innerHeight, sectionRect?.bottom || window.innerHeight);
    const top = window.scrollY + (visibleTop + visibleBottom) * 0.5;
    const id = 'added-' + plant.id + '-' + Date.now().toString(36) + '-' + (++idCounter);
    const width = Math.min(plant.width || 150, Math.max(86, window.innerWidth * 0.3));
    const state = {
      added: true,
      catalogId: plant.id,
      left,
      top,
      width,
      x: 0,
      y: 0,
      angle: 0,
      scale: 1,
      flip: 1,
    };
    const el = document.createElement('img');
    el.className = 'free-decor library-added-decor';
    el.src = plant.src;
    el.alt = '';
    el.draggable = false;
    el.dataset.decorId = id;
    el.dataset.decorName = plant.name;
    el.dataset.catalogId = plant.id;
    el.dataset.added = 'true';
    layer.appendChild(el);
    apply(el, state);
    saved[id] = state;
    decors.push(el);
    bindDecor(el);
    persist();
    sizeLayer();
    refreshPlacedList();
    select(el, false);
  };

  catalog.forEach((plant) => {
    const item = document.createElement('div');
    item.className = 'decor-library-item';
    const thumb = document.createElement('img');
    thumb.src = plant.src;
    thumb.alt = '';
    const label = document.createElement('span');
    label.textContent = plant.name;
    const add = document.createElement('button');
    add.type = 'button';
    add.textContent = 'Add';
    add.setAttribute('aria-label', 'Add ' + plant.name + ' to ' + sectionLabel.textContent);
    add.addEventListener('click', () => addPlant(plant));
    item.append(thumb, label, add);
    libraryGrid.appendChild(item);
  });

  decors.forEach(bindDecor);
  refreshPlacedList();

  angle.addEventListener('input', () => {
    const state = current(selected);
    state.angle = Number(angle.value);
    saveSelected(state);
  });
  size.addEventListener('input', () => {
    const state = current(selected);
    state.scale = Number(size.value);
    saveSelected(state);
  });
  flip.addEventListener('click', () => {
    const state = current(selected);
    state.flip = state.flip * -1;
    saveSelected(state);
  });
  reset.addEventListener('click', () => {
    if (!selected) return;
    const id = selected.dataset.decorId;
    if (selected.dataset.added === 'true') {
      const state = current(selected);
      saved[id] = Object.assign({}, saved[id], { x: 0, y: 0, angle: 0, scale: 1, flip: 1 });
      apply(selected, saved[id]);
    } else {
      delete saved[id];
      ['--decor-x', '--decor-y', '--decor-angle', '--decor-scale', '--decor-flip'].forEach((name) => selected.style.removeProperty(name));
    }
    persist();
    updatePanel();
  });
  deleteSelected.addEventListener('click', () => deleteDecor(selected));
  panel.querySelector('#decor-reset-all').addEventListener('click', () => {
    if (!window.confirm('Remove added plants and restore every original plant?')) return;
    try {
      localStorage.removeItem(KEY);
      localStorage.removeItem(LEGACY_KEY);
    } catch (error) {}
    location.reload();
  });
  panel.querySelector('#decor-done').addEventListener('click', () => {
    params.delete('edit-flowers');
    const query = params.toString();
    location.href = location.pathname + (query ? '?' + query : '') + location.hash;
  });
})();
