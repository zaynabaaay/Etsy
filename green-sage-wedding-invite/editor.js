(() => {
  const template = window.GreenSageTemplate;
  if (!template) return;

  const preview = document.getElementById('preview');
  const previewFrame = document.getElementById('previewFrame');
  const controls = document.getElementById('controls');
  const sectionSelect = document.getElementById('sectionSelect');
  const saveStatus = document.getElementById('saveStatus');
  const undoButton = document.getElementById('undoButton');
  const resetButton = document.getElementById('resetButton');
  const deviceButtons = [...document.querySelectorAll('[data-device]')];

  const backgrounds = [
    { name: 'Sage flatlay', src: 'invitation-assets/opening-background-sage-flatlay.png' },
    { name: 'Soft ivory', src: 'design-previews/desktop-background-01-plain-white-v2.png' },
    { name: 'Paper garden', src: 'invitation-assets/invitation-background-optimized.jpg' },
    { name: 'Botanical paper', src: 'invitation-assets/invitation-background-sharp-v2.png' },
    { name: 'Sage schedule', src: 'design-previews/schedule-flat-sage-preview.png' },
    { name: 'Frosted vellum', src: 'invitation-assets/letter-previews/05-frosted-glass.png' }
  ];

  const waxOptions = [
    { name: 'Antique gold', color: '#a37e46', filter: 'none' },
    { name: 'Champagne', color: '#c4aa78', filter: 'sepia(.35) saturate(.72) brightness(1.16)' },
    { name: 'Sage', color: '#777b63', filter: 'sepia(.3) saturate(.55) hue-rotate(42deg) brightness(.84)' },
    { name: 'Bronze', color: '#765233', filter: 'sepia(.5) saturate(1.1) brightness(.72)' },
    { name: 'Pearl', color: '#ddd8ca', filter: 'grayscale(.85) brightness(1.45)' },
    { name: 'Charcoal', color: '#49483f', filter: 'grayscale(1) brightness(.52)' }
  ];

  const sectionFields = {
    opening: [
      ['First name', 'couple.firstName'],
      ['Second name', 'couple.secondName'],
      ['Day', 'date.day'],
      ['Month', 'date.month'],
      ['Year', 'date.year'],
      ['City', 'location.city']
    ],
    schedule: [
      ['Section title', 'schedule.title'],
      ['Ceremony time', 'schedule.events.0.time'],
      ['Ceremony label', 'schedule.events.0.title'],
      ['Ceremony location', 'schedule.events.0.place'],
      ['Cocktail time', 'schedule.events.1.time'],
      ['Cocktail label', 'schedule.events.1.title'],
      ['Cocktail location', 'schedule.events.1.place'],
      ['Dinner time', 'schedule.events.2.time'],
      ['Dinner label', 'schedule.events.2.title'],
      ['Dinner location', 'schedule.events.2.place'],
      ['Dancing time', 'schedule.events.3.time'],
      ['Dancing label', 'schedule.events.3.title'],
      ['Dancing location', 'schedule.events.3.place']
    ],
    story: [
      ['Heading', 'story.title'],
      ['Story', 'story.body', 'textarea'],
      ['Sign-off', 'story.signoff']
    ],
    details: [
      ['Heading', 'details.title'],
      ['Message to guests', 'details.body', 'textarea']
    ]
  };

  const clone = template.clone;
  const getValue = (source, path) => path.split('.').reduce((value, key) => value?.[key], source);
  const setValue = (source, path, value) => {
    const keys = path.split('.');
    const finalKey = keys.pop();
    const target = keys.reduce((object, key) => object[key], source);
    target[finalKey] = value;
  };

  const loadState = () => {
    try {
      const saved = window.localStorage.getItem(template.storageKey);
      const parsed = saved ? JSON.parse(saved) : null;
      return template.normalize(parsed);
    } catch {
      return template.cloneDefaults();
    }
  };

  let state = loadState();
  let history = [];
  let saveTimer = 0;
  let resetTimer = 0;

  const pushHistory = (snapshot) => {
    if (!snapshot) return;
    history.push(snapshot);
    if (history.length > 30) history.shift();
    undoButton.disabled = false;
  };

  const save = () => {
    window.clearTimeout(saveTimer);
    saveStatus.textContent = 'Saving…';
    saveTimer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(template.storageKey, JSON.stringify(state));
        saveStatus.textContent = 'Saved in this browser';
      } catch {
        saveStatus.textContent = 'Preview updated — uploaded image is too large to save';
      }
    }, 180);
  };

  const updatePreview = () => {
    preview.contentWindow?.postMessage({ type: 'green-sage-template:update', state }, '*');
  };

  const focusPreviewSection = () => {
    const section = sectionSelect.value;
    if (section === 'wax') return;
    preview.contentWindow?.postMessage({ type: 'green-sage-template:focus-section', section }, '*');
  };

  const commit = (nextState, recordHistory = true) => {
    if (recordHistory) pushHistory(clone(state));
    state = nextState;
    undoButton.disabled = history.length === 0;
    updatePreview();
    save();
  };

  const createField = ([label, path, type = 'text']) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'control-field';
    const fieldId = `field-${path.replaceAll('.', '-')}`;

    const labelElement = document.createElement('label');
    labelElement.className = 'control-label';
    labelElement.textContent = label;
    labelElement.htmlFor = fieldId;

    const input = document.createElement(type === 'textarea' ? 'textarea' : 'input');
    input.id = fieldId;
    input.className = type === 'textarea' ? 'textarea-control' : 'text-control';
    input.value = getValue(state, path) ?? '';
    let editStart = null;
    input.addEventListener('focus', () => { editStart = clone(state); });
    input.addEventListener('change', () => {
      pushHistory(editStart);
      editStart = null;
      save();
    });
    input.addEventListener('input', () => {
      const nextState = clone(state);
      setValue(nextState, path, input.value);
      state = nextState;
      updatePreview();
      save();
    });

    wrapper.append(labelElement, input);
    return wrapper;
  };

  const createRange = (label, property, min, max, suffix = '%') => {
    const wrapper = document.createElement('div');
    wrapper.className = 'control-field';
    const rangeId = `range-${sectionSelect.value}-${property}`;
    const labelElement = document.createElement('label');
    labelElement.className = 'control-label';
    labelElement.textContent = label;
    labelElement.htmlFor = rangeId;
    const row = document.createElement('div');
    row.className = 'range-row';
    const input = document.createElement('input');
    input.id = rangeId;
    input.type = 'range';
    input.min = min;
    input.max = max;
    input.value = state.sections[sectionSelect.value][property];
    let rangeStart = null;
    const output = document.createElement('output');
    output.textContent = `${input.value}${suffix}`;
    input.addEventListener('pointerdown', () => { rangeStart = clone(state); });
    input.addEventListener('focus', () => { rangeStart ||= clone(state); });
    input.addEventListener('input', () => {
      output.textContent = `${input.value}${suffix}`;
      const nextState = clone(state);
      nextState.sections[sectionSelect.value][property] = Number(input.value);
      state = nextState;
      updatePreview();
      save();
    });
    input.addEventListener('change', () => {
      pushHistory(rangeStart);
      rangeStart = null;
    });
    row.append(input, output);
    wrapper.append(labelElement, row);
    return wrapper;
  };

  const createBackgroundControls = (section) => {
    const group = document.createElement('section');
    group.className = 'control-group';
    group.innerHTML = '<h2 class="control-heading">Background</h2>';
    const grid = document.createElement('div');
    grid.className = 'background-grid';

    backgrounds.forEach((background) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'background-option';
      button.title = background.name;
      const isActive = state.sections[section].background === background.src;
      button.setAttribute('aria-pressed', String(isActive));
      if (isActive) button.classList.add('is-active');
      button.innerHTML = `<img src="${background.src}" alt="${background.name}">`;
      button.addEventListener('click', () => {
        const nextState = clone(state);
        nextState.sections[section].background = background.src;
        commit(nextState);
        renderControls();
      });
      grid.append(button);
    });

    const upload = document.createElement('label');
    upload.className = 'upload-control';
    upload.innerHTML = 'Upload your own image<input type="file" accept="image/*">';
    upload.querySelector('input').addEventListener('change', (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        const nextState = clone(state);
        nextState.sections[section].background = reader.result;
        commit(nextState);
        renderControls();
      });
      reader.readAsDataURL(file);
    });

    group.append(grid, upload, createRange('Move left or right', 'positionX', 0, 100), createRange('Move up or down', 'positionY', 0, 100), createRange('Zoom', 'zoom', 100, 220));
    return group;
  };

  const createWaxControls = () => {
    const group = document.createElement('section');
    group.className = 'control-group';
    group.innerHTML = '<h2 class="control-heading">Wax colour</h2>';
    const grid = document.createElement('div');
    grid.className = 'wax-grid';
    waxOptions.forEach((option) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'wax-option';
      const isActive = state.wax.name === option.name;
      button.setAttribute('aria-pressed', String(isActive));
      if (isActive) button.classList.add('is-active');
      button.innerHTML = `<span class="wax-swatch" style="background:${option.color}"></span><span>${option.name}</span>`;
      button.addEventListener('click', () => {
        const nextState = clone(state);
        nextState.wax = { name: option.name, filter: option.filter };
        commit(nextState);
        renderControls();
      });
      grid.append(button);
    });
    group.append(grid);
    return group;
  };

  function renderControls() {
    const section = sectionSelect.value;
    controls.replaceChildren();

    if (section === 'wax') {
      controls.append(createWaxControls());
      return;
    }

    const contentGroup = document.createElement('section');
    contentGroup.className = 'control-group';
    contentGroup.innerHTML = '<h2 class="control-heading">Text</h2>';
    sectionFields[section].forEach((field) => contentGroup.append(createField(field)));
    controls.append(contentGroup, createBackgroundControls(section));
  }

  preview.addEventListener('load', () => {
    updatePreview();
    focusPreviewSection();
  });
  sectionSelect.addEventListener('change', () => {
    renderControls();
    focusPreviewSection();
  });

  deviceButtons.forEach((button) => {
    button.addEventListener('click', () => {
      deviceButtons.forEach((item) => {
        const isActive = item === button;
        item.classList.toggle('is-active', isActive);
        item.setAttribute('aria-pressed', String(isActive));
      });
      previewFrame.className = `preview-frame device-${button.dataset.device}`;
    });
  });

  undoButton.addEventListener('click', () => {
    const previous = history.pop();
    if (!previous) return;
    state = previous;
    undoButton.disabled = history.length === 0;
    updatePreview();
    save();
    renderControls();
  });

  resetButton.addEventListener('click', () => {
    if (resetButton.dataset.armed !== 'true') {
      resetButton.dataset.armed = 'true';
      resetButton.textContent = 'Confirm reset';
      saveStatus.textContent = 'Press Confirm reset to restore the original template';
      window.clearTimeout(resetTimer);
      resetTimer = window.setTimeout(() => {
        resetButton.dataset.armed = 'false';
        resetButton.textContent = 'Reset';
        saveStatus.textContent = 'Saved in this browser';
      }, 3500);
      return;
    }

    window.clearTimeout(resetTimer);
    resetButton.dataset.armed = 'false';
    resetButton.textContent = 'Reset';
    history = [];
    commit(template.cloneDefaults(), false);
    undoButton.disabled = true;
    renderControls();
  });

  deviceButtons.forEach((button) => {
    button.setAttribute('aria-pressed', String(button.classList.contains('is-active')));
  });
  undoButton.disabled = true;
  renderControls();
})();
