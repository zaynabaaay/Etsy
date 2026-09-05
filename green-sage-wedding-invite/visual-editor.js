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
  const getCanvasMetrics = () => model.getCanvasMetrics(activeResponsiveView, { safeMargin: state.document.canvas.safeMargin });
  const ui = {
    canvas: $('visualCanvas'), previewFrame: $('previewFrame'), workspace: $('workspace'), saveStatus: $('saveStatus'),
    undo: $('undoButton'), redo: $('redoButton'), previewButton: $('previewButton'), previewPopover: $('previewPopover'),
    contextEmpty: $('contextEmpty'), textContext: $('textContext'), imageContext: $('imageContext'), sectionContext: $('sectionContext'), sectionContextName: $('sectionContextName'), backgroundEditContext: $('backgroundEditContext'), doneBackgroundToolbar: $('doneBackgroundToolbarButton'),
    fontButton: $('fontPickerButton'), fontValue: $('fontPickerValue'), fontPopover: $('fontPickerPopover'), fontSearch: $('fontSearch'), fontFilters: $('fontCategoryFilters'), fontList: $('fontList'),
    fontSize: $('fontSize'), sizeMinus: $('fontSizeDecrease'), sizePlus: $('fontSizeIncrease'), sizePresets: $('fontSizePresets'), textColorButton: $('textColorButton'), textColorPopover: $('textColorPopover'), textColorPalette: $('textColorPalette'), textColor: $('textColor'), textColorHex: $('textColorHex'), textColorSwatch: $('textColorSwatch'),
    bold: $('boldButton'), italic: $('italicButton'), alignButton: $('alignmentButton'), alignPopover: $('alignmentPopover'), spacingButton: $('spacingButton'), spacingPopover: $('spacingPopover'), lineHeight: $('lineHeight'), letterSpacing: $('letterSpacing'),
    morePopover: $('morePopover'), opacity: $('elementOpacity'), rotation: $('elementRotation'), textCaseControls: $('textCaseControls'), imageZoomControl: $('imageReframeZoom'), imageZoom: $('imageZoom'),
    replace: $('replaceImageButton'), replaceInput: $('replaceImageInput'), imageFit: $('imageFitButton'), editImage: $('editImageButton'), doneImage: $('doneImageButton'), imageFlips: $('imageFlipControls'),
    designName: $('designSectionName'), palette: $('sectionPalette'), sectionColor: $('sectionBackgroundColor'), sectionColorHex: $('sectionBackgroundHex'), templateBackgrounds: $('templateBackgrounds'), uploadedBackgrounds: $('uploadedBackgrounds'), editBackground: $('editBackgroundButton'), doneBackground: $('doneBackgroundButton'), removeBackground: $('removeBackgroundButton'), backgroundPosition: $('backgroundPositionControls'), backgroundFocalX: $('backgroundFocalX'), backgroundFocalY: $('backgroundFocalY'), backgroundZoom: $('backgroundZoom'),
    templateElements: $('templateElements'), uploadInput: $('uploadInput'), uploadStatus: $('uploadStatus'), uploadLibrary: $('uploadLibrary'),
    addSection: $('addSectionButton'), sectionList: $('sectionList'), sectionName: $('sectionName'), sectionHeightPresets: $('sectionHeightPresets'), sectionHeight: $('sectionHeight'), sectionHeightMinus: $('sectionHeightDecrease'), sectionHeightPlus: $('sectionHeightIncrease'), duplicateSection: $('duplicateSectionButton'), deleteSection: $('deleteSectionButton'),
    closePosition: $('closePositionPanel'), positionTabs: $$('[data-position-tab]'), arrangePanel: $('positionArrangePanel'), layersPanel: $('positionLayersPanel'), layersList: $('layersList'), positionHelp: $('positionSelectionHelp')
  };

  // Keep existing popover nodes and handlers outside the toolbar scroll containers.
  const popovers = [ui.fontPopover, ui.sizePresets, ui.textColorPopover, ui.alignPopover, ui.spacingPopover, ui.morePopover, ui.previewPopover];
  const popoverLayer = document.createElement('div'); popoverLayer.className = 'popover-layer';
  popoverLayer.append(...popovers); document.body.append(popoverLayer);
  let openPopover = null;

  const ORIGIN = window.location.origin === 'null' ? '*' : window.location.origin;
  const sameOrigin = (origin) => origin === window.location.origin || (origin === 'null' && window.location.origin === 'null');
  const SIZE_PRESETS = [8, 10, 12, 14, 16, 18, 21, 24, 28, 32, 36, 42, 48, 56, 64, 72, 84, 96, 120];
  const history = { past: [], future: [] };
  const clone = model.clone;
  let state = model.load();
  let activeResponsiveView = 'mobile';
  let selectedSectionId = state.document.sectionOrder[0];
  let selectedElementId = null;
  let canvasReady = false;
  let activePanel = 'design';
  let positionReturnPanel = 'design';
  let activePositionTab = 'arrange';
  let activeFontCategory = 'all';
  let backgroundEditSectionId = null;
  let imageEditElementId = null;
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
  let uploadMenuId = null;
  let uploadDeleteId = null;
  let deletingUploadId = null;
  let layerDrag = null;

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
    ui.canvas.contentWindow?.postMessage({ type: 'green-sage-visual:state', state, selectedSectionId, selectedElementId, backgroundEditSectionId, imageEditElementId, activeResponsiveView, assetUrls, revision: saveRevision }, ORIGIN);
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
    backgroundEditSectionId = null; imageEditElementId = null;
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
  const setPositionTab = (name) => {
    activePositionTab = name === 'layers' ? 'layers' : 'arrange';
    ui.positionTabs.forEach((button) => { const active = button.dataset.positionTab === activePositionTab; button.classList.toggle('is-active', active); button.setAttribute('aria-selected', String(active)); });
    ui.arrangePanel.hidden = activePositionTab !== 'arrange'; ui.layersPanel.hidden = activePositionTab !== 'layers';
  };
  const openPositionPanel = () => {
    if (activePanel !== 'position') positionReturnPanel = activePanel;
    closePopovers(); setPanel('position'); setPositionTab(activePositionTab); renderLayers();
  };
  const closePositionPanel = () => setPanel(positionReturnPanel === 'position' ? 'design' : positionReturnPanel);
  const renderResponsiveView = () => {
    const metrics = getCanvasMetrics();
    const displayWidth = Math.min(metrics.logicalWidth, state.document.canvas.maxRenderedWidth);
    ui.previewFrame.className = `preview-frame canvas-view-${activeResponsiveView}`;
    ui.previewFrame.style.setProperty('--canvas-display-width', `${displayWidth}px`);
    ui.previewButton.textContent = activeResponsiveView === 'ipad' ? 'iPad' : activeResponsiveView[0].toUpperCase() + activeResponsiveView.slice(1);
    $$('[data-responsive-view]', ui.previewPopover).forEach((button) => {
      const active = button.dataset.responsiveView === activeResponsiveView;
      button.classList.toggle('is-active', active); button.setAttribute('aria-checked', String(active));
    });
  };
  const setResponsiveView = (view) => {
    if (!model.canvasViews[view] || view === activeResponsiveView) { closePopovers(); return; }
    activeResponsiveView = view;
    backgroundEditSectionId = null; imageEditElementId = null;
    renderResponsiveView(); closePopovers(); renderAll(); syncCanvas();
  };
  const selectSection = (id, sync = true) => { if (!state.sections[id]) return; backgroundEditSectionId = null; imageEditElementId = null; selectedSectionId = id; selectedElementId = null; closePopovers(); renderAll(); if (sync) syncCanvas(); };
  const selectElement = (id, sync = true) => { if (!state.elements[id]) return; backgroundEditSectionId = null; imageEditElementId = null; selectedElementId = id; selectedSectionId = state.elements[id].sectionId; closePopovers(); renderAll(); if (sync) syncCanvas(); };

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
    if (selected?.id !== imageEditElementId || selected?.type !== 'image' || selected.permissions.locked || !selected.permissions.editable) imageEditElementId = null;
    ui.editImage.hidden = selected?.type !== 'image' || Boolean(imageEditElementId);
    ui.doneImage.hidden = !imageEditElementId;
    ui.imageZoomControl.hidden = !imageEditElementId;
    ui.replace.hidden = selected?.type !== 'image'; ui.imageFit.hidden = selected?.type !== 'image';
    $$('[data-open-position]', ui.imageContext).forEach(button => { button.disabled = Boolean(imageEditElementId); });
    ui.editImage.disabled = !selected?.permissions.editable || selected?.permissions.locked;
    ui.editImage.setAttribute('aria-pressed', String(Boolean(imageEditElementId)));
    ui.imageFlips.hidden = !selected?.crop;
    $$('[data-image-flip]', ui.imageFlips).forEach(button => { button.disabled = !selected?.permissions.editable || selected?.permissions.locked; button.setAttribute('aria-pressed', String(Boolean(selected?.crop?.[button.dataset.imageFlip]))); });
    const editingBackground = Boolean(backgroundEditSectionId && backgroundEditSectionId === selectedSectionId && section()?.background.kind === 'image');
    ui.contextEmpty.hidden = Boolean(selected || section()); ui.textContext.hidden = selected?.type !== 'text' || editingBackground;
    ui.imageContext.hidden = editingBackground || !selected || !['image', 'decorative'].includes(selected.type); ui.sectionContext.hidden = editingBackground || Boolean(selected) || !section(); ui.backgroundEditContext.hidden = !editingBackground;
    if (!selected) { ui.sectionContextName.textContent = section()?.name || 'Section'; return; }
    const locked = selected.permissions.locked;
    ui.opacity.value = selected.opacity; ui.rotation.value = selected.rotation;
    ui.textCaseControls.hidden = selected.type !== 'text';
    if (selected.crop) { [ui.imageFit, ui.replace, ui.imageZoom].forEach(control => control.disabled = locked || !selected.permissions.editable); ui.imageZoom.value = selected.crop.zoom; ui.imageFit.textContent = selected.crop.fit === 'cover' ? 'Fit / Contain' : 'Fill / Cover'; }
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
  const uploadUsage = () => {
    const counts = new Map();
    const count = (item) => { if (item.assetKind === 'upload' && item.assetId) counts.set(item.assetId, (counts.get(item.assetId) || 0) + 1); };
    Object.values(state.elements).filter(item => item.type === 'image' || item.type === 'decorative').forEach(count);
    Object.values(state.sections).filter(item => item.background.kind === 'image').forEach(item => count(item.background));
    return counts;
  };
  const renderUploads = () => {
    const focusedId = document.activeElement.closest('.upload-card')?.dataset.assetId;
    const focusedAction = document.activeElement.dataset.uploadAction;
    ui.uploadLibrary.replaceChildren();
    const usage = uploadUsage(); const library = new Map(assetRecords.map(asset => [asset.id, asset]));
    // Authored references remain visible and Used even when their binary is absent.
    usage.forEach((count, id) => { if (!library.has(id)) library.set(id, { id, name: 'Image unavailable', missing: true }); });
    if (!library.size) { const empty = document.createElement('p'); empty.className = 'panel-help'; empty.textContent = 'Uploaded images will appear here.'; ui.uploadLibrary.append(empty); return; }
    library.forEach((asset) => {
      const count = usage.get(asset.id) || 0; const busy = deletingUploadId === asset.id;
      const card = document.createElement('article'); card.className = 'upload-card'; card.dataset.assetId = asset.id;
      if (asset.missing) { const placeholder = document.createElement('p'); placeholder.className = 'upload-unavailable'; placeholder.textContent = 'Image unavailable'; card.append(placeholder); }
      else { const image = document.createElement('img'); image.src = assetUrls[asset.id]; image.alt = ''; card.append(image); }
      const name = document.createElement('span'); name.textContent = asset.name; card.append(name);
      if (count) { const used = document.createElement('small'); used.className = 'upload-usage'; used.textContent = count === 1 ? 'Used' : `Used ${count} times`; card.append(used); }
      const button = (action, label) => { const node = document.createElement('button'); node.type = 'button'; node.dataset.uploadAction = action; node.textContent = label; node.disabled = busy; return node; };
      const actions = document.createElement('div');
      const insert = button('insert', 'Insert'); const background = button('background', 'Set as background');
      insert.disabled = background.disabled = busy || Boolean(asset.missing); actions.append(insert, background); card.append(actions);
      if (!asset.missing) { const manage = button('manage', '…'); manage.className = 'upload-manage'; manage.setAttribute('aria-label', `Manage ${asset.name}`); manage.setAttribute('aria-expanded', String(uploadMenuId === asset.id || uploadDeleteId === asset.id)); card.append(manage); }
      if (uploadDeleteId === asset.id) {
        const confirmation = document.createElement('section'); confirmation.className = 'upload-delete-confirmation'; confirmation.setAttribute('role', 'group'); confirmation.setAttribute('aria-label', 'Delete upload confirmation');
        const message = document.createElement('p'); message.textContent = count ? `This image is used in ${count} ${count === 1 ? 'place' : 'places'}. Deleting it will make those images unavailable.` : 'Delete this upload?';
        confirmation.append(message, button('cancel-delete', 'Cancel'), button('confirm-delete', busy ? 'Deleting…' : 'Delete anyway')); card.append(confirmation);
      } else if (uploadMenuId === asset.id) { const menu = document.createElement('section'); menu.className = 'upload-management'; menu.append(button('delete', busy ? 'Deleting…' : 'Delete upload')); card.append(menu); }
      ui.uploadLibrary.append(card);
      if (asset.id === focusedId) {
        const focusTarget = card.querySelector(`[data-upload-action="${CSS.escape(focusedAction || '')}"]:not(:disabled)`) || card.querySelector('[data-upload-action="cancel-delete"]:not(:disabled), [data-upload-action="manage"]:not(:disabled)');
        focusTarget?.focus({ preventScroll: true });
      }
    });
  };
  const deleteUpload = async (assetId, confirmed = false) => {
    if (deletingUploadId) return;
    if (!confirmed && (uploadUsage().get(assetId) || 0) > 0) { uploadDeleteId = assetId; uploadMenuId = null; renderUploads(); return; }
    deletingUploadId = assetId; renderUploads();
    try {
      await assets.remove(assetId); // Missing records are a safe no-op; authored references stay intact.
      await refreshAssets();
      ui.uploadStatus.textContent = 'Upload deleted.';
      if (uploadDeleteId === assetId) uploadDeleteId = null;
      if (uploadMenuId === assetId) uploadMenuId = null;
    } catch { ui.uploadStatus.textContent = 'Could not finish deleting the upload. Please try again.'; }
    finally { deletingUploadId = null; renderUploads(); }
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

  const layerLabel = (item) => {
    if (item.type === 'text') return item.content.replace(/\s+/g, ' ').trim().slice(0, 42) || 'Text';
    if (item.type === 'image') return 'Image';
    if (item.type === 'decorative') return model.getTemplateAsset(item.assetId)?.name || 'Asset';
    return `${item.type.charAt(0).toUpperCase()}${item.type.slice(1)}`;
  };
  const renderLayers = () => {
    const current = section(); ui.layersList.replaceChildren();
    if (!current?.elementOrder.length) { const empty = document.createElement('p'); empty.className = 'layers-empty'; empty.textContent = 'No objects in this section.'; ui.layersList.append(empty); }
    else [...current.elementOrder].reverse().forEach((id) => {
      const item = state.elements[id]; if (!item) return;
      const row = document.createElement('article'); row.className = 'layer-row'; row.dataset.elementId = id; row.classList.toggle('is-selected', id === selectedElementId);
      const select = document.createElement('button'); select.type = 'button'; select.className = 'layer-select'; select.dataset.layerSelect = id;
      const type = document.createElement('small'); type.textContent = item.type === 'decorative' ? 'Asset' : item.type === 'image' ? 'Image' : 'Text';
      const label = document.createElement('span'); label.textContent = layerLabel(item); select.append(type, label);
      const drag = document.createElement('button'); drag.type = 'button'; drag.className = 'layer-drag-handle'; drag.dataset.layerDrag = id; drag.textContent = 'Drag'; drag.setAttribute('aria-label', `Reorder ${layerLabel(item)}`);
      row.append(select, drag); ui.layersList.append(row);
    });
    const selected = element(); const locked = !selected || selected.permissions.locked;
    const order = current?.elementOrder || []; const index = selected ? order.indexOf(selected.id) : -1;
    $$('[data-layer]', ui.arrangePanel).forEach((button) => { const action = button.dataset.layer; button.disabled = locked || index < 0 || (['forward', 'front'].includes(action) && index === order.length - 1) || (['backward', 'back'].includes(action) && index === 0); });
    $$('[data-position-x], [data-position-y]', ui.arrangePanel).forEach((button) => { button.disabled = !selected || selected.permissions.locked || !selected.permissions.movable; });
    ui.positionHelp.hidden = Boolean(selected);
  };

  const renderAll = () => { renderContext(); renderDesign(); renderUploads(); renderSections(); renderLayers(); };
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
    let frame = { x: 65 + (count % 3) * 8, y: 410 + (count % 4) * 12, width: 260, height: 220 };
    if (type === 'decorative') {
      const canvas = getCanvasMetrics();
      const asset = model.getTemplateAsset(assetId); const ratio = asset?.width && asset?.height ? asset.width / asset.height : 1;
      const maxHeight = Math.max(32, current.height - 40); const width = Math.min(260, maxHeight * ratio); const height = width / ratio; const offset = (count % 3) * 8;
      frame = { x: Math.max(canvas.safeMargin, Math.min(canvas.right - width - canvas.safeMargin, canvas.centerX - width / 2 + offset)), y: Math.max(20, Math.min(current.height - height - 20, (current.height - height) / 2 + offset)), width, height };
    }
    const created = model.createImageElement({ sectionId: current.id, assetId, assetKind, type, frame, crop: { fit: type === 'decorative' ? 'contain' : 'cover' } });
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
      const frame = next.elements[source.id].frame; const canvas = getCanvasMetrics(); const margin = canvas.safeMargin;
      if (axis === 'x') frame.x = value === 'left' ? margin : value === 'center' ? canvas.centerX - frame.width / 2 : canvas.right - margin - frame.width;
      if (axis === 'y') frame.y = value === 'top' ? margin : value === 'middle' ? (current.height - frame.height) / 2 : current.height - margin - frame.height;
    });
  };

  const startLayerDrag = (event, handle) => {
    if (layerDrag || !event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
    const row = handle.closest('.layer-row'); const current = section();
    if (!row || !current || !current.elementOrder.includes(row.dataset.elementId)) return;
    event.preventDefault(); event.stopPropagation();
    const active = { pointerId: event.pointerId, handle, row, captureTarget: ui.layersList, sectionId: current.id, original: [...current.elementOrder], removers: [] };
    layerDrag = active; row.classList.add('is-dragging');
    const listen = (target, type, handler, options) => { target.addEventListener(type, handler, options); active.removers.push(() => target.removeEventListener(type, handler, options)); };
    const finish = (nextEvent, commitOrder) => {
      if (layerDrag !== active || (nextEvent.pointerId != null && nextEvent.pointerId !== active.pointerId)) return;
      layerDrag = null; active.removers.forEach((remove) => remove()); row.classList.remove('is-dragging');
      try { if (active.captureTarget.hasPointerCapture(active.pointerId)) active.captureTarget.releasePointerCapture(active.pointerId); } catch {}
      if (!commitOrder || !state.sections[active.sectionId]) { renderLayers(); return; }
      const frontToBack = $$('.layer-row', ui.layersList).map((item) => item.dataset.elementId);
      if (selectedSectionId !== active.sectionId || frontToBack.length !== active.original.length || !frontToBack.every((id) => active.original.includes(id))) { renderLayers(); return; }
      const nextOrder = frontToBack.reverse();
      if (equal(active.original, nextOrder)) { renderLayers(); return; }
      mutate('Reorder layer', (next) => { next.sections[active.sectionId].elementOrder = nextOrder; });
    };
    listen(document, 'pointermove', (nextEvent) => {
      if (layerDrag !== active || nextEvent.pointerId !== active.pointerId) return;
      nextEvent.preventDefault();
      const siblings = $$('.layer-row', ui.layersList).filter((item) => item !== row);
      const before = siblings.find((item) => nextEvent.clientY < item.getBoundingClientRect().top + item.getBoundingClientRect().height / 2);
      ui.layersList.insertBefore(row, before || null);
    }, { capture: true, passive: false });
    listen(document, 'pointerup', (nextEvent) => finish(nextEvent, true), true);
    listen(document, 'pointercancel', (nextEvent) => finish(nextEvent, false), true);
    listen(document, 'lostpointercapture', (nextEvent) => { if (nextEvent.target === active.captureTarget) finish(nextEvent, false); }, true);
    listen(window, 'blur', (nextEvent) => finish(nextEvent, false));
    try { active.captureTarget.setPointerCapture(active.pointerId); } catch {}
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
    imageEditElementId = null;
    backgroundEditSectionId = enabled && current?.background.kind === 'image' ? current.id : null;
    if (backgroundEditSectionId) selectedElementId = null;
    renderAll(); syncCanvas();
  };
  const applyBackgroundAsset = (assetId, assetKind) => {
    backgroundEditSectionId = null; imageEditElementId = null;
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
  ui.closePosition.addEventListener('click', closePositionPanel);
  ui.positionTabs.forEach((button) => button.addEventListener('click', () => setPositionTab(button.dataset.positionTab)));
  ui.layersList.addEventListener('click', (event) => { const button = event.target.closest('[data-layer-select]'); if (button) selectElement(button.dataset.layerSelect); });
  ui.layersList.addEventListener('pointerdown', (event) => { const handle = event.target.closest('[data-layer-drag]'); if (handle) startLayerDrag(event, handle); });
  $$('[data-add-text]').forEach((button) => button.addEventListener('click', () => addText(button.dataset.addText)));
  ui.undo.addEventListener('click', () => applyHistory('undo')); ui.redo.addEventListener('click', () => applyHistory('redo'));
  ui.previewButton.addEventListener('click', () => togglePopover(ui.previewPopover, ui.previewButton));
  ui.previewPopover.addEventListener('click', (event) => { const button = event.target.closest('[data-responsive-view]'); if (button) setResponsiveView(button.dataset.responsiveView); });

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
  $$('[data-open-position]').forEach((button) => button.addEventListener('click', openPositionPanel));
  $$('[data-open-more]').forEach((button) => button.addEventListener('click', () => togglePopover(ui.morePopover, button)));
  ui.arrangePanel.addEventListener('click', (event) => { const layer = event.target.closest('[data-layer]'); const x = event.target.closest('[data-position-x]'); const y = event.target.closest('[data-position-y]'); if (layer) layerElement(layer.dataset.layer); if (x) alignElement('x', x.dataset.positionX); if (y) alignElement('y', y.dataset.positionY); });
  bindTransactionalInput(ui.opacity, 'Change opacity', (next, value) => { const source = element(); if (source) next.elements[source.id].opacity = Number(value); });
  bindTransactionalInput(ui.rotation, 'Rotate element', (next, value) => { const source = element(); if (source) next.elements[source.id].rotation = Number(value); });
  bindTransactionalInput(ui.imageZoom, 'Crop image', (next, value) => { const source = element(); if (source?.crop) next.elements[source.id].crop.zoom = Number(value); });
  const toggleElementLock = () => { const source = element(); if (source) mutate(source.permissions.locked ? 'Unlock element' : 'Lock element', (next) => { next.elements[source.id].permissions.locked = !source.permissions.locked; }); closePopovers(); };
  ui.textCaseControls.addEventListener('click', (event) => { const button = event.target.closest('[data-text-case]'); if (button) { changeTextCase(button.dataset.textCase); closePopovers(); } });
  ui.editImage.addEventListener('click', () => {
    const source = element(); if (source?.type !== 'image' || source.permissions.locked || !source.permissions.editable) return;
    finishTransaction(false); backgroundEditSectionId = null; imageEditElementId = source.id; closePopovers(); renderAll(); syncCanvas();
  });
  ui.doneImage.addEventListener('click', () => { finishTransaction(false); imageEditElementId = null; closePopovers(); renderAll(); syncCanvas(); });
  ui.imageFlips.addEventListener('click', (event) => {
    const axis = event.target.closest('[data-image-flip]')?.dataset.imageFlip; const source = element();
    if (!['flipX', 'flipY'].includes(axis) || !source?.crop || source.permissions.locked || !source.permissions.editable) return;
    mutate('Flip image', (next) => { next.elements[source.id].crop[axis] = !source.crop[axis]; });
  });
  ui.imageFit.addEventListener('click', () => { const source = element(); if (source) mutate('Change image fit', (next) => { next.elements[source.id].crop.fit = source.crop.fit === 'cover' ? 'contain' : 'cover'; }); });
  ui.replace.addEventListener('click', () => {
    const source = element();
    replaceTargetElementId = source?.type === 'image' ? source.id : null;
    if (replaceTargetElementId) ui.replaceInput.click();
  });
  ui.replaceInput.addEventListener('change', async () => {
    const targetId = replaceTargetElementId; const files = [...ui.replaceInput.files]; replaceTargetElementId = null; ui.replaceInput.value = '';
    if (!targetId || !files.length) return;
    const [added] = await uploadFiles(files); const target = state.elements[targetId];
    if (!added || target?.type !== 'image') return;
    // Preserve fit, focal position, zoom and flips alongside the existing frame/layout.
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
  ui.removeBackground.addEventListener('click', () => { backgroundEditSectionId = null; imageEditElementId = null; mutate('Remove background image', (next) => { Object.assign(next.sections[selectedSectionId].background, { kind: 'color', assetId: '' }); }); });
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
      case 'manage': uploadMenuId = uploadMenuId === card.dataset.assetId ? null : card.dataset.assetId; uploadDeleteId = null; renderUploads(); break;
      case 'delete': void deleteUpload(card.dataset.assetId); break;
      case 'cancel-delete': uploadDeleteId = null; uploadMenuId = null; renderUploads(); break;
      case 'confirm-delete': if (uploadDeleteId === card.dataset.assetId) void deleteUpload(uploadDeleteId, true); break;
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
    if (message.type === 'green-sage-visual:object-action') {
      if (message.elementId !== selectedElementId || !state.elements[message.elementId]) return;
      if (message.action === 'lock') { toggleElementLock(); return; }
      if (message.action === 'duplicate') { duplicateElement(); closePopovers(); return; }
      if (message.action === 'delete') { deleteElement(); closePopovers(); return; }
      if (message.action === 'more' && message.anchor) {
        const frame = ui.canvas.getBoundingClientRect(); const anchor = message.anchor;
        const values = ['left', 'right', 'top', 'bottom', 'width', 'height'].map((key) => Number(anchor[key]));
        if (!values.every(Number.isFinite)) return;
        const [left, right, top, bottom, width, height] = values;
        const rect = { left: frame.left + left, right: frame.left + right, top: frame.top + top, bottom: frame.top + bottom, width, height, x: frame.left + left, y: frame.top + top, toJSON() { return this; } };
        togglePopover(ui.morePopover, { getBoundingClientRect: () => rect, setAttribute() {} });
      }
      return;
    }
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
        if (message.patch?.crop && target.type === 'image') Object.assign(target.crop, { focalX: message.patch.crop.focalX ?? target.crop.focalX, focalY: message.patch.crop.focalY ?? target.crop.focalY });
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

  renderTemplateElements(); setPanel(activePanel); renderResponsiveView(); renderAll(); updateHistory();
  refreshAssets().catch(() => { ui.uploadStatus.textContent = 'Local upload storage is unavailable in this browser.'; });
})();
