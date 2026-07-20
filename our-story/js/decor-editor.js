/* ══════════════════════════════════════════════════════════════════
   OUR STORY · Reusable botanical library
   Open with ?edit-flowers=1 to add unlimited copies of any plant to the
   section currently in view, then move, rotate, resize, flip, or delete
   every placed instance. Placements are saved in this browser.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const KEY = 'ourstory:decor-library:v5';
  const OLD_KEYS = ['ourstory:decor-library:v4', 'ourstory:decor-library:v3', 'ourstory:decor-library:v2', 'ourstory:decor-positions:v1'];
  const params = new URLSearchParams(location.search);
  const arranging = params.get('edit-flowers') === '1';
  const isPhone = window.matchMedia('(max-width: 767px)').matches;

  /* Complete arrangement exported from the iPad. This is the shared starting
     layout that every device — and every buyer's fresh browser — sees, so the
     flowers are genuinely part of the template. New in-browser adjustments save
     to v5 on top of this, but this baked layout is the source of truth. */
  const defaultLayout = {
    'beginning-babys-breath-one': { left: 632.6356201171875, top: 1602.1925659179688, width: 190, x: 0.12109375, y: 0.05859375, angle: 0, scale: 1, flip: 1, deleted: true },
    'beginning-babys-breath-two': { left: 1582.1451416015625, top: 2148.7647705078125, width: 180, x: -0.1015625, y: 0, angle: 0, scale: 1, flip: 1, deleted: true },
    'dried-daisy': { left: 2039.2414062500002, top: 764.062875, width: 185, x: 0, y: 0, angle: 14, scale: 1, flip: 1, sectionId: 'opening', coordinateSpace: 'section', deleted: true },
    'eucalyptus-lunaria': { left: 1881.64078125, top: 358.188, width: 178, x: 0.02734375, y: -0.1015625, angle: 17, scale: 1, flip: 1, sectionId: 'opening', coordinateSpace: 'section', deleted: true },
    'leaf-branch': { left: 156.79687881469727, top: 293.015625, width: 175, x: -0.0703125, y: -0.07421875, angle: 0, scale: 1, flip: 1, deleted: true },
    'straight-eucalyptus': { left: 2150.3984375, top: 549.359375, width: 118, x: -0.0078125, y: -0.1015625, angle: 0, scale: 1, flip: 1, deleted: true },
    'wildflower-fan': { left: 1948.796875, top: 947.171875, width: 245, x: 0, y: 0, angle: 0, scale: 1, flip: 1, deleted: true },
    'dried-bundle': { left: 1601.46875, top: 82.83984375, width: 205, x: -25.4884033203125, y: 1023.8092346191406, angle: 31, scale: 0.73, flip: 1, sectionId: 'beginning', coordinateSpace: 'section', phone: { deleted: true } },
    'flowering-branch': { left: 156.79688453674316, top: 719.8515625, width: 290, x: -0.37109375, y: 0, angle: 0, scale: 1, flip: 1, deleted: true },
    'added-plant-dried-cosmos-stem-mroayfjy-1': { added: true, catalogId: 'plant-dried-cosmos-stem', sectionId: 'beginning', left: 1120, top: 494.25, width: 145, x: -450.3359375, y: 90.5078125, angle: -41, scale: 1, flip: 1, coordinateSpace: 'section', deleted: true, phone: { left: 357.24, top: 736.9, width: 117, x: -32, y: 158, angle: 35, scale: 0.76, flip: 1 } },
    'cream-sprig': { left: 2060.7969360351562, top: 1648.8984375, width: 285, x: -0.57421875, y: -0.60546875, angle: 0, scale: 1, flip: 1, deleted: true },
    'olive-arch': { left: 1164.7968444824219, top: 95.1171875, width: 650, x: -0.19921875, y: -0.28125, angle: 0, scale: 1, flip: 1, deleted: true },
    'straight-myrtle': { left: 2105.59375, top: 751.65625, width: 112, x: -0.10546875, y: -0.16796875, angle: 0, scale: 1, flip: 1, deleted: true },
    'straight-olive': { left: 0, top: 0, width: 109, x: -0.07421875, y: 0, angle: 0, scale: 1, flip: 1, deleted: true },
    'added-plant-generated-botanical-1-mrobmf54-1': { added: true, catalogId: 'plant-generated-botanical-1', sectionId: 'beginning', left: 1120, top: 1380, width: 175, x: -885.734375, y: 242.81640625, angle: -43, scale: 1, flip: 1, coordinateSpace: 'section', phone: { left: 32.76, top: 1473.8, width: 117, x: 32, y: 123, angle: -70, scale: 0.73, flip: 1 } },
    'corner-branch': { left: 0, top: 0, width: 320, x: -0.328125, y: 0, angle: 0, scale: 1, flip: 1, deleted: true },
    'added-plant-opening-babys-breath-right-mrobnbvu-2': { added: true, catalogId: 'plant-opening-babys-breath-right', sectionId: 'numbers', left: 1120, top: 577.17578125, width: 168, x: 360.55859375, y: -105.2734375, angle: 45, scale: 0.8, flip: -1, coordinateSpace: 'viewport', phone: { deleted: true } },
    'cosmos-stem': { left: 313.6, top: 691.56, width: 145, x: -0.40234375, y: 0.0859375, angle: -14, scale: 1, flip: 1, deleted: true },
    'straight-ruscus': { left: 112, top: 1321.2734375, width: 116, x: -0.2578125, y: -0.640625, angle: 0, scale: 1, flip: 1, deleted: true },
    'added-plant-opening-babys-breath-right-mrobtsww-1': { added: true, catalogId: 'plant-opening-babys-breath-right', sectionId: 'montage', left: 1120, top: 664.46875, width: 168, x: -155.25390625, y: 246.1953125, angle: 50, scale: 0.88, flip: -1, coordinateSpace: 'section', deleted: true, phone: { deleted: true } },
    'added-plant-dried-cosmos-stem-mrobuje6-2': { added: true, catalogId: 'plant-dried-cosmos-stem', sectionId: 'montage', left: 1120, top: 2190.1484375, width: 145, x: 463.5390625, y: 196.890625, angle: 48, scale: 0.86, flip: -1, coordinateSpace: 'section', deleted: true, phone: { deleted: true } },
    'added-plant-dried-flower-daisy-mrobv8ko-3': { added: true, catalogId: 'plant-dried-flower-daisy', sectionId: 'montage', left: 1120, top: 2190.1484375, width: 185, x: -963.69921875, y: 67.46484375, angle: -28, scale: 0.75, flip: -1, coordinateSpace: 'section', deleted: true, phone: { deleted: true } },
    'added-plant-dried-cosmos-stem-mror1ph1-1': { added: true, catalogId: 'plant-dried-cosmos-stem', sectionId: 'beginning', left: 683, top: 830.640625, width: 137, x: -462.5, y: -239, angle: -22, scale: 1, flip: -1, coordinateSpace: 'section', phone: { deleted: true } },
    'added-plant-dried-flower-wildflower-bundle-mror227e-2': { added: true, catalogId: 'plant-dried-flower-wildflower-bundle', sectionId: 'beginning', left: 683, top: 830.640625, width: 191, x: 454.5, y: 281.5, angle: 38, scale: 0.74, flip: -1, coordinateSpace: 'section', phone: { deleted: true } },
    'added-plant-dried-cosmos-stem-mror70sz-5': { added: true, catalogId: 'plant-dried-cosmos-stem', sectionId: 'montage', left: 683, top: 2311.484375, width: 137, x: 486.5, y: -62, angle: 65, scale: 0.86, flip: -1, coordinateSpace: 'section', deleted: true, phone: { deleted: true } },
    'added-plant-dried-eucalyptus-lunaria-mrovt7h6-1': { added: true, catalogId: 'plant-dried-eucalyptus-lunaria', sectionId: 'montage', left: 195, top: 332.2421875, width: 117, x: 0, y: 0, angle: 0, scale: 1, flip: 1, coordinateSpace: 'section', deleted: true, phone: { deleted: true } },
    'added-plant-dried-eucalyptus-lunaria-mrovu17f-2': { added: true, catalogId: 'plant-dried-eucalyptus-lunaria', sectionId: 'numbers', left: 195, top: 190.7578125, width: 117, x: 0, y: 0, angle: 0, scale: 1, flip: 1, coordinateSpace: 'viewport', deleted: true, phone: { deleted: true } },
    'added-plant-flowering-olive-arch-mrovw36l-1': { added: true, catalogId: 'plant-flowering-olive-arch', sectionId: 'montage', left: 195, top: 201.2421875, width: 117, x: 0, y: 0, angle: 0, scale: 1, flip: 1, coordinateSpace: 'section', deleted: true, phone: { left: 357.24, top: 715.5175, width: 117, x: -112.67, y: 23.67, angle: 0, scale: 1, flip: 1, deleted: true } },
  };

  let saved = JSON.parse(JSON.stringify(defaultLayout));
  try {
    const currentLayout = JSON.parse(localStorage.getItem(KEY) || '{}') || {};
    saved = Object.assign(saved, currentLayout);
  } catch (error) {
    saved = JSON.parse(JSON.stringify(defaultLayout));
  }

  /* A plant's visibility is per-device, just like its position. On a phone a
     `.phone` overlay decides: an overlay WITHOUT a `deleted` key means the plant
     was hand-placed for phones and shows there even when it's hidden on iPad; an
     overlay WITH `deleted:true` hides it on phones only. With no overlay at all,
     phones follow the shared (iPad) flag. On iPad/desktop the shared top-level
     `deleted` always decides. This lets each device keep its own set of flowers
     without one wiping the other. */
  const effDeleted = (state) => {
    if (!state) return false;
    if (isPhone && state.phone) {
      return Object.prototype.hasOwnProperty.call(state.phone, 'deleted') ? !!state.phone.deleted : false;
    }
    return !!state.deleted;
  };

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
    /* If this plant has a hand-placed PHONE position, show that instead of the
       auto-safe fallback. Phone placements live in a `.phone` sub-object on the
       shared record, so the iPad/desktop layout (the top-level values) is never
       touched — each device shows its own dragged arrangement. */
    const record = saved[el.dataset.decorId];
    const phone = record && record.phone;
    const PLACE_KEYS = ['left', 'top', 'width', 'x', 'y', 'angle', 'scale', 'flip'];
    if (phone && PLACE_KEYS.some((key) => phone[key] !== undefined)) {
      return Object.assign({}, state, phone);
    }
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
    /* A hidden source can seed the library without appearing as a placed
       plant. Every visible plant remains selectable in edit mode. */
    if (el.dataset.decorCatalogOnly === 'true') return;
    if (effDeleted(stored)) {
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
        /* apply for display only — never re-save on load. Rewriting the
           position on every load (from live measurements) is what made a
           locked flower walk a little further each refresh. */
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
      /* display only — the locked value is never rewritten on load */
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
    if (!storedState || !storedState.added || effDeleted(storedState)) return;
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

    /* one-time coordinate-space conversion for legacy saves — computed for
       display only, never written back (writing it back on every load is what
       made placements drift). New placements are already saved in the right
       space, so they skip this entirely and stay put. */
    if (state.sectionId === 'numbers' && numbersSection && milestonesScroll && state.coordinateSpace !== 'viewport') {
      const stageTop = milestonesScroll.getBoundingClientRect().top + window.scrollY;
      state.top = Math.min(window.innerHeight - 70, Math.max(70, state.top - stageTop));
      state.coordinateSpace = 'viewport';
    } else if (state.sectionId && state.sectionId !== 'numbers' && state.coordinateSpace !== 'section') {
      const owner = document.getElementById(state.sectionId);
      if (owner) {
        const origin = sectionPageOrigin(owner);
        state.left -= origin.left;
        state.top -= origin.top;
        state.coordinateSpace = 'section';
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

  let decors = Array.from(document.querySelectorAll('img[data-decor-id]:not([data-decor-catalog-only="true"])'));
  decors.forEach((el) => el.classList.add('movable-decor'));

  const cssNumber = (el, name, fallback) => {
    const value = parseFloat(getComputedStyle(el).getPropertyValue(name));
    return Number.isFinite(value) ? value : fallback;
  };

  const GEOM_KEYS = ['left', 'top', 'width', 'x', 'y', 'angle', 'scale', 'flip'];
  const pickGeom = (state) => {
    const out = {};
    GEOM_KEYS.forEach((key) => { if (state[key] !== undefined) out[key] = state[key]; });
    return out;
  };

  /* Route every geometry edit to the right layout. On a phone, edits are saved
     into the record's `.phone` overlay so the iPad/desktop numbers stay put; on
     iPad/desktop they update the shared top-level record as before. */
  const writeGeometry = (id, state) => {
    const base = saved[id] || {};
    if (isPhone) {
      saved[id] = Object.assign({}, base, { phone: Object.assign({}, base.phone, pickGeom(state)) });
    } else {
      saved[id] = Object.assign({}, base, state);
    }
    return saved[id];
  };

  const current = (el) => {
    const stored = saved[el.dataset.decorId] || {};
    const applied = {
      left: cssNumber(el, '--decor-left', 0),
      top: cssNumber(el, '--decor-top', 0),
      width: cssNumber(el, '--decor-width', el.offsetWidth || 150),
      x: cssNumber(el, '--decor-x', 0),
      y: cssNumber(el, '--decor-y', 0),
      angle: cssNumber(el, '--decor-angle', 0),
      scale: cssNumber(el, '--decor-scale', 1),
      flip: cssNumber(el, '--decor-flip', 1),
    };
    if (isPhone) {
      /* On a phone the "current" placement is whatever is displayed right now —
         either the auto-safe fallback or an existing phone override — plus the
         shared record's identity fields (added / catalogId / sectionId /
         coordinateSpace) so a save keeps the plant in its section. Desktop
         geometry must NOT leak in, or the first phone drag would jump the plant
         to the iPad coordinates. */
      const meta = Object.assign({}, stored);
      delete meta.phone;
      GEOM_KEYS.forEach((key) => delete meta[key]);
      return Object.assign(applied, stored.phone || {}, meta);
    }
    return Object.assign(applied, stored);
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
    const id = selected.dataset.decorId;
    writeGeometry(id, state);
    apply(selected, saved[id]);
    persist();
    updatePanel();
  };

  const deleteDecor = (el) => {
    if (!el) return;
    const id = el.dataset.decorId;
    /* Always leave a "deleted" tombstone — never just drop the key. The shared
       default layout is merged UNDER the saved layout on load, so a bare delete
       lets a default flower reappear next visit ("it keeps coming back after I
       press Done"). The tombstone overrides the default and keeps it gone.
       On a phone the tombstone goes on the `.phone` overlay so it hides the
       plant on phones ONLY — the iPad layout is never touched. */
    const base = saved[id] || current(el);
    if (isPhone) {
      saved[id] = Object.assign({}, base, { phone: Object.assign({}, base.phone, { deleted: true }) });
    } else {
      saved[id] = Object.assign({}, base, { deleted: true });
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
      writeGeometry(el.dataset.decorId, next);
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
    /* A plant added while on a phone belongs to the phone layout only: it is
       hidden on iPad (top-level deleted) and shown on the phone through its
       own overlay, so the two devices' flower sets stay independent. */
    if (isPhone) {
      state.deleted = true;
      state.phone = { left, top, width, x: 0, y: 0, angle: 0, scale: 1, flip: 1 };
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
    if (isPhone) {
      /* Reset on a phone clears this plant's phone placement (back to the
         auto-safe fallback) but KEEPS it visible on the phone — an empty overlay
         still counts as "shown here", so a phone-added flower doesn't vanish.
         The iPad/desktop layout is left untouched. */
      if (saved[id]) saved[id].phone = {};
      apply(selected, saved[id] || current(selected));
      persist();
      updatePanel();
      return;
    }
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
      version: 5,
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
      OLD_KEYS.forEach((key) => localStorage.removeItem(key));
    } catch (error) {}
    location.reload();
  });
  panel.querySelector('#decor-done').addEventListener('click', () => {
    params.delete('edit-flowers');
    const query = params.toString();
    location.href = location.pathname + (query ? '?' + query : '') + location.hash;
  });
})();
