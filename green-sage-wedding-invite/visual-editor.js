(() => {
  const model = globalThis.GreenSageVisualDocument;
  const assets = globalThis.StorielVisualAssets;
  if (!model || !assets) {
    const missing = [!model && 'document model', !assets && 'local asset storage'].filter(Boolean).join(' and ');
    const message = document.createElement('section');
    message.className = 'editor-initialization-error';
    message.setAttribute('role', 'alert');
    message.innerHTML = `<strong>The visual editor could not start.</strong><span>Required ${missing} failed to load. Refresh the page or check the editor files.</span>`;
    document.body.replaceChildren(message);
    console.error(`Storiel visual editor initialization failed: missing ${missing}.`);
    return;
  }

  const $ = (id) => document.getElementById(id);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const ui = {
    canvas: $('visualCanvas'), previewFrame: $('previewFrame'), workspace: $('workspace'), saveStatus: $('saveStatus'),
    undo: $('undoButton'), redo: $('redoButton'), previewButton: $('previewButton'), previewPopover: $('previewPopover'),
    contextEmpty: $('contextEmpty'), textContext: $('textContext'), imageContext: $('imageContext'), sectionContext: $('sectionContext'), sectionContextName: $('sectionContextName'), backgroundEditContext: $('backgroundEditContext'), doneBackgroundToolbar: $('doneBackgroundToolbarButton'),
    fontButton: $('fontPickerButton'), fontValue: $('fontPickerValue'), fontPopover: $('fontPickerPopover'), fontSearch: $('fontSearch'), fontFilters: $('fontCategoryFilters'), fontList: $('fontList'),
    fontSize: $('fontSize'), sizeMinus: $('fontSizeDecrease'), sizePlus: $('fontSizeIncrease'), sizePresets: $('fontSizePresets'), textColorButton: $('textColorButton'), textColorPopover: $('textColorPopover'), textColorPalette: $('textColorPalette'), textColor: $('textColor'), textColorHex: $('textColorHex'), textColorSwatch: $('textColorSwatch'),
    bold: $('boldButton'), italic: $('italicButton'), alignButton: $('alignmentButton'), alignPopover: $('alignmentPopover'), spacingButton: $('spacingButton'), spacingPopover: $('spacingPopover'), lineHeight: $('lineHeight'), letterSpacing: $('letterSpacing'),
    positionPopover: $('positionPopover'), morePopover: $('morePopover'), opacity: $('elementOpacity'), rotation: $('elementRotation'), textCaseControls: $('textCaseControls'), cropControls: $('imageCropControls'), imageFocalX: $('imageFocalX'), imageFocalY: $('imageFocalY'), imageZoom: $('imageZoom'),
    lock: $('lockButton'), duplicate: $('duplicateButton'), remove: $('deleteButton'), replace: $('replaceImageButton'), replaceInput: $('replaceImageInput'), imageFit: $('imageFitButton'),
    designName: $('designSectionName'), palette: $('sectionPalette'), sectionColor: $('sectionBackgroundColor'), sectionColorHex: $('sectionBackgroundHex'), templateBackgrounds: $('templateBackgrounds'), uploadedBackgrounds: $('uploadedBackgrounds'), editBackground: $('editBackgroundButton'), doneBackground: $('doneBackgroundButton'), removeBackground: $('removeBackgroundButton'), backgroundPosition: $('backgroundPositionControls'), backgroundFocalX: $('backgroundFocalX'), backgroundFocalY: $('backgroundFocalY'), backgroundZoom: $('backgroundZoom'),
    templateElements: $('templateElements'), uploadInput: $('uploadInput'), uploadStatus: $('uploadStatus'), uploadLibrary: $('uploadLibrary'),
    addSection: $('addSectionButton'), sectionList: $('sectionList'), sectionName: $('sectionName'), sectionHeightPresets: $('sectionHeightPresets'), sectionHeight: $('sectionHeight'), sectionHeightMinus: $('sectionHeightDecrease'), sectionHeightPlus: $('sectionHeightIncrease'), duplicateSection: $('duplicateSectionButton'), deleteSection: $('deleteSectionButton')
  };

  // Keep existing popover nodes and handlers outside the toolbar scroll containers.
  const popovers = [ui.fontPopover, ui.sizePresets, ui.textColorPopover, ui.alignPopover, ui.spacingPopover, ui.positionPopover, ui.morePopover, ui.previewPopover];
  const popoverLayer = document.createElement('div'); popoverLayer.className = 'popover-layer';
  popoverLayer.append(...popovers); document.body.append(popoverLayer);
  let openPopover = null;

  const ORIGIN = window.location.origin === 'null' ? '*' : window.location.origin;
  const sameOrigin = (origin) => origin === window.location.origin || (origin === 'null' && window.location.origin === 'null');
  const SIZE_PRESETS = [8, 10, 12, 14, 16, 18, 21, 24, 28, 32, 36, 42, 48, 56, 64, 72, 84, 96, 120];
  const history = { past: [], future: [] };
  const clone = model.clone;
  let state = model.load();
  let selectedSectionId = state.document.sectionOrder[0];
  let selectedElementId = null;
  let canvasReady = false;
  let activePanel = 'design';
  let activeFontCategory = 'all';
  let backgroundEditSectionId = null;
  let fontObserver = null;
  let transaction = null;
  // Keep completed and rejected starts from reopening a transaction on replay.
  const seenCanvasTransactionIds = new Set();
  let saveTimer = 0;
  let saveRevision = 0;
  let assetRecords = [];
  let assetUrls = {};
  let assetObjectUrls = [];
  let replaceTargetElementId = null;

  const section = () => state.sections[selectedSectionId] || null;
  const element = () => state.elements[selectedElementId] || null;
  const snapshot = (label = '') => ({ state: clone(state), selectedElementId, selectedSectionId, label });
  const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const updateHistory = () => { ui.undo.disabled = !history.past.length; ui.redo.disabled = !history.future.length; };

  const pushHistory = (entry) => {
    history.past.push(entry);
    if (history.past.length > 100) history.past.shift();
    history.future.length = 0;
    updateHistory();
  };

  const flushPendingSave = () => {
    if (!saveTimer) return;
    clearTimeout(saveTimer);
    saveTimer = 0;
    // Live transaction patches are previews; only persist committed authored state.
    const committedState = transaction ? transaction.before.state : state;
    try { localStorage.setItem(model.storageKey, JSON.stringify(committedState)); ui.saveStatus.textContent = 'Saved'; }
    catch { ui.saveStatus.textContent = 'Draft not saved'; }
  };
  const scheduleSave = () => {
    clearTimeout(saveTimer);
    ui.saveStatus.textContent = 'Saving…';
    saveTimer = setTimeout(flushPendingSave, 220);
  };

  const syncCanvas = () => {
    saveRevision += 1;
    ui.canvas.contentWindow?.postMessage({ type: 'green-sage-visual:state', state, selectedSectionId, selectedElementId, backgroundEditSectionId, assetUrls, revision: saveRevision }, ORIGIN);
  };

  const finishTransaction = (sync = true) => {
    if (!transaction) return false;
    const before = transaction.before;
    transaction = null;
    if (!equal(before.state, state)) {
      pushHistory(before); scheduleSave(); if (sync) syncCanvas(); renderAll(); return true;
    }
    if (sync) syncCanvas();
    return false;
  };

  const commit = (next, label, selection = {}) => {
    finishTransaction(false);
    const before = snapshot(label);
    const normalized = model.normalize(next);
    if (equal(state, normalized)) return;
    pushHistory(before); state = normalized;
    if (Object.hasOwn(selection, 'sectionId')) selectedSectionId = selection.sectionId;
    if (Object.hasOwn(selection, 'elementId')) selectedElementId = selection.elementId;
    if (!state.sections[selectedSectionId]) selectedSectionId = state.document.sectionOrder[0];
    if (!state.elements[selectedElementId]) selectedElementId = null;
    scheduleSave(); renderAll(); syncCanvas();
  };

  const mutate = (label, callback, selection) => { const next = clone(state); callback(next); commit(next, label, selection); };
  const beginControlTransaction = (label) => { if (!transaction) transaction = { before: snapshot(label), label, source: 'control' }; };
  const previewMutation = (callback) => { const next = clone(state); callback(next); state = model.normalize(next); renderAll(); syncCanvas(); };

  const applyHistory = (direction) => {
    finishTransaction(false);
    const source = direction === 'undo' ? history.past : history.future;
    const destination = direction === 'undo' ? history.future : history.past;
    if (!source.length) return;
    destination.push(snapshot(direction));
    const entry = source.pop(); state = model.normalize(entry.state);
    backgroundEditSectionId = null;
    selectedSectionId = state.sections[entry.selectedSectionId] ? entry.selectedSectionId : state.document.sectionOrder[0];
    selectedElementId = state.elements[entry.selectedElementId] ? entry.selectedElementId : null;
    updateHistory(); scheduleSave(); renderAll(); syncCanvas();
  };

  const closePopovers = (except = null) => {
    popovers.forEach((popover) => { if (popover !== except) popover.hidden = true; });
    if (openPopover && openPopover.popover !== except) { openPopover.trigger.setAttribute('aria-expanded', 'false'); openPopover = null; }
    ui.fontButton.setAttribute('aria-expanded', String(!ui.fontPopover.hidden));
    ui.previewButton.setAttribute('aria-expanded', String(!ui.previewPopover.hidden));
    if (except !== ui.fontPopover) fontObserver?.disconnect();
  };
  const positionOpenPopover = () => {
    if (!openPopover) return;
    const { popover, trigger } = openPopover; const viewport = window.visualViewport;
    const editor = $('storielEditor').getBoundingClientRect(); const anchor = trigger.getBoundingClientRect(); const margin = 8;
    const left = Math.max(editor.left, viewport?.offsetLeft || 0) + margin;
    const top = Math.max(editor.top, viewport?.offsetTop || 0) + margin;
    const right = Math.min(editor.right, (viewport?.offsetLeft || 0) + (viewport?.width || window.innerWidth)) - margin;
    const bottom = Math.min(editor.bottom, (viewport?.offsetTop || 0) + (viewport?.height || window.innerHeight)) - margin;
    const below = Math.max(top, Math.min(bottom, anchor.bottom + margin));
    const above = Math.max(top, Math.min(bottom, anchor.top - margin));
    const placeBelow = bottom - below >= above - top;
    popover.style.setProperty('--popover-max-width', `${Math.max(1, right - left)}px`);
    popover.style.setProperty('--popover-max-height', `${Math.max(0, placeBelow ? bottom - below : above - top)}px`);
    const bounds = popover.getBoundingClientRect();
    popover.style.left = `${Math.max(left, Math.min(anchor.left, right - bounds.width))}px`;
    popover.style.top = `${placeBelow ? below : above - bounds.height}px`;
  };
  const togglePopover = (popover, trigger) => {
    const opening = popover.hidden; closePopovers(opening ? popover : null); popover.hidden = !opening;
    trigger.setAttribute('aria-controls', popover.id); trigger.setAttribute('aria-expanded', String(opening));
    if (opening) { openPopover = { popover, trigger }; positionOpenPopover(); }
    return opening;
  };
  $$('.context-tools').forEach((toolbar) => toolbar.addEventListener('scroll', positionOpenPopover, { passive: true }));
  window.addEventListener('resize', positionOpenPopover);
  window.visualViewport?.addEventListener('resize', positionOpenPopover);
  window.visualViewport?.addEventListener('scroll', positionOpenPopover);

  const setPanel = (name) => {
    activePanel = name;
    $$('.nav-tool').forEach((button) => { const active = button.dataset.panel === name; button.classList.toggle('is-active', active); button.setAttribute('aria-pressed', String(active)); });
    $$('.panel-view').forEach((view) => { const active = view.dataset.panelView === name; view.hidden = !active; view.classList.toggle('is-active', active); });
  };
  const selectSection = (id, sync = true) => { if (!state.sections[id]) return; backgroundEditSectionId = null; selectedSectionId = id; selectedElementId = null; closePopovers(); renderAll(); if (sync) syncCanvas(); };
  const selectElement = (id, sync = true) => { if (!state.elements[id]) return; backgroundEditSectionId = null; selectedElementId = id; selectedSectionId = state.elements[id].sectionId; closePopovers(); renderAll(); if (sync) syncCanvas(); };

  const ensureElementFont = async (elementId, nextFont) => {
    const current = state.elements[elementId]; if (!current || current.type !== 'text') return false;
    await model.loadFont(nextFont, { document, weight: current.style.fontWeight, style: current.style.fontStyle, size: current.style.fontSize, sample: current.content });
    return state.elements[elementId]?.type === 'text';
  };

  const renderFontList = () => {
    fontObserver?.disconnect(); ui.fontList.replaceChildren();
    const query = ui.fontSearch.value.trim().toLowerCase(); const current = element()?.style.fontFamily;
    model.fontCatalog.filter((font) => {
      const category = activeFontCategory === 'all' || (activeFontCategory === 'display' ? font.display : font.category === activeFontCategory);
      return category && (!query || font.displayName.toLowerCase().includes(query));
    }).forEach((font) => {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'visual-font-option'; button.dataset.fontName = font.name; button.style.fontFamily = model.fontStack(font.name);
      button.setAttribute('aria-selected', String(font.name === current)); button.classList.toggle('is-selected', font.name === current);
      button.innerHTML = `<span>${font.displayName}</span><span aria-hidden="true">${font.name === current ? '✓' : ''}</span>`; ui.fontList.append(button);
    });
    if ('IntersectionObserver' in window) {
      fontObserver = new IntersectionObserver((entries) => entries.forEach((entry) => { if (!entry.isIntersecting) return; const target = entry.target; fontObserver.unobserve(target); model.loadFont(target.dataset.fontName, { document, sample: target.dataset.fontName }).catch(() => {}); }), { root: ui.fontList, rootMargin: '100px 0px' });
      $$('.visual-font-option', ui.fontList).forEach((option) => fontObserver.observe(option));
    }
  };

  const renderContext = () => {
    const selected = element();
    const editingBackground = Boolean(backgroundEditSectionId && backgroundEditSectionId === selectedSectionId && section()?.background.kind === 'image');
    ui.contextEmpty.hidden = Boolean(selected || section()); ui.textContext.hidden = selected?.type !== 'text' || editingBackground;
    ui.imageContext.hidden = editingBackground || !selected || !['image', 'decorative'].includes(selected.type); ui.sectionContext.hidden = editingBackground || Boolean(selected) || !section(); ui.backgroundEditContext.hidden = !editingBackground;
    if (!selected) { ui.sectionContextName.textContent = section()?.name || 'Section'; return; }
    const locked = selected.permissions.locked;
    ui.opacity.value = selected.opacity; ui.rotation.value = selected.rotation; ui.lock.textContent = locked ? 'Unlock' : 'Lock';
    ui.duplicate.disabled = locked; ui.remove.disabled = locked || !selected.permissions.deletable; ui.textCaseControls.hidden = selected.type !== 'text'; ui.cropControls.hidden = !['image', 'decorative'].includes(selected.type);
    if (selected.crop) { ui.imageFocalX.value = selected.crop.focalX; ui.imageFocalY.value = selected.crop.focalY; ui.imageZoom.value = selected.crop.zoom; ui.imageFit.textContent = selected.crop.fit === 'cover' ? 'Fit image' : 'Fill frame'; }
    if (selected.type !== 'text') return;
    const font = model.getFont(selected.style.fontFamily); const editable = selected.permissions.editable && !locked;
    ui.fontValue.textContent = font.displayName; ui.fontValue.style.fontFamily = model.fontStack(font.name); ui.fontSize.value = selected.style.fontSize;
    ui.textColor.value = selected.style.color; ui.textColorHex.value = selected.style.color.toUpperCase(); ui.textColorSwatch.style.background = selected.style.color; ui.lineHeight.value = selected.style.lineHeight; ui.letterSpacing.value = selected.style.letterSpacing; renderColorSwatches(ui.textColorPalette, selected.style.color);
    const bold = selected.style.fontWeight === 700; const italic = selected.style.fontStyle === 'italic';
    ui.bold.classList.toggle('is-active', bold); ui.italic.classList.toggle('is-active', italic); ui.bold.setAttribute('aria-pressed', String(bold)); ui.italic.setAttribute('aria-pressed', String(italic));
    ui.bold.disabled = !editable || !font.weights.includes(700); ui.italic.disabled = !editable || !font.styles.includes('italic');
    $$('[data-text-case]', ui.textCaseControls).forEach((button) => { button.disabled = !editable; });
    [ui.fontButton, ui.fontSize, ui.sizeMinus, ui.sizePlus, ui.textColorButton, ui.textColor, ui.textColorHex, ui.lineHeight, ui.letterSpacing].forEach((control) => { control.disabled = !editable; });
  };

  const renderColorSwatches = (root, selectedColor) => {
    root.replaceChildren(); const selected = model.normalizeColor(selectedColor);
    state.document.colors.forEach((color) => {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'palette-swatch'; button.dataset.color = color; button.style.background = color; button.title = color; button.setAttribute('aria-label', color); button.classList.toggle('is-selected', selected === color); root.append(button);
    });
  };
  const rememberColor = (next, value) => {
    const color = model.normalizeColor(value); if (!color) return null;
    next.document.colors = [...new Set([...(next.document.colors || []).map(model.normalizeColor).filter(Boolean), color])]; return color;
  };

  const assetUrl = (assetId, kind) => kind === 'upload' ? assetUrls[assetId] : model.getTemplateAsset(assetId)?.url;
  const assetCard = (asset, options = {}) => {
    const card = document.createElement('button'); card.type = 'button'; card.className = options.className || 'asset-card'; card.dataset.assetId = asset.id;
    const thumb = document.createElement('span'); thumb.className = 'asset-thumb'; thumb.style.backgroundImage = `url("${options.url || asset.url}")`;
    const name = document.createElement('span'); name.textContent = asset.name;
    card.append(thumb, name);
    if (options.actionLabel) { const action = document.createElement('span'); action.className = 'asset-action-label'; action.textContent = options.actionLabel; card.append(action); }
    if (options.selected) card.classList.add('is-selected'); return card;
  };

  const renderDesign = () => {
    const current = section(); if (!current) return;
    const editingBackground = backgroundEditSectionId === current.id && current.background.kind === 'image';
    if (backgroundEditSectionId && !editingBackground) backgroundEditSectionId = null;
    ui.designName.textContent = current.name; ui.sectionColor.value = current.background.color; ui.sectionColorHex.value = current.background.color.toUpperCase(); renderColorSwatches(ui.palette, current.background.kind === 'color' ? current.background.color : null);
    ui.templateBackgrounds.replaceChildren(); model.templateAssets.filter((asset) => asset.kind === 'background').forEach((asset) => ui.templateBackgrounds.append(assetCard(asset, { actionLabel: 'Set as background', selected: current.background.kind === 'image' && current.background.assetKind === 'template' && current.background.assetId === asset.id })));
    ui.uploadedBackgrounds.replaceChildren(); assetRecords.forEach((asset) => ui.uploadedBackgrounds.append(assetCard(asset, { actionLabel: 'Set as background', url: assetUrls[asset.id], selected: current.background.kind === 'image' && current.background.assetKind === 'upload' && current.background.assetId === asset.id })));
    ui.editBackground.hidden = current.background.kind !== 'image' || editingBackground; ui.doneBackground.hidden = !editingBackground; ui.removeBackground.hidden = current.background.kind !== 'image'; ui.backgroundPosition.hidden = !editingBackground; ui.backgroundFocalX.value = current.background.focalX; ui.backgroundFocalY.value = current.background.focalY; ui.backgroundZoom.value = current.background.zoom;
  };

  const renderTemplateElements = () => { ui.templateElements.replaceChildren(); model.templateAssets.filter((asset) => asset.kind === 'decorative').forEach((asset) => ui.templateElements.append(assetCard(asset))); };
  const renderUploads = () => {
    ui.uploadLibrary.replaceChildren();
    if (!assetRecords.length) { const empty = document.createElement('p'); empty.className = 'panel-help'; empty.textContent = 'Uploaded images will appear here.'; ui.uploadLibrary.append(empty); return; }
    assetRecords.forEach((asset) => {
      const card = document.createElement('article'); card.className = 'upload-card'; card.dataset.assetId = asset.id;
      const image = document.createElement('img'); image.src = assetUrls[asset.id]; image.alt = '';
      const name = document.createElement('span'); name.textContent = asset.name;
      const actions = document.createElement('div');
      const insert = document.createElement('button'); insert.type = 'button'; insert.dataset.uploadAction = 'insert'; insert.textContent = 'Insert';
      const background = document.createElement('button'); background.type = 'button'; background.dataset.uploadAction = 'background'; background.textContent = 'Set as background';
      actions.append(insert, background); card.append(image, name, actions); ui.uploadLibrary.append(card);
    });
  };

  const renderSections = () => {
    const current = section(); ui.sectionList.replaceChildren();
    state.document.sectionOrder.forEach((id, index) => {
      const item = state.sections[id]; const card = document.createElement('article'); card.className = 'section-card'; card.classList.toggle('is-selected', id === selectedSectionId); card.dataset.sectionId = id;
      const bg = item.background.kind === 'image' ? assetUrl(item.background.assetId, item.background.assetKind) : '';
      const select = document.createElement('button'); select.className = 'section-select'; select.type = 'button';
      const thumb = document.createElement('span'); thumb.className = 'section-thumb'; thumb.style.backgroundColor = item.background.color; if (bg) thumb.style.backgroundImage = `url("${bg}")`;
      const copy = document.createElement('span');
      const name = document.createElement('strong'); name.textContent = item.name;
      const height = document.createElement('small'); height.textContent = `${Math.round(item.height)} units`;
      copy.append(name, height); select.append(thumb, copy);
      const order = document.createElement('div'); order.className = 'section-order';
      const up = document.createElement('button'); up.type = 'button'; up.dataset.sectionMove = 'up'; up.setAttribute('aria-label', 'Move section up'); up.disabled = index === 0; up.textContent = '↑';
      const down = document.createElement('button'); down.type = 'button'; down.dataset.sectionMove = 'down'; down.setAttribute('aria-label', 'Move section down'); down.disabled = index === state.document.sectionOrder.length - 1; down.textContent = '↓';
      order.append(up, down); card.append(select, order); ui.sectionList.append(card);
    });
    if (!current) return; ui.sectionName.value = current.name; ui.sectionHeight.value = Math.round(current.height); $$('[data-section-height-preset]', ui.sectionHeightPresets).forEach((button) => button.classList.toggle('is-selected', button.dataset.sectionHeightPreset === current.heightPreset)); ui.deleteSection.disabled = state.document.sectionOrder.length === 1;
  };

  const renderAll = () => { renderContext(); renderDesign(); renderUploads(); renderSections(); };
  const refreshAssets = async () => {
    const nextRecords = await assets.list(); const nextUrls = {}; const nextObjectUrls = [];
    try {
      nextRecords.forEach((record) => {
        const url = URL.createObjectURL(record.blob); nextObjectUrls.push(url); nextUrls[record.id] = url;
      });
    } catch (error) {
      nextObjectUrls.forEach((url) => URL.revokeObjectURL(url));
      throw error;
    }
    const previousUrls = assetObjectUrls;
    assetRecords = nextRecords; assetUrls = nextUrls; assetObjectUrls = nextObjectUrls;
    try { renderUploads(); renderDesign(); renderSections(); syncCanvas(); }
    finally { previousUrls.forEach((url) => URL.revokeObjectURL(url)); }
  };

  const addText = (kind) => {
    const current = section(); if (!current) return;
    const presets = {
      heading: { content: 'Add a heading', frame: { x: 35, y: 100, width: 320, height: 82 }, style: { fontFamily: 'Instrument Serif', fontSize: 42, color: '#474232', textAlign: 'center', lineHeight: 1.05 } },
      subheading: { content: 'Add a subheading', frame: { x: 55, y: 210, width: 280, height: 58 }, style: { fontFamily: 'Instrument Serif', fontSize: 24, color: '#474232', textAlign: 'center', lineHeight: 1.1 } },
      body: { content: 'Add body text', frame: { x: 65, y: 300, width: 260, height: 64 }, style: { fontFamily: 'Instrument Sans', fontSize: 15, color: '#6B6A54', textAlign: 'center', lineHeight: 1.45 } }
    };
    const created = model.createTextElement({ sectionId: current.id, ...presets[kind] });
    mutate('Add text', (next) => { next.elements[created.id] = created; next.sections[current.id].elementOrder.push(created.id); }, { sectionId: current.id, elementId: created.id });
  };

  const addImage = (assetId, assetKind = 'upload', type = 'image') => {
    const current = section(); if (!current) return;
    const count = current.elementOrder.length;
    const created = model.createImageElement({ sectionId: current.id, assetId, assetKind, type, frame: { x: 65 + (count % 3) * 8, y: 410 + (count % 4) * 12, width: 260, height: 220 }, crop: { fit: type === 'decorative' ? 'contain' : 'cover' } });
    mutate('Add image', (next) => { next.elements[created.id] = created; next.sections[current.id].elementOrder.push(created.id); }, { sectionId: current.id, elementId: created.id });
  };

  const duplicateElement = () => {
    const source = element(); if (!source || source.permissions.locked) return;
    const copy = clone(source); copy.id = model.createId(source.type); copy.frame.x += 12; copy.frame.y += 12;
    mutate('Duplicate element', (next) => { next.elements[copy.id] = copy; const order = next.sections[source.sectionId].elementOrder; order.splice(order.indexOf(source.id) + 1, 0, copy.id); }, { sectionId: source.sectionId, elementId: copy.id });
  };
  const deleteElement = () => {
    const source = element(); if (!source || source.permissions.locked || !source.permissions.deletable) return;
    mutate('Delete element', (next) => { delete next.elements[source.id]; next.sections[source.sectionId].elementOrder = next.sections[source.sectionId].elementOrder.filter((id) => id !== source.id); }, { sectionId: source.sectionId, elementId: null });
  };
  const changeTextCase = (mode) => {
    const source = element(); if (source?.type !== 'text' || source.permissions.locked || !source.permissions.editable) return;
    const transform = mode === 'upper' ? (value) => value.toLocaleUpperCase() : mode === 'lower' ? (value) => value.toLocaleLowerCase() : (value) => value.toLocaleLowerCase().replace(/(^|[\s\u2013\u2014-])([\p{L}\p{N}])/gu, (_, prefix, character) => prefix + character.toLocaleUpperCase());
    mutate('Change text case', (next) => { next.elements[source.id].content = transform(source.content); });
  };
  const layerElement = (action) => {
    const source = element(); if (!source || source.permissions.locked) return;
    mutate('Change layer order', (next) => {
      const order = next.sections[source.sectionId].elementOrder; const from = order.indexOf(source.id); let to = from;
      if (action === 'forward') to = Math.min(order.length - 1, from + 1);
      if (action === 'backward') to = Math.max(0, from - 1);
      if (action === 'front') to = order.length - 1;
      if (action === 'back') to = 0;
      order.splice(from, 1); order.splice(to, 0, source.id);
    });
  };
  const alignElement = (axis, value) => {
    const source = element(); const current = section(); if (!source || !current || source.permissions.locked || !source.permissions.movable) return;
    mutate('Align element', (next) => {
      const frame = next.elements[source.id].frame; const margin = state.document.canvas.safeMargin;
      if (axis === 'x') frame.x = value === 'left' ? margin : value === 'center' ? (390 - frame.width) / 2 : 390 - margin - frame.width;
      if (axis === 'y') frame.y = value === 'top' ? margin : value === 'middle' ? (current.height - frame.height) / 2 : current.height - margin - frame.height;
    });
  };

  const addSection = () => {
    const created = model.createSection({ name: `Section ${state.document.sectionOrder.length + 1}`, heightPreset: 'standard', height: model.sectionHeightPresets.standard, background: { kind: 'color', color: '#F4EFE7' } });
    mutate('Add section', (next) => { next.sections[created.id] = created; next.document.sectionOrder.push(created.id); }, { sectionId: created.id, elementId: null });
  };
  const duplicateSection = () => {
    const source = section(); if (!source) return;
    const nextSectionId = model.createId('section'); const copied = clone(source); copied.id = nextSectionId; copied.name = `${source.name} copy`; copied.elementOrder = [];
    mutate('Duplicate section', (next) => {
      source.elementOrder.forEach((id) => { const item = clone(state.elements[id]); const newId = model.createId(item.type); item.id = newId; item.sectionId = nextSectionId; next.elements[newId] = item; copied.elementOrder.push(newId); });
      next.sections[nextSectionId] = copied; const index = next.document.sectionOrder.indexOf(source.id); next.document.sectionOrder.splice(index + 1, 0, nextSectionId);
    }, { sectionId: nextSectionId, elementId: null });
  };
  const deleteSection = () => {
    const source = section(); if (!source || state.document.sectionOrder.length === 1) return;
    const index = state.document.sectionOrder.indexOf(source.id); const nextId = state.document.sectionOrder[index - 1] || state.document.sectionOrder[index + 1];
    mutate('Delete section', (next) => { source.elementOrder.forEach((id) => delete next.elements[id]); delete next.sections[source.id]; next.document.sectionOrder = next.document.sectionOrder.filter((id) => id !== source.id); }, { sectionId: nextId, elementId: null });
  };
  const moveSection = (id, direction) => {
    mutate('Reorder sections', (next) => { const order = next.document.sectionOrder; const from = order.indexOf(id); const to = from + (direction === 'up' ? -1 : 1); if (to < 0 || to >= order.length) return; [order[from], order[to]] = [order[to], order[from]]; });
  };
  const setBackgroundEditMode = (enabled) => {
    const current = section();
    backgroundEditSectionId = enabled && current?.background.kind === 'image' ? current.id : null;
    if (backgroundEditSectionId) selectedElementId = null;
    renderAll(); syncCanvas();
  };
  const applyBackgroundAsset = (assetId, assetKind) => {
    backgroundEditSectionId = null;
    mutate('Change section background', (next) => { Object.assign(next.sections[selectedSectionId].background, { kind: 'image', assetId, assetKind, focalX: 50, focalY: 50, zoom: 1 }); });
  };
  const setSectionHeightPreset = (preset) => {
    const current = section(); if (!current) return;
    if (preset === 'custom') { mutate('Use custom section height', (next) => { next.sections[current.id].heightPreset = 'custom'; }); requestAnimationFrame(() => ui.sectionHeight.focus()); return; }
    const value = model.sectionHeightPresets[preset]; if (!value) return;
    mutate('Change section height', (next) => { next.sections[current.id].heightPreset = preset; next.sections[current.id].height = value; });
  };
  const stepSectionHeight = (delta) => {
    const current = section(); if (!current) return;
    mutate('Resize section', (next) => { next.sections[current.id].height = Math.max(180, Math.min(2200, Math.round(current.height + delta))); next.sections[current.id].heightPreset = 'custom'; });
  };

  const uploadFiles = async (fileList) => {
    if (!fileList?.length) return [];
    ui.uploadStatus.textContent = 'Uploading…';
    try { const added = await assets.addFiles([...fileList]); await refreshAssets(); ui.uploadStatus.textContent = `${added.length} image${added.length === 1 ? '' : 's'} added.`; return added; }
    catch (error) { ui.uploadStatus.textContent = error.message || 'The image could not be added.'; return []; }
  };

  const bindTransactionalInput = (control, label, apply, eventName = 'input') => {
    control.addEventListener('focus', () => beginControlTransaction(label));
    control.addEventListener(eventName, () => { beginControlTransaction(label); previewMutation((next) => apply(next, control.value)); });
    control.addEventListener('change', () => finishTransaction()); control.addEventListener('blur', () => finishTransaction());
  };
  const bindHexColor = (control, label, currentValue, apply) => {
    control.addEventListener('focus', () => beginControlTransaction(label));
    control.addEventListener('input', () => {
      const color = model.normalizeColor(control.value); if (!color) return;
      beginControlTransaction(label); previewMutation((next) => apply(next, color));
    });
    const finish = () => { if (!model.normalizeColor(control.value)) control.value = currentValue(); finishTransaction(); };
    control.addEventListener('change', finish); control.addEventListener('blur', finish);
    control.addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); control.blur(); } });
  };

  $$('.nav-tool').forEach((button) => button.addEventListener('click', () => setPanel(button.dataset.panel)));
  $$('[data-add-text]').forEach((button) => button.addEventListener('click', () => addText(button.dataset.addText)));
  ui.undo.addEventListener('click', () => applyHistory('undo')); ui.redo.addEventListener('click', () => applyHistory('redo'));
  ui.previewButton.addEventListener('click', () => togglePopover(ui.previewPopover, ui.previewButton));
  ui.previewPopover.addEventListener('click', (event) => { const button = event.target.closest('[data-device]'); if (!button) return; ui.previewFrame.className = `preview-frame device-${button.dataset.device}`; closePopovers(); });

  ui.fontButton.addEventListener('click', () => { if (togglePopover(ui.fontPopover, ui.fontButton)) { ui.fontSearch.focus(); renderFontList(); } });
  ui.fontSearch.addEventListener('input', renderFontList);
  ui.fontFilters.addEventListener('click', (event) => { const button = event.target.closest('[data-font-category]'); if (!button) return; activeFontCategory = button.dataset.fontCategory; $$('[data-font-category]', ui.fontFilters).forEach((item) => item.classList.toggle('is-active', item === button)); renderFontList(); });
  ui.fontList.addEventListener('click', async (event) => {
    const option = event.target.closest('[data-font-name]'); const source = element(); if (!option || source?.type !== 'text') return;
    const targetId = source.id; const fontName = option.dataset.fontName;
    if (!await ensureElementFont(targetId, fontName)) { closePopovers(); return; }
    mutate('Change font', (next) => { const target = next.elements[targetId]; const variant = model.resolveFontVariant(fontName, target.style.fontWeight, target.style.fontStyle); target.style.fontFamily = variant.font.name; target.style.fontWeight = variant.weight; target.style.fontStyle = variant.style; }); closePopovers();
  });

  SIZE_PRESETS.forEach((size) => { const button = document.createElement('button'); button.type = 'button'; button.dataset.fontSize = size; button.textContent = size; ui.sizePresets.append(button); });
  ui.fontSize.addEventListener('click', () => togglePopover(ui.sizePresets, ui.fontSize));
  ui.sizePresets.addEventListener('click', (event) => { const button = event.target.closest('[data-font-size]'); const source = element(); if (!button || !source) return; mutate('Change font size', (next) => { next.elements[source.id].style.fontSize = Number(button.dataset.fontSize); }); closePopovers(); });
  const stepFontSize = (delta) => { const source = element(); if (!source) return; mutate('Change font size', (next) => { next.elements[source.id].style.fontSize = Math.max(8, Math.min(180, source.style.fontSize + delta)); }); };
  ui.sizeMinus.addEventListener('click', () => stepFontSize(-1)); ui.sizePlus.addEventListener('click', () => stepFontSize(1));
  bindTransactionalInput(ui.fontSize, 'Change font size', (next, value) => { const source = element(); if (source) next.elements[source.id].style.fontSize = Number(value); });
  ui.textColorButton.addEventListener('click', () => { renderColorSwatches(ui.textColorPalette, element()?.style?.color); togglePopover(ui.textColorPopover, ui.textColorButton); });
  ui.textColorPalette.addEventListener('click', (event) => { const swatch = event.target.closest('[data-color]'); const source = element(); if (!swatch || source?.type !== 'text' || source.permissions.locked || !source.permissions.editable) return; mutate('Change text color', (next) => { next.elements[source.id].style.color = rememberColor(next, swatch.dataset.color); }); closePopovers(); });
  bindTransactionalInput(ui.textColor, 'Change text color', (next, value) => { const source = element(); const color = rememberColor(next, value); if (source && color) next.elements[source.id].style.color = color; });
  ui.textColor.addEventListener('input', () => { ui.textColorHex.value = ui.textColor.value.toUpperCase(); });
  bindHexColor(ui.textColorHex, 'Change text color', () => element()?.style.color || '#474232', (next, color) => { const source = element(); if (source && !source.permissions.locked && source.permissions.editable) next.elements[source.id].style.color = rememberColor(next, color); });
  bindTransactionalInput(ui.lineHeight, 'Change line height', (next, value) => { const source = element(); if (source) next.elements[source.id].style.lineHeight = Number(value); });
  bindTransactionalInput(ui.letterSpacing, 'Change letter spacing', (next, value) => { const source = element(); if (source) next.elements[source.id].style.letterSpacing = Number(value); });
  ui.bold.addEventListener('click', () => { const source = element(); if (source) mutate('Toggle bold', (next) => { next.elements[source.id].style.fontWeight = source.style.fontWeight === 700 ? 400 : 700; }); });
  ui.italic.addEventListener('click', () => { const source = element(); if (source) mutate('Toggle italic', (next) => { next.elements[source.id].style.fontStyle = source.style.fontStyle === 'italic' ? 'normal' : 'italic'; }); });
  ui.alignButton.addEventListener('click', () => togglePopover(ui.alignPopover, ui.alignButton));
  ui.alignPopover.addEventListener('click', (event) => { const button = event.target.closest('[data-align]'); const source = element(); if (!button || !source) return; mutate('Change text alignment', (next) => { next.elements[source.id].style.textAlign = button.dataset.align; }); closePopovers(); });
  ui.spacingButton.addEventListener('click', () => togglePopover(ui.spacingPopover, ui.spacingButton));
  $$('[data-open-position]').forEach((button) => button.addEventListener('click', () => togglePopover(ui.positionPopover, button)));
  $$('[data-open-more]').forEach((button) => button.addEventListener('click', () => togglePopover(ui.morePopover, button)));
  ui.positionPopover.addEventListener('click', (event) => { const layer = event.target.closest('[data-layer]'); const x = event.target.closest('[data-position-x]'); const y = event.target.closest('[data-position-y]'); if (layer) layerElement(layer.dataset.layer); if (x) alignElement('x', x.dataset.positionX); if (y) alignElement('y', y.dataset.positionY); closePopovers(); });
  bindTransactionalInput(ui.opacity, 'Change opacity', (next, value) => { const source = element(); if (source) next.elements[source.id].opacity = Number(value); });
  bindTransactionalInput(ui.rotation, 'Rotate element', (next, value) => { const source = element(); if (source) next.elements[source.id].rotation = Number(value); });
  bindTransactionalInput(ui.imageFocalX, 'Crop image', (next, value) => { const source = element(); if (source?.crop) next.elements[source.id].crop.focalX = Number(value); });
  bindTransactionalInput(ui.imageFocalY, 'Crop image', (next, value) => { const source = element(); if (source?.crop) next.elements[source.id].crop.focalY = Number(value); });
  bindTransactionalInput(ui.imageZoom, 'Crop image', (next, value) => { const source = element(); if (source?.crop) next.elements[source.id].crop.zoom = Number(value); });
  ui.lock.addEventListener('click', () => { const source = element(); if (source) mutate(source.permissions.locked ? 'Unlock element' : 'Lock element', (next) => { next.elements[source.id].permissions.locked = !source.permissions.locked; }); closePopovers(); });
  ui.duplicate.addEventListener('click', () => { duplicateElement(); closePopovers(); }); ui.remove.addEventListener('click', () => { deleteElement(); closePopovers(); });
  ui.textCaseControls.addEventListener('click', (event) => { const button = event.target.closest('[data-text-case]'); if (button) { changeTextCase(button.dataset.textCase); closePopovers(); } });
  ui.imageFit.addEventListener('click', () => { const source = element(); if (source) mutate('Change image fit', (next) => { next.elements[source.id].crop.fit = source.crop.fit === 'cover' ? 'contain' : 'cover'; }); });
  ui.replace.addEventListener('click', () => {
    const source = element();
    replaceTargetElementId = source && ['image', 'decorative'].includes(source.type) ? source.id : null;
    if (replaceTargetElementId) ui.replaceInput.click();
  });
  ui.replaceInput.addEventListener('change', async () => {
    const targetId = replaceTargetElementId; const files = [...ui.replaceInput.files]; replaceTargetElementId = null; ui.replaceInput.value = '';
    if (!targetId || !files.length) return;
    const [added] = await uploadFiles(files); const target = state.elements[targetId];
    if (!added || !target || !['image', 'decorative'].includes(target.type)) return;
    mutate('Replace image', (next) => { next.elements[targetId].assetId = added.id; next.elements[targetId].assetKind = 'upload'; });
  });

  ui.palette.addEventListener('click', (event) => { const swatch = event.target.closest('[data-color]'); if (!swatch) return; mutate('Change section color', (next) => { Object.assign(next.sections[selectedSectionId].background, { kind: 'color', color: rememberColor(next, swatch.dataset.color), assetId: '' }); }); });
  bindTransactionalInput(ui.sectionColor, 'Change section color', (next, value) => { const color = rememberColor(next, value); if (color) Object.assign(next.sections[selectedSectionId].background, { kind: 'color', color, assetId: '' }); });
  ui.sectionColor.addEventListener('input', () => { ui.sectionColorHex.value = ui.sectionColor.value.toUpperCase(); });
  bindHexColor(ui.sectionColorHex, 'Change section color', () => section()?.background.color || '#EAE2D7', (next, color) => { Object.assign(next.sections[selectedSectionId].background, { kind: 'color', color: rememberColor(next, color), assetId: '' }); });
  const backgroundClick = (event, kind) => { const card = event.target.closest('[data-asset-id]'); if (card) applyBackgroundAsset(card.dataset.assetId, kind); };
  ui.templateBackgrounds.addEventListener('click', (event) => backgroundClick(event, 'template'));
  ui.uploadedBackgrounds.addEventListener('click', (event) => backgroundClick(event, 'upload'));
  ui.editBackground.addEventListener('click', () => setBackgroundEditMode(true));
  ui.doneBackground.addEventListener('click', () => setBackgroundEditMode(false));
  ui.doneBackgroundToolbar.addEventListener('click', () => setBackgroundEditMode(false));
  ui.removeBackground.addEventListener('click', () => { backgroundEditSectionId = null; mutate('Remove background image', (next) => { Object.assign(next.sections[selectedSectionId].background, { kind: 'color', assetId: '' }); }); });
  bindTransactionalInput(ui.backgroundFocalX, 'Adjust background crop', (next, value) => { next.sections[selectedSectionId].background.focalX = Number(value); });
  bindTransactionalInput(ui.backgroundFocalY, 'Adjust background crop', (next, value) => { next.sections[selectedSectionId].background.focalY = Number(value); });
  bindTransactionalInput(ui.backgroundZoom, 'Adjust background crop', (next, value) => { next.sections[selectedSectionId].background.zoom = Number(value); });
  ui.templateElements.addEventListener('click', (event) => { const card = event.target.closest('[data-asset-id]'); if (card) addImage(card.dataset.assetId, 'template', 'decorative'); });
  ui.uploadInput.addEventListener('change', async () => { await uploadFiles(ui.uploadInput.files); ui.uploadInput.value = ''; });
  ui.uploadLibrary.addEventListener('click', (event) => {
    const card = event.target.closest('[data-asset-id]'); const action = event.target.closest('[data-upload-action]');
    if (!card || !action) return;
    switch (action.dataset.uploadAction) {
      case 'insert': addImage(card.dataset.assetId); break;
      case 'background': applyBackgroundAsset(card.dataset.assetId, 'upload'); break;
      default: break;
    }
  });

  ui.addSection.addEventListener('click', addSection); ui.duplicateSection.addEventListener('click', duplicateSection); ui.deleteSection.addEventListener('click', deleteSection);
  ui.sectionList.addEventListener('click', (event) => { const card = event.target.closest('[data-section-id]'); if (!card) return; const move = event.target.closest('[data-section-move]'); if (move) moveSection(card.dataset.sectionId, move.dataset.sectionMove); else selectSection(card.dataset.sectionId); });
  bindTransactionalInput(ui.sectionName, 'Rename section', (next, value) => { next.sections[selectedSectionId].name = value; });
  ui.sectionHeightPresets.addEventListener('click', (event) => { const button = event.target.closest('[data-section-height-preset]'); if (button) setSectionHeightPreset(button.dataset.sectionHeightPreset); });
  ui.sectionHeightMinus.addEventListener('click', () => stepSectionHeight(-10)); ui.sectionHeightPlus.addEventListener('click', () => stepSectionHeight(10));
  ui.sectionHeight.addEventListener('focus', () => beginControlTransaction('Resize section'));
  ui.sectionHeight.addEventListener('input', () => {
    beginControlTransaction('Resize section');
    if (ui.sectionHeight.value === '' || !Number.isFinite(Number(ui.sectionHeight.value))) return;
    const next = clone(state); next.sections[selectedSectionId].height = Number(ui.sectionHeight.value); next.sections[selectedSectionId].heightPreset = 'custom'; state = model.normalize(next); syncCanvas();
  });
  const finishSectionHeight = () => { if (!finishTransaction()) renderSections(); };
  ui.sectionHeight.addEventListener('change', finishSectionHeight); ui.sectionHeight.addEventListener('blur', finishSectionHeight);
  ui.sectionHeight.addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); ui.sectionHeight.blur(); } });

  window.addEventListener('message', (event) => {
    if (event.source !== ui.canvas.contentWindow || !sameOrigin(event.origin) || !event.data) return;
    const message = event.data;
    if (message.type === 'green-sage-visual:ready') { canvasReady = true; syncCanvas(); return; }
    if (message.type === 'green-sage-visual:canvas-interaction') { closePopovers(); return; }
    if (message.type === 'green-sage-visual:select-element') { selectElement(message.elementId, true); return; }
    if (message.type === 'green-sage-visual:select-section') { selectSection(message.sectionId, true); return; }
    if (message.type === 'green-sage-visual:delete-selected') { deleteElement(); return; }
    if (message.type === 'green-sage-visual:transaction-start') {
      const id = message.transactionId;
      if (typeof id !== 'string' || !id.trim() || seenCanvasTransactionIds.has(id)) return;
      seenCanvasTransactionIds.add(id);
      if (transaction) return;
      transaction = { id, before: snapshot(message.label || 'Edit canvas'), label: message.label || 'Edit canvas', source: 'canvas' };
      return;
    }
    if (message.type === 'green-sage-visual:transaction-patch') {
      if (transaction?.source !== 'canvas' || message.transactionId !== transaction.id) return;
      const next = clone(state);
      if (message.targetType === 'section' && next.sections[message.targetId] && message.patch?.background) Object.assign(next.sections[message.targetId].background, message.patch.background);
      if (message.targetType !== 'section' && next.elements[message.targetId]) {
        const target = next.elements[message.targetId];
        if (message.patch?.frame) Object.assign(target.frame, message.patch.frame);
        if (message.patch?.content != null) target.content = String(message.patch.content);
      }
      state = model.normalize(next); renderAll(); return;
    }
    if (message.type === 'green-sage-visual:transaction-commit') {
      if (transaction?.source !== 'canvas' || message.transactionId !== transaction.id) return;
      finishTransaction(false); renderAll(); syncCanvas();
    }
  });

  document.addEventListener('pointerdown', (event) => { if (!event.target.closest('.toolbar-popover, .compact-popover, .toolbar-popover-anchor, [data-open-position], [data-open-more]')) closePopovers(); });
  document.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); applyHistory(event.shiftKey ? 'redo' : 'undo'); }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'y') { event.preventDefault(); applyHistory('redo'); }
    if ((event.key === 'Delete' || event.key === 'Backspace') && !event.target.closest('input, textarea, [contenteditable="true"]') && element()) { event.preventDefault(); deleteElement(); }
  });
  ui.workspace.addEventListener('wheel', (event) => {
    if (event.target !== ui.workspace) return;
    event.preventDefault();
    ui.canvas.contentWindow?.postMessage({ type: 'green-sage-visual:scroll-by', deltaY: event.deltaY }, ORIGIN);
  }, { passive: false });
  let workspacePan = null;
  ui.workspace.addEventListener('pointerdown', (event) => {
    if (event.target !== ui.workspace || !event.isPrimary || event.pointerType === 'mouse') return;
    workspacePan = { id: event.pointerId, y: event.clientY };
    try { ui.workspace.setPointerCapture(event.pointerId); } catch {}
  });
  ui.workspace.addEventListener('pointermove', (event) => {
    if (!workspacePan || workspacePan.id !== event.pointerId) return;
    const deltaY = workspacePan.y - event.clientY; workspacePan.y = event.clientY;
    ui.canvas.contentWindow?.postMessage({ type: 'green-sage-visual:scroll-by', deltaY }, ORIGIN);
  });
  const endWorkspacePan = (event) => { if (!workspacePan || workspacePan.id !== event.pointerId) return; workspacePan = null; try { ui.workspace.releasePointerCapture(event.pointerId); } catch {} };
  ui.workspace.addEventListener('pointerup', endWorkspacePan); ui.workspace.addEventListener('pointercancel', endWorkspacePan);
  window.addEventListener('pagehide', (event) => {
    try { flushPendingSave(); }
    finally {
      // A cached page still owns its URLs and needs them when restored.
      if (!event.persisted) {
        const urls = assetObjectUrls; assetObjectUrls = [];
        urls.forEach((url) => URL.revokeObjectURL(url));
      }
    }
  });

  renderTemplateElements(); setPanel(activePanel); renderAll(); updateHistory();
  refreshAssets().catch(() => { ui.uploadStatus.textContent = 'Local upload storage is unavailable in this browser.'; });
})();
