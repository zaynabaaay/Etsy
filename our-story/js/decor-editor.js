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
  const isPhone = window.matchMedia('(max-width: 767px)').matches;

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
  const milestoneLayer = document.querySelector('.milestone-decor-layer');
  const numbersSection = document.querySelector('#numbers');
  const milestonesScroll = document.querySelector('.milestones-scroll');

  const targetLayer = (state) => {
    if (state?.sectionId === 'numbers' && milestoneLayer) return milestoneLayer;
    return (state?.sectionId && document.getElementById(state.sectionId)) || layer;
  };

  const sectionPageOrigin = (section) => {
    const rect = section.getBoundingClientRect();
    return { left: rect.left + window.scrollX, top: rect.top + window.scrollY, rect };
  };

  const sectionForPageY = (pageY) => {
    const sections = Array.from(document.querySelectorAll('body > section[id]'));
    const exact = sections.find((section) => {
      const origin = sectionPageOrigin(section);
      return pageY >= origin.top && pageY <= origin.top + origin.rect.height;
    });
    if (exact) return exact;
    return sections.reduce((closest, section) => {
      const origin = sectionPageOrigin(section);
      const distance = Math.min(
        Math.abs(pageY - origin.top),
        Math.abs(pageY - (origin.top + origin.rect.height))
      );
      return !closest || distance < closest.distance ? { section, distance } : closest;
    }, null)?.section;
  };

  const setSectionMetadata = (el, state) => {
    if (state?.sectionId) el.dataset.sectionId = state.sectionId;
    el.classList.toggle('milestone-pinned-decor', state?.sectionId === 'numbers');
  };
  let migratedPinnedPlants = false;

  const stableHash = (value) => Array.from(String(value || '')).reduce(
    (hash, character) => ((hash * 31) + character.charCodeAt(0)) >>> 0,
    7
  );

  /* Desktop placements are intentionally art-directed. Phones get a separate
     safe layout: anchored photo flowers return to their responsive defaults,
     while loose plants use their CSS default or a deterministic outer-edge
     slot. This prevents desktop pixel offsets from pushing plants off-screen
     or extending the page with empty overflow. The saved desktop state is
     never overwritten by this phone-only presentation. */
  const viewState = (el, state) => {
    if (!isPhone) return state;
    if (el.matches('.cover-flower, .moment-flower')) {
      return Object.assign({}, state, { x: 0, y: 0, angle: 0, scale: 1, flip: 1 });
    }
    const section = state?.sectionId === 'numbers'
      ? milestoneLayer
      : state?.sectionId && document.getElementById(state.sectionId);
    if (!section) return state;
    const rect = state.sectionId === 'numbers'
      ? { width: window.innerWidth, height: window.innerHeight }
      : section.getBoundingClientRect();
    const fallback = el.__mobileDefault;
    const hash = stableHash(el.dataset.decorId);
    const width = Math.min(
      Number(fallback?.width) || Number(state.width) || 130,
      Math.max(82, window.innerWidth * 0.3)
    );
    const safeLeft = hash % 2 ? rect.width - width * 0.28 : width * 0.28;
    const safeTop = rect.height * (0.16 + ((hash >>> 1) % 5) * 0.16);
    return Object.assign({}, state, {
      left: Number.isFinite(fallback?.left) ? fallback.left : safeLeft,
      top: Number.isFinite(fallback?.top) ? fallback.top : safeTop,
      width,
      x: 0,
      y: 0,
      scale: Math.min(Number(state.scale) || 1, 1.05),
    });
  };

  const viewportCoordinate = (rawValue, viewportSize, fallback) => {
    const raw = String(rawValue || '').trim();
    if (raw.endsWith('%')) return viewportSize * (parseFloat(raw) || 0) / 100;
    return fallback;
  };

  const apply = (el, state) => {
    if (!state) return;
    const shown = viewState(el, state);
    if (Number.isFinite(shown.left)) el.style.setProperty('--decor-left', shown.left + 'px');
    if (Number.isFinite(shown.top)) el.style.setProperty('--decor-top', shown.top + 'px');
    if (Number.isFinite(shown.width)) el.style.setProperty('--decor-width', shown.width + 'px');
    el.style.setProperty('--decor-x', (Number(shown.x) || 0) + 'px');
    el.style.setProperty('--decor-y', (Number(shown.y) || 0) + 'px');
    el.style.setProperty('--decor-angle', (Number(shown.angle) || 0) + 'deg');
    el.style.setProperty('--decor-scale', Number.isFinite(Number(shown.scale)) ? Number(shown.scale) : 1);
    el.style.setProperty('--decor-flip', Number(shown.flip) === -1 ? -1 : 1);
  };

  /* Keep each plant inside the section it decorates. Milestones plants use
     their held viewport layer so they stay fixed with the paper. */
  sourcePlants.forEach((el) => {
    const id = el.dataset.decorId;
    const stored = saved[id];
    const originSectionId = el.closest('section')?.id || '';
    /* Locked pieces still seed the reusable plant catalog, but their approved
       art-directed placement is now owned by CSS instead of localStorage. */
    if (el.dataset.decorLocked === 'true') return;
    if (stored && stored.deleted) {
      el.remove();
      return;
    }

    if (el.classList.contains('free-decor')) {
      const styles = getComputedStyle(el);

      if (originSectionId === 'numbers' && milestoneLayer) {
        const rect = el.getBoundingClientRect();
        const baseAngle = parseFloat(styles.getPropertyValue('--decor-angle')) || 0;
        el.__mobileDefault = {
          left: viewportCoordinate(
            styles.getPropertyValue('--decor-left'),
            window.innerWidth,
            rect.left + rect.width / 2
          ),
          top: viewportCoordinate(
            styles.getPropertyValue('--decor-top'),
            window.innerHeight,
            rect.top + rect.height / 2
          ),
          width: el.offsetWidth,
        };
        const pinnedState = Object.assign({}, stored || {}, {
          sectionId: 'numbers',
          left: viewportCoordinate(
            styles.getPropertyValue('--decor-left'),
            window.innerWidth,
            rect.left + rect.width / 2
          ),
          top: viewportCoordinate(
            styles.getPropertyValue('--decor-top'),
            window.innerHeight,
            rect.top + rect.height / 2
          ),
          width: Number.isFinite(Number(stored?.width)) ? Number(stored.width) : el.offsetWidth,
          x: Number(stored?.x) || 0,
          y: Number(stored?.y) || 0,
          angle: Number.isFinite(Number(stored?.angle)) ? Number(stored.angle) : baseAngle,
          scale: Number.isFinite(Number(stored?.scale)) ? Number(stored.scale) : 1,
          flip: Number(stored?.flip) === -1 ? -1 : 1,
          coordinateSpace: 'viewport',
        });
        setSectionMetadata(el, pinnedState);
        milestoneLayer.appendChild(el);
        apply(el, pinnedState);
        if (stored) {
          saved[id] = pinnedState;
          migratedPinnedPlants = true;
        }
        return;
      }

      const markupSection = document.getElementById(originSectionId);
      if (!markupSection) return;
      const rect = el.getBoundingClientRect();
      const markupOrigin = sectionPageOrigin(markupSection);
      const storedInSection = stored?.coordinateSpace === 'section' && stored?.sectionId;
      const finalPageX = Number(stored?.left) + (Number(stored?.x) || 0);
      const finalPageY = Number(stored?.top) + (Number(stored?.y) || 0);
      const ownerSection = storedInSection
        ? document.getElementById(stored.sectionId) || markupSection
        : stored && Number.isFinite(finalPageY)
          ? sectionForPageY(finalPageY) || markupSection
          : markupSection;
      const ownerOrigin = sectionPageOrigin(ownerSection);
      if (ownerSection === markupSection) {
        el.__mobileDefault = {
          left: rect.left - markupOrigin.rect.left + rect.width / 2,
          top: rect.top - markupOrigin.rect.top + rect.height / 2,
          width: el.offsetWidth,
        };
      }
      const sectionState = Object.assign({}, stored || {}, {
        sectionId: ownerSection.id,
        coordinateSpace: 'section',
        left: storedInSection && Number.isFinite(Number(stored.left))
          ? Number(stored.left)
          : Number.isFinite(finalPageX)
            ? finalPageX - ownerOrigin.left
            : rect.left - ownerOrigin.rect.left + rect.width / 2,
        top: storedInSection && Number.isFinite(Number(stored.top))
          ? Number(stored.top)
          : Number.isFinite(finalPageY)
            ? finalPageY - ownerOrigin.top
            : rect.top - ownerOrigin.rect.top + rect.height / 2,
        x: storedInSection ? Number(stored.x) || 0 : 0,
        y: storedInSection ? Number(stored.y) || 0 : 0,
        width: Number.isFinite(Number(stored?.width)) ? Number(stored.width) : el.offsetWidth,
      });
      setSectionMetadata(el, sectionState);
      ownerSection.appendChild(el);
      apply(el, sectionState);
      if (stored && !isPhone) {
        saved[id] = sectionState;
        migratedPinnedPlants = true;
      }
      return;
    } else {
      /* These five flowers are intentionally anchored inside their photo
         stages so the print stays in front of their stems. Moving them into
         the page-level library layer made every flower sit on top of the
         photograph. Keep the original DOM relationship; dragging still uses
         the same x/y, angle, size, and flip custom properties. */
      if (stored) apply(el, stored);
      return;
    }
  });

  /* Restore copies created from the library on earlier visits. */
  Object.entries(saved).forEach(([id, storedState]) => {
    if (!storedState || !storedState.added || storedState.deleted) return;
    const state = Object.assign({}, storedState);
    const plant = catalog.find((item) => item.id === state.catalogId);
    if (!plant) return;

    /* Placements saved before the pinned Milestones layer existed used page
       coordinates. Migrate any copy that lives inside that section once,
       preserving its horizontal position and bringing its vertical position
       into the held viewport. */
    if (!state.sectionId) {
      const owner = sectionForPageY(state.top + (Number(state.y) || 0));
      if (owner) state.sectionId = owner.id;
    }

    if (state.sectionId === 'numbers' && numbersSection && milestonesScroll && state.coordinateSpace !== 'viewport') {
      const stageTop = milestonesScroll.getBoundingClientRect().top + window.scrollY;
      state.top = Math.min(window.innerHeight - 70, Math.max(70, state.top - stageTop));
      state.coordinateSpace = 'viewport';
      saved[id] = state;
      migratedPinnedPlants = true;
    } else if (state.sectionId && state.sectionId !== 'numbers' && state.coordinateSpace !== 'section') {
      const owner = document.getElementById(state.sectionId);
      if (owner) {
        const origin = sectionPageOrigin(owner);
        state.left -= origin.left;
        state.top -= origin.top;
        state.coordinateSpace = 'section';
        if (!isPhone) {
          saved[id] = state;
          migratedPinnedPlants = true;
        }
      }
    }

    const el = document.createElement('img');
    el.className = 'free-decor library-added-decor';
    el.src = plant.src;
    el.alt = '';
    el.draggable = false;
    el.dataset.decorId = id;
    el.dataset.decorName = plant.name;
    el.dataset.catalogId = plant.id;
    el.dataset.added = 'true';
    setSectionMetadata(el, state);
    targetLayer(state).appendChild(el);
    apply(el, state);
  });
  if (migratedPinnedPlants) persist();

  let decors = Array.from(document.querySelectorAll('img[data-decor-id]:not([data-decor-locked="true"])'));
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
    /* The global layer is now only an emergency fallback. Keep it at zero
       height when empty so it can never extend the document with blank
       scrollable pages below the closing section. */
    layer.style.height = layer.childElementCount
      ? Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) + 'px'
      : '0px';
  };
  sizeLayer();
  window.addEventListener('load', sizeLayer, { once: true });
  window.addEventListener('resize', sizeLayer);

  if (!arranging) return;
  document.body.classList.add('decor-editing');
  if (milestoneLayer) milestoneLayer.removeAttribute('aria-hidden');

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
        '<button type="button" id="decor-copy-layout" class="decor-copy-layout">Copy layout</button>' +
        '<button type="button" id="decor-done" class="decor-done">Done</button>' +
      '</div>' +
      '<p class="decor-copy-status" role="status" aria-live="polite"></p>' +
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
  const copyLayout = panel.querySelector('#decor-copy-layout');
  const copyStatus = panel.querySelector('.decor-copy-status');
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
    const visibleTop = Math.max(0, sectionRect?.top || 0);
    const visibleBottom = Math.min(window.innerHeight, sectionRect?.bottom || window.innerHeight);
    const pinToMilestones = section?.id === 'numbers' && milestoneLayer;
    const left = pinToMilestones
      ? window.innerWidth * 0.5
      : window.innerWidth * 0.5 - (sectionRect?.left || 0);
    const viewportTop = (visibleTop + visibleBottom) * 0.5;
    const top = pinToMilestones ? viewportTop : viewportTop - (sectionRect?.top || 0);
    const id = 'added-' + plant.id + '-' + Date.now().toString(36) + '-' + (++idCounter);
    const width = Math.min(plant.width || 150, Math.max(86, window.innerWidth * 0.3));
    const state = {
      added: true,
      catalogId: plant.id,
      sectionId: section?.id || '',
      left,
      top,
      width,
      x: 0,
      y: 0,
      angle: 0,
      scale: 1,
      flip: 1,
      coordinateSpace: pinToMilestones ? 'viewport' : 'section',
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
    setSectionMetadata(el, state);
    targetLayer(state).appendChild(el);
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
  copyLayout.addEventListener('click', async () => {
    persist();
    const exportText = JSON.stringify({
      version: 2,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        pixelRatio: window.devicePixelRatio || 1,
      },
      layout: saved,
    });
    let copied = false;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(exportText);
        copied = true;
      }
    } catch (error) {}

    if (!copied) {
      const field = document.createElement('textarea');
      field.value = exportText;
      field.setAttribute('readonly', '');
      field.style.position = 'fixed';
      field.style.left = '-9999px';
      document.body.appendChild(field);
      field.select();
      field.setSelectionRange(0, field.value.length);
      try { copied = document.execCommand('copy'); } catch (error) {}
      field.remove();
    }

    if (copied) {
      copyLayout.textContent = 'Copied \u2713';
      copyStatus.textContent = 'Paste the copied layout into the Codex chat.';
      window.setTimeout(() => { copyLayout.textContent = 'Copy layout'; }, 2600);
    } else {
      copyStatus.textContent = 'Copy the layout text, then paste it into the Codex chat.';
      window.prompt('Copy this complete plant layout:', exportText);
    }
  });
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
