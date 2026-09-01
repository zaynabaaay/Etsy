(() => {
  const SCHEMA_VERSION = 2;
  const STORAGE_KEY = 'green-sage-visual-proof-v1';
  const FONT_CATALOG = Object.freeze([
    { name: 'Prata', displayName: 'Prata', cssFamily: 'Prata', category: 'serif', display: true, weights: [400], styles: ['normal'], fallback: 'Georgia, serif' },
    { name: 'Instrument Serif', displayName: 'Instrument Serif', cssFamily: 'Instrument Serif', category: 'serif', weights: [400], styles: ['normal', 'italic'], fallback: 'Georgia, serif' },
    { name: 'Cormorant Garamond', displayName: 'Cormorant Garamond', cssFamily: 'Cormorant Garamond', category: 'serif', weights: [400, 600, 700], styles: ['normal', 'italic'], fallback: 'Garamond, Georgia, serif' },
    { name: 'Libre Baskerville', displayName: 'Libre Baskerville', cssFamily: 'Libre Baskerville', category: 'serif', weights: [400, 700], styles: ['normal', 'italic'], italicWeights: [400], fallback: 'Georgia, serif' },
    { name: 'Baskervville', displayName: 'Baskervville', cssFamily: 'Baskervville', category: 'serif', weights: [400], styles: ['normal', 'italic'], fallback: 'Georgia, serif' },
    { name: 'Playfair Display', displayName: 'Playfair Display', cssFamily: 'Playfair Display', category: 'serif', display: true, weights: [400, 600, 700], styles: ['normal', 'italic'], fallback: 'Georgia, serif' },
    { name: 'DM Serif Display', displayName: 'DM Serif Display', cssFamily: 'DM Serif Display', category: 'serif', display: true, weights: [400], styles: ['normal', 'italic'], fallback: 'Georgia, serif' },
    { name: 'Bodoni Moda', displayName: 'Bodoni Moda', cssFamily: 'Bodoni Moda', category: 'serif', display: true, weights: [400, 600, 700], styles: ['normal', 'italic'], fallback: 'Didot, Georgia, serif' },
    { name: 'EB Garamond', displayName: 'EB Garamond', cssFamily: 'EB Garamond', category: 'serif', weights: [400, 600, 700], styles: ['normal', 'italic'], fallback: 'Garamond, Georgia, serif' },
    { name: 'Lora', displayName: 'Lora', cssFamily: 'Lora', category: 'serif', weights: [400, 600, 700], styles: ['normal', 'italic'], fallback: 'Georgia, serif' },
    { name: 'Crimson Pro', displayName: 'Crimson Pro', cssFamily: 'Crimson Pro', category: 'serif', weights: [400, 600, 700], styles: ['normal', 'italic'], fallback: 'Georgia, serif' },
    { name: 'Marcellus', displayName: 'Marcellus', cssFamily: 'Marcellus', category: 'serif', display: true, weights: [400], styles: ['normal'], fallback: 'Georgia, serif' },
    { name: 'Cinzel', displayName: 'Cinzel', cssFamily: 'Cinzel', category: 'serif', display: true, weights: [400, 600, 700], styles: ['normal'], fallback: 'Georgia, serif' },
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
  ].map((font) => Object.freeze({ ...font, weights: Object.freeze(font.weights), styles: Object.freeze(font.styles), italicWeights: Object.freeze(font.italicWeights || font.weights) })));
  const FONT_BY_NAME = Object.freeze(Object.fromEntries(FONT_CATALOG.map((font) => [font.name, font])));
  const TEMPLATE_PALETTE = Object.freeze([
    Object.freeze({ name: 'Main Ivory', value: '#F4EFE7' }), Object.freeze({ name: 'Soft Linen', value: '#EAE2D7' }),
    Object.freeze({ name: 'Stone Beige', value: '#D8CEC1' }), Object.freeze({ name: 'Muted Sage', value: '#A3A792' }),
    Object.freeze({ name: 'Olive Ink', value: '#6B6A54' }), Object.freeze({ name: 'Deep Text', value: '#474232' })
  ]);
  const TEMPLATE_ASSETS = Object.freeze([
    Object.freeze({ id: 'background-ivory-silk', name: 'Ivory Silk', kind: 'background', url: 'invitation-assets/opening-background-ivory-silk-4k.png' }),
    Object.freeze({ id: 'background-sage-flatlay', name: 'Sage Flatlay', kind: 'background', url: 'invitation-assets/opening-background-sage-flatlay.png' }),
    Object.freeze({ id: 'background-botanical', name: 'Botanical Paper', kind: 'background', url: 'invitation-assets/invitation-background-optimized.jpg' }),
    Object.freeze({ id: 'asset-botanical-left', name: 'Botanical Left', kind: 'decorative', url: 'invitation-assets/botanical-left.png' }),
    Object.freeze({ id: 'asset-botanical-right', name: 'Botanical Right', kind: 'decorative', url: 'invitation-assets/botanical-right.png' }),
    Object.freeze({ id: 'asset-botanical-accent', name: 'Botanical Accent', kind: 'decorative', url: 'invitation-assets/botanical-accent-v2.png' }),
    Object.freeze({ id: 'asset-deckled-frame', name: 'Deckled Frame', kind: 'decorative', url: 'invitation-assets/deckled-edge.png' })
  ]);
  const TEMPLATE_ASSET_BY_ID = Object.freeze(Object.fromEntries(TEMPLATE_ASSETS.map((asset) => [asset.id, asset])));
  const SECTION_HEIGHT_PRESETS = Object.freeze({ strip: 280, standard: 620, full: 844 });
  const ALIGNMENTS = Object.freeze(['left', 'center', 'right']);
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const finite = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, finite(value, min)));
  const isHexColor = (value) => /^#[0-9a-f]{6}$/i.test(String(value || ''));
  const createId = (prefix = 'element') => `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
  const getFont = (name) => FONT_BY_NAME[name] || FONT_BY_NAME['Instrument Serif'];
  const getTemplateAsset = (id) => TEMPLATE_ASSET_BY_ID[id] || null;
  const resolveFontVariant = (name, weight = 400, style = 'normal') => {
    const font = getFont(name);
    const resolvedStyle = font.styles.includes(style) ? style : 'normal';
    const availableWeights = resolvedStyle === 'italic' ? font.italicWeights : font.weights;
    const requestedWeight = Number(weight);
    return { font, weight: availableWeights.includes(requestedWeight) ? requestedWeight : availableWeights[0], style: resolvedStyle };
  };
  const fontStack = (name) => { const font = getFont(name); return `"${font.cssFamily}", ${font.fallback}`; };
  const fontStylesheetUrl = (name, weight = 400, style = 'normal') => {
    const variant = resolveFontVariant(name, weight, style);
    const family = variant.font.cssFamily.replaceAll(' ', '+');
    if (variant.font.weights.length === 1 && variant.font.styles.length === 1) return `https://fonts.googleapis.com/css2?family=${family}&display=swap`;
    if (variant.font.styles.includes('italic')) return `https://fonts.googleapis.com/css2?family=${family}:ital,wght@${variant.style === 'italic' ? 1 : 0},${variant.weight}&display=swap`;
    return `https://fonts.googleapis.com/css2?family=${family}:wght@${variant.weight}&display=swap`;
  };
  const FONT_LOADS = new Map();
  const loadFont = async (name, options = {}) => {
    const variant = resolveFontVariant(name, options.weight, options.style);
    const targetDocument = options.document || globalThis.document;
    if (!targetDocument?.head) return variant;
    const url = fontStylesheetUrl(variant.font.name, variant.weight, variant.style);
    if (!FONT_LOADS.has(url)) {
      FONT_LOADS.set(url, new Promise((resolve) => {
        const link = targetDocument.createElement('link');
        const timeout = globalThis.setTimeout(resolve, 6000);
        const finish = () => { globalThis.clearTimeout(timeout); resolve(); };
        link.rel = 'stylesheet'; link.href = url; link.dataset.visualFont = variant.font.name;
        link.addEventListener('load', finish, { once: true }); link.addEventListener('error', finish, { once: true }); targetDocument.head.append(link);
      }));
    }
    await FONT_LOADS.get(url);
    if (targetDocument.fonts?.load) {
      const descriptor = `${variant.style === 'italic' ? 'italic ' : ''}${variant.weight} ${clamp(options.size ?? 18, 8, 180)}px "${variant.font.cssFamily}"`;
      await targetDocument.fonts.load(descriptor, String(options.sample || 'Aa'));
    }
    return variant;
  };
  const defaultPermissions = Object.freeze({ editable: true, movable: true, resizable: true, deletable: true, locked: false });
  const baseElement = (overrides, type) => ({
    id: overrides.id || createId(type), sectionId: overrides.sectionId || 'proof-section', type,
    frame: { x: overrides.frame?.x ?? 45, y: overrides.frame?.y ?? 180, width: overrides.frame?.width ?? 300, height: overrides.frame?.height ?? 76 },
    rotation: overrides.rotation ?? 0, opacity: overrides.opacity ?? 1,
    responsive: { strategy: 'scale', anchorX: 'center', ...(overrides.responsive || {}) },
    permissions: { ...defaultPermissions, ...(overrides.permissions || {}) }
  });
  const createTextElement = (overrides = {}) => ({
    ...baseElement(overrides, 'text'), content: overrides.content ?? 'New text',
    style: { fontFamily: overrides.style?.fontFamily || 'Instrument Serif', fontSize: overrides.style?.fontSize ?? 42, fontWeight: overrides.style?.fontWeight ?? 400, fontStyle: overrides.style?.fontStyle || 'normal', color: overrides.style?.color || '#474232', textAlign: overrides.style?.textAlign || 'center', lineHeight: overrides.style?.lineHeight ?? 1.08, letterSpacing: overrides.style?.letterSpacing ?? 0 }
  });
  const createImageElement = (overrides = {}) => ({
    ...baseElement({ frame: { x: 65, y: 430, width: 260, height: 220 }, ...overrides }, overrides.type === 'decorative' ? 'decorative' : 'image'),
    assetId: String(overrides.assetId || ''), assetKind: overrides.assetKind === 'template' ? 'template' : 'upload', alt: String(overrides.alt || 'Invitation image'),
    crop: { fit: overrides.crop?.fit === 'contain' ? 'contain' : 'cover', focalX: clamp(overrides.crop?.focalX ?? 50, 0, 100), focalY: clamp(overrides.crop?.focalY ?? 50, 0, 100), zoom: clamp(overrides.crop?.zoom ?? 1, 1, 4) }
  });
  const createSection = (overrides = {}) => ({
    id: overrides.id || createId('section'), name: String(overrides.name || 'Untitled section'), height: clamp(overrides.height ?? SECTION_HEIGHT_PRESETS.standard, 180, 2200),
    heightPreset: Object.hasOwn(SECTION_HEIGHT_PRESETS, overrides.heightPreset) || overrides.heightPreset === 'custom' ? overrides.heightPreset : 'standard',
    background: { kind: overrides.background?.kind === 'image' ? 'image' : 'color', color: isHexColor(overrides.background?.color) ? overrides.background.color : '#EAE2D7', assetId: String(overrides.background?.assetId || ''), assetKind: overrides.background?.assetKind === 'upload' ? 'upload' : 'template', focalX: clamp(overrides.background?.focalX ?? 50, 0, 100), focalY: clamp(overrides.background?.focalY ?? 50, 0, 100), zoom: clamp(overrides.background?.zoom ?? 1, 1, 4) },
    elementOrder: Array.isArray(overrides.elementOrder) ? [...overrides.elementOrder] : []
  });
  const defaults = {
    schemaVersion: SCHEMA_VERSION,
    document: { id: 'green-sage-visual-editor', templateId: 'green-sage', title: 'Green Sage invitation', canvas: { baseWidth: 390, maxRenderedWidth: 560, viewportBackground: '#F4EFE7', safeMargin: 20 }, sectionOrder: ['proof-section'], media: { audio: null } },
    sections: { 'proof-section': createSection({ id: 'proof-section', name: 'Opening canvas', height: 844, heightPreset: 'full', background: { kind: 'color', color: '#EAE2D7' }, elementOrder: ['proof-heading', 'proof-copy'] }) },
    elements: {
      'proof-heading': createTextElement({ id: 'proof-heading', content: 'A BEAUTIFUL BEGINNING', frame: { x: 35, y: 184, width: 320, height: 92 }, style: { fontFamily: 'Instrument Serif', fontSize: 46, color: '#474232', textAlign: 'center', lineHeight: 1.04, letterSpacing: 0 } }),
      'proof-copy': createTextElement({ id: 'proof-copy', content: 'Tap once to select. Tap again to place the caret and type.', frame: { x: 58, y: 324, width: 274, height: 78 }, style: { fontFamily: 'Instrument Sans', fontSize: 15, color: '#6B6A54', textAlign: 'center', lineHeight: 1.5, letterSpacing: 0.35 } })
    }
  };
  const normalizeFrame = (frame, fallback) => ({ x: finite(frame?.x, fallback.x), y: finite(frame?.y, fallback.y), width: clamp(frame?.width ?? fallback.width, 40, 780), height: clamp(frame?.height ?? fallback.height, 32, 1600) });
  const normalizeTextElement = (value, id, sectionId) => {
    const supplied = value && typeof value === 'object' ? value : {}; const fallback = createTextElement({ id, sectionId });
    const fontFamily = FONT_BY_NAME[supplied.style?.fontFamily] ? supplied.style.fontFamily : fallback.style.fontFamily;
    const variant = resolveFontVariant(fontFamily, Math.round(finite(supplied.style?.fontWeight, 400)), supplied.style?.fontStyle);
    return { ...fallback, ...supplied, id, sectionId, type: 'text', content: String(supplied.content ?? fallback.content), frame: normalizeFrame(supplied.frame, fallback.frame), rotation: clamp(supplied.rotation ?? 0, -180, 180), opacity: clamp(supplied.opacity ?? 1, 0.05, 1), style: { ...fallback.style, ...(supplied.style || {}), fontFamily, fontSize: clamp(supplied.style?.fontSize ?? fallback.style.fontSize, 8, 180), fontWeight: variant.weight, fontStyle: variant.style, color: isHexColor(supplied.style?.color) ? supplied.style.color : fallback.style.color, textAlign: ALIGNMENTS.includes(supplied.style?.textAlign) ? supplied.style.textAlign : fallback.style.textAlign, lineHeight: clamp(supplied.style?.lineHeight ?? fallback.style.lineHeight, 0.7, 3), letterSpacing: clamp(supplied.style?.letterSpacing ?? fallback.style.letterSpacing, -10, 30) }, responsive: { ...fallback.responsive, ...(supplied.responsive || {}), strategy: 'scale' }, permissions: { ...defaultPermissions, ...(supplied.permissions || {}) } };
  };
  const normalizeImageElement = (value, id, sectionId) => {
    const supplied = value && typeof value === 'object' ? value : {}; const fallback = createImageElement({ id, sectionId, type: supplied.type });
    return { ...fallback, ...supplied, id, sectionId, type: supplied.type === 'decorative' ? 'decorative' : 'image', frame: normalizeFrame(supplied.frame, fallback.frame), assetId: String(supplied.assetId || ''), assetKind: supplied.assetKind === 'template' ? 'template' : 'upload', alt: String(supplied.alt || fallback.alt), rotation: clamp(supplied.rotation ?? 0, -180, 180), opacity: clamp(supplied.opacity ?? 1, 0.05, 1), crop: { fit: supplied.crop?.fit === 'contain' ? 'contain' : fallback.crop.fit, focalX: clamp(supplied.crop?.focalX ?? 50, 0, 100), focalY: clamp(supplied.crop?.focalY ?? 50, 0, 100), zoom: clamp(supplied.crop?.zoom ?? 1, 1, 4) }, responsive: { ...fallback.responsive, ...(supplied.responsive || {}), strategy: 'scale' }, permissions: { ...defaultPermissions, ...(supplied.permissions || {}) } };
  };
  const normalize = (value) => {
    const supplied = value && typeof value === 'object' ? clone(value) : clone(defaults); const documentValue = supplied.document && typeof supplied.document === 'object' ? supplied.document : {};
    const rawSections = supplied.sections && typeof supplied.sections === 'object' ? supplied.sections : {}; const rawElements = supplied.elements && typeof supplied.elements === 'object' ? supplied.elements : {};
    const requestedOrder = Array.isArray(documentValue.sectionOrder) ? documentValue.sectionOrder : [];
    const sectionOrder = [...new Set([...requestedOrder, ...Object.keys(rawSections)])].filter((id) => rawSections[id] && typeof rawSections[id] === 'object');
    if (!sectionOrder.length) return clone(defaults);
    const sections = {}; const elements = {};
    sectionOrder.forEach((sectionId) => {
      const rawSection = rawSections[sectionId];
      const section = createSection({ ...rawSection, id: sectionId, background: rawSection.background || { kind: 'color', color: rawSection.style?.backgroundColor || '#EAE2D7' } });
      const sectionElementIds = Object.keys(rawElements).filter((id) => rawElements[id]?.sectionId === sectionId);
      section.elementOrder = [...new Set([...(Array.isArray(rawSection.elementOrder) ? rawSection.elementOrder : []), ...sectionElementIds])].filter((id) => ['text', 'image', 'decorative'].includes(rawElements[id]?.type));
      sections[sectionId] = section;
      section.elementOrder.forEach((elementId) => { const raw = rawElements[elementId]; elements[elementId] = raw.type === 'text' ? normalizeTextElement(raw, elementId, sectionId) : normalizeImageElement(raw, elementId, sectionId); });
    });
    return { ...supplied, schemaVersion: SCHEMA_VERSION, document: { ...defaults.document, ...documentValue, canvas: { ...defaults.document.canvas, ...(documentValue.canvas || {}), baseWidth: 390, maxRenderedWidth: clamp(documentValue.canvas?.maxRenderedWidth ?? 560, 390, 720), viewportBackground: isHexColor(documentValue.canvas?.viewportBackground) ? documentValue.canvas.viewportBackground : '#F4EFE7', safeMargin: clamp(documentValue.canvas?.safeMargin ?? 20, 0, 60) }, sectionOrder, media: { ...defaults.document.media, ...(documentValue.media || {}), audio: null } }, sections, elements };
  };
  const load = (storage = globalThis.localStorage) => { try { const saved = storage?.getItem(STORAGE_KEY); return normalize(saved ? JSON.parse(saved) : defaults); } catch { return clone(defaults); } };
  globalThis.GreenSageVisualDocument = Object.freeze({
    schemaVersion: SCHEMA_VERSION, storageKey: STORAGE_KEY, fontCatalog: FONT_CATALOG,
    fontCategories: Object.freeze([Object.freeze({ id: 'serif', label: 'Serif' }), Object.freeze({ id: 'sans', label: 'Sans Serif' }), Object.freeze({ id: 'script', label: 'Script / Handwritten' }), Object.freeze({ id: 'display', label: 'Display' })]),
    templatePalette: TEMPLATE_PALETTE, templateAssets: TEMPLATE_ASSETS, sectionHeightPresets: SECTION_HEIGHT_PRESETS,
    getFont, getTemplateAsset, resolveFontVariant, fontStack, fontStylesheetUrl, loadFont, defaults, clone, cloneDefaults: () => clone(defaults), createId, createTextElement, createImageElement, createSection, normalize, load
  });
})();
