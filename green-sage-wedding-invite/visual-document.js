(() => {
  const SCHEMA_VERSION = 1;
  const STORAGE_KEY = 'green-sage-visual-proof-v1';
  const FONT_CATALOG = Object.freeze([
    { name: 'Prata', displayName: 'Prata', cssFamily: 'Prata', category: 'serif', weights: [400], styles: ['normal'], fallback: 'Georgia, serif' },
    { name: 'Instrument Serif', displayName: 'Instrument Serif', cssFamily: 'Instrument Serif', category: 'serif', weights: [400], styles: ['normal', 'italic'], fallback: 'Georgia, serif' },
    { name: 'Cormorant Garamond', displayName: 'Cormorant Garamond', cssFamily: 'Cormorant Garamond', category: 'serif', weights: [400, 600, 700], styles: ['normal', 'italic'], fallback: 'Garamond, Georgia, serif' },
    { name: 'Libre Baskerville', displayName: 'Libre Baskerville', cssFamily: 'Libre Baskerville', category: 'serif', weights: [400, 700], styles: ['normal', 'italic'], italicWeights: [400], fallback: 'Georgia, serif' },
    { name: 'Baskervville', displayName: 'Baskervville', cssFamily: 'Baskervville', category: 'serif', weights: [400], styles: ['normal', 'italic'], fallback: 'Georgia, serif' },
    { name: 'Playfair Display', displayName: 'Playfair Display', cssFamily: 'Playfair Display', category: 'serif', weights: [400, 600, 700], styles: ['normal', 'italic'], fallback: 'Georgia, serif' },
    { name: 'DM Serif Display', displayName: 'DM Serif Display', cssFamily: 'DM Serif Display', category: 'serif', weights: [400], styles: ['normal', 'italic'], fallback: 'Georgia, serif' },
    { name: 'Bodoni Moda', displayName: 'Bodoni Moda', cssFamily: 'Bodoni Moda', category: 'serif', weights: [400, 600, 700], styles: ['normal', 'italic'], fallback: 'Didot, Georgia, serif' },
    { name: 'EB Garamond', displayName: 'EB Garamond', cssFamily: 'EB Garamond', category: 'serif', weights: [400, 600, 700], styles: ['normal', 'italic'], fallback: 'Garamond, Georgia, serif' },
    { name: 'Lora', displayName: 'Lora', cssFamily: 'Lora', category: 'serif', weights: [400, 600, 700], styles: ['normal', 'italic'], fallback: 'Georgia, serif' },
    { name: 'Crimson Pro', displayName: 'Crimson Pro', cssFamily: 'Crimson Pro', category: 'serif', weights: [400, 600, 700], styles: ['normal', 'italic'], fallback: 'Georgia, serif' },
    { name: 'Marcellus', displayName: 'Marcellus', cssFamily: 'Marcellus', category: 'serif', weights: [400], styles: ['normal'], fallback: 'Georgia, serif' },
    { name: 'Cinzel', displayName: 'Cinzel', cssFamily: 'Cinzel', category: 'serif', weights: [400, 600, 700], styles: ['normal'], fallback: 'Georgia, serif' },
    { name: 'Instrument Sans', displayName: 'Instrument Sans', cssFamily: 'Instrument Sans', category: 'sans', weights: [400, 600, 700], styles: ['normal', 'italic'], fallback: 'Arial, sans-serif' },
    { name: 'Manrope', displayName: 'Manrope', cssFamily: 'Manrope', category: 'sans', weights: [400, 600, 700], styles: ['normal'], fallback: 'Arial, sans-serif' },
    { name: 'Inter', displayName: 'Inter', cssFamily: 'Inter', category: 'sans', weights: [400, 600, 700], styles: ['normal', 'italic'], fallback: 'Arial, sans-serif' },
    { name: 'Montserrat', displayName: 'Montserrat', cssFamily: 'Montserrat', category: 'sans', weights: [400, 600, 700], styles: ['normal', 'italic'], fallback: 'Arial, sans-serif' },
    { name: 'Poppins', displayName: 'Poppins', cssFamily: 'Poppins', category: 'sans', weights: [400, 600, 700], styles: ['normal', 'italic'], fallback: 'Arial, sans-serif' },
    { name: 'Raleway', displayName: 'Raleway', cssFamily: 'Raleway', category: 'sans', weights: [400, 600, 700], styles: ['normal', 'italic'], fallback: 'Arial, sans-serif' },
    { name: 'Work Sans', displayName: 'Work Sans', cssFamily: 'Work Sans', category: 'sans', weights: [400, 600, 700], styles: ['normal', 'italic'], fallback: 'Arial, sans-serif' },
    { name: 'Great Vibes', displayName: 'Great Vibes', cssFamily: 'Great Vibes', category: 'script', weights: [400], styles: ['normal'], fallback: 'cursive' },
    { name: 'Allura', displayName: 'Allura', cssFamily: 'Allura', category: 'script', weights: [400], styles: ['normal'], fallback: 'cursive' },
    { name: 'Parisienne', displayName: 'Parisienne', cssFamily: 'Parisienne', category: 'script', weights: [400], styles: ['normal'], fallback: 'cursive' },
    { name: 'Sacramento', displayName: 'Sacramento', cssFamily: 'Sacramento', category: 'script', weights: [400], styles: ['normal'], fallback: 'cursive' },
    { name: 'Caveat', displayName: 'Caveat', cssFamily: 'Caveat', category: 'script', weights: [400, 600, 700], styles: ['normal'], fallback: 'cursive' }
  ].map((font) => Object.freeze({
    ...font,
    weights: Object.freeze(font.weights),
    styles: Object.freeze(font.styles),
    italicWeights: Object.freeze(font.italicWeights || font.weights)
  })));
  const FONT_BY_NAME = Object.freeze(Object.fromEntries(FONT_CATALOG.map((font) => [font.name, font])));
  const ALIGNMENTS = Object.freeze(['left', 'center', 'right']);

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const finite = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, finite(value, min)));
  const isHexColor = (value) => /^#[0-9a-f]{6}$/i.test(String(value || ''));
  const createId = (prefix = 'element') => {
    const token = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    return `${prefix}-${token}`;
  };
  const getFont = (name) => FONT_BY_NAME[name] || FONT_BY_NAME['Instrument Serif'];
  const resolveFontVariant = (name, weight = 400, style = 'normal') => {
    const font = getFont(name);
    const resolvedStyle = font.styles.includes(style) ? style : 'normal';
    const availableWeights = resolvedStyle === 'italic' ? font.italicWeights : font.weights;
    const requestedWeight = Number(weight);
    const resolvedWeight = availableWeights.includes(requestedWeight) ? requestedWeight : availableWeights[0];
    return { font, weight: resolvedWeight, style: resolvedStyle };
  };
  const fontStack = (name) => {
    const font = getFont(name);
    return `"${font.cssFamily}", ${font.fallback}`;
  };
  const fontStylesheetUrl = (name, weight = 400, style = 'normal') => {
    const { font, weight: supportedWeight, style: supportedStyle } = resolveFontVariant(name, weight, style);
    const family = font.cssFamily.replaceAll(' ', '+');
    if (font.weights.length === 1 && font.styles.length === 1) {
      return `https://fonts.googleapis.com/css2?family=${family}&display=swap`;
    }
    if (font.styles.includes('italic')) {
      const italic = supportedStyle === 'italic' ? 1 : 0;
      return `https://fonts.googleapis.com/css2?family=${family}:ital,wght@${italic},${supportedWeight}&display=swap`;
    }
    return `https://fonts.googleapis.com/css2?family=${family}:wght@${supportedWeight}&display=swap`;
  };
  const FONT_LOADS = new Map();
  const loadFont = async (name, options = {}) => {
    const { font, weight, style } = resolveFontVariant(name, options.weight, options.style);
    const targetDocument = options.document || globalThis.document;
    if (!targetDocument?.head) return { font, weight, style };

    const url = fontStylesheetUrl(font.name, weight, style);
    if (!FONT_LOADS.has(url)) {
      const existingLink = [...targetDocument.querySelectorAll('link[data-visual-font-url]')]
        .find((link) => link.dataset.visualFontUrl === url);
      const stylesheetReady = existingLink
        ? Promise.resolve()
        : new Promise((resolve) => {
          const link = targetDocument.createElement('link');
          const timeout = globalThis.setTimeout(resolve, 6000);
          const finish = () => {
            globalThis.clearTimeout(timeout);
            resolve();
          };
          link.rel = 'stylesheet';
          link.href = url;
          link.dataset.visualFont = font.name;
          link.dataset.visualFontUrl = url;
          link.addEventListener('load', finish, { once: true });
          link.addEventListener('error', finish, { once: true });
          targetDocument.head.append(link);
        });
      FONT_LOADS.set(url, stylesheetReady);
    }

    await FONT_LOADS.get(url);
    if (targetDocument.fonts?.load) {
      const size = clamp(options.size ?? 18, 8, 180);
      const descriptor = `${style === 'italic' ? 'italic ' : ''}${weight} ${size}px "${font.cssFamily}"`;
      await targetDocument.fonts.load(descriptor, String(options.sample || 'Aa'));
    }
    return { font, weight, style };
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
      fontWeight: overrides.style?.fontWeight ?? 400,
      fontStyle: overrides.style?.fontStyle || 'normal',
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
    const fontFamily = FONT_BY_NAME[supplied.style?.fontFamily]
      ? supplied.style.fontFamily
      : fallback.style.fontFamily;
    const requestedWeight = Math.round(finite(supplied.style?.fontWeight, fallback.style.fontWeight));
    const variant = resolveFontVariant(fontFamily, requestedWeight, supplied.style?.fontStyle);
    const fontWeight = variant.weight;
    const fontStyle = variant.style;
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
        fontWeight,
        fontStyle,
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
    fontCategories: Object.freeze([
      Object.freeze({ id: 'serif', label: 'Serif' }),
      Object.freeze({ id: 'sans', label: 'Sans serif' }),
      Object.freeze({ id: 'script', label: 'Script' })
    ]),
    getFont,
    resolveFontVariant,
    fontStack,
    fontStylesheetUrl,
    loadFont,
    defaults,
    clone,
    cloneDefaults: () => clone(defaults),
    createId,
    createTextElement,
    normalize,
    load
  });
})();
