(() => {
  const model = globalThis.GreenSageVisualDocument;
  if (!model) return;
  const root = document.getElementById('canvasRoot');
  const ORIGIN = window.location.origin === 'null' ? '*' : window.location.origin;
  const sameOrigin = (origin) => origin === window.location.origin || (origin === 'null' && window.location.origin === 'null');
  const resizeDirections = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
  const post = (message) => window.parent.postMessage(message, ORIGIN);
  let state = null;
  let selectedSectionId = null;
  let selectedElementId = null;
  let backgroundEditSectionId = null;
  let editingElementId = null;
  let assetUrls = {};
  let scale = 1;
  let renderToken = 0;
  let transaction = null;
  let gesture = null;
  let lastTextTap = null;

  const frameNode = (id) => root.querySelector(`[data-element-id="${CSS.escape(id)}"]`);
  const sectionNode = (id) => root.querySelector(`[data-section-id="${CSS.escape(id)}"]`);
  const getAssetUrl = (item) => item.assetKind === 'upload' ? assetUrls[item.assetId] : model.getTemplateAsset(item.assetId)?.url;
  const calculateScale = () => state ? Math.min(window.innerWidth / state.document.canvas.baseWidth, state.document.canvas.maxRenderedWidth / state.document.canvas.baseWidth) : 1;
  const canPointer = (event) => event.isPrimary && (event.pointerType !== 'mouse' || event.button === 0);

  const sendStart = (targetType, targetId, label) => {
    transaction = { id: model.createId('transaction'), targetType, targetId, label };
    post({ type: 'green-sage-visual:transaction-start', transactionId: transaction.id, targetType, targetId, label });
  };
  const sendPatch = (patch) => { if (transaction) post({ type: 'green-sage-visual:transaction-patch', transactionId: transaction.id, targetType: transaction.targetType, targetId: transaction.targetId, patch, label: transaction.label }); };
  const sendCommit = () => { if (!transaction) return; const active = transaction; transaction = null; post({ type: 'green-sage-visual:transaction-commit', transactionId: active.id, targetType: active.targetType, targetId: active.targetId }); };

  const finishGesture = (active, event) => {
    if (gesture !== active || (event?.pointerId != null && event.pointerId !== active.pointerId)) return;
    // Clear ownership before releasing capture, which can itself signal termination.
    gesture = null;
    active.removeListeners.forEach((remove) => remove());
    document.documentElement.classList.remove('is-manipulating'); clearGuides();
    try { if (active.target.hasPointerCapture(active.pointerId)) active.target.releasePointerCapture(active.pointerId); } catch {}
    sendCommit();
    if (event?.type === 'pointerup') active.onPointerUp?.(event);
    else lastTextTap = null;
  };

  const trackGesture = (event, moveTarget, move, onPointerUp = null) => {
    const active = { pointerId: event.pointerId, target: event.currentTarget, onPointerUp, removeListeners: [] };
    gesture = active; document.documentElement.classList.add('is-manipulating');
    const listen = (target, type, handler, capture = false) => {
      target.addEventListener(type, handler, capture);
      active.removeListeners.push(() => target.removeEventListener(type, handler, capture));
    };
    const end = (nextEvent) => finishGesture(active, nextEvent);
    listen(moveTarget, 'pointermove', (nextEvent) => { if (gesture === active && nextEvent.pointerId === active.pointerId) move(nextEvent); });
    listen(moveTarget, 'pointerup', end);
    listen(moveTarget, 'pointercancel', end);
    listen(document, 'lostpointercapture', (nextEvent) => {
      if (nextEvent.target === active.target || (!active.target.isConnected && nextEvent.target === document)) end(nextEvent);
    }, true);
    listen(window, 'blur', end);
    listen(window, 'pagehide', end);
    listen(document, 'visibilitychange', (nextEvent) => { if (document.hidden) end(nextEvent); });

    let captured = false;
    try { active.target.setPointerCapture(active.pointerId); captured = active.target.hasPointerCapture(active.pointerId); } catch { /* Use scoped termination listeners below. */ }
    if (!captured && gesture === active) {
      listen(document, 'pointerup', end, true);
      listen(document, 'pointercancel', end, true);
      // Without capture, release outside the iframe may never reach this document.
      listen(document, 'pointerout', (nextEvent) => { if (!nextEvent.relatedTarget) end(nextEvent); });
    }
  };

  const isOutside = (item) => {
    const section = state.sections[item.sectionId];
    return item.frame.x < 0 || item.frame.y < 0 || item.frame.x + item.frame.width > 390 || item.frame.y + item.frame.height > section.height;
  };
  const textExceedsFrame = (frame, content) => {
    if (!content?.textContent) return false;
    const tolerance = 1;
    const range = document.createRange();
    range.selectNodeContents(content);
    const lineRects = [...range.getClientRects()].filter((rect) => rect.width || rect.height);
    const frameRect = frame.getBoundingClientRect();
    const visualOverflow = lineRects.some((rect) => rect.left < frameRect.left - tolerance || rect.top < frameRect.top - tolerance || rect.right > frameRect.right + tolerance || rect.bottom > frameRect.bottom + tolerance);
    const layoutOverflow = content.scrollWidth > content.clientWidth + tolerance || content.scrollHeight > content.clientHeight + tolerance;
    return visualOverflow || layoutOverflow;
  };
  const updateOverflow = (item) => {
    const frame = frameNode(item.id); if (!frame) return;
    frame.classList.toggle('is-outside', isOutside(item));
    if (item.type === 'text') {
      const content = frame.querySelector('.element-content');
      const overflow = textExceedsFrame(frame, content);
      frame.classList.toggle('has-text-overflow', overflow);
      let warning = frame.querySelector(':scope > .text-overflow-warning');
      if (overflow && !warning) { warning = document.createElement('span'); warning.className = 'text-overflow-warning'; warning.textContent = 'Text exceeds frame'; frame.append(warning); }
      if (warning) warning.hidden = !overflow;
    }
    const canvas = frame.closest('.section-canvas'); canvas?.classList.toggle('has-overflow', state.sections[item.sectionId].elementOrder.some((id) => isOutside(state.elements[id])));
  };

  const clearGuides = () => root.querySelectorAll('.snap-guide, .safe-margin-guides').forEach((node) => node.remove());
  const drawGuides = (sectionId, guides) => {
    clearGuides(); const canvas = sectionNode(sectionId); if (!canvas) return;
    const safe = document.createElement('div'); safe.className = 'safe-margin-guides'; safe.style.inset = `${state.document.canvas.safeMargin}px`; canvas.append(safe);
    guides.forEach((guide) => { const node = document.createElement('span'); node.className = `snap-guide is-${guide.axis}`; node.style[guide.axis === 'x' ? 'left' : 'top'] = `${guide.value}px`; canvas.append(node); });
  };

  const snapFrame = (item, nextFrame) => {
    const threshold = 5; const section = state.sections[item.sectionId]; const margin = state.document.canvas.safeMargin;
    const xCandidates = [margin, 195, 390 - margin]; const yCandidates = [margin, section.height / 2, section.height - margin];
    section.elementOrder.filter((id) => id !== item.id).forEach((id) => {
      const frame = state.elements[id].frame; xCandidates.push(frame.x, frame.x + frame.width / 2, frame.x + frame.width); yCandidates.push(frame.y, frame.y + frame.height / 2, frame.y + frame.height);
    });
    const xPoints = [{ key: 'left', value: nextFrame.x }, { key: 'center', value: nextFrame.x + nextFrame.width / 2 }, { key: 'right', value: nextFrame.x + nextFrame.width }];
    const yPoints = [{ key: 'top', value: nextFrame.y }, { key: 'middle', value: nextFrame.y + nextFrame.height / 2 }, { key: 'bottom', value: nextFrame.y + nextFrame.height }];
    const guides = []; let bestX = null; let bestY = null;
    xPoints.forEach((point) => xCandidates.forEach((candidate) => { const distance = Math.abs(point.value - candidate); if (distance <= threshold && (!bestX || distance < bestX.distance)) bestX = { point, candidate, distance }; }));
    yPoints.forEach((point) => yCandidates.forEach((candidate) => { const distance = Math.abs(point.value - candidate); if (distance <= threshold && (!bestY || distance < bestY.distance)) bestY = { point, candidate, distance }; }));
    if (bestX) { nextFrame.x += bestX.candidate - bestX.point.value; guides.push({ axis: 'x', value: bestX.candidate }); }
    if (bestY) { nextFrame.y += bestY.candidate - bestY.point.value; guides.push({ axis: 'y', value: bestY.candidate }); }
    return { frame: nextFrame, guides };
  };

  const applyFrame = (item, frame, nextFrame, guides = []) => {
    item.frame = { ...item.frame, ...nextFrame };
    Object.assign(frame.style, { left: `${item.frame.x}px`, top: `${item.frame.y}px`, width: `${item.frame.width}px`, height: `${item.frame.height}px` });
    updateOverflow(item); drawGuides(item.sectionId, guides); sendPatch({ frame: item.frame });
  };

  const startMove = (event, item, frame) => {
    if (!canPointer(event) || gesture || item.permissions.locked || !item.permissions.movable) return;
    event.preventDefault(); event.stopPropagation(); exitEdit();
    const start = { x: event.clientX, y: event.clientY, frame: { ...item.frame }, moved: false };
    const move = (nextEvent) => {
      if (nextEvent.pointerId !== event.pointerId) return;
      const dx = nextEvent.clientX - start.x; const dy = nextEvent.clientY - start.y;
      if (!start.moved && Math.hypot(dx, dy) < 4) return;
      if (!start.moved) { start.moved = true; lastTextTap = null; sendStart('element', item.id, 'Move element'); }
      const next = { ...start.frame, x: start.frame.x + dx / scale, y: start.frame.y + dy / scale }; const snapped = snapFrame(item, next); applyFrame(item, frame, snapped.frame, snapped.guides);
    };
    trackGesture(event, frame, move, (nextEvent) => {
      if (!start.moved && item.type === 'text') {
        const now = performance.now(); const previous = lastTextTap;
        if (previous?.id === item.id && now - previous.time < 420 && Math.hypot(nextEvent.clientX - previous.x, nextEvent.clientY - previous.y) < 28) {
          lastTextTap = null; const content = frame.querySelector('.text-content'); if (content) enterEdit(item, frame, content, nextEvent);
        } else lastTextTap = { id: item.id, time: now, x: nextEvent.clientX, y: nextEvent.clientY };
      }
    });
  };

  const startResize = (event, item, frame, direction) => {
    if (!canPointer(event) || gesture || item.permissions.locked || !item.permissions.resizable) return;
    event.preventDefault(); event.stopPropagation(); exitEdit(); sendStart('element', item.id, 'Resize element');
    const start = { x: event.clientX, y: event.clientY, frame: { ...item.frame } };
    const move = (nextEvent) => {
      if (nextEvent.pointerId !== event.pointerId) return;
      const dx = (nextEvent.clientX - start.x) / scale; const dy = (nextEvent.clientY - start.y) / scale; const next = { ...start.frame };
      if (direction.includes('e')) next.width = Math.max(40, start.frame.width + dx);
      if (direction.includes('s')) next.height = Math.max(32, start.frame.height + dy);
      if (direction.includes('w')) { next.width = Math.max(40, start.frame.width - dx); next.x = start.frame.x + start.frame.width - next.width; }
      if (direction.includes('n')) { next.height = Math.max(32, start.frame.height - dy); next.y = start.frame.y + start.frame.height - next.height; }
      applyFrame(item, frame, next);
    };
    trackGesture(event, frame, move);
  };

  const startBackgroundReframe = (event, section, background, image) => {
    if (!canPointer(event) || gesture) return;
    event.preventDefault(); event.stopPropagation(); exitEdit(); sendStart('section', section.id, 'Reframe background');
    const bounds = background.getBoundingClientRect();
    const start = { x: event.clientX, y: event.clientY, focalX: section.background.focalX, focalY: section.background.focalY };
    const move = (nextEvent) => {
      if (nextEvent.pointerId !== event.pointerId) return;
      const focalX = Math.max(0, Math.min(100, start.focalX - ((nextEvent.clientX - start.x) / Math.max(bounds.width * .55, 1)) * 100));
      const focalY = Math.max(0, Math.min(100, start.focalY - ((nextEvent.clientY - start.y) / Math.max(bounds.height * .55, 1)) * 100));
      section.background.focalX = focalX; section.background.focalY = focalY; image.style.objectPosition = `${focalX}% ${focalY}%`;
      sendPatch({ background: { focalX, focalY } });
    };
    trackGesture(event, background, move);
  };

  const placeCaret = (content, x, y) => {
    content.focus({ preventScroll: true }); const selection = getSelection(); if (!selection) return; let range;
    const position = document.caretPositionFromPoint?.(x, y);
    if (position && content.contains(position.offsetNode)) { range = document.createRange(); range.setStart(position.offsetNode, position.offset); range.collapse(true); }
    else { const legacy = document.caretRangeFromPoint?.(x, y); if (legacy && content.contains(legacy.commonAncestorContainer)) range = legacy; }
    if (!range) { range = document.createRange(); range.selectNodeContents(content); range.collapse(false); }
    selection.removeAllRanges(); selection.addRange(range);
  };

  const exitEdit = () => {
    if (!editingElementId) return;
    const frame = frameNode(editingElementId); const content = frame?.querySelector('.element-content'); editingElementId = null;
    frame?.classList.remove('is-editing'); if (content) { content.setAttribute('contenteditable', 'false'); content.blur(); }
    if (transaction?.label === 'Edit text') sendCommit();
  };
  const enterEdit = (item, frame, content, event) => {
    if (item.permissions.locked || !item.permissions.editable) return;
    exitEdit(); renderToken += 1; editingElementId = item.id; frame.classList.add('is-editing'); content.setAttribute('contenteditable', 'plaintext-only'); content.spellcheck = true;
    sendStart('element', item.id, 'Edit text'); placeCaret(content, event.clientX, event.clientY);
  };

  const syncEditableContent = (item) => {
    const content = frameNode(item.id)?.querySelector('.text-content');
    if (!content) { exitEdit(); render(); return; }
    if (content.innerText.replace(/\r/g, '') === item.content) return;
    const selection = getSelection();
    const offset = (node, position) => {
      const range = document.createRange(); range.selectNodeContents(content); range.setEnd(node, position); return range.toString().length;
    };
    const inside = selection && content.contains(selection.anchorNode) && content.contains(selection.focusNode);
    const anchor = inside ? offset(selection.anchorNode, selection.anchorOffset) : 0;
    const focus = inside ? offset(selection.focusNode, selection.focusOffset) : 0;
    content.textContent = item.content;
    if (inside) {
      const node = content.firstChild || content;
      selection.setBaseAndExtent(node, Math.min(anchor, item.content.length), node, Math.min(focus, item.content.length));
    }
  };

  const createTextContent = (item, frame) => {
    const elementId = item.id;
    const content = document.createElement('div'); content.className = 'element-content text-content'; content.textContent = item.content;
    Object.assign(content.style, { fontFamily: model.fontStack(item.style.fontFamily), fontSize: `${item.style.fontSize}px`, fontWeight: item.style.fontWeight, fontStyle: item.style.fontStyle, color: item.style.color, textAlign: item.style.textAlign, lineHeight: item.style.lineHeight, letterSpacing: `${item.style.letterSpacing}px` });
    content.addEventListener('pointerdown', (event) => {
      if (!canPointer(event) || editingElementId === elementId) return;
      if (selectedElementId !== elementId) { event.preventDefault(); event.stopPropagation(); lastTextTap = { id: elementId, time: performance.now(), x: event.clientX, y: event.clientY }; post({ type: 'green-sage-visual:select-element', elementId }); }
    });
    content.addEventListener('input', () => {
      if (editingElementId !== elementId) return;
      const current = state.elements[elementId];
      if (current?.type !== 'text') { exitEdit(); return; }
      current.content = content.innerText.replace(/\r/g, '');
      requestAnimationFrame(() => { const latest = state.elements[elementId]; if (editingElementId === elementId && latest?.type === 'text') updateOverflow(latest); });
      sendPatch({ content: current.content });
    });
    content.addEventListener('paste', (event) => { event.preventDefault(); const text = event.clipboardData?.getData('text/plain') || ''; document.execCommand('insertText', false, text); });
    content.addEventListener('blur', () => { if (editingElementId === elementId) exitEdit(); });
    return content;
  };

  const setImageSource = (container, image, asset) => {
    const url = getAssetUrl(asset) || '';
    if (image.getAttribute('src') === url) return;
    if (asset.assetKind === 'upload') {
      const showUnavailable = (missing) => {
        container.classList.toggle('asset-unavailable', missing);
        let message = container.querySelector(':scope > .missing-asset-message');
        if (missing && !message) { message = document.createElement('span'); message.className = 'missing-asset-message'; message.textContent = 'Image unavailable'; container.append(message); }
        if (!missing) message?.remove();
      };
      image.onload = () => { if (url && image.getAttribute('src') === url) showUnavailable(false); };
      image.onerror = () => { if (image.getAttribute('src') === url && image.complete && !image.naturalWidth) showUnavailable(true); };
      showUnavailable(!url);
    }
    if (url) image.src = url; else image.removeAttribute('src');
  };

  const syncUploadSources = () => {
    // Asset recovery must not rerender an active contenteditable node.
    Object.values(state.elements).forEach((item) => {
      if (item.assetKind !== 'upload') return;
      const content = frameNode(item.id)?.querySelector('.image-content'); const image = content?.querySelector('img');
      if (image) setImageSource(content, image, item);
    });
    Object.values(state.sections).forEach((section) => {
      if (section.background.kind !== 'image' || section.background.assetKind !== 'upload') return;
      const background = sectionNode(section.id)?.querySelector(':scope > .section-background'); const image = background?.querySelector('img');
      if (image) setImageSource(background, image, section.background);
    });
  };

  const createImageContent = (item) => {
    const content = document.createElement('div'); content.className = 'element-content image-content';
    const image = document.createElement('img'); image.alt = item.alt || ''; image.draggable = false;
    Object.assign(image.style, { objectFit: item.crop.fit, objectPosition: `${item.crop.focalX}% ${item.crop.focalY}%`, transform: `scale(${item.crop.zoom})` }); content.append(image); setImageSource(content, image, item);
    content.addEventListener('pointerdown', (event) => { if (!canPointer(event)) return; if (selectedElementId !== item.id) { event.preventDefault(); event.stopPropagation(); post({ type: 'green-sage-visual:select-element', elementId: item.id }); } });
    return content;
  };

  const createElement = (item) => {
    const frame = document.createElement('div'); frame.className = 'element-frame'; frame.dataset.elementId = item.id; frame.dataset.elementType = item.type;
    frame.classList.toggle('is-selected', selectedElementId === item.id); frame.classList.toggle('is-locked', item.permissions.locked);
    Object.assign(frame.style, { left: `${item.frame.x}px`, top: `${item.frame.y}px`, width: `${item.frame.width}px`, height: `${item.frame.height}px`, opacity: item.opacity, rotate: `${item.rotation}deg` });
    const animation = document.createElement('div'); animation.className = 'element-animation-layer'; animation.append(item.type === 'text' ? createTextContent(item, frame) : createImageContent(item)); frame.append(animation);
    frame.addEventListener('pointerdown', (event) => {
      if (!canPointer(event) || event.target.closest('.resize-handle') || editingElementId === item.id) return;
      if (selectedElementId === item.id) startMove(event, item, frame);
    });
    if (selectedElementId === item.id && !item.permissions.locked) {
      if (item.permissions.resizable) resizeDirections.forEach((direction) => { const handle = document.createElement('button'); handle.type = 'button'; handle.className = 'resize-handle'; handle.dataset.direction = direction; handle.setAttribute('aria-label', `Resize ${direction}`); handle.addEventListener('pointerdown', (event) => startResize(event, item, frame, direction)); frame.append(handle); });
    }
    return frame;
  };

  const createSection = (section) => {
    const editingBackground = backgroundEditSectionId === section.id && section.background.kind === 'image';
    const shell = document.createElement('div'); shell.className = 'section-shell'; shell.style.width = `${390 * scale}px`; shell.style.height = `${section.height * scale}px`;
    const canvas = document.createElement('section'); canvas.className = 'section-canvas'; canvas.dataset.sectionId = section.id; canvas.classList.toggle('is-section-selected', section.id === selectedSectionId && !selectedElementId); canvas.classList.toggle('is-background-editing', editingBackground); canvas.style.height = `${section.height}px`; canvas.style.transform = `scale(${scale})`; canvas.style.background = section.background.color;
    const background = document.createElement('div'); background.className = 'section-background'; background.classList.toggle('is-editing', editingBackground);
    if (section.background.kind === 'image') { const image = document.createElement('img'); image.alt = ''; Object.assign(image.style, { objectPosition: `${section.background.focalX}% ${section.background.focalY}%`, transform: `scale(${section.background.zoom})` }); background.append(image); setImageSource(background, image, section.background); if (editingBackground) background.addEventListener('pointerdown', (event) => startBackgroundReframe(event, section, background, image)); }
    canvas.append(background);
    section.elementOrder.forEach((id, index) => { const item = state.elements[id]; if (!item) return; const node = createElement(item); node.style.zIndex = String(index + 1); canvas.append(node); });
    canvas.addEventListener('pointerdown', (event) => { if (event.target !== canvas && event.target !== background) return; exitEdit(); post({ type: 'green-sage-visual:select-section', sectionId: section.id }); });
    if (editingBackground) { const indicator = document.createElement('span'); indicator.className = 'background-edit-indicator'; indicator.textContent = 'Drag to reposition'; canvas.append(indicator); }
    shell.append(canvas); return shell;
  };

  const render = async () => {
    if (!state || editingElementId) return; const token = ++renderToken; const scrollY = window.scrollY; scale = calculateScale();
    const fonts = Object.values(state.elements).filter((item) => item.type === 'text').map((item) => model.loadFont(item.style.fontFamily, { document, weight: item.style.fontWeight, style: item.style.fontStyle, size: item.style.fontSize, sample: item.content }));
    await Promise.allSettled(fonts); await document.fonts?.ready; if (token !== renderToken) return;
    root.replaceChildren(...state.document.sectionOrder.map((id) => createSection(state.sections[id])));
    requestAnimationFrame(() => requestAnimationFrame(() => { if (token !== renderToken) return; window.scrollTo(0, scrollY); Object.values(state.elements).forEach(updateOverflow); }));
  };

  window.addEventListener('message', (event) => {
    if (event.source !== window.parent || !sameOrigin(event.origin) || !event.data) return;
    if (event.data.type === 'green-sage-visual:state') {
      const wasEditing = editingElementId; state = model.normalize(event.data.state); selectedSectionId = state.sections[event.data.selectedSectionId] ? event.data.selectedSectionId : state.document.sectionOrder[0]; selectedElementId = state.elements[event.data.selectedElementId] ? event.data.selectedElementId : null; backgroundEditSectionId = state.sections[event.data.backgroundEditSectionId]?.background.kind === 'image' ? event.data.backgroundEditSectionId : null; assetUrls = event.data.assetUrls || {};
      if (wasEditing && state.elements[wasEditing]?.type === 'text' && transaction?.label === 'Edit text') {
        syncUploadSources(); syncEditableContent(state.elements[wasEditing]);
        return;
      }
      exitEdit(); transaction = null; render();
    }
    if (event.data.type === 'green-sage-visual:scroll-by') window.scrollBy({ top: Number(event.data.deltaY) || 0, behavior: 'auto' });
  });
  window.addEventListener('resize', render);
  document.addEventListener('pointerdown', () => post({ type: 'green-sage-visual:canvas-interaction' }), true);
  document.addEventListener('pointerdown', (event) => { if (!event.target.closest('.element-frame')) { lastTextTap = null; exitEdit(); } });
  document.addEventListener('keydown', (event) => {
    if (!['Delete', 'Backspace'].includes(event.key) || editingElementId || event.target.closest('input, textarea, [contenteditable="true"], [contenteditable="plaintext-only"]')) return;
    const selected = state?.elements[selectedElementId]; if (!selected || selected.permissions.locked || !selected.permissions.deletable) return;
    event.preventDefault(); post({ type: 'green-sage-visual:delete-selected' });
  });
  root.innerHTML = '<div class="canvas-loading">Preparing your invitation canvas…</div>';
  post({ type: 'green-sage-visual:ready' });
})();
