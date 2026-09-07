(() => {
  const permissions = { editable: true, movable: true, resizable: true, deletable: true, locked: false };
  const text = (id, content, frame, style, overrides = {}) => {
    const { opacity = 1, ...textStyle } = style;
    return {
      id, sectionId: 'ceremony', type: 'text', content, frame, rotation: 0, opacity,
      style: { fontWeight: 400, fontStyle: 'normal', textAlign: 'center', ...textStyle },
      responsive: { strategy: 'scale', anchorX: 'center', ...(Object.keys(overrides).length ? { overrides } : {}) },
      permissions: { ...permissions }
    };
  };
  const defaultDocument = {
    schemaVersion: 4,
    document: {
      id: 'green-sage-visual-template', templateId: 'green-sage', title: 'Green Sage invitation',
      colors: ['#F4EFE7', '#EAE2D7', '#D8CEC1', '#A3A792', '#6B6A54', '#474232'],
      canvas: { baseWidth: 390, maxRenderedWidth: 560, viewportBackground: '#F4EFE7', safeMargin: 20 },
      sectionOrder: ['ceremony'], media: { audio: null }
    },
    sections: {
      ceremony: {
        id: 'ceremony', name: 'Ceremony', height: 844, heightPreset: 'full',
        background: { kind: 'color', color: '#EAE2D7', assetId: '', assetKind: 'template', focalX: 50, focalY: 50, zoom: 1 },
        elementOrder: ['ceremony-label', 'ceremony-time', 'ceremony-glasshouse', 'ceremony-venue', 'ceremony-address', 'ceremony-note'],
        responsive: { overrides: { ipad: { height: 1024 }, desktop: { height: 1000 } } }
      }
    },
    elements: {
      'ceremony-label': text('ceremony-label', 'CEREMONY', { x: 95, y: 228, width: 200, height: 32 },
        { fontFamily: 'Instrument Sans', fontSize: 10, color: '#6B6A54', lineHeight: 1.5, letterSpacing: 3, opacity: 0.92 },
        { ipad: { frame: { x: 284, y: 321 } }, desktop: { frame: { x: 500, y: 278 } } }),
      'ceremony-time': text('ceremony-time', '3:00 PM', { x: 95, y: 265, width: 200, height: 32 },
        { fontFamily: 'Instrument Sans', fontSize: 13, color: '#6B6A54', lineHeight: 1.5, letterSpacing: 2.34, opacity: 0.92 },
        { ipad: { frame: { x: 284, y: 358 } }, desktop: { frame: { x: 500, y: 317 } } }),
      'ceremony-glasshouse': {
        id: 'ceremony-glasshouse', sectionId: 'ceremony', type: 'decorative', assetId: 'asset-glasshouse-line', assetKind: 'template', alt: 'Glasshouse illustration',
        frame: { x: 63, y: 303, width: 264, height: 128.7 }, rotation: 0, opacity: 0.58,
        crop: { flipX: false, flipY: false, fit: 'contain', focalX: 50, focalY: 50, zoom: 1 },
        responsive: { strategy: 'scale', anchorX: 'center', overrides: {
          ipad: { frame: { x: 252, y: 396 } },
          desktop: { frame: { x: 441.6, y: 356, width: 316.8, height: 154.44 } }
        } },
        permissions: { ...permissions }
      },
      'ceremony-venue': text('ceremony-venue', 'The Glasshouse', { x: 35, y: 445, width: 320, height: 56 },
        { fontFamily: 'Instrument Serif', fontSize: 46.8, color: '#474232', lineHeight: 0.98, letterSpacing: 0.468 },
        {
          ipad: { frame: { x: 224, y: 539 }, style: { fontSize: 48, letterSpacing: 0.48 } },
          desktop: { frame: { x: 350, y: 528, width: 500, height: 74 }, style: { fontSize: 62.4, letterSpacing: 0.624 } }
        }),
      'ceremony-address': text('ceremony-address', '123 Example Street\nOttawa, Ontario', { x: 70, y: 521, width: 250, height: 52 },
        { fontFamily: 'Instrument Sans', fontSize: 11, color: '#474232', lineHeight: 2, letterSpacing: 0.88, opacity: 0.82 },
        { ipad: { frame: { x: 259, y: 616 } }, desktop: { frame: { x: 475, y: 627 } } }),
      'ceremony-note': text('ceremony-note', 'Please arrive 15 minutes early.', { x: 65, y: 586, width: 260, height: 32 },
        { fontFamily: 'Instrument Serif', fontSize: 15, fontStyle: 'italic', color: '#474232', lineHeight: 1.45, letterSpacing: 0.15, opacity: 0.86 },
        { ipad: { frame: { x: 254, y: 681 } }, desktop: { frame: { x: 470, y: 700 } } })
    }
  };
  const clone = () => JSON.parse(JSON.stringify(defaultDocument));
  globalThis.GreenSageVisualTemplate = Object.freeze({
    templateId: 'green-sage', storageKey: 'storiel-visual-document:green-sage:v1', defaultDocument: Object.freeze(defaultDocument), cloneDefault: clone
  });
})();
