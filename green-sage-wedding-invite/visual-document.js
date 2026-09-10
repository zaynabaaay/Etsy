(() => {
  const SCHEMA_VERSION = 4;
  const CANVAS_VIEWS = Object.freeze({
    mobile: Object.freeze({ logicalWidth: 390 }),
    ipad: Object.freeze({ logicalWidth: 768 }),
    desktop: Object.freeze({ logicalWidth: 1200 })
  });
  // Allow a full Desktop-width element plus intentional overflow while still bounding corrupt data.
  const MAX_FRAME_WIDTH = CANVAS_VIEWS.desktop.logicalWidth * 2;
  const getCanvasMetrics = (view = 'mobile', options = {}) => {
    const definition = CANVAS_VIEWS[view] || CANVAS_VIEWS.mobile;
    const safeMargin = Math.max(0, Number.isFinite(Number(options.safeMargin)) ? Number(options.safeMargin) : 20);
    return Object.freeze({ logicalWidth: definition.logicalWidth, left: 0, right: definition.logicalWidth, centerX: definition.logicalWidth / 2, safeMargin });
  };
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
    Object.freeze({ name: 'Main Ivory', value: '#F4EFE7' }), Object.freeze({ name: 'Cool Stone', value: '#E6E5DF' }),
    Object.freeze({ name: 'Muted Sage', value: '#858977' }), Object.freeze({ name: 'Deep Olive', value: '#626753' }),
    Object.freeze({ name: 'Deep Neutral', value: '#44463D' }), Object.freeze({ name: 'Quiet Olive', value: '#5F6051' })
  ]);
  const TEMPLATE_ASSETS = Object.freeze([
    Object.freeze({ id: 'background-green-sage-opening', name: 'Green Sage Opening', kind: 'background', url: 'invitation-assets/green-sage-opening-background.jpg', width: 853, height: 1280 }),
    Object.freeze({ id: 'venue-glasshouse', name: 'Glasshouse', kind: 'decorative', url: 'invitation-assets/venue-glasshouse.svg', width: 1796, height: 876 }),
    Object.freeze({ id: 'venue-mansion', name: 'Mansion', kind: 'decorative', url: 'invitation-assets/venue-mansion.svg', width: 1536, height: 768 }),
    Object.freeze({ id: 'venue-pergola', name: 'Pergola', kind: 'decorative', url: 'invitation-assets/venue-pergola.svg', width: 1536, height: 768 }),
    Object.freeze({ id: 'venue-barn', name: 'Barn', kind: 'decorative', url: 'invitation-assets/venue-barn.svg', width: 1536, height: 768 }),
    Object.freeze({ id: 'details-icon-dress-code', name: 'Dress Code Icon', kind: 'decorative', url: 'invitation-assets/details-icon-dress-code.svg', width: 24, height: 24 }),
    Object.freeze({ id: 'details-icon-parking', name: 'Parking Icon', kind: 'decorative', url: 'invitation-assets/details-icon-parking.svg', width: 24, height: 24 }),
    Object.freeze({ id: 'details-icon-adults-only', name: 'Adults Only Icon', kind: 'decorative', url: 'invitation-assets/details-icon-adults-only.svg', width: 24, height: 24 }),
    Object.freeze({ id: 'details-icon-accommodation', name: 'Accommodation Icon', kind: 'decorative', url: 'invitation-assets/details-icon-accommodation.svg', width: 24, height: 24 }),
    Object.freeze({ id: 'details-icon-transportation', name: 'Transportation Icon', kind: 'decorative', url: 'invitation-assets/details-icon-transportation.svg', width: 24, height: 24 }),
    Object.freeze({ id: 'details-icon-gifts', name: 'Gifts Icon', kind: 'decorative', url: 'invitation-assets/details-icon-gifts.svg', width: 24, height: 24 })
  ]);
  const TEMPLATE_ASSET_BY_ID = Object.freeze(Object.fromEntries(TEMPLATE_ASSETS.map((asset) => [asset.id, asset])));
  const SECTION_HEIGHT_PRESETS = Object.freeze({ strip: 280, standard: 620, full: 844 });
  const ALIGNMENTS = Object.freeze(['left', 'center', 'right']);
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const finite = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, finite(value, min)));
  const isObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
  const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  const copyFinite = (target, source, key, min, max) => {
    if (!hasOwn(source, key) || !Number.isFinite(Number(source[key]))) return;
    const value = Number(source[key]);
    target[key] = Number.isFinite(min) && Number.isFinite(max) ? Math.min(max, Math.max(min, value)) : value;
  };
  const isHexColor = (value) => /^#[0-9a-f]{6}$/i.test(String(value || ''));
  const normalizeColor = (value) => isHexColor(value) ? String(value).toUpperCase() : null;
  const uniqueColors = (values) => [...new Set(values.map(normalizeColor).filter(Boolean))];
  const getDefaultElementPlacement = (options = {}) => {
    const view = CANVAS_VIEWS[options.view] ? options.view : 'mobile';
    const metrics = getCanvasMetrics(view, { safeMargin: options.safeMargin });
    const mobileMetrics = getCanvasMetrics('mobile', { safeMargin: options.safeMargin });
    const base = {
      x: finite(options.baseFrame?.x, 0), y: finite(options.baseFrame?.y, 0),
      width: finite(options.baseFrame?.width, 260), height: finite(options.baseFrame?.height, 220)
    };
    if (options.type === 'divider') {
      const sectionHeight = finite(options.section?.height, SECTION_HEIGHT_PRESETS.standard);
      return { ...base, x: metrics.centerX - base.width / 2, y: (sectionHeight - base.height) / 2 };
    }
    if (options.type !== 'decorative') return { ...base, x: base.x + metrics.centerX - mobileMetrics.centerX };

    const ratio = Number(options.assetMetadata?.width) > 0 && Number(options.assetMetadata?.height) > 0 ? Number(options.assetMetadata.width) / Number(options.assetMetadata.height) : 1;
    const sectionHeight = finite(options.section?.height, SECTION_HEIGHT_PRESETS.standard);
    const maxHeight = Math.max(32, sectionHeight - 40);
    const width = Math.min(base.width, maxHeight * ratio);
    const height = width / ratio;
    const offset = (Math.max(0, Math.floor(finite(options.index, 0))) % 3) * 8;
    return {
      x: Math.max(metrics.safeMargin, Math.min(metrics.right - width - metrics.safeMargin, metrics.centerX - width / 2 + offset)),
      y: Math.max(20, Math.min(sectionHeight - height - 20, (sectionHeight - height) / 2 + offset)),
      width,
      height
    };
  };
  const createId = (prefix = 'element') => `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
  const getFont = (name) => FONT_BY_NAME[name] || FONT_BY_NAME['Instrument Serif'];
  const getTemplateAsset = (id) => TEMPLATE_ASSET_BY_ID[id] || null;
  const normalizeSectionOverride = (value) => {
    if (!isObject(value)) return {};
    const result = {};
    copyFinite(result, value, 'height', 180, 2200);
    if (hasOwn(value, 'heightPreset') && (Object.hasOwn(SECTION_HEIGHT_PRESETS, value.heightPreset) || value.heightPreset === 'custom')) result.heightPreset = value.heightPreset;
    if (isObject(value.background)) {
      const background = {};
      if (hasOwn(value.background, 'fit') && ['cover', 'contain'].includes(value.background.fit)) background.fit = value.background.fit;
      copyFinite(background, value.background, 'focalX', 0, 100);
      copyFinite(background, value.background, 'focalY', 0, 100);
      copyFinite(background, value.background, 'zoom', 1, 4);
      if (Object.keys(background).length) result.background = background;
    }
    return result;
  };
  const normalizeElementOverride = (value, type) => {
    if (!isObject(value)) return {};
    const result = {};
    if (hasOwn(value, 'visible') && typeof value.visible === 'boolean') result.visible = value.visible;
    if (isObject(value.frame)) {
      const frame = {};
      copyFinite(frame, value.frame, 'x');
      copyFinite(frame, value.frame, 'y');
      copyFinite(frame, value.frame, 'width', type === 'divider' ? 1 : 40, MAX_FRAME_WIDTH);
      copyFinite(frame, value.frame, 'height', type === 'divider' ? 1 : 32, 1600);
      if (Object.keys(frame).length) result.frame = frame;
    }
    if (type === 'text' && isObject(value.style)) {
      const style = {};
      copyFinite(style, value.style, 'fontSize', 8, 180);
      if (hasOwn(value.style, 'textAlign') && ALIGNMENTS.includes(value.style.textAlign)) style.textAlign = value.style.textAlign;
      copyFinite(style, value.style, 'lineHeight', 0.7, 3);
      copyFinite(style, value.style, 'letterSpacing', -10, 30);
      if (Object.keys(style).length) result.style = style;
    }
    if (type === 'image' && isObject(value.crop)) {
      const crop = {};
      if (hasOwn(value.crop, 'fit') && ['cover', 'contain'].includes(value.crop.fit)) crop.fit = value.crop.fit;
      copyFinite(crop, value.crop, 'focalX', 0, 100);
      copyFinite(crop, value.crop, 'focalY', 0, 100);
      copyFinite(crop, value.crop, 'zoom', 1, 4);
      if (Object.keys(crop).length) result.crop = crop;
    }
    return result;
  };
  const normalizeResponsiveOverrides = (value, normalizeKnownOverride) => {
    if (!isObject(value)) return null;
    const result = {};
    Object.entries(value).forEach(([breakpoint, override]) => {
      if (breakpoint === 'ipad' || breakpoint === 'desktop') {
        const normalized = normalizeKnownOverride(override);
        if (Object.keys(normalized).length) result[breakpoint] = normalized;
        return;
      }
      // Preserve unknown breakpoint payloads for forward-compatible round trips, but never interpret them here.
      if (override !== undefined) result[breakpoint] = clone(override);
    });
    return Object.keys(result).length ? result : null;
  };
  const normalizeElementResponsive = (value, fallback, type) => {
    const source = isObject(value) ? value : {};
    const result = {
      strategy: typeof source.strategy === 'string' ? source.strategy : fallback.strategy,
      anchorX: typeof source.anchorX === 'string' ? source.anchorX : fallback.anchorX
    };
    const overrides = normalizeResponsiveOverrides(source.overrides, (override) => normalizeElementOverride(override, type));
    if (overrides) result.overrides = overrides;
    return result;
  };
  const normalizeSectionResponsive = (value) => {
    const source = isObject(value) ? value : {};
    const overrides = normalizeResponsiveOverrides(source.overrides, normalizeSectionOverride);
    return overrides ? { overrides } : {};
  };
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
    id: overrides.id || createId(type), sectionId: overrides.sectionId || 'document-section', type,
    frame: { x: overrides.frame?.x ?? 45, y: overrides.frame?.y ?? 180, width: overrides.frame?.width ?? 300, height: overrides.frame?.height ?? 76 },
    rotation: overrides.rotation ?? 0, opacity: overrides.opacity ?? 1,
    ...(typeof overrides.visible === 'boolean' ? { visible: overrides.visible } : {}),
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
    crop: { flipX: overrides.crop?.flipX === true, flipY: overrides.crop?.flipY === true, fit: overrides.crop?.fit === 'contain' ? 'contain' : 'cover', focalX: clamp(overrides.crop?.focalX ?? 50, 0, 100), focalY: clamp(overrides.crop?.focalY ?? 50, 0, 100), zoom: clamp(overrides.crop?.zoom ?? 1, 1, 4) }
  });
  const createDividerElement = (overrides = {}) => ({
    ...baseElement({ frame: { x: 115, y: 309, width: 160, height: 2 }, ...overrides }, 'divider'),
    style: { color: isHexColor(overrides.style?.color) ? overrides.style.color : '#6B6A54' }
  });
  const createSection = (overrides = {}) => ({
    id: overrides.id || createId('section'), name: String(overrides.name || 'Untitled section'), height: clamp(overrides.height ?? SECTION_HEIGHT_PRESETS.standard, 180, 2200),
    heightPreset: Object.hasOwn(SECTION_HEIGHT_PRESETS, overrides.heightPreset) || overrides.heightPreset === 'custom' ? overrides.heightPreset : 'standard',
    background: { kind: overrides.background?.kind === 'image' ? 'image' : 'color', color: isHexColor(overrides.background?.color) ? overrides.background.color : '#EAE2D7', assetId: String(overrides.background?.assetId || ''), assetKind: overrides.background?.assetKind === 'upload' ? 'upload' : 'template', ...(overrides.background?.fit === 'contain' || overrides.background?.fit === 'cover' ? { fit: overrides.background.fit } : {}), focalX: clamp(overrides.background?.focalX ?? 50, 0, 100), focalY: clamp(overrides.background?.focalY ?? 50, 0, 100), zoom: clamp(overrides.background?.zoom ?? 1, 1, 4) },
    elementOrder: Array.isArray(overrides.elementOrder) ? [...overrides.elementOrder] : [],
    responsive: normalizeSectionResponsive(overrides.responsive)
  });
  // Model-only recovery state. Product templates and development fixtures live in
  // dedicated resources and are selected through the template loader.
  const defaults = {
    schemaVersion: SCHEMA_VERSION,
    document: { id: 'visual-document-fallback', templateId: 'visual-document', title: 'Visual document', colors: TEMPLATE_PALETTE.map((color) => color.value), canvas: { baseWidth: 390, maxRenderedWidth: 560, viewportBackground: '#F4EFE7', safeMargin: 20 }, sectionOrder: ['document-section'], media: { audio: null } },
    sections: { 'document-section': createSection({ id: 'document-section', name: 'Document', height: 844, heightPreset: 'full', background: { kind: 'color', color: '#F4EFE7' }, elementOrder: [] }) },
    elements: {}
  };
  const normalizeFrame = (frame, fallback, type) => ({ x: finite(frame?.x, fallback.x), y: finite(frame?.y, fallback.y), width: clamp(frame?.width ?? fallback.width, type === 'divider' ? 1 : 40, MAX_FRAME_WIDTH), height: clamp(frame?.height ?? fallback.height, type === 'divider' ? 1 : 32, 1600) });
  const normalizeTextElement = (value, id, sectionId) => {
    const supplied = value && typeof value === 'object' ? value : {}; const fallback = createTextElement({ id, sectionId });
    const { visible: suppliedVisibility, ...authored } = supplied;
    const fontFamily = FONT_BY_NAME[supplied.style?.fontFamily] ? supplied.style.fontFamily : fallback.style.fontFamily;
    const variant = resolveFontVariant(fontFamily, Math.round(finite(supplied.style?.fontWeight, 400)), supplied.style?.fontStyle);
    return { ...fallback, ...authored, id, sectionId, type: 'text', content: String(supplied.content ?? fallback.content), frame: normalizeFrame(supplied.frame, fallback.frame, 'text'), rotation: clamp(supplied.rotation ?? 0, -180, 180), opacity: clamp(supplied.opacity ?? 1, 0.05, 1), ...(typeof suppliedVisibility === 'boolean' ? { visible: suppliedVisibility } : {}), style: { ...fallback.style, ...(supplied.style || {}), fontFamily, fontSize: clamp(supplied.style?.fontSize ?? fallback.style.fontSize, 8, 180), fontWeight: variant.weight, fontStyle: variant.style, color: isHexColor(supplied.style?.color) ? supplied.style.color : fallback.style.color, textAlign: ALIGNMENTS.includes(supplied.style?.textAlign) ? supplied.style.textAlign : fallback.style.textAlign, lineHeight: clamp(supplied.style?.lineHeight ?? fallback.style.lineHeight, 0.7, 3), letterSpacing: clamp(supplied.style?.letterSpacing ?? fallback.style.letterSpacing, -10, 30) }, responsive: normalizeElementResponsive(supplied.responsive, fallback.responsive, 'text'), permissions: { ...defaultPermissions, ...(supplied.permissions || {}) } };
  };
  const normalizeImageElement = (value, id, sectionId) => {
    const supplied = value && typeof value === 'object' ? value : {}; const fallback = createImageElement({ id, sectionId, type: supplied.type });
    const { visible: suppliedVisibility, ...authored } = supplied;
    const type = supplied.type === 'decorative' ? 'decorative' : 'image';
    return { ...fallback, ...authored, id, sectionId, type, frame: normalizeFrame(supplied.frame, fallback.frame, type), assetId: String(supplied.assetId || ''), assetKind: supplied.assetKind === 'template' ? 'template' : 'upload', alt: String(supplied.alt || fallback.alt), rotation: clamp(supplied.rotation ?? 0, -180, 180), opacity: clamp(supplied.opacity ?? 1, 0.05, 1), ...(typeof suppliedVisibility === 'boolean' ? { visible: suppliedVisibility } : {}), crop: { flipX: supplied.crop?.flipX === true, flipY: supplied.crop?.flipY === true, fit: supplied.crop?.fit === 'contain' ? 'contain' : fallback.crop.fit, focalX: clamp(supplied.crop?.focalX ?? 50, 0, 100), focalY: clamp(supplied.crop?.focalY ?? 50, 0, 100), zoom: clamp(supplied.crop?.zoom ?? 1, 1, 4) }, responsive: normalizeElementResponsive(supplied.responsive, fallback.responsive, type), permissions: { ...defaultPermissions, ...(supplied.permissions || {}) } };
  };
  const normalizeDividerElement = (value, id, sectionId) => {
    const supplied = value && typeof value === 'object' ? value : {}; const fallback = createDividerElement({ id, sectionId });
    const { visible: suppliedVisibility, ...authored } = supplied;
    return { ...fallback, ...authored, id, sectionId, type: 'divider', frame: normalizeFrame(supplied.frame, fallback.frame, 'divider'), rotation: clamp(supplied.rotation ?? 0, -180, 180), opacity: clamp(supplied.opacity ?? 1, 0.05, 1), ...(typeof suppliedVisibility === 'boolean' ? { visible: suppliedVisibility } : {}), style: { color: isHexColor(supplied.style?.color) ? supplied.style.color : fallback.style.color }, responsive: normalizeElementResponsive(supplied.responsive, fallback.responsive, 'divider'), permissions: { ...defaultPermissions, ...(supplied.permissions || {}) } };
  };
  const migrate = (value) => {
    const migrated = isObject(value) ? clone(value) : clone(defaults);
    const sourceVersion = Math.max(1, Math.floor(finite(migrated.schemaVersion, 1)));
    if (sourceVersion <= 3) migrated.schemaVersion = 4;
    return migrated;
  };
  const normalize = (value) => {
    const supplied = migrate(value); const documentValue = supplied.document && typeof supplied.document === 'object' ? supplied.document : {};
    const rawSections = supplied.sections && typeof supplied.sections === 'object' ? supplied.sections : {}; const rawElements = supplied.elements && typeof supplied.elements === 'object' ? supplied.elements : {};
    const requestedOrder = Array.isArray(documentValue.sectionOrder) ? documentValue.sectionOrder : [];
    const sectionOrder = [...new Set([...requestedOrder, ...Object.keys(rawSections)])].filter((id) => rawSections[id] && typeof rawSections[id] === 'object');
    if (!sectionOrder.length) return clone(defaults);
    const sections = {}; const elements = {};
    sectionOrder.forEach((sectionId) => {
      const rawSection = rawSections[sectionId];
      const section = createSection({ ...rawSection, id: sectionId, background: rawSection.background || { kind: 'color', color: rawSection.style?.backgroundColor || '#EAE2D7' } });
      const sectionElementIds = Object.keys(rawElements).filter((id) => rawElements[id]?.sectionId === sectionId);
      section.elementOrder = [...new Set([...(Array.isArray(rawSection.elementOrder) ? rawSection.elementOrder : []), ...sectionElementIds])].filter((id) => ['text', 'image', 'decorative', 'divider'].includes(rawElements[id]?.type));
      sections[sectionId] = section;
      section.elementOrder.forEach((elementId) => { const raw = rawElements[elementId]; elements[elementId] = raw.type === 'text' ? normalizeTextElement(raw, elementId, sectionId) : raw.type === 'divider' ? normalizeDividerElement(raw, elementId, sectionId) : normalizeImageElement(raw, elementId, sectionId); });
    });
    const usedColors = [...Object.values(sections).map((section) => section.background.color), ...Object.values(elements).filter((item) => item.type === 'text' || item.type === 'divider').map((item) => item.style.color)];
    const colors = uniqueColors([...(Array.isArray(documentValue.colors) ? documentValue.colors : TEMPLATE_PALETTE.map((color) => color.value)), ...usedColors]);
    return { ...supplied, schemaVersion: SCHEMA_VERSION, document: { ...defaults.document, ...documentValue, colors, canvas: { ...defaults.document.canvas, ...(documentValue.canvas || {}), baseWidth: 390, maxRenderedWidth: clamp(documentValue.canvas?.maxRenderedWidth ?? 560, 390, 720), viewportBackground: isHexColor(documentValue.canvas?.viewportBackground) ? documentValue.canvas.viewportBackground : '#F4EFE7', safeMargin: clamp(documentValue.canvas?.safeMargin ?? 20, 0, 60) }, sectionOrder, media: { ...defaults.document.media, ...(documentValue.media || {}), audio: null } }, sections, elements };
  };
  const applySectionOverride = (resolved, authored, view) => {
    if (view === 'mobile') return resolved;
    const override = normalizeSectionOverride(authored?.responsive?.overrides?.[view]);
    if (hasOwn(override, 'height')) resolved.height = override.height;
    if (hasOwn(override, 'heightPreset')) resolved.heightPreset = override.heightPreset;
    if (override.background) Object.assign(resolved.background, override.background);
    return resolved;
  };
  const applyElementOverride = (resolved, authored, view) => {
    if (!hasOwn(resolved, 'visible')) resolved.visible = true;
    if (view === 'mobile') return resolved;
    const override = normalizeElementOverride(authored?.responsive?.overrides?.[view], authored?.type);
    if (hasOwn(override, 'visible')) resolved.visible = override.visible;
    if (override.frame) Object.assign(resolved.frame, override.frame);
    if (override.style && resolved.style) Object.assign(resolved.style, override.style);
    if (override.crop && resolved.crop) Object.assign(resolved.crop, override.crop);
    return resolved;
  };
  const resolveSection = (section, view = 'mobile') => applySectionOverride(clone(section), section, CANVAS_VIEWS[view] ? view : 'mobile');
  const resolveElement = (element, view = 'mobile') => applyElementOverride(clone(element), element, CANVAS_VIEWS[view] ? view : 'mobile');
  const resolveDocument = (authoredState, view = 'mobile') => {
    const activeView = CANVAS_VIEWS[view] ? view : 'mobile';
    const resolved = clone(authoredState);
    Object.entries(authoredState?.sections || {}).forEach(([id, section]) => { resolved.sections[id] = applySectionOverride(resolved.sections[id], section, activeView); });
    Object.entries(authoredState?.elements || {}).forEach(([id, element]) => { resolved.elements[id] = applyElementOverride(resolved.elements[id], element, activeView); });
    return resolved;
  };
  const pathParts = (path) => Array.isArray(path) ? path : String(path || '').split('.').filter(Boolean);
  const readPath = (root, path) => pathParts(path).reduce((value, key) => value?.[key], root);
  const hasPath = (root, path) => {
    const parts = pathParts(path); let current = root;
    return parts.length > 0 && parts.every((key) => {
      if (!isObject(current) || !hasOwn(current, key)) return false;
      current = current[key]; return true;
    });
  };
  const setPath = (root, path, value) => {
    const parts = pathParts(path); if (!parts.length) return false;
    let current = root;
    parts.slice(0, -1).forEach((key) => { if (!isObject(current[key])) current[key] = {}; current = current[key]; });
    current[parts[parts.length - 1]] = value; return true;
  };
  const deletePath = (root, path) => {
    const parts = pathParts(path); const parents = []; let current = root;
    for (const key of parts.slice(0, -1)) { if (!isObject(current?.[key])) return; parents.push([current, key]); current = current[key]; }
    if (!isObject(current)) return;
    delete current[parts[parts.length - 1]];
    parents.reverse().forEach(([parent, key]) => { if (isObject(parent[key]) && !Object.keys(parent[key]).length) delete parent[key]; });
  };
  const SECTION_RESPONSIVE_PATHS = new Set(['height', 'heightPreset', 'background.fit', 'background.focalX', 'background.focalY', 'background.zoom']);
  const ELEMENT_RESPONSIVE_PATHS = new Set(['frame.x', 'frame.y', 'frame.width', 'frame.height', 'visible']);
  const TEXT_RESPONSIVE_PATHS = new Set(['style.fontSize', 'style.textAlign', 'style.lineHeight', 'style.letterSpacing']);
  const IMAGE_RESPONSIVE_PATHS = new Set(['crop.fit', 'crop.focalX', 'crop.focalY', 'crop.zoom']);
  const responsivePathSupported = (targetType, target, path) => {
    const key = pathParts(path).join('.');
    if (targetType === 'section') return SECTION_RESPONSIVE_PATHS.has(key);
    if (targetType !== 'element') return false;
    return ELEMENT_RESPONSIVE_PATHS.has(key)
      || (target?.type === 'text' && TEXT_RESPONSIVE_PATHS.has(key))
      || (target?.type === 'image' && IMAGE_RESPONSIVE_PATHS.has(key));
  };
  const responsiveTarget = (authoredState, targetType, targetId) => targetType === 'section'
    ? authoredState?.sections?.[targetId]
    : targetType === 'element' ? authoredState?.elements?.[targetId] : null;
  const resettableView = (view) => view === 'ipad' || view === 'desktop';
  const pruneResponsiveView = (target, view) => {
    if (isObject(target?.responsive?.overrides?.[view]) && !Object.keys(target.responsive.overrides[view]).length) delete target.responsive.overrides[view];
    if (isObject(target?.responsive?.overrides) && !Object.keys(target.responsive.overrides).length) delete target.responsive.overrides;
  };
  const normalizeResponsiveWrite = (targetType, target, path, value) => {
    if (!responsivePathSupported(targetType, target, path)) return { valid: false };
    const candidate = {}; setPath(candidate, path, value);
    const normalized = targetType === 'section' ? normalizeSectionOverride(candidate) : normalizeElementOverride(candidate, target.type);
    return hasPath(normalized, path) ? { valid: true, value: readPath(normalized, path) } : { valid: false };
  };
  const writeAuthoredProperty = (authoredState, options = {}) => {
    const targetType = options.targetType === 'section' ? 'section' : options.targetType === 'element' ? 'element' : null;
    const target = responsiveTarget(authoredState, targetType, options.targetId);
    const path = pathParts(options.path);
    if (!target || !path.length) return false;
    if (options.scope === 'global') return setPath(target, path, options.value);
    if (options.scope !== 'responsive') return false;
    const normalized = normalizeResponsiveWrite(targetType, target, path, options.value);
    if (!normalized.valid) return false;
    const view = CANVAS_VIEWS[options.responsiveView] ? options.responsiveView : 'mobile';
    if (view === 'mobile') {
      if (path.join('.') === 'visible' && normalized.value === true) { delete target.visible; return true; }
      return setPath(target, path, normalized.value);
    }

    if (!isObject(target.responsive)) target.responsive = targetType === 'element' ? { strategy: 'scale', anchorX: 'center' } : {};
    if (!isObject(target.responsive.overrides)) target.responsive.overrides = {};
    const baseValue = path.join('.') === 'visible' && !hasPath(target, path) ? true : readPath(target, path);
    if (JSON.stringify(normalized.value) === JSON.stringify(baseValue)) {
      deletePath(target.responsive.overrides[view], path);
      pruneResponsiveView(target, view);
      return true;
    }
    if (!isObject(target.responsive.overrides[view])) target.responsive.overrides[view] = {};
    return setPath(target.responsive.overrides[view], path, normalized.value);
  };
  const removeResponsiveProperty = (authoredState, options = {}) => {
    const targetType = options.targetType === 'section' ? 'section' : options.targetType === 'element' ? 'element' : null;
    const target = responsiveTarget(authoredState, targetType, options.targetId);
    const view = options.responsiveView;
    const path = pathParts(options.path);
    const breakpoint = target?.responsive?.overrides?.[view];
    if (!target || !resettableView(view) || !path.length || !responsivePathSupported(targetType, target, path) || !isObject(breakpoint) || !hasPath(breakpoint, path)) return false;
    deletePath(breakpoint, path);
    pruneResponsiveView(target, view);
    return true;
  };
  const resetResponsiveTarget = (authoredState, options = {}) => {
    const targetType = options.targetType === 'section' ? 'section' : options.targetType === 'element' ? 'element' : null;
    const target = responsiveTarget(authoredState, targetType, options.targetId);
    const view = options.responsiveView;
    if (!target || !resettableView(view) || !isObject(target.responsive?.overrides) || !hasOwn(target.responsive.overrides, view)) return false;
    delete target.responsive.overrides[view];
    pruneResponsiveView(target, view);
    return true;
  };
  const resetResponsiveView = (authoredState, view) => {
    if (!isObject(authoredState) || !resettableView(view)) return false;
    let changed = false;
    Object.keys(authoredState.sections || {}).forEach((targetId) => { changed = resetResponsiveTarget(authoredState, { targetType: 'section', targetId, responsiveView: view }) || changed; });
    Object.keys(authoredState.elements || {}).forEach((targetId) => { changed = resetResponsiveTarget(authoredState, { targetType: 'element', targetId, responsiveView: view }) || changed; });
    return changed;
  };
  const hasResponsiveOverrides = (authoredState, view) => {
    if (!isObject(authoredState) || !resettableView(view)) return false;
    return Object.values(authoredState.sections || {}).some((section) => Object.keys(normalizeSectionOverride(section?.responsive?.overrides?.[view])).length > 0)
      || Object.values(authoredState.elements || {}).some((element) => Object.keys(normalizeElementOverride(element?.responsive?.overrides?.[view], element?.type)).length > 0);
  };
  globalThis.GreenSageVisualDocument = Object.freeze({
    schemaVersion: SCHEMA_VERSION, fontCatalog: FONT_CATALOG,
    fontCategories: Object.freeze([Object.freeze({ id: 'serif', label: 'Serif' }), Object.freeze({ id: 'sans', label: 'Sans Serif' }), Object.freeze({ id: 'script', label: 'Script / Handwritten' }), Object.freeze({ id: 'display', label: 'Display' })]),
    templatePalette: TEMPLATE_PALETTE, templateAssets: TEMPLATE_ASSETS, sectionHeightPresets: SECTION_HEIGHT_PRESETS, canvasViews: CANVAS_VIEWS,
    getCanvasMetrics, getDefaultElementPlacement,
    getFont, getTemplateAsset, resolveFontVariant, fontStack, fontStylesheetUrl, loadFont, normalizeColor, defaults, clone, cloneDefaults: () => clone(defaults), createId, createTextElement, createImageElement, createDividerElement, createSection, migrate, normalize, resolveDocument, resolveSection, resolveElement, writeAuthoredProperty, removeResponsiveProperty, resetResponsiveTarget, resetResponsiveView, hasResponsiveOverrides
  });
})();
