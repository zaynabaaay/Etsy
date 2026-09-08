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
  const openingText = (id, content, frame, style, overrides = {}) => {
    const { opacity = 1, ...textStyle } = style;
    return {
      id, sectionId: 'opening', type: 'text', content, frame, rotation: 0, opacity,
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
      sectionOrder: ['opening', 'ceremony'], media: { audio: null }
    },
    sections: {
      opening: {
        id: 'opening', name: 'Opening', height: 844, heightPreset: 'full',
        background: { kind: 'image', color: '#ECE6DF', assetId: 'background-opening-reference', assetKind: 'template', focalX: 50, focalY: 50, zoom: 1 },
        elementOrder: ['opening-intro-1', 'opening-intro-2', 'opening-isabella', 'opening-and', 'opening-julian', 'opening-date', 'opening-location', 'opening-scroll'],
        responsive: { overrides: { ipad: { height: 1024 }, desktop: { height: 1000 } } }
      },
      ceremony: {
        id: 'ceremony', name: 'Ceremony', height: 844, heightPreset: 'full',
        background: { kind: 'color', color: '#EAE2D7', assetId: '', assetKind: 'template', focalX: 50, focalY: 50, zoom: 1 },
        elementOrder: ['ceremony-label', 'ceremony-time', 'ceremony-glasshouse', 'ceremony-venue', 'ceremony-address', 'ceremony-note'],
        responsive: { overrides: { ipad: { height: 1024 }, desktop: { height: 1000 } } }
      }
    },
    elements: {
      'opening-intro-1': openingText('opening-intro-1', 'Together with their families', { x: 32.38, y: 232.58, width: 325.23, height: 32 },
        { fontFamily: 'Instrument Sans', fontSize: 11, color: '#3F4037', lineHeight: 1.55, letterSpacing: 0.99, opacity: 0.96 },
        { ipad: { frame: { x: 151.97, y: 304.37, width: 464.06 } }, desktop: { frame: { x: 235.92, y: 230.8, width: 728.16 }, style: { fontSize: 12, letterSpacing: 1.08 } } }),
      'opening-intro-2': openingText('opening-intro-2', 'invite you to celebrate the marriage of', { x: 32.38, y: 254.63, width: 325.23, height: 32 },
        { fontFamily: 'Instrument Sans', fontSize: 11, color: '#3F4037', lineHeight: 1.55, letterSpacing: 0.99, opacity: 0.96 },
        { ipad: { frame: { x: 151.97, y: 326.42, width: 464.06 } }, desktop: { frame: { x: 235.92, y: 254.39, width: 728.16 }, style: { fontSize: 12, letterSpacing: 1.08 } } }),
      'opening-isabella': openingText('opening-isabella', 'ISABELLA', { x: 43.31, y: 295.67, width: 303.34, height: 53.55 },
        { fontFamily: 'Baskervville', fontSize: 58.2, color: '#45402B', lineHeight: 0.92, letterSpacing: 1.08 },
        { ipad: { frame: { x: 233.84, y: 371.47, width: 300.31, height: 52.98 }, style: { fontSize: 57.6 } }, desktop: { frame: { x: 335.73, y: 304.17, width: 528.52, height: 93.25 }, style: { fontSize: 101.376, letterSpacing: 1.9008 } } }),
      'opening-and': openingText('opening-and', 'and', { x: 105.55, y: 359.14, width: 178.88, height: 32 },
        { fontFamily: 'Instrument Serif', fontSize: 19.2, fontStyle: 'italic', color: '#626753', lineHeight: 1, letterSpacing: 0, opacity: 0.76 },
        { ipad: { frame: { x: 272.63, y: 434.36, width: 222.75 } }, desktop: { frame: { x: 475, y: 411.58, width: 250, height: 33.8 }, style: { fontSize: 33.792 } } }),
      'opening-julian': openingText('opening-julian', 'JULIAN', { x: 76.92, y: 386.72, width: 236.14, height: 56.3 },
        { fontFamily: 'Baskervville', fontSize: 61.2, color: '#45402B', lineHeight: 0.92, letterSpacing: 1.08 },
        { ipad: { frame: { x: 265.36, y: 461.94, width: 237.27, height: 56.58 }, style: { fontSize: 61.5 } }, desktop: { frame: { x: 391.2, y: 456.84, width: 417.58, height: 99.56 }, style: { fontSize: 108.24, letterSpacing: 1.9008 } } }),
      'opening-date': openingText('opening-date', 'Tuesday, August 24, 2027', { x: 32.38, y: 479.02, width: 325.23, height: 32 },
        { fontFamily: 'Instrument Sans', fontSize: 12, color: '#45402B', lineHeight: 1.45, letterSpacing: 0.96 },
        { ipad: { frame: { x: 151.97, y: 554.52, width: 464.06 } }, desktop: { frame: { x: 235.92, y: 597.2, width: 728.16 } } }),
      'opening-location': openingText('opening-location', 'Ottawa, Ontario', { x: 32.38, y: 504.41, width: 325.23, height: 32 },
        { fontFamily: 'Instrument Sans', fontSize: 10, color: '#3F4037', lineHeight: 1.5, letterSpacing: 1.2, opacity: 0.93 },
        { ipad: { frame: { x: 151.97, y: 579.91, width: 464.06 } }, desktop: { frame: { x: 235.92, y: 622.59, width: 728.16 } } }),
      'opening-scroll': openingText('opening-scroll', 'Scroll to view', { x: 32.38, y: 567.41, width: 325.23, height: 32 },
        { fontFamily: 'Instrument Sans', fontSize: 8, color: '#5F6051', lineHeight: 1.2, letterSpacing: 1.92 },
        { ipad: { frame: { x: 151.97, y: 644.91, width: 464.06 } }, desktop: { frame: { x: 235.92, y: 695.19, width: 728.16 } } }),
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
