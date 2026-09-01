(() => {
  const model = globalThis.GreenSageVisualDocument;
  if (!model) return;

  const canvas = document.getElementById('visualCanvas');
  const previewFrame = document.getElementById('previewFrame');
  const saveStatus = document.getElementById('saveStatus');
  const undoButton = document.getElementById('undoButton');
  const redoButton = document.getElementById('redoButton');
  const addTextButton = document.getElementById('addTextButton');
  const duplicateButton = document.getElementById('duplicateButton');
  const deleteButton = document.getElementById('deleteButton');
  const emptyState = document.getElementById('emptyState');
  const selectionControls = document.getElementById('selectionControls');
  const fontPickerButton = document.getElementById('fontPickerButton');
  const fontPickerValue = document.getElementById('fontPickerValue');
  const fontPickerPopover = document.getElementById('fontPickerPopover');
  const fontCategoryFilters = document.getElementById('fontCategoryFilters');
  const fontList = document.getElementById('fontList');
  const fontSize = document.getElementById('fontSize');
  const fontSizeDecrease = document.getElementById('fontSizeDecrease');
  const fontSizeIncrease = document.getElementById('fontSizeIncrease');
  const fontSizePresets = document.getElementById('fontSizePresets');
  const textColor = document.getElementById('textColor');
  const textColorValue = document.getElementById('textColorValue');
  const formattingControls = document.getElementById('formattingControls');
  const alignmentControls = document.getElementById('alignmentControls');
  const lineHeight = document.getElementById('lineHeight');
  const letterSpacing = document.getElementById('letterSpacing');
  const horizontalPositionControls = document.getElementById('horizontalPositionControls');
  const verticalPositionControls = document.getElementById('verticalPositionControls');
  const previewStage = document.querySelector('.visual-preview-stage');
  const deviceButtons = [...document.querySelectorAll('[data-device]')];

  const clone = model.clone;
  const messageOrigin = window.location.origin === 'null' ? '*' : window.location.origin;
  const isSameOrigin = (origin) => origin === window.location.origin
    || (window.location.origin === 'null' && origin === 'null');
  const history = { past: [], future: [] };
  const fontSizeValues = Object.freeze([8, 10, 12, 14, 16, 18, 21, 24, 28, 32, 36, 42, 48, 56, 64, 72, 84, 96, 120]);

  let state = model.load();
  let selectedElementId = null;
  let activeTransaction = null;
  let canvasReady = false;
  let saveTimer = 0;
  let revision = 0;
  let stylePreviewToken = 0;
  let canvasScrollLock = null;
  let activeFontCategory = 'all';
  let fontPreviewObserver = null;
  let workspaceScrollGesture = null;
  let styleCommitQueue = Promise.resolve();

  const snapshot = (label = '') => ({
    state: clone(state),
    selectedElementId,
    label
  });

  const statesMatch = (first, second) => JSON.stringify(first) === JSON.stringify(second);

  const updateHistoryButtons = () => {
    undoButton.disabled = history.past.length === 0;
    redoButton.disabled = history.future.length === 0;
  };

  const save = () => {
    window.clearTimeout(saveTimer);
    saveStatus.textContent = 'Saving…';
    saveTimer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(model.storageKey, JSON.stringify(state));
        saveStatus.textContent = 'Saved in this browser';
      } catch {
        saveStatus.textContent = 'Canvas updated — this draft could not be saved';
      }
    }, 180);
  };

  const postToCanvas = (message) => {
    if (!canvasReady && message.type !== 'green-sage-visual:state') return;
    canvas.contentWindow?.postMessage(message, messageOrigin);
  };

  const syncCanvas = () => {
    revision += 1;
    postToCanvas({
      type: 'green-sage-visual:state',
      state,
      selectedElementId,
      revision
    });
  };

  const selectedElement = () => state.elements[selectedElementId] || null;

  const ensureFontLoaded = async (fontName, weight = 400, style = 'normal', sample = 'Aa') => {
    await model.loadFont(fontName, { weight, style, sample, document });
  };

  const closeFontPicker = () => {
    fontPickerPopover.hidden = true;
    fontPickerButton.setAttribute('aria-expanded', 'false');
    fontPreviewObserver?.disconnect();
  };

  const renderFontList = () => {
    fontPreviewObserver?.disconnect();
    fontList.replaceChildren();
    const selectedFont = selectedElement()?.style.fontFamily;
    const fonts = model.fontCatalog.filter((font) => activeFontCategory === 'all' || font.category === activeFontCategory);

    let previousCategory = '';
    fonts.forEach((font) => {
      if (activeFontCategory === 'all' && font.category !== previousCategory) {
        const heading = document.createElement('div');
        heading.className = 'visual-font-category-heading';
        heading.textContent = model.fontCategories.find((category) => category.id === font.category)?.label || font.category;
        fontList.append(heading);
        previousCategory = font.category;
      }
      const button = document.createElement('button');
      button.className = 'visual-font-option';
      button.type = 'button';
      button.dataset.fontName = font.name;
      button.setAttribute('role', 'option');
      button.setAttribute('aria-selected', String(font.name === selectedFont));
      button.classList.toggle('is-selected', font.name === selectedFont);
      button.style.fontFamily = model.fontStack(font.name);
      const label = document.createElement('span');
      label.textContent = font.displayName;
      const selectedMark = document.createElement('span');
      selectedMark.setAttribute('aria-hidden', 'true');
      selectedMark.textContent = font.name === selectedFont ? '✓' : '';
      button.append(label, selectedMark);
      fontList.append(button);
    });

    fontPreviewObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const option = entry.target;
        fontPreviewObserver.unobserve(option);
        ensureFontLoaded(option.dataset.fontName, 400, 'normal', option.dataset.fontName)
          .then(() => option.classList.add('is-loaded'))
          .catch(() => {});
      });
    }, { root: fontList, rootMargin: '80px 0px' });
    fontList.querySelectorAll('.visual-font-option').forEach((option) => fontPreviewObserver.observe(option));
  };

  const openFontPicker = () => {
    fontSizePresets.hidden = true;
    fontSize.setAttribute('aria-expanded', 'false');
    fontPickerPopover.hidden = false;
    fontPickerButton.setAttribute('aria-expanded', 'true');
    renderFontList();
  };

  const closeSizePresets = () => {
    fontSizePresets.hidden = true;
    fontSize.setAttribute('aria-expanded', 'false');
  };

  const openSizePresets = () => {
    closeFontPicker();
    fontSizePresets.hidden = false;
    fontSize.setAttribute('aria-expanded', 'true');
  };

  const renderSelectionControls = () => {
    const element = selectedElement();
    emptyState.hidden = Boolean(element);
    selectionControls.hidden = !element;

    if (!element) {
      closeFontPicker();
      closeSizePresets();
      return;
    }

    const font = model.getFont(element.style.fontFamily);
    fontPickerValue.textContent = font.displayName;
    fontPickerValue.style.fontFamily = model.fontStack(font.name);
    ensureFontLoaded(font.name, element.style.fontWeight, element.style.fontStyle, element.content).catch(() => {});
    fontSize.value = String(element.style.fontSize);
    lineHeight.value = String(element.style.lineHeight);
    letterSpacing.value = String(element.style.letterSpacing);
    textColor.value = element.style.color;
    textColorValue.textContent = element.style.color.toUpperCase();
    duplicateButton.disabled = element.permissions.locked;
    deleteButton.disabled = element.permissions.locked || !element.permissions.deletable;
    const positionDisabled = element.permissions.locked || !element.permissions.movable;
    [...horizontalPositionControls.querySelectorAll('button'), ...verticalPositionControls.querySelectorAll('button')]
      .forEach((button) => { button.disabled = positionDisabled; });

    [...alignmentControls.querySelectorAll('[data-align]')].forEach((button) => {
      const isActive = button.dataset.align === element.style.textAlign;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });

    const boldButton = formattingControls.querySelector('[data-format="bold"]');
    const italicButton = formattingControls.querySelector('[data-format="italic"]');
    const editable = !element.permissions.locked && element.permissions.editable;
    const supportsBold = font.weights.includes(700);
    const supportsItalic = font.styles.includes('italic');
    fontPickerButton.disabled = !editable;
    fontSize.disabled = !editable;
    lineHeight.disabled = !editable;
    letterSpacing.disabled = !editable;
    boldButton.disabled = !editable || !supportsBold;
    italicButton.disabled = !editable || !supportsItalic;
    boldButton.classList.toggle('is-active', supportsBold && element.style.fontWeight === 700);
    italicButton.classList.toggle('is-active', supportsItalic && element.style.fontStyle === 'italic');
    boldButton.setAttribute('aria-pressed', String(supportsBold && element.style.fontWeight === 700));
    italicButton.setAttribute('aria-pressed', String(supportsItalic && element.style.fontStyle === 'italic'));
    fontSizeDecrease.disabled = !editable || element.style.fontSize <= 8;
    fontSizeIncrease.disabled = !editable || element.style.fontSize >= 180;
    fontSizePresets.querySelectorAll('[data-font-size]').forEach((button) => {
      const isSelected = Number(button.dataset.fontSize) === element.style.fontSize;
      button.classList.toggle('is-selected', isSelected);
      button.setAttribute('aria-selected', String(isSelected));
    });
  };

  const setSelection = (elementId, sync = true) => {
    closeFontPicker();
    closeSizePresets();
    selectedElementId = state.elements[elementId] ? elementId : null;
    renderSelectionControls();
    if (sync) syncCanvas();
  };

  const pushPast = (entry) => {
    history.past.push(entry);
    if (history.past.length > 80) history.past.shift();
    history.future = [];
    updateHistoryButtons();
  };

  const finalizeActiveTransaction = (sync = true) => {
    if (!activeTransaction) return false;
    const transaction = activeTransaction;
    activeTransaction = null;
    if (!statesMatch(transaction.before.state, state)) {
      pushPast(transaction.before);
      save();
      if (sync) syncCanvas();
      return true;
    }
    if (sync) syncCanvas();
    return false;
  };

  const commitState = (nextState, label, nextSelection = selectedElementId) => {
    finalizeActiveTransaction(false);
    const before = snapshot(label);
    const normalized = model.normalize(nextState);
    if (statesMatch(state, normalized) && nextSelection === selectedElementId) return;
    pushPast(before);
    state = normalized;
    selectedElementId = state.elements[nextSelection] ? nextSelection : null;
    renderSelectionControls();
    syncCanvas();
    save();
  };

  const applyElementPatch = (elementId, patch) => {
    const element = state.elements[elementId];
    if (!element || !patch || typeof patch !== 'object') return;
    const next = clone(state);
    const target = next.elements[elementId];
    if (typeof patch.content === 'string') target.content = patch.content;
    if (patch.frame && typeof patch.frame === 'object') {
      target.frame = { ...target.frame, ...patch.frame };
    }
    if (patch.style && typeof patch.style === 'object') {
      target.style = { ...target.style, ...patch.style };
    }
    state = model.normalize(next);
  };

  const waitForFont = async (element) => {
    if (!element) return;
    await ensureFontLoaded(
      element.style.fontFamily,
      element.style.fontWeight,
      element.style.fontStyle,
      element.content || 'Text'
    );
  };

  const commitSelectedStyle = (styleOrUpdater, label) => {
    const elementId = selectedElementId;
    const commit = async () => {
      const element = state.elements[elementId];
      if (!element || element.permissions.locked || !element.permissions.editable) return;
      const style = typeof styleOrUpdater === 'function'
        ? styleOrUpdater(element.style)
        : styleOrUpdater;
      const next = clone(state);
      next.elements[elementId].style = {
        ...next.elements[elementId].style,
        ...style
      };
      const normalized = model.normalize(next);
      await waitForFont(normalized.elements[elementId]);
      commitState(normalized, label);
    };
    styleCommitQueue = styleCommitQueue.then(commit, commit);
    return styleCommitQueue;
  };

  const beginControlTransaction = (label) => {
    const element = selectedElement();
    if (!element || element.permissions.locked || !element.permissions.editable) return false;
    if (activeTransaction?.id?.startsWith('control-') && activeTransaction.elementId === element.id) return true;
    finalizeActiveTransaction(false);
    activeTransaction = {
      id: `control-${model.createId('transaction')}`,
      elementId: element.id,
      kind: label,
      before: snapshot(label)
    };
    return true;
  };

  const previewSelectedStyle = async (style, label) => {
    if (!beginControlTransaction(label)) return;
    const element = selectedElement();
    const next = clone(state);
    next.elements[element.id].style = {
      ...next.elements[element.id].style,
      ...style
    };
    state = model.normalize(next);
    const token = ++stylePreviewToken;
    await waitForFont(state.elements[element.id]);
    if (token !== stylePreviewToken) return;
    syncCanvas();
    save();
  };

  const roundPosition = (value) => Math.round(value * 10) / 10;

  const positionSelectedElement = (axis, position) => {
    const element = selectedElement();
    if (!element || element.permissions.locked || !element.permissions.movable) return;
    const section = state.sections[element.sectionId];
    if (!section) return;

    const next = clone(state);
    const target = next.elements[element.id];
    if (axis === 'x') {
      const pageWidth = state.document.canvas.baseWidth;
      const positions = {
        left: 0,
        center: (pageWidth - element.frame.width) / 2,
        right: pageWidth - element.frame.width
      };
      if (!(position in positions)) return;
      target.frame.x = roundPosition(positions[position]);
    } else {
      const positions = {
        top: 0,
        middle: (section.height - element.frame.height) / 2,
        bottom: section.height - element.frame.height
      };
      if (!(position in positions)) return;
      target.frame.y = roundPosition(positions[position]);
    }
    commitState(next, `Position text ${position}`);
  };

  const lockPreviewScroll = () => {
    if (canvasScrollLock) return;
    const targets = [previewStage, document.scrollingElement].filter(Boolean);
    const positions = targets.map((target) => ({
      target,
      left: target.scrollLeft,
      top: target.scrollTop
    }));
    const keepStationary = () => {
      positions.forEach(({ target, left, top }) => {
        if (target.scrollLeft !== left) target.scrollLeft = left;
        if (target.scrollTop !== top) target.scrollTop = top;
      });
    };
    canvasScrollLock = { positions, keepStationary };
    previewStage?.classList.add('is-manipulating');
    positions.forEach(({ target }) => target.addEventListener('scroll', keepStationary, { passive: true }));
  };

  const unlockPreviewScroll = () => {
    if (!canvasScrollLock) return;
    canvasScrollLock.positions.forEach(({ target }) => {
      target.removeEventListener('scroll', canvasScrollLock.keepStationary);
    });
    canvasScrollLock = null;
    previewStage?.classList.remove('is-manipulating');
  };

  const scrollCanvasBy = (deltaY) => {
    if (!Number.isFinite(deltaY) || deltaY === 0) return;
    postToCanvas({ type: 'green-sage-visual:scroll-by', deltaY });
  };

  previewStage?.addEventListener('wheel', (event) => {
    if (canvasScrollLock || previewFrame.contains(event.target)) return;
    event.preventDefault();
    scrollCanvasBy(event.deltaY);
  }, { passive: false });

  previewStage?.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse'
      || canvasScrollLock
      || event.target !== previewStage) return;
    workspaceScrollGesture = {
      pointerId: event.pointerId,
      lastY: event.clientY
    };
    previewStage.setPointerCapture?.(event.pointerId);
  });

  previewStage?.addEventListener('pointermove', (event) => {
    if (!workspaceScrollGesture || workspaceScrollGesture.pointerId !== event.pointerId) return;
    event.preventDefault();
    const deltaY = workspaceScrollGesture.lastY - event.clientY;
    workspaceScrollGesture.lastY = event.clientY;
    scrollCanvasBy(deltaY);
  }, { passive: false });

  const endWorkspaceScroll = (event) => {
    if (!workspaceScrollGesture || workspaceScrollGesture.pointerId !== event.pointerId) return;
    workspaceScrollGesture = null;
    try {
      previewStage.releasePointerCapture?.(event.pointerId);
    } catch {
      // Safari may release capture before pointercancel is delivered.
    }
  };
  previewStage?.addEventListener('pointerup', endWorkspaceScroll);
  previewStage?.addEventListener('pointercancel', endWorkspaceScroll);

  fontSizeValues.forEach((value) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.fontSize = String(value);
    button.setAttribute('role', 'option');
    button.textContent = String(value);
    fontSizePresets.append(button);
  });

  addTextButton.addEventListener('click', () => {
    const sectionId = state.document.sectionOrder[0];
    const section = state.sections[sectionId];
    const id = model.createId('text');
    const offset = section.elementOrder.length * 14;
    const element = model.createTextElement({
      id,
      sectionId,
      content: 'New text',
      frame: {
        x: 65 + (offset % 56),
        y: 470 + (offset % 112),
        width: 260,
        height: 66
      },
      style: {
        fontFamily: 'Instrument Serif',
        fontSize: 34,
        color: '#474232',
        textAlign: 'center',
        lineHeight: 1.1,
        letterSpacing: 0
      }
    });
    const next = clone(state);
    next.elements[id] = element;
    next.sections[sectionId].elementOrder.push(id);
    commitState(next, 'Add text', id);
  });

  duplicateButton.addEventListener('click', () => {
    const element = selectedElement();
    if (!element || element.permissions.locked) return;
    const id = model.createId('text');
    const next = clone(state);
    next.elements[id] = {
      ...clone(element),
      id,
      frame: {
        ...element.frame,
        x: element.frame.x + 16,
        y: element.frame.y + 16
      }
    };
    const order = next.sections[element.sectionId].elementOrder;
    order.splice(order.indexOf(element.id) + 1, 0, id);
    commitState(next, 'Duplicate text', id);
  });

  deleteButton.addEventListener('click', () => {
    const element = selectedElement();
    if (!element || element.permissions.locked || !element.permissions.deletable) return;
    const next = clone(state);
    delete next.elements[element.id];
    next.sections[element.sectionId].elementOrder = next.sections[element.sectionId].elementOrder
      .filter((id) => id !== element.id);
    commitState(next, 'Delete text', null);
  });

  fontPickerButton.addEventListener('click', () => {
    if (fontPickerPopover.hidden) openFontPicker();
    else closeFontPicker();
  });

  fontCategoryFilters.addEventListener('click', (event) => {
    const button = event.target.closest('[data-font-category]');
    if (!button) return;
    activeFontCategory = button.dataset.fontCategory;
    fontCategoryFilters.querySelectorAll('[data-font-category]').forEach((item) => {
      item.classList.toggle('is-active', item === button);
    });
    renderFontList();
  });

  fontList.addEventListener('click', async (event) => {
    const option = event.target.closest('[data-font-name]');
    if (!option) return;
    const fontName = option.dataset.fontName;
    closeFontPicker();
    await commitSelectedStyle({ fontFamily: fontName }, 'Change font family');
  });

  document.addEventListener('pointerdown', (event) => {
    if (!fontPickerPopover.hidden
      && !fontPickerPopover.contains(event.target)
      && !fontPickerButton.contains(event.target)) closeFontPicker();
    if (!fontSizePresets.hidden
      && !fontSizePresets.contains(event.target)
      && !fontSize.contains(event.target)) closeSizePresets();
  });

  fontSize.addEventListener('focus', () => {
    beginControlTransaction('Change font size');
    openSizePresets();
  });
  fontSize.addEventListener('click', openSizePresets);
  fontSize.addEventListener('input', () => {
    const value = Number(fontSize.value);
    if (fontSize.value !== '' && Number.isFinite(value)) {
      previewSelectedStyle({ fontSize: value }, 'Change font size');
    }
  });
  fontSize.addEventListener('change', () => finalizeActiveTransaction());
  fontSize.addEventListener('blur', () => {
    finalizeActiveTransaction();
    renderSelectionControls();
  });

  const adjustFontSize = (delta) => {
    const element = selectedElement();
    if (!element) return;
    finalizeActiveTransaction(false);
    commitSelectedStyle(
      (style) => ({ fontSize: style.fontSize + delta }),
      delta < 0 ? 'Decrease font size' : 'Increase font size'
    );
  };

  fontSizeDecrease.addEventListener('click', () => adjustFontSize(-1));
  fontSizeIncrease.addEventListener('click', () => adjustFontSize(1));

  fontSizePresets.addEventListener('click', (event) => {
    const button = event.target.closest('[data-font-size]');
    if (!button) return;
    finalizeActiveTransaction(false);
    closeSizePresets();
    commitSelectedStyle({ fontSize: Number(button.dataset.fontSize) }, 'Choose font size');
  });

  formattingControls.addEventListener('click', (event) => {
    const button = event.target.closest('[data-format]');
    const element = selectedElement();
    if (!button || !element || button.disabled) return;
    if (button.dataset.format === 'bold') {
      commitSelectedStyle({ fontWeight: element.style.fontWeight === 700 ? 400 : 700 }, 'Toggle bold');
    } else if (button.dataset.format === 'italic') {
      commitSelectedStyle({ fontStyle: element.style.fontStyle === 'italic' ? 'normal' : 'italic' }, 'Toggle italic');
    }
  });

  const bindNumericStyleControl = (control, property, label) => {
    control.addEventListener('focus', () => beginControlTransaction(label));
    control.addEventListener('input', () => {
      const value = Number(control.value);
      if (control.value !== '' && Number.isFinite(value)) previewSelectedStyle({ [property]: value }, label);
    });
    control.addEventListener('change', () => finalizeActiveTransaction());
    control.addEventListener('blur', () => {
      finalizeActiveTransaction();
      renderSelectionControls();
    });
  };

  bindNumericStyleControl(lineHeight, 'lineHeight', 'Change line height');
  bindNumericStyleControl(letterSpacing, 'letterSpacing', 'Change letter spacing');

  textColor.addEventListener('input', () => {
    textColorValue.textContent = textColor.value.toUpperCase();
  });
  textColor.addEventListener('change', () => {
    commitSelectedStyle({ color: textColor.value }, 'Change text color');
  });

  alignmentControls.addEventListener('click', (event) => {
    const button = event.target.closest('[data-align]');
    if (!button) return;
    commitSelectedStyle({ textAlign: button.dataset.align }, 'Change text alignment');
  });

  horizontalPositionControls.addEventListener('click', (event) => {
    const button = event.target.closest('[data-position-x]');
    if (!button) return;
    positionSelectedElement('x', button.dataset.positionX);
  });

  verticalPositionControls.addEventListener('click', (event) => {
    const button = event.target.closest('[data-position-y]');
    if (!button) return;
    positionSelectedElement('y', button.dataset.positionY);
  });

  undoButton.addEventListener('click', () => {
    finalizeActiveTransaction(false);
    const previous = history.past.pop();
    if (!previous) return;
    history.future.push(snapshot(previous.label));
    state = model.normalize(previous.state);
    selectedElementId = state.elements[previous.selectedElementId] ? previous.selectedElementId : null;
    renderSelectionControls();
    updateHistoryButtons();
    syncCanvas();
    save();
  });

  redoButton.addEventListener('click', () => {
    finalizeActiveTransaction(false);
    const nextEntry = history.future.pop();
    if (!nextEntry) return;
    history.past.push(snapshot(nextEntry.label));
    state = model.normalize(nextEntry.state);
    selectedElementId = state.elements[nextEntry.selectedElementId] ? nextEntry.selectedElementId : null;
    renderSelectionControls();
    updateHistoryButtons();
    syncCanvas();
    save();
  });

  deviceButtons.forEach((button) => {
    button.setAttribute('aria-pressed', String(button.classList.contains('is-active')));
    button.addEventListener('click', () => {
      deviceButtons.forEach((item) => {
        const isActive = item === button;
        item.classList.toggle('is-active', isActive);
        item.setAttribute('aria-pressed', String(isActive));
      });
      previewFrame.className = `preview-frame device-${button.dataset.device}`;
    });
  });

  window.addEventListener('message', (event) => {
    if (event.source !== canvas.contentWindow || !isSameOrigin(event.origin)) return;
    const message = event.data;
    if (!message || typeof message.type !== 'string') return;

    if (message.type === 'green-sage-visual:ready') {
      canvasReady = true;
      syncCanvas();
      return;
    }

    if (message.type === 'green-sage-visual:manipulation-start') {
      lockPreviewScroll();
      return;
    }

    if (message.type === 'green-sage-visual:manipulation-end') {
      unlockPreviewScroll();
      return;
    }

    if (message.type === 'green-sage-visual:select') {
      if (activeTransaction) finalizeActiveTransaction(false);
      setSelection(message.elementId);
      return;
    }

    if (message.type === 'green-sage-visual:transaction-start') {
      if (!state.elements[message.elementId]) return;
      finalizeActiveTransaction(false);
      selectedElementId = message.elementId;
      activeTransaction = {
        id: String(message.transactionId || ''),
        elementId: message.elementId,
        kind: String(message.kind || 'Edit text'),
        before: snapshot(String(message.kind || 'Edit text'))
      };
      renderSelectionControls();
      return;
    }

    if (message.type === 'green-sage-visual:transaction-patch') {
      if (!activeTransaction
        || activeTransaction.id !== String(message.transactionId || '')
        || activeTransaction.elementId !== message.elementId) return;
      applyElementPatch(message.elementId, message.patch);
      save();
      return;
    }

    if (message.type === 'green-sage-visual:transaction-commit') {
      if (!activeTransaction || activeTransaction.id !== String(message.transactionId || '')) return;
      finalizeActiveTransaction();
      renderSelectionControls();
      return;
    }

    if (message.type === 'green-sage-visual:transaction-cancel') {
      if (!activeTransaction || activeTransaction.id !== String(message.transactionId || '')) return;
      state = model.normalize(activeTransaction.before.state);
      selectedElementId = activeTransaction.before.selectedElementId;
      activeTransaction = null;
      renderSelectionControls();
      syncCanvas();
      save();
    }
  });

  canvas.addEventListener('load', () => {
    canvasReady = true;
    syncCanvas();
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && (!fontPickerPopover.hidden || !fontSizePresets.hidden)) {
      closeFontPicker();
      closeSizePresets();
      event.preventDefault();
      return;
    }
    const modifier = event.metaKey || event.ctrlKey;
    if (!modifier || event.key.toLowerCase() !== 'z') return;
    if (event.shiftKey) {
      if (!redoButton.disabled) redoButton.click();
    } else if (!undoButton.disabled) {
      undoButton.click();
    }
    event.preventDefault();
  });

  renderSelectionControls();
  updateHistoryButtons();
})();
