(() => {
  const SCHEMA_VERSION = 1;
  const STORAGE_KEY = 'green-sage-visual-proof-v1';
  const FONT_CATALOG = Object.freeze([
    'Instrument Serif',
    'Instrument Sans',
    'Cormorant Garamond',
    'Baskervville',
    'Libre Baskerville'
  ]);
  const ALIGNMENTS = Object.freeze(['left', 'center', 'right']);

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const finite = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, finite(value, min)));
  const isHexColor = (value) => /^#[0-9a-f]{6}$/i.test(String(value || ''));
  const createId = (prefix = 'element') => {
    const token = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    return `${prefix}-${token}`;
  };

  const defaultPermissions = Object.freeze({
    editable: true,
    movable: true,
    resizable: true,
    deletable: true,
    locked: false
  });

  const createTextElement = (overrides = {}) => ({
    id: overrides.id || createId('text'),
    sectionId: overrides.sectionId || 'proof-section',
    type: 'text',
    content: overrides.content ?? 'New text',
    frame: {
      x: overrides.frame?.x ?? 45,
      y: overrides.frame?.y ?? 180,
      width: overrides.frame?.width ?? 300,
      height: overrides.frame?.height ?? 76
    },
    rotation: 0,
    opacity: 1,
    style: {
      fontFamily: overrides.style?.fontFamily || 'Instrument Serif',
      fontSize: overrides.style?.fontSize ?? 42,
      fontWeight: 400,
      fontStyle: 'normal',
      color: overrides.style?.color || '#474232',
      textAlign: overrides.style?.textAlign || 'center',
      lineHeight: overrides.style?.lineHeight ?? 1.08,
      letterSpacing: overrides.style?.letterSpacing ?? 0
    },
    responsive: {
      strategy: 'scale',
      anchorX: 'center'
    },
    permissions: {
      ...defaultPermissions,
      ...(overrides.permissions || {})
    }
  });

  const defaults = {
    schemaVersion: SCHEMA_VERSION,
    document: {
      id: 'green-sage-text-proof',
      templateId: 'green-sage',
      title: 'Direct text editing proof',
      canvas: {
        baseWidth: 390,
        maxRenderedWidth: 560,
        viewportBackground: '#F4EFE7'
      },
      sectionOrder: ['proof-section'],
      media: { audio: null }
    },
    sections: {
      'proof-section': {
        id: 'proof-section',
        name: 'Text editing proof',
        height: 844,
        style: {
          backgroundColor: '#EAE2D7'
        },
        elementOrder: ['proof-heading', 'proof-copy']
      }
    },
    elements: {
      'proof-heading': createTextElement({
        id: 'proof-heading',
        content: 'A BEAUTIFUL BEGINNING',
        frame: { x: 35, y: 184, width: 320, height: 92 },
        style: {
          fontFamily: 'Instrument Serif',
          fontSize: 46,
          color: '#474232',
          textAlign: 'center',
          lineHeight: 1.04,
          letterSpacing: 0
        }
      }),
      'proof-copy': createTextElement({
        id: 'proof-copy',
        content: 'Tap once to select. Tap again to place the caret and type.',
        frame: { x: 58, y: 324, width: 274, height: 78 },
        style: {
          fontFamily: 'Instrument Sans',
          fontSize: 15,
          color: '#6B6A54',
          textAlign: 'center',
          lineHeight: 1.5,
          letterSpacing: 0.35
        }
      })
    }
  };

  const normalizeTextElement = (value, id, fallbackSectionId) => {
    const supplied = value && typeof value === 'object' ? value : {};
    const fallback = createTextElement({ id, sectionId: fallbackSectionId });
    const fontFamily = FONT_CATALOG.includes(supplied.style?.fontFamily)
      ? supplied.style.fontFamily
      : fallback.style.fontFamily;
    const textAlign = ALIGNMENTS.includes(supplied.style?.textAlign)
      ? supplied.style.textAlign
      : fallback.style.textAlign;

    return {
      ...fallback,
      ...supplied,
      id,
      sectionId: typeof supplied.sectionId === 'string' ? supplied.sectionId : fallbackSectionId,
      type: 'text',
      content: String(supplied.content ?? fallback.content),
      frame: {
        x: finite(supplied.frame?.x, fallback.frame.x),
        y: finite(supplied.frame?.y, fallback.frame.y),
        width: clamp(supplied.frame?.width ?? fallback.frame.width, 48, 780),
        height: clamp(supplied.frame?.height ?? fallback.frame.height, 32, 1600)
      },
      rotation: 0,
      opacity: 1,
      style: {
        ...fallback.style,
        ...(supplied.style || {}),
        fontFamily,
        fontSize: clamp(supplied.style?.fontSize ?? fallback.style.fontSize, 8, 180),
        fontWeight: 400,
        fontStyle: 'normal',
        color: isHexColor(supplied.style?.color) ? supplied.style.color : fallback.style.color,
        textAlign,
        lineHeight: clamp(supplied.style?.lineHeight ?? fallback.style.lineHeight, 0.7, 3),
        letterSpacing: clamp(supplied.style?.letterSpacing ?? fallback.style.letterSpacing, -10, 30)
      },
      responsive: {
        ...fallback.responsive,
        ...(supplied.responsive || {}),
        strategy: 'scale'
      },
      permissions: {
        ...defaultPermissions,
        ...(supplied.permissions || {})
      }
    };
  };

  const normalize = (value) => {
    const supplied = value && typeof value === 'object' ? clone(value) : clone(defaults);
    const documentValue = supplied.document && typeof supplied.document === 'object' ? supplied.document : {};
    const canvasValue = documentValue.canvas && typeof documentValue.canvas === 'object' ? documentValue.canvas : {};
    const rawSections = supplied.sections && typeof supplied.sections === 'object' ? supplied.sections : {};
    const rawElements = supplied.elements && typeof supplied.elements === 'object' ? supplied.elements : {};
    const requestedOrder = Array.isArray(documentValue.sectionOrder) ? documentValue.sectionOrder : [];
    const sectionOrder = [...new Set([...requestedOrder, ...Object.keys(rawSections)])]
      .filter((id) => rawSections[id] && typeof rawSections[id] === 'object');

    if (!sectionOrder.length) return clone(defaults);

    const sections = {};
    const elements = {};

    sectionOrder.forEach((sectionId) => {
      const rawSection = rawSections[sectionId];
      const rawOrder = Array.isArray(rawSection.elementOrder) ? rawSection.elementOrder : [];
      const sectionElementIds = Object.keys(rawElements)
        .filter((id) => rawElements[id]?.sectionId === sectionId && rawElements[id]?.type === 'text');
      const elementOrder = [...new Set([...rawOrder, ...sectionElementIds])]
        .filter((id) => rawElements[id]?.type === 'text');

      sections[sectionId] = {
        ...rawSection,
        id: sectionId,
        name: String(rawSection.name || 'Untitled section'),
        height: clamp(rawSection.height ?? 844, 180, 2200),
        style: {
          ...(rawSection.style || {}),
          backgroundColor: isHexColor(rawSection.style?.backgroundColor)
            ? rawSection.style.backgroundColor
            : '#EAE2D7'
        },
        elementOrder
      };

      elementOrder.forEach((elementId) => {
        elements[elementId] = normalizeTextElement(rawElements[elementId], elementId, sectionId);
      });
    });

    return {
      ...supplied,
      schemaVersion: SCHEMA_VERSION,
      document: {
        ...defaults.document,
        ...documentValue,
        canvas: {
          ...defaults.document.canvas,
          ...canvasValue,
          baseWidth: 390,
          maxRenderedWidth: clamp(canvasValue.maxRenderedWidth ?? 560, 390, 720),
          viewportBackground: isHexColor(canvasValue.viewportBackground)
            ? canvasValue.viewportBackground
            : defaults.document.canvas.viewportBackground
        },
        sectionOrder,
        media: {
          ...defaults.document.media,
          ...(documentValue.media || {}),
          audio: null
        }
      },
      sections,
      elements
    };
  };

  const load = (storage = globalThis.localStorage) => {
    try {
      const saved = storage?.getItem(STORAGE_KEY);
      return normalize(saved ? JSON.parse(saved) : defaults);
    } catch {
      return clone(defaults);
    }
  };

  globalThis.GreenSageVisualDocument = Object.freeze({
    schemaVersion: SCHEMA_VERSION,
    storageKey: STORAGE_KEY,
    fontCatalog: FONT_CATALOG,
    defaults,
    clone,
    cloneDefaults: () => clone(defaults),
    createId,
    createTextElement,
    normalize,
    load
  });
})();
