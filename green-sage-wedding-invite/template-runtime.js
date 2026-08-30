(() => {
  const template = window.GreenSageTemplate;
  if (!template) return;

  const getValue = (source, path) => path.split('.').reduce((value, key) => value?.[key], source);

  const readSavedState = () => {
    try {
      const saved = window.localStorage.getItem(template.storageKey);
      return template.normalize(saved ? JSON.parse(saved) : null);
    } catch {
      return template.cloneDefaults();
    }
  };

  const applyBackground = (section, settings) => {
    if (!section || !settings) return;

    if (settings.background) {
      const background = settings.background === 'invitation-assets/opening-background-reference.jpg'
        || settings.background === 'invitation-assets/opening-background-reference.jpg?v=20260830-hero-v1'
        ? 'invitation-assets/opening-background-reference.jpg?v=20260830-hero-v2'
        : settings.background;
      section.style.backgroundImage = `url("${String(background).replaceAll('"', '%22')}")`;
    } else {
      section.style.removeProperty('background-image');
    }

    section.style.backgroundPosition = `${settings.positionX ?? 50}% ${settings.positionY ?? 50}%`;
    section.style.backgroundSize = Number(settings.zoom) === 100 ? 'cover' : `${settings.zoom}% auto`;
  };

  const applyState = (state) => {
    if (!state) return;

    document.querySelectorAll('[data-template-text]').forEach((element) => {
      const value = getValue(state, element.dataset.templateText);
      if (value !== undefined && value !== null) element.textContent = value;
    });

    document.querySelectorAll('[data-template-section]').forEach((section) => {
      applyBackground(section, state.sections?.[section.dataset.templateSection]);
    });

  };

  const editorMode = new URLSearchParams(window.location.search).has('editor');
  if (editorMode) document.documentElement.classList.add('editor-preview');

  applyState(readSavedState());

  window.addEventListener('message', (event) => {
    if (event.data?.type === 'green-sage-template:update') {
      applyState(event.data.state);
      return;
    }

    if (event.data?.type === 'green-sage-template:focus-section') {
      const section = document.querySelector(`[data-template-section="${event.data.section}"]`);
      section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  window.GreenSageTemplateRuntime = Object.freeze({ applyState });
})();
