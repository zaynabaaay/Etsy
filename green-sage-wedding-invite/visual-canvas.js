(() => {
  const model = globalThis.GreenSageVisualDocument;
  if (!model) return;

  const root = document.getElementById('canvasRoot');
  const messageOrigin = window.location.origin === 'null' ? '*' : window.location.origin;
  const isSameOrigin = (origin) => origin === window.location.origin
    || (window.location.origin === 'null' && origin === 'null');
  const resizeDirections = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

  let currentState = null;
  let selectedElementId = null;
  let editingElementId = null;
  let activeTransaction = null;
  let currentScale = 1;
  let renderToken = 0;
  let endingEdit = false;
  let activePointerGesture = null;

  const post = (message) => {
    window.parent.postMessage(message, messageOrigin);
  };

  const ensureFontLoaded = async (element) => {
    await model.loadFont(element.style.fontFamily, {
      weight: element.style.fontWeight,
      style: element.style.fontStyle,
      size: element.style.fontSize,
      sample: element.content || 'Text',
      document
    });
  };

  const waitForFonts = async (state) => {
    const requests = [];
    const seen = new Set();
    Object.values(state.elements).forEach((element) => {
      const key = `${element.style.fontSize}:${element.style.fontFamily}:${element.style.fontWeight}:${element.style.fontStyle}`;
      if (seen.has(key)) return;
      seen.add(key);
      requests.push(ensureFontLoaded(element));
    });
    await Promise.allSettled(requests);
  };

  const calculateScale = () => {
    if (!currentState) return 1;
    const { baseWidth, maxRenderedWidth } = currentState.document.canvas;
    return Math.min(window.innerWidth / baseWidth, maxRenderedWidth / baseWidth);
  };

  const frameElement = (elementId) => root.querySelector(`[data-element-id="${CSS.escape(elementId)}"]`);

  const elementIsOutside = (element) => {
    const section = currentState.sections[element.sectionId];
    return element.frame.x < 0
      || element.frame.y < 0
      || element.frame.x + element.frame.width > currentState.document.canvas.baseWidth
      || element.frame.y + element.frame.height > section.height;
  };

  const updateOverflowState = (elementId) => {
    const element = currentState?.elements[elementId];
    const frame = frameElement(elementId);
    if (!element || !frame) return;
    const content = frame.querySelector('.element-content');
    const outside = elementIsOutside(element);
    const textOverflow = content.scrollHeight > frame.clientHeight + 1
      || content.scrollWidth > frame.clientWidth + 1;
    frame.classList.toggle('is-outside', outside);
    frame.classList.toggle('has-text-overflow', textOverflow);
    const sectionCanvas = frame.closest('.section-canvas');
    const sectionId = element.sectionId;
    const sectionHasOverflow = currentState.sections[sectionId].elementOrder
      .some((id) => elementIsOutside(currentState.elements[id]));
    sectionCanvas?.classList.toggle('has-overflow', sectionHasOverflow);
  };

  const updateAllOverflowStates = () => {
    if (!currentState) return;
    Object.keys(currentState.elements).forEach(updateOverflowState);
  };

  const refreshSelectionChrome = () => {
    root.querySelectorAll('.element-frame').forEach((frame) => {
      const isSelected = frame.dataset.elementId === selectedElementId;
      frame.classList.toggle('is-selected', isSelected);
      frame.setAttribute('aria-selected', String(isSelected));
      const content = frame.querySelector('.element-content');
      if (!isSelected && content.isContentEditable) content.blur();
    });
  };

  const beginTransaction = (elementId, kind) => {
    const transactionId = model.createId('transaction');
    activeTransaction = { transactionId, elementId, kind };
    post({
      type: 'green-sage-visual:transaction-start',
      transactionId,
      elementId,
      kind
    });
    return activeTransaction;
  };

  const sendTransactionPatch = (patch) => {
    if (!activeTransaction) return;
    post({
      type: 'green-sage-visual:transaction-patch',
      transactionId: activeTransaction.transactionId,
      elementId: activeTransaction.elementId,
      patch
    });
  };

  const finishTransaction = (outcome = 'commit') => {
    if (!activeTransaction) return;
    const transaction = activeTransaction;
    activeTransaction = null;
    post({
      type: outcome === 'cancel'
        ? 'green-sage-visual:transaction-cancel'
        : 'green-sage-visual:transaction-commit',
      transactionId: transaction.transactionId,
      elementId: transaction.elementId
    });
  };

  const exitTextEdit = (outcome = 'commit') => {
    if (!editingElementId || endingEdit) return;
    endingEdit = true;
    const frame = frameElement(editingElementId);
    const content = frame?.querySelector('.element-content');
    const editingId = editingElementId;
    editingElementId = null;
    frame?.classList.remove('is-editing');
    if (content) {
      content.setAttribute('contenteditable', 'false');
      if (document.activeElement === content) content.blur();
    }
    if (activeTransaction?.elementId === editingId) finishTransaction(outcome);
    endingEdit = false;
  };

  const enterTextEdit = (element, frame, content) => {
    if (editingElementId === element.id || !element.permissions.editable || element.permissions.locked) return;
    exitTextEdit('commit');
    editingElementId = element.id;
    frame.classList.add('is-editing');
    content.setAttribute('contenteditable', 'plaintext-only');
    content.spellcheck = true;
    beginTransaction(element.id, 'Edit text');
  };

  const applyFrameLocally = (element, frame, nextFrame) => {
    element.frame = { ...element.frame, ...nextFrame };
    frame.style.left = `${element.frame.x}px`;
    frame.style.top = `${element.frame.y}px`;
    frame.style.width = `${element.frame.width}px`;
    frame.style.height = `${element.frame.height}px`;
    updateOverflowState(element.id);
    sendTransactionPatch({ frame: element.frame });
  };

  const capturePointer = (target, pointerId) => {
    try {
      target.setPointerCapture?.(pointerId);
    } catch {
      // Pointer capture can fail if Safari has already cancelled the pointer.
    }
  };

  const releasePointer = (target, pointerId) => {
    try {
      if (!target.hasPointerCapture || target.hasPointerCapture(pointerId)) {
        target.releasePointerCapture?.(pointerId);
      }
    } catch {
      // The pointer may already have been released by the browser.
    }
  };

  const lockCanvasScroll = (pointerId, target) => {
    const scrollPosition = { x: window.scrollX, y: window.scrollY };
    const keepCanvasStationary = () => {
      if (!activePointerGesture) return;
      if (window.scrollX !== scrollPosition.x || window.scrollY !== scrollPosition.y) {
        window.scrollTo(scrollPosition.x, scrollPosition.y);
      }
    };

    activePointerGesture = { pointerId, target, keepCanvasStationary };
    document.documentElement.classList.add('is-manipulating');
    window.addEventListener('scroll', keepCanvasStationary, { passive: true });
    capturePointer(target, pointerId);
    post({ type: 'green-sage-visual:manipulation-start' });
  };

  const unlockCanvasScroll = (pointerId, target) => {
    const gesture = activePointerGesture;
    if (!gesture || gesture.pointerId !== pointerId) return;
    activePointerGesture = null;
    window.removeEventListener('scroll', gesture.keepCanvasStationary);
    document.documentElement.classList.remove('is-manipulating');
    releasePointer(target || gesture.target, pointerId);
    post({ type: 'green-sage-visual:manipulation-end' });
  };

  const pointerCanManipulate = (event) => event.isPrimary
    && (event.pointerType !== 'mouse' || event.button === 0);

  const placeCaretAtPoint = (content, clientX, clientY) => {
    content.focus({ preventScroll: true });
    const selection = window.getSelection();
    if (!selection) return;

    let range = null;
    const position = document.caretPositionFromPoint?.(clientX, clientY);
    if (position?.offsetNode && content.contains(position.offsetNode)) {
      range = document.createRange();
      range.setStart(position.offsetNode, position.offset);
      range.collapse(true);
    } else {
      const legacyRange = document.caretRangeFromPoint?.(clientX, clientY);
      if (legacyRange && content.contains(legacyRange.commonAncestorContainer)) range = legacyRange;
    }

    if (!range) {
      range = document.createRange();
      range.selectNodeContents(content);
      range.collapse(false);
    }
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const startMove = (event, element, frame, handle) => {
    if (!pointerCanManipulate(event) || !element.permissions.movable || element.permissions.locked) return;
    event.preventDefault();
    event.stopPropagation();
    exitTextEdit('commit');
    selectedElementId = element.id;
    refreshSelectionChrome();
    const start = {
      clientX: event.clientX,
      clientY: event.clientY,
      frame: { ...element.frame }
    };
    const transaction = beginTransaction(element.id, 'Move text');
    lockCanvasScroll(event.pointerId, handle);

    const onMove = (moveEvent) => {
      if (!activeTransaction || activeTransaction.transactionId !== transaction.transactionId) return;
      moveEvent.preventDefault();
      const x = start.frame.x + ((moveEvent.clientX - start.clientX) / currentScale);
      const y = start.frame.y + ((moveEvent.clientY - start.clientY) / currentScale);
      applyFrameLocally(element, frame, {
        x: Math.round(x * 10) / 10,
        y: Math.round(y * 10) / 10
      });
    };

    const onEnd = (endEvent) => {
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onEnd);
      handle.removeEventListener('pointercancel', onCancel);
      unlockCanvasScroll(endEvent.pointerId, handle);
      finishTransaction('commit');
    };

    const onCancel = (cancelEvent) => {
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onEnd);
      handle.removeEventListener('pointercancel', onCancel);
      unlockCanvasScroll(cancelEvent.pointerId, handle);
      finishTransaction('cancel');
    };

    handle.addEventListener('pointermove', onMove, { passive: false });
    handle.addEventListener('pointerup', onEnd);
    handle.addEventListener('pointercancel', onCancel);
  };

  const resizedFrame = (startFrame, direction, dx, dy) => {
    const minimumWidth = 48;
    const minimumHeight = 32;
    let { x, y, width, height } = startFrame;

    if (direction.includes('e')) width = Math.max(minimumWidth, startFrame.width + dx);
    if (direction.includes('s')) height = Math.max(minimumHeight, startFrame.height + dy);
    if (direction.includes('w')) {
      width = Math.max(minimumWidth, startFrame.width - dx);
      x = startFrame.x + (startFrame.width - width);
    }
    if (direction.includes('n')) {
      height = Math.max(minimumHeight, startFrame.height - dy);
      y = startFrame.y + (startFrame.height - height);
    }

    return Object.fromEntries(
      Object.entries({ x, y, width, height }).map(([key, value]) => [key, Math.round(value * 10) / 10])
    );
  };

  const startResize = (event, element, frame, handle) => {
    if (!pointerCanManipulate(event) || !element.permissions.resizable || element.permissions.locked) return;
    event.preventDefault();
    event.stopPropagation();
    exitTextEdit('commit');
    selectedElementId = element.id;
    refreshSelectionChrome();
    const direction = handle.dataset.direction;
    const start = {
      clientX: event.clientX,
      clientY: event.clientY,
      frame: { ...element.frame }
    };
    const transaction = beginTransaction(element.id, 'Resize text box');
    lockCanvasScroll(event.pointerId, handle);

    const onMove = (moveEvent) => {
      if (!activeTransaction || activeTransaction.transactionId !== transaction.transactionId) return;
      moveEvent.preventDefault();
      const dx = (moveEvent.clientX - start.clientX) / currentScale;
      const dy = (moveEvent.clientY - start.clientY) / currentScale;
      applyFrameLocally(element, frame, resizedFrame(start.frame, direction, dx, dy));
    };

    const onEnd = (endEvent) => {
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onEnd);
      handle.removeEventListener('pointercancel', onCancel);
      unlockCanvasScroll(endEvent.pointerId, handle);
      finishTransaction('commit');
    };

    const onCancel = (cancelEvent) => {
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onEnd);
      handle.removeEventListener('pointercancel', onCancel);
      unlockCanvasScroll(cancelEvent.pointerId, handle);
      finishTransaction('cancel');
    };

    handle.addEventListener('pointermove', onMove, { passive: false });
    handle.addEventListener('pointerup', onEnd);
    handle.addEventListener('pointercancel', onCancel);
  };

  const startDirectMove = (event, element, frame, content) => {
    if (!pointerCanManipulate(event)
      || editingElementId === element.id
      || selectedElementId !== element.id
      || !element.permissions.movable
      || element.permissions.locked) return;

    event.preventDefault();
    event.stopPropagation();
    const pointerId = event.pointerId;
    const start = {
      clientX: event.clientX,
      clientY: event.clientY,
      frame: { ...element.frame }
    };
    let transaction = null;
    let moved = false;
    lockCanvasScroll(pointerId, content);

    const onMove = (moveEvent) => {
      if (moveEvent.pointerId !== pointerId) return;
      moveEvent.preventDefault();
      const rawDx = moveEvent.clientX - start.clientX;
      const rawDy = moveEvent.clientY - start.clientY;
      if (!moved && Math.hypot(rawDx, rawDy) < 5) return;

      if (!moved) {
        moved = true;
        exitTextEdit('commit');
        transaction = beginTransaction(element.id, 'Move text');
      }
      if (!activeTransaction || activeTransaction.transactionId !== transaction.transactionId) return;
      applyFrameLocally(element, frame, {
        x: Math.round((start.frame.x + (rawDx / currentScale)) * 10) / 10,
        y: Math.round((start.frame.y + (rawDy / currentScale)) * 10) / 10
      });
    };

    const cleanUp = (endEvent) => {
      content.removeEventListener('pointermove', onMove);
      content.removeEventListener('pointerup', onEnd);
      content.removeEventListener('pointercancel', onCancel);
      unlockCanvasScroll(endEvent.pointerId, content);
    };

    const onEnd = (endEvent) => {
      if (endEvent.pointerId !== pointerId) return;
      cleanUp(endEvent);
      if (moved) {
        finishTransaction('commit');
        return;
      }
      enterTextEdit(element, frame, content);
      placeCaretAtPoint(content, endEvent.clientX, endEvent.clientY);
    };

    const onCancel = (cancelEvent) => {
      if (cancelEvent.pointerId !== pointerId) return;
      cleanUp(cancelEvent);
      if (moved) finishTransaction('cancel');
    };

    content.addEventListener('pointermove', onMove, { passive: false });
    content.addEventListener('pointerup', onEnd);
    content.addEventListener('pointercancel', onCancel);
  };

  const insertPlainText = (content, text) => {
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (!content.contains(range.commonAncestorContainer)) return;
    range.deleteContents();
    const textNode = document.createTextNode(text);
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    content.dispatchEvent(new InputEvent('input', {
      bubbles: true,
      inputType: 'insertFromPaste',
      data: text
    }));
  };

  const createElementFrame = (element, layerIndex) => {
    const frame = document.createElement('div');
    frame.className = 'element-frame';
    frame.dataset.elementId = element.id;
    frame.setAttribute('role', 'group');
    frame.setAttribute('aria-label', `Text box: ${element.content.slice(0, 50)}`);
    frame.style.left = `${element.frame.x}px`;
    frame.style.top = `${element.frame.y}px`;
    frame.style.width = `${element.frame.width}px`;
    frame.style.height = `${element.frame.height}px`;
    frame.style.zIndex = String(layerIndex + 1);

    const animationLayer = document.createElement('div');
    animationLayer.className = 'element-animation-layer';

    const content = document.createElement('div');
    content.className = 'element-content';
    content.textContent = element.content;
    content.setAttribute('role', 'textbox');
    content.setAttribute('aria-label', 'Edit text');
    content.setAttribute('aria-multiline', 'true');
    content.setAttribute('contenteditable', 'false');
    content.style.fontFamily = model.fontStack(element.style.fontFamily);
    content.style.fontSize = `${element.style.fontSize}px`;
    content.style.fontWeight = String(element.style.fontWeight);
    content.style.fontStyle = element.style.fontStyle;
    content.style.color = element.style.color;
    content.style.textAlign = element.style.textAlign;
    content.style.lineHeight = String(element.style.lineHeight);
    content.style.letterSpacing = `${element.style.letterSpacing}px`;

    content.addEventListener('pointerdown', (event) => {
      event.stopPropagation();
      startDirectMove(event, element, frame, content);
    }, { passive: false });

    content.addEventListener('click', (event) => {
      event.stopPropagation();
      if (selectedElementId === element.id) return;
      exitTextEdit('commit');
      selectedElementId = element.id;
      refreshSelectionChrome();
      post({ type: 'green-sage-visual:select', elementId: element.id });
    });

    content.addEventListener('input', () => {
      if (editingElementId !== element.id || activeTransaction?.elementId !== element.id) return;
      element.content = content.textContent || '';
      frame.setAttribute('aria-label', `Text box: ${element.content.slice(0, 50)}`);
      updateOverflowState(element.id);
      sendTransactionPatch({ content: element.content });
    });

    content.addEventListener('paste', (event) => {
      if (editingElementId !== element.id) return;
      event.preventDefault();
      insertPlainText(content, event.clipboardData?.getData('text/plain') || '');
    });

    content.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      exitTextEdit('cancel');
    });

    content.addEventListener('blur', () => {
      if (!endingEdit && editingElementId === element.id) exitTextEdit('commit');
    });

    animationLayer.append(content);
    frame.append(animationLayer);

    const moveHandle = document.createElement('button');
    moveHandle.className = 'element-move-handle';
    moveHandle.type = 'button';
    moveHandle.textContent = '↕';
    moveHandle.setAttribute('aria-label', 'Move text box');
    moveHandle.addEventListener('pointerdown', (event) => startMove(event, element, frame, moveHandle), { passive: false });
    frame.append(moveHandle);

    resizeDirections.forEach((direction) => {
      const handle = document.createElement('button');
      handle.className = 'resize-handle';
      handle.type = 'button';
      handle.dataset.direction = direction;
      handle.setAttribute('aria-label', `Resize text box ${direction}`);
      handle.addEventListener('pointerdown', (event) => startResize(event, element, frame, handle), { passive: false });
      frame.append(handle);
    });

    return frame;
  };

  const render = async (value, selection) => {
    const token = ++renderToken;
    const normalized = model.normalize(value);
    await waitForFonts(normalized);
    if (token !== renderToken) return;

    exitTextEdit('commit');
    currentState = normalized;
    selectedElementId = currentState.elements[selection] ? selection : null;
    currentScale = calculateScale();
    document.documentElement.style.backgroundColor = currentState.document.canvas.viewportBackground;
    document.body.style.backgroundColor = currentState.document.canvas.viewportBackground;
    root.replaceChildren();

    currentState.document.sectionOrder.forEach((sectionId) => {
      const section = currentState.sections[sectionId];
      const shell = document.createElement('div');
      shell.className = 'section-shell';
      shell.dataset.sectionId = sectionId;
      shell.style.width = `${currentState.document.canvas.baseWidth * currentScale}px`;
      shell.style.height = `${section.height * currentScale}px`;

      const sectionCanvas = document.createElement('section');
      sectionCanvas.className = 'section-canvas';
      sectionCanvas.dataset.sectionId = sectionId;
      sectionCanvas.setAttribute('aria-label', section.name);
      sectionCanvas.style.height = `${section.height}px`;
      sectionCanvas.style.backgroundColor = section.style.backgroundColor;
      sectionCanvas.style.transform = `scale(${currentScale})`;

      section.elementOrder.forEach((elementId, index) => {
        const element = currentState.elements[elementId];
        if (element) sectionCanvas.append(createElementFrame(element, index));
      });

      sectionCanvas.addEventListener('pointerdown', (event) => {
        if (event.target !== sectionCanvas) return;
        exitTextEdit('commit');
        selectedElementId = null;
        refreshSelectionChrome();
        post({ type: 'green-sage-visual:select', elementId: null });
      });

      shell.append(sectionCanvas);
      root.append(shell);
    });

    refreshSelectionChrome();
    requestAnimationFrame(updateAllOverflowStates);
  };

  window.addEventListener('message', (event) => {
    if (event.source !== window.parent || !isSameOrigin(event.origin)) return;
    if (event.data?.type === 'green-sage-visual:scroll-by') {
      const deltaY = Number(event.data.deltaY);
      if (Number.isFinite(deltaY)) window.scrollBy({ top: deltaY, left: 0, behavior: 'auto' });
      return;
    }
    if (event.data?.type === 'green-sage-visual:state') {
      render(event.data.state, event.data.selectedElementId);
    }
  });

  window.addEventListener('resize', () => {
    if (!currentState || activeTransaction || editingElementId) return;
    render(currentState, selectedElementId);
  });

  root.addEventListener('pointerdown', (event) => {
    if (event.target !== root) return;
    exitTextEdit('commit');
    selectedElementId = null;
    refreshSelectionChrome();
    post({ type: 'green-sage-visual:select', elementId: null });
  });

  root.innerHTML = '<div class="canvas-loading">Preparing text canvas…</div>';
  post({ type: 'green-sage-visual:ready' });
})();
