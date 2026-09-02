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
    fontSize: $('fontSize'), sizeMinus: $('fontSizeDecrease'), sizePlus: $('fontSizeIncrease'), sizePresets: $('fontSizePresets'), textColor: $('textColor'), textColorSwatch: $('textColorSwatch'),
    bold: $('boldButton'), italic: $('italicButton'), alignButton: $('alignmentButton'), alignPopover: $('alignmentPopover'), spacingButton: $('spacingButton'), spacingPopover: $('spacingPopover'), lineHeight: $('lineHeight'), letterSpacing: $('letterSpacing'),
    positionPopover: $('positionPopover'), morePopover: $('morePopover'), opacity: $('elementOpacity'), rotation: $('elementRotation'), cropControls: $('imageCropControls'), imageFocalX: $('imageFocalX'), imageFocalY: $('imageFocalY'), imageZoom: $('imageZoom'),
    lock: $('lockButton'), duplicate: $('duplicateButton'), remove: $('deleteButton'), replace: $('replaceImageButton'), replaceInput: $('replaceImageInput'), imageFit: $('imageFitButton'),
    designName: $('designSectionName'), palette: $('sectionPalette'), sectionColor: $('sectionBackgroundColor'), templateBackgrounds: $('templateBackgrounds'), uploadedBackgrounds: $('uploadedBackgrounds'), editBackground: $('editBackgroundButton'), doneBackground: $('doneBackgroundButton'), removeBackground: $('removeBackgroundButton'), backgroundPosition: $('backgroundPositionControls'), backgroundFocalX: $('backgroundFocalX'), backgroundFocalY: $('backgroundFocalY'), backgroundZoom: $('backgroundZoom'),
    templateElements: $('templateElements'), uploadInput: $('uploadInput'), uploadStatus: $('uploadStatus'), uploadLibrary: $('uploadLibrary'),
    addSection: $('addSectionButton'), sectionList: $('sectionList'), sectionName: $('sectionName'), sectionHeightPresets: $('sectionHeightPresets'), sectionHeight: $('sectionHeight'), sectionHeightMinus: $('sectionHeightDecrease'), sectionHeightPlus: $('sectionHeightIncrease'), duplicateSection: $('duplicateSectionButton'), deleteSection: $('deleteSectionButton')
  };

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
  let saveTimer = 0;
  let saveRevision = 0;
  let assetRecords = [];
  let assetUrls = {};
  let assetObjectUrls = [];

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

  const scheduleSave = () => {
    clearTimeout(saveTimer);
    ui.saveStatus.textContent = 'Saving…';
    saveTimer = setTimeout(() => {
      try { localStorage.setItem(model.storageKey, JSON.stringify(state)); ui.saveStatus.textContent = 'Saved'; }
      catch { ui.saveStatus.textContent = 'Draft not saved'; }
    }, 220);
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
    [ui.fontPopover, ui.sizePresets, ui.alignPopover, ui.spacingPopover, ui.positionPopover, ui.morePopover, ui.previewPopover].forEach((popover) => { if (popover !== except) popover.hidden = true; });
    ui.fontButton.setAttribute('aria-expanded', String(!ui.fontPopover.hidden));
    ui.previewButton.setAttribute('aria-expanded', String(!ui.previewPopover.hidden));
    if (except !== ui.fontPopover) fontObserver?.disconnect();
  };
  const togglePopover = (popover, trigger) => { const opening = popover.hidden; closePopovers(opening ? popover : null); popover.hidden = !opening; trigger?.setAttribute('aria-expanded', String(opening)); return opening; };

  const setPanel = (name) => {
    activePanel = name;
    $$('.nav-tool').forEach((button) => { const active = button.dataset.panel === name; button.classList.toggle('is-active', active); button.setAttribute('aria-pressed', String(active)); });
    $$('.panel-view').forEach((view) => { const active = view.dataset.panelView === name; view.hidden = !active; view.classList.toggle('is-active', active); });
  };
  const selectSection = (id, sync = true) => { if (!state.sections[id]) return; backgroundEditSectionId = null; selectedSectionId = id; selectedElementId = null; closePopovers(); renderAll(); if (sync) syncCanvas(); };
  const selectElement = (id, sync = true) => { if (!state.elements[id]) return; backgroundEditSectionId = null; selectedElementId = id; selectedSectionId = state.elements[id].sectionId; closePopovers(); renderAll(); if (sync) syncCanvas(); };

  const ensureSelectedFont = async (nextFont, style = null) => {
    const current = element(); if (!current || current.type !== 'text') return;
    const target = style || current.style;
    await model.loadFont(nextFont, { document, weight: target.fontWeight, style: target.fontStyle, size: target.fontSize, sample: current.content });
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
    ui.duplicate.disabled = locked; ui.remove.disabled = locked || !selected.permissions.deletable; ui.cropControls.hidden = !['image', 'decorative'].includes(selected.type);
    if (selected.crop) { ui.imageFocalX.value = selected.crop.focalX; ui.imageFocalY.value = selected.crop.focalY; ui.imageZoom.value = selected.crop.zoom; ui.imageFit.textContent = selected.crop.fit === 'cover' ? 'Fit image' : 'Fill frame'; }
    if (selected.type !== 'text') return;
    const font = model.getFont(selected.style.fontFamily); const editable = selected.permissions.editable && !locked;
    ui.fontValue.textContent = font.displayName; ui.fontValue.style.fontFamily = model.fontStack(font.name); ui.fontSize.value = selected.style.fontSize;
    ui.textColor.value = selected.style.color; ui.textColorSwatch.style.background = selected.style.color; ui.lineHeight.value = selected.style.lineHeight; ui.letterSpacing.value = selected.style.letterSpacing;
    const bold = selected.style.fontWeight === 700; const italic = selected.style.fontStyle === 'italic';
    ui.bold.classList.toggle('is-active', bold); ui.italic.classList.toggle('is-active', italic); ui.bold.setAttribute('aria-pressed', String(bold)); ui.italic.setAttribute('aria-pressed', String(italic));
    ui.bold.disabled = !editable || !font.weights.includes(700); ui.italic.disabled = !editable || !font.styles.includes('italic');
    [ui.fontButton, ui.fontSize, ui.sizeMinus, ui.sizePlus, ui.textColor, ui.lineHeight, ui.letterSpacing].forEach((control) => { control.disabled = !editable; });
  };

  const assetUrl = (assetId, kind) => kind === 'upload' ? assetUrls[assetId] : model.getTemplateAsset(assetId)?.url;
  const assetCard = (asset, options = {}) => {
    const card = document.createElement('button'); card.type = 'button'; card.className = options.className || 'asset-card'; card.dataset.assetId = asset.id;
    const url = options.url || asset.url; card.innerHTML = `<span class="asset-thumb" style="background-image:url('${url}')"></span><span>${asset.name}</span>${options.actionLabel ? `<span class="asset-action-label">${options.actionLabel}</span>` : ''}`; if (options.selected) card.classList.add('is-selected'); return card;
  };

  const renderDesign = () => {
    const current = section(); if (!current) return;
    const editingBackground = backgroundEditSectionId === current.id && current.background.kind === 'image';
    if (backgroundEditSectionId && !editingBackground) backgroundEditSectionId = null;
    ui.designName.textContent = current.name; ui.sectionColor.value = current.background.color; ui.palette.replaceChildren();
    model.templatePalette.forEach((color) => { const button = document.createElement('button'); button.type = 'button'; button.className = 'palette-swatch'; button.dataset.color = color.value; button.style.background = color.value; button.title = `${color.name} ${color.value}`; button.setAttribute('aria-label', color.name); button.classList.toggle('is-selected', current.background.kind === 'color' && current.background.color.toUpperCase() === color.value); ui.palette.append(button); });
    ui.templateBackgrounds.replaceChildren(); model.templateAssets.filter((asset) => asset.kind === 'background').forEach((asset) => ui.templateBackgrounds.append(assetCard(asset, { actionLabel: 'Set as background', selected: current.background.kind === 'image' && current.background.assetKind === 'template' && current.background.assetId === asset.id })));
    ui.uploadedBackgrounds.replaceChildren(); assetRecords.forEach((asset) => ui.uploadedBackgrounds.append(assetCard(asset, { actionLabel: 'Set as background', url: assetUrls[asset.id], selected: current.background.kind === 'image' && current.background.assetKind === 'upload' && current.background.assetId === asset.id })));
    ui.editBackground.hidden = current.background.kind !== 'image' || editingBackground; ui.doneBackground.hidden = !editingBackground; ui.removeBackground.hidden = current.background.kind !== 'image'; ui.backgroundPosition.hidden = !editingBackground; ui.backgroundFocalX.value = current.background.focalX; ui.backgroundFocalY.value = current.background.focalY; ui.backgroundZoom.value = current.background.zoom;
  };

  const renderTemplateElements = () => { ui.templateElements.replaceChildren(); model.templateAssets.filter((asset) => asset.kind === 'decorative').forEach((asset) => ui.templateElements.append(assetCard(asset))); };
  const renderUploads = () => {
    ui.uploadLibrary.replaceChildren();
    if (!assetRecords.length) { const empty = document.createElement('p'); empty.className = 'panel-help'; empty.textContent = 'Uploaded images will appear here.'; ui.uploadLibrary.append(empty); return; }
    assetRecords.forEach((asset) => { const card = document.createElement('article'); card.className = 'upload-card'; card.dataset.assetId = asset.id; card.innerHTML = `<img src="${assetUrls[asset.id]}" alt=""><span>${asset.name}</span><div><button type="button" data-upload-action="insert">Insert</button><button type="button" data-upload-action="background">Set as background</button></div>`; ui.uploadLibrary.append(card); });
  };

  const renderSections = () => {
    const current = section(); ui.sectionList.replaceChildren();
    state.document.sectionOrder.forEach((id, index) => {
      const item = state.sections[id]; const card = document.createElement('article'); card.className = 'section-card'; card.classList.toggle('is-selected', id === selectedSectionId); card.dataset.sectionId = id;
      const bg = item.background.kind === 'image' ? assetUrl(item.background.assetId, item.background.assetKind) : '';
      card.innerHTML = `<button class="section-select" type="button"><span class="section-thumb" style="background-color:${item.background.color};${bg ? `background-image:url('${bg}')` : ''}"></span><span><strong>${item.name}</strong><small>${Math.round(item.height)} units</small></span></button><div class="section-order"><button type="button" data-section-move="up" aria-label="Move section up" ${index === 0 ? 'disabled' : ''}>↑</button><button type="button" data-section-move="down" aria-label="Move section down" ${index === state.document.sectionOrder.length - 1 ? 'disabled' : ''}>↓</button></div>`; ui.sectionList.append(card);
    });
    if (!current) return; ui.sectionName.value = current.name; ui.sectionHeight.value = Math.round(current.height); $$('[data-section-height-preset]', ui.sectionHeightPresets).forEach((button) => button.classList.toggle('is-selected', button.dataset.sectionHeightPreset === current.heightPreset)); ui.deleteSection.disabled = state.document.sectionOrder.length === 1;
  };

  const renderAll = () => { renderContext(); renderDesign(); renderUploads(); renderSections(); };
  const refreshAssets = async () => {
    assetObjectUrls.forEach((url) => URL.revokeObjectURL(url)); assetObjectUrls = []; assetUrls = {}; assetRecords = await assets.list();
    assetRecords.forEach((record) => { const url = URL.createObjectURL(record.blob); assetUrls[record.id] = url; assetObjectUrls.push(url); }); renderUploads(); renderDesign(); renderSections(); syncCanvas();
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
    await ensureSelectedFont(option.dataset.fontName);
    mutate('Change font', (next) => { const target = next.elements[source.id]; const variant = model.resolveFontVariant(option.dataset.fontName, target.style.fontWeight, target.style.fontStyle); target.style.fontFamily = variant.font.name; target.style.fontWeight = variant.weight; target.style.fontStyle = variant.style; }); closePopovers();
  });

  SIZE_PRESETS.forEach((size) => { const button = document.createElement('button'); button.type = 'button'; button.dataset.fontSize = size; button.textContent = size; ui.sizePresets.append(button); });
  ui.fontSize.addEventListener('click', () => togglePopover(ui.sizePresets));
  ui.sizePresets.addEventListener('click', (event) => { const button = event.target.closest('[data-font-size]'); const source = element(); if (!button || !source) return; mutate('Change font size', (next) => { next.elements[source.id].style.fontSize = Number(button.dataset.fontSize); }); closePopovers(); });
  const stepFontSize = (delta) => { const source = element(); if (!source) return; mutate('Change font size', (next) => { next.elements[source.id].style.fontSize = Math.max(8, Math.min(180, source.style.fontSize + delta)); }); };
  ui.sizeMinus.addEventListener('click', () => stepFontSize(-1)); ui.sizePlus.addEventListener('click', () => stepFontSize(1));
  bindTransactionalInput(ui.fontSize, 'Change font size', (next, value) => { const source = element(); if (source) next.elements[source.id].style.fontSize = Number(value); });
  bindTransactionalInput(ui.textColor, 'Change text color', (next, value) => { const source = element(); if (source) next.elements[source.id].style.color = value; });
  bindTransactionalInput(ui.lineHeight, 'Change line height', (next, value) => { const source = element(); if (source) next.elements[source.id].style.lineHeight = Number(value); });
  bindTransactionalInput(ui.letterSpacing, 'Change letter spacing', (next, value) => { const source = element(); if (source) next.elements[source.id].style.letterSpacing = Number(value); });
  ui.bold.addEventListener('click', () => { const source = element(); if (source) mutate('Toggle bold', (next) => { next.elements[source.id].style.fontWeight = source.style.fontWeight === 700 ? 400 : 700; }); });
  ui.italic.addEventListener('click', () => { const source = element(); if (source) mutate('Toggle italic', (next) => { next.elements[source.id].style.fontStyle = source.style.fontStyle === 'italic' ? 'normal' : 'italic'; }); });
  ui.alignButton.addEventListener('click', () => togglePopover(ui.alignPopover));
  ui.alignPopover.addEventListener('click', (event) => { const button = event.target.closest('[data-align]'); const source = element(); if (!button || !source) return; mutate('Change text alignment', (next) => { next.elements[source.id].style.textAlign = button.dataset.align; }); closePopovers(); });
  ui.spacingButton.addEventListener('click', () => togglePopover(ui.spacingPopover));
  $$('[data-open-position]').forEach((button) => button.addEventListener('click', () => togglePopover(ui.positionPopover)));
  $$('[data-open-more]').forEach((button) => button.addEventListener('click', () => togglePopover(ui.morePopover)));
  ui.positionPopover.addEventListener('click', (event) => { const layer = event.target.closest('[data-layer]'); const x = event.target.closest('[data-position-x]'); const y = event.target.closest('[data-position-y]'); if (layer) layerElement(layer.dataset.layer); if (x) alignElement('x', x.dataset.positionX); if (y) alignElement('y', y.dataset.positionY); closePopovers(); });
  bindTransactionalInput(ui.opacity, 'Change opacity', (next, value) => { const source = element(); if (source) next.elements[source.id].opacity = Number(value); });
  bindTransactionalInput(ui.rotation, 'Rotate element', (next, value) => { const source = element(); if (source) next.elements[source.id].rotation = Number(value); });
  bindTransactionalInput(ui.imageFocalX, 'Crop image', (next, value) => { const source = element(); if (source?.crop) next.elements[source.id].crop.focalX = Number(value); });
  bindTransactionalInput(ui.imageFocalY, 'Crop image', (next, value) => { const source = element(); if (source?.crop) next.elements[source.id].crop.focalY = Number(value); });
  bindTransactionalInput(ui.imageZoom, 'Crop image', (next, value) => { const source = element(); if (source?.crop) next.elements[source.id].crop.zoom = Number(value); });
  ui.lock.addEventListener('click', () => { const source = element(); if (source) mutate(source.permissions.locked ? 'Unlock element' : 'Lock element', (next) => { next.elements[source.id].permissions.locked = !source.permissions.locked; }); });
  ui.duplicate.addEventListener('click', duplicateElement); ui.remove.addEventListener('click', deleteElement);
  ui.imageFit.addEventListener('click', () => { const source = element(); if (source) mutate('Change image fit', (next) => { next.elements[source.id].crop.fit = source.crop.fit === 'cover' ? 'contain' : 'cover'; }); });
  ui.replace.addEventListener('click', () => ui.replaceInput.click());
  ui.replaceInput.addEventListener('change', async () => { const source = element(); const [added] = await uploadFiles(ui.replaceInput.files); if (source && added) mutate('Replace image', (next) => { next.elements[source.id].assetId = added.id; next.elements[source.id].assetKind = 'upload'; }); ui.replaceInput.value = ''; });

  ui.palette.addEventListener('click', (event) => { const swatch = event.target.closest('[data-color]'); if (!swatch) return; mutate('Change section color', (next) => { Object.assign(next.sections[selectedSectionId].background, { kind: 'color', color: swatch.dataset.color, assetId: '' }); }); });
  bindTransactionalInput(ui.sectionColor, 'Change section color', (next, value) => { Object.assign(next.sections[selectedSectionId].background, { kind: 'color', color: value, assetId: '' }); });
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
  ui.uploadLibrary.addEventListener('click', (event) => { const card = event.target.closest('[data-asset-id]'); const action = event.target.closest('[data-upload-action]'); if (!card || !action) return; if (action.dataset.uploadAction === 'insert') addImage(card.dataset.assetId); else applyBackgroundAsset(card.dataset.assetId, 'upload'); });

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
    if (message.type === 'green-sage-visual:transaction-start') { finishTransaction(false); transaction = { before: snapshot(message.label || 'Edit canvas'), label: message.label || 'Edit canvas', source: 'canvas' }; return; }
    if (message.type === 'green-sage-visual:transaction-patch') {
      if (!transaction) transaction = { before: snapshot(message.label || 'Edit canvas'), source: 'canvas' };
      const next = clone(state);
      if (message.targetType === 'section' && next.sections[message.targetId] && message.patch?.background) Object.assign(next.sections[message.targetId].background, message.patch.background);
      if (message.targetType !== 'section' && next.elements[message.targetId]) {
        const target = next.elements[message.targetId];
        if (message.patch?.frame) Object.assign(target.frame, message.patch.frame);
        if (message.patch?.content != null) target.content = String(message.patch.content);
      }
      state = model.normalize(next); renderAll(); return;
    }
    if (message.type === 'green-sage-visual:transaction-commit') { finishTransaction(false); renderAll(); syncCanvas(); }
  });

  document.addEventListener('pointerdown', (event) => { if (!event.target.closest('.toolbar-popover, .toolbar-popover-anchor, [data-open-position], [data-open-more]')) closePopovers(); });
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
  window.addEventListener('beforeunload', () => assetObjectUrls.forEach((url) => URL.revokeObjectURL(url)));

  renderTemplateElements(); setPanel(activePanel); renderAll(); updateHistory();
  refreshAssets().catch(() => { ui.uploadStatus.textContent = 'Local upload storage is unavailable in this browser.'; });
})();
