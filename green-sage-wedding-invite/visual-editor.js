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
  const fontFamily = document.getElementById('fontFamily');
  const fontSize = document.getElementById('fontSize');
  const textColor = document.getElementById('textColor');
  const textColorValue = document.getElementById('textColorValue');
  const alignmentControls = document.getElementById('alignmentControls');
  const horizontalPositionControls = document.getElementById('horizontalPositionControls');
  const verticalPositionControls = document.getElementById('verticalPositionControls');
  const previewStage = document.querySelector('.visual-preview-stage');
  const deviceButtons = [...document.querySelectorAll('[data-device]')];

  const clone = model.clone;
  const messageOrigin = window.location.origin === 'null' ? '*' : window.location.origin;
  const isSameOrigin = (origin) => origin === window.location.origin
    || (window.location.origin === 'null' && origin === 'null');
  const history = { past: [], future: [] };

  let state = model.load();
  let selectedElementId = null;
  let activeTransaction = null;
  let canvasReady = false;
  let saveTimer = 0;
  let revision = 0;
  let stylePreviewToken = 0;
  let canvasScrollLock = null;

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

  const renderSelectionControls = () => {
    const element = selectedElement();
    emptyState.hidden = Boolean(element);
    selectionControls.hidden = !element;

    if (!element) return;

    fontFamily.value = element.style.fontFamily;
    fontSize.value = String(element.style.fontSize);
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
  };

  const setSelection = (elementId, sync = true) => {
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
    if (!element || !document.fonts?.load) return;
    const family = String(element.style.fontFamily).replaceAll('"', '');
    await document.fonts.load(`${element.style.fontSize}px "${family}"`, element.content || 'Text');
  };

  const commitSelectedStyle = async (style, label) => {
    const element = selectedElement();
    if (!element || element.permissions.locked || !element.permissions.editable) return;
    const next = clone(state);
    next.elements[element.id].style = {
      ...next.elements[element.id].style,
      ...style
    };
    const normalized = model.normalize(next);
    await waitForFont(normalized.elements[element.id]);
    commitState(normalized, label);
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

  model.fontCatalog.forEach((family) => {
    const option = document.createElement('option');
    option.value = family;
    option.textContent = family;
    fontFamily.append(option);
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

  fontFamily.addEventListener('change', () => {
    commitSelectedStyle({ fontFamily: fontFamily.value }, 'Change font family');
  });

  fontSize.addEventListener('focus', () => beginControlTransaction('Change font size'));
  fontSize.addEventListener('input', () => {
    previewSelectedStyle({ fontSize: Number(fontSize.value) }, 'Change font size');
  });
  fontSize.addEventListener('change', () => finalizeActiveTransaction());
  fontSize.addEventListener('blur', () => finalizeActiveTransaction());

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
