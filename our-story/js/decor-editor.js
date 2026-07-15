/* ══════════════════════════════════════════════════════════════════
   OUR STORY · Decoration placer
   Open the page with ?edit-flowers=1 to drag, rotate, resize, and flip
   every botanical image. Placements are kept in this browser so the
   owner can arrange the composition visually before baking it in.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const KEY = 'ourstory:decor-positions:v1';
  const params = new URLSearchParams(location.search);
  const arranging = params.get('edit-flowers') === '1';
  const anchoredPlants = [
    ['.cover-flower-left', 'cover-babys-breath-left', "Opening baby's breath — left"],
    ['.cover-flower-right', 'cover-babys-breath-right', "Opening baby's breath — right"],
    ['.moment-flower--one', 'beginning-babys-breath-one', "Beginning baby's breath — first photo"],
    ['.moment-flower--two', 'beginning-babys-breath-two', "Beginning baby's breath — second photo"],
    ['.moment-flower--three', 'beginning-botanical-three', 'Beginning leafy branch — third photo'],
  ];

  anchoredPlants.forEach(([selector, id, name]) => {
    const el = document.querySelector(selector);
    if (!el) return;
    el.dataset.decorId = id;
    el.dataset.decorName = name;
  });

  const decors = Array.from(document.querySelectorAll('[data-decor-id]'));
  if (!decors.length) return;
  decors.forEach((el) => el.classList.add('movable-decor'));

  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { saved = {}; }

  const cssNumber = (el, name, fallback) => {
    const value = parseFloat(getComputedStyle(el).getPropertyValue(name));
    return Number.isFinite(value) ? value : fallback;
  };

  const current = (el) => {
    const id = el.dataset.decorId;
    return Object.assign({
      x: cssNumber(el, '--decor-x', 0),
      y: cssNumber(el, '--decor-y', 0),
      angle: cssNumber(el, '--decor-angle', 0),
      scale: cssNumber(el, '--decor-scale', 1),
      flip: cssNumber(el, '--decor-flip', 1),
    }, saved[id] || {});
  };

  const apply = (el, state) => {
    el.style.setProperty('--decor-x', state.x + 'px');
    el.style.setProperty('--decor-y', state.y + 'px');
    el.style.setProperty('--decor-angle', state.angle + 'deg');
    el.style.setProperty('--decor-scale', state.scale);
    el.style.setProperty('--decor-flip', state.flip);
  };

  const persist = () => {
    try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) {}
  };

  decors.forEach((el) => {
    if (saved[el.dataset.decorId]) apply(el, current(el));
  });

  if (!arranging) return;

  document.body.classList.add('decor-editing');

  const panel = document.createElement('div');
  panel.className = 'decor-panel';
  panel.innerHTML =
    '<div class="decor-panel-head">Arrange plants · ' + decors.length + '</div>' +
    '<p class="decor-panel-name">Tap a decoration, then drag it.</p>' +
    '<label class="decor-picker-label">Find a plant<select id="decor-picker"><option value="">Choose a plant…</option></select></label>' +
    '<label>Angle <output id="decor-angle-out">0°</output><input id="decor-angle" type="range" min="-180" max="180" step="1" value="0" disabled></label>' +
    '<label>Size <output id="decor-size-out">100%</output><input id="decor-size" type="range" min="0.35" max="2.2" step="0.01" value="1" disabled></label>' +
    '<div class="decor-panel-actions">' +
      '<button type="button" id="decor-flip" disabled>Flip</button>' +
      '<button type="button" id="decor-reset" disabled>Reset selected</button>' +
      '<button type="button" id="decor-reset-all">Reset all</button>' +
      '<button type="button" id="decor-done" class="decor-done">Done</button>' +
    '</div>';
  document.body.appendChild(panel);

  const nameEl = panel.querySelector('.decor-panel-name');
  const picker = panel.querySelector('#decor-picker');
  const angle = panel.querySelector('#decor-angle');
  const angleOut = panel.querySelector('#decor-angle-out');
  const size = panel.querySelector('#decor-size');
  const sizeOut = panel.querySelector('#decor-size-out');
  const flip = panel.querySelector('#decor-flip');
  const reset = panel.querySelector('#decor-reset');
  let selected = null;
  let drag = null;

  decors.forEach((el) => {
    const option = document.createElement('option');
    option.value = el.dataset.decorId;
    option.textContent = el.dataset.decorName || 'Decoration';
    picker.appendChild(option);
  });

  const updatePanel = () => {
    const active = !!selected;
    [angle, size, flip, reset].forEach((control) => { control.disabled = !active; });
    if (!active) {
      nameEl.textContent = 'Tap a decoration, then drag it.';
      return;
    }
    const state = current(selected);
    nameEl.textContent = selected.dataset.decorName || 'Selected decoration';
    picker.value = selected.dataset.decorId;
    angle.value = state.angle;
    size.value = state.scale;
    angleOut.textContent = Math.round(state.angle) + '°';
    sizeOut.textContent = Math.round(state.scale * 100) + '%';
  };

  const select = (el) => {
    decors.forEach((item) => item.classList.toggle('is-selected', item === el));
    selected = el;
    updatePanel();
  };

  picker.addEventListener('change', () => {
    if (!picker.value) return;
    const el = decors.find((item) => item.dataset.decorId === picker.value);
    if (!el) return;
    select(el);
    el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
  });

  const saveSelected = (state) => {
    if (!selected) return;
    saved[selected.dataset.decorId] = state;
    apply(selected, state);
    persist();
    updatePanel();
  };

  decors.forEach((el) => {
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', 'Move ' + (el.dataset.decorName || 'decoration'));

    el.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      event.stopPropagation();
      select(el);
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
      saved[el.dataset.decorId] = next;
      apply(el, next);
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
    el.addEventListener('click', (event) => { event.preventDefault(); select(el); });
    el.addEventListener('keydown', (event) => {
      const step = event.shiftKey ? 12 : 3;
      const delta = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[event.key];
      if (!delta) return;
      event.preventDefault();
      select(el);
      const state = current(el);
      state.x += delta[0]; state.y += delta[1];
      saveSelected(state);
    });
  });

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
    delete saved[selected.dataset.decorId];
    ['--decor-x', '--decor-y', '--decor-angle', '--decor-scale', '--decor-flip'].forEach((name) => selected.style.removeProperty(name));
    persist();
    updatePanel();
  });
  panel.querySelector('#decor-reset-all').addEventListener('click', () => {
    if (!window.confirm('Reset every decoration to its starting position?')) return;
    saved = {};
    persist();
    decors.forEach((el) => ['--decor-x', '--decor-y', '--decor-angle', '--decor-scale', '--decor-flip'].forEach((name) => el.style.removeProperty(name)));
    updatePanel();
  });
  panel.querySelector('#decor-done').addEventListener('click', () => {
    params.delete('edit-flowers');
    const query = params.toString();
    location.href = location.pathname + (query ? '?' + query : '') + location.hash;
  });
})();
