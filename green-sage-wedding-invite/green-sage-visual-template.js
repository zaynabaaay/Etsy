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
  const dayText = (id, content, frame, style, overrides = {}) => {
    const { opacity = 1, ...textStyle } = style;
    return {
      id, sectionId: 'the-day', type: 'text', content, frame, rotation: 0, opacity,
      style: { fontWeight: 400, fontStyle: 'normal', textAlign: 'center', ...textStyle },
      responsive: { strategy: 'scale', anchorX: 'center', ...(Object.keys(overrides).length ? { overrides } : {}) },
      permissions: { ...permissions }
    };
  };
  const dayDivider = (id, frame, overrides) => ({
    id, sectionId: 'the-day', type: 'divider', visible: false, frame, rotation: 0, opacity: 0.18,
    style: { color: '#F4EFE7' },
    responsive: { strategy: 'scale', anchorX: 'center', overrides },
    permissions: { ...permissions }
  });
  const detailsText = (id, content, frame, style, overrides = {}) => {
    const { opacity = 1, ...textStyle } = style;
    return {
      id, sectionId: 'details', type: 'text', content, frame, rotation: 0, opacity,
      style: { fontWeight: 400, fontStyle: 'normal', textAlign: 'left', ...textStyle },
      responsive: { strategy: 'scale', anchorX: 'center', ...(Object.keys(overrides).length ? { overrides } : {}) },
      permissions: { ...permissions }
    };
  };
  const detailsDivider = (id, frame, overrides) => ({
    id, sectionId: 'details', type: 'divider', visible: false, frame, rotation: 0, opacity: 0.28,
    style: { color: '#858977' },
    responsive: { strategy: 'scale', anchorX: 'center', overrides },
    permissions: { ...permissions }
  });
  const defaultDocument = {
    schemaVersion: 4,
    document: {
      id: 'green-sage-visual-template', templateId: 'green-sage', title: 'Green Sage invitation',
      colors: ['#F4EFE7', '#E6E5DF', '#858977', '#626753', '#44463D', '#5F6051'],
      canvas: { baseWidth: 390, maxRenderedWidth: 560, viewportBackground: '#F4EFE7', safeMargin: 20 },
      sectionOrder: ['opening', 'ceremony', 'the-day', 'details'], media: { audio: null }
    },
    sections: {
      opening: {
        id: 'opening', name: 'Opening', height: 844, heightPreset: 'full',
        background: { kind: 'image', color: '#ECE6DF', assetId: 'background-green-sage-opening', assetKind: 'template', focalX: 50, focalY: 50, zoom: 1 },
        elementOrder: ['opening-intro-1', 'opening-intro-2', 'opening-isabella', 'opening-and', 'opening-julian', 'opening-date', 'opening-location', 'opening-scroll'],
        responsive: { overrides: { ipad: { height: 1024 }, desktop: { height: 1000 } } }
      },
      ceremony: {
        id: 'ceremony', name: 'Ceremony', height: 844, heightPreset: 'full',
        background: { kind: 'color', color: '#E6E5DF', assetId: '', assetKind: 'template', focalX: 50, focalY: 50, zoom: 1 },
        elementOrder: ['ceremony-label', 'ceremony-time', 'ceremony-glasshouse', 'ceremony-venue', 'ceremony-address', 'ceremony-note'],
        responsive: { overrides: { ipad: { height: 1024 }, desktop: { height: 1000 } } }
      },
      'the-day': {
        id: 'the-day', name: 'The Day', height: 450.25, heightPreset: 'custom',
        background: { kind: 'color', color: '#858977', assetId: '', assetKind: 'template', focalX: 50, focalY: 50, zoom: 1 },
        elementOrder: [
          'the-day-label',
          'the-day-time-1', 'the-day-event-1',
          'the-day-divider-1', 'the-day-time-2', 'the-day-event-2',
          'the-day-divider-2', 'the-day-time-3', 'the-day-event-3',
          'the-day-divider-3', 'the-day-time-4', 'the-day-event-4',
          'the-day-divider-4', 'the-day-time-5', 'the-day-event-5'
        ],
        responsive: { overrides: { ipad: { height: 500 }, desktop: { height: 540 } } }
      },
      details: {
        id: 'details', name: 'Details', height: 423.09, heightPreset: 'custom',
        background: { kind: 'color', color: '#F4EFE7', assetId: '', assetKind: 'template', focalX: 50, focalY: 50, zoom: 1 },
        elementOrder: [
          'details-label',
          'details-dress-code-title', 'details-dress-code-copy',
          'details-divider-1', 'details-parking-title', 'details-parking-copy',
          'details-divider-2', 'details-adults-only-title', 'details-adults-only-copy'
        ],
        responsive: { overrides: { ipad: { height: 500 }, desktop: { height: 540 } } }
      }
    },
    elements: {
      'opening-intro-1': openingText('opening-intro-1', 'Together with their families', { x: 32.38, y: 232.58, width: 325.23, height: 32 },
        { fontFamily: 'Instrument Sans', fontSize: 11, color: '#5F6051', lineHeight: 1.55, letterSpacing: 0.99, opacity: 0.96 },
        { ipad: { frame: { x: 151.97, y: 304.37, width: 464.06 } }, desktop: { frame: { x: 235.92, y: 230.8, width: 728.16 }, style: { fontSize: 12, letterSpacing: 1.08 } } }),
      'opening-intro-2': openingText('opening-intro-2', 'invite you to celebrate the marriage of', { x: 32.38, y: 254.63, width: 325.23, height: 32 },
        { fontFamily: 'Instrument Sans', fontSize: 11, color: '#5F6051', lineHeight: 1.55, letterSpacing: 0.99, opacity: 0.96 },
        { ipad: { frame: { x: 151.97, y: 326.42, width: 464.06 } }, desktop: { frame: { x: 235.92, y: 254.39, width: 728.16 }, style: { fontSize: 12, letterSpacing: 1.08 } } }),
      'opening-isabella': openingText('opening-isabella', 'ISABELLA', { x: 43.31, y: 295.67, width: 303.34, height: 53.55 },
        { fontFamily: 'Baskervville', fontSize: 58.2, color: '#44463D', lineHeight: 0.92, letterSpacing: 1.08 },
        { ipad: { frame: { x: 233.84, y: 371.47, width: 300.31, height: 52.98 }, style: { fontSize: 57.6 } }, desktop: { frame: { x: 335.73, y: 304.17, width: 528.52, height: 93.25 }, style: { fontSize: 101.376, letterSpacing: 1.9008 } } }),
      'opening-and': openingText('opening-and', 'and', { x: 105.55, y: 359.14, width: 178.88, height: 32 },
        { fontFamily: 'Instrument Serif', fontSize: 19.2, fontStyle: 'italic', color: '#626753', lineHeight: 1, letterSpacing: 0, opacity: 0.76 },
        { ipad: { frame: { x: 272.63, y: 434.36, width: 222.75 } }, desktop: { frame: { x: 475, y: 411.58, width: 250, height: 33.8 }, style: { fontSize: 33.792 } } }),
      'opening-julian': openingText('opening-julian', 'JULIAN', { x: 76.92, y: 386.72, width: 236.14, height: 56.3 },
        { fontFamily: 'Baskervville', fontSize: 61.2, color: '#44463D', lineHeight: 0.92, letterSpacing: 1.08 },
        { ipad: { frame: { x: 265.36, y: 461.94, width: 237.27, height: 56.58 }, style: { fontSize: 61.5 } }, desktop: { frame: { x: 391.2, y: 456.84, width: 417.58, height: 99.56 }, style: { fontSize: 108.24, letterSpacing: 1.9008 } } }),
      'opening-date': openingText('opening-date', 'Tuesday, August 24, 2027', { x: 32.38, y: 479.02, width: 325.23, height: 32 },
        { fontFamily: 'Instrument Sans', fontSize: 12, color: '#44463D', lineHeight: 1.45, letterSpacing: 0.96 },
        { ipad: { frame: { x: 151.97, y: 554.52, width: 464.06 } }, desktop: { frame: { x: 235.92, y: 597.2, width: 728.16 } } }),
      'opening-location': openingText('opening-location', 'Ottawa, Ontario', { x: 32.38, y: 504.41, width: 325.23, height: 32 },
        { fontFamily: 'Instrument Sans', fontSize: 10, color: '#5F6051', lineHeight: 1.5, letterSpacing: 1.2, opacity: 0.93 },
        { ipad: { frame: { x: 151.97, y: 579.91, width: 464.06 } }, desktop: { frame: { x: 235.92, y: 622.59, width: 728.16 } } }),
      'opening-scroll': openingText('opening-scroll', 'Scroll to view', { x: 32.38, y: 567.41, width: 325.23, height: 32 },
        { fontFamily: 'Instrument Sans', fontSize: 8, color: '#5F6051', lineHeight: 1.2, letterSpacing: 1.92 },
        { ipad: { frame: { x: 151.97, y: 644.91, width: 464.06 } }, desktop: { frame: { x: 235.92, y: 695.19, width: 728.16 } } }),
      'ceremony-label': text('ceremony-label', 'CEREMONY', { x: 95, y: 228, width: 200, height: 32 },
        { fontFamily: 'Instrument Sans', fontSize: 10, color: '#626753', lineHeight: 1.5, letterSpacing: 3, opacity: 0.92 },
        { ipad: { frame: { x: 284, y: 321 } }, desktop: { frame: { x: 500, y: 278 } } }),
      'ceremony-time': text('ceremony-time', '3:00 PM', { x: 95, y: 264, width: 200, height: 32 },
        { fontFamily: 'Instrument Sans', fontSize: 13, color: '#626753', lineHeight: 1.5, letterSpacing: 2.34, opacity: 0.92 },
        { ipad: { frame: { x: 284, y: 363 } }, desktop: { frame: { x: 500, y: 318 } } }),
      'ceremony-glasshouse': {
        id: 'ceremony-glasshouse', sectionId: 'ceremony', type: 'decorative', assetId: 'venue-glasshouse', assetKind: 'template', alt: 'Glasshouse illustration',
        frame: { x: 30, y: 306, width: 330, height: 160.875 }, rotation: 0, opacity: 0.58,
        crop: { flipX: false, flipY: false, fit: 'contain', focalX: 50, focalY: 50, zoom: 1 },
        responsive: { strategy: 'scale', anchorX: 'center', overrides: {
          ipad: { frame: { x: 174, y: 405, width: 420, height: 204.75 } },
          desktop: { frame: { x: 300, y: 360, width: 600, height: 292.5 } }
        } },
        permissions: { ...permissions }
      },
      'ceremony-venue': text('ceremony-venue', 'The Glasshouse', { x: 35, y: 475, width: 320, height: 56 },
        { fontFamily: 'Instrument Serif', fontSize: 46.8, color: '#44463D', lineHeight: 0.98, letterSpacing: 0.468 },
        {
          ipad: { frame: { x: 224, y: 618 }, style: { fontSize: 48, letterSpacing: 0.48 } },
          desktop: { frame: { x: 350, y: 661, width: 500, height: 74 }, style: { fontSize: 62.4, letterSpacing: 0.624 } }
        }),
      'ceremony-address': text('ceremony-address', '123 Example Street\nOttawa, Ontario', { x: 70, y: 545, width: 250, height: 52 },
        { fontFamily: 'Instrument Sans', fontSize: 11, color: '#44463D', lineHeight: 2, letterSpacing: 0.88, opacity: 0.82 },
        { ipad: { frame: { x: 259, y: 690 } }, desktop: { frame: { x: 475, y: 743 } } }),
      'ceremony-note': text('ceremony-note', 'Please arrive 15 minutes early.', { x: 65, y: 612, width: 260, height: 32 },
        { fontFamily: 'Instrument Serif', fontSize: 15, fontStyle: 'italic', color: '#44463D', lineHeight: 1.45, letterSpacing: 0.15, opacity: 0.86 },
        { ipad: { frame: { x: 254, y: 757 } }, desktop: { frame: { x: 470, y: 810 } } }),
      'the-day-label': dayText('the-day-label', 'THE DAY', { x: 24, y: 120, width: 342, height: 32 },
        { fontFamily: 'Instrument Sans', fontSize: 10, color: '#F4EFE7', lineHeight: 1.5, letterSpacing: 3.4, opacity: 0.94 },
        { ipad: { frame: { x: 48, y: 160.5, width: 672 } }, desktop: { frame: { x: 48, y: 173.7, width: 1104 } } }),
      'the-day-time-1': dayText('the-day-time-1', '3:00 PM', { x: 24, y: 184, width: 82, height: 32 },
        { fontFamily: 'Instrument Sans', fontSize: 11, color: '#F4EFE7', textAlign: 'right', lineHeight: 1.4, letterSpacing: 1.76, opacity: 0.72 },
        { ipad: { frame: { x: 48, y: 254.4, width: 134.4 }, style: { fontSize: 10.5, textAlign: 'center', letterSpacing: 1.68 } }, desktop: { frame: { x: 48, y: 275.7, width: 220.8 }, style: { fontSize: 10.5, textAlign: 'center', letterSpacing: 1.68 } } }),
      'the-day-event-1': dayText('the-day-event-1', 'Ceremony', { x: 130, y: 175, width: 236, height: 32 },
        { fontFamily: 'Instrument Serif', fontSize: 21, color: '#F4EFE7', textAlign: 'left', lineHeight: 1.25, letterSpacing: 0.315 },
        { ipad: { frame: { x: 48, y: 285.1, width: 134.4 }, style: { fontSize: 22, textAlign: 'center', letterSpacing: 0.33 } }, desktop: { frame: { x: 48, y: 308.4, width: 220.8 }, style: { fontSize: 22.8, textAlign: 'center', letterSpacing: 0.342 } } }),
      'the-day-time-2': dayText('the-day-time-2', '4:00 PM', { x: 24, y: 234.25, width: 82, height: 32 },
        { fontFamily: 'Instrument Sans', fontSize: 11, color: '#F4EFE7', textAlign: 'right', lineHeight: 1.4, letterSpacing: 1.76, opacity: 0.72 },
        { ipad: { frame: { x: 182.4, y: 254.4, width: 134.4 }, style: { fontSize: 10.5, textAlign: 'center', letterSpacing: 1.68 } }, desktop: { frame: { x: 268.8, y: 275.7, width: 220.8 }, style: { fontSize: 10.5, textAlign: 'center', letterSpacing: 1.68 } } }),
      'the-day-event-2': dayText('the-day-event-2', 'Cocktail Hour', { x: 130, y: 225.25, width: 236, height: 32 },
        { fontFamily: 'Instrument Serif', fontSize: 21, color: '#F4EFE7', textAlign: 'left', lineHeight: 1.25, letterSpacing: 0.315 },
        { ipad: { frame: { x: 182.4, y: 285.1, width: 134.4 }, style: { fontSize: 22, textAlign: 'center', letterSpacing: 0.33 } }, desktop: { frame: { x: 268.8, y: 308.4, width: 220.8 }, style: { fontSize: 22.8, textAlign: 'center', letterSpacing: 0.342 } } }),
      'the-day-time-3': dayText('the-day-time-3', '5:30 PM', { x: 24, y: 284.5, width: 82, height: 32 },
        { fontFamily: 'Instrument Sans', fontSize: 11, color: '#F4EFE7', textAlign: 'right', lineHeight: 1.4, letterSpacing: 1.76, opacity: 0.72 },
        { ipad: { frame: { x: 316.8, y: 254.4, width: 134.4 }, style: { fontSize: 10.5, textAlign: 'center', letterSpacing: 1.68 } }, desktop: { frame: { x: 489.6, y: 275.7, width: 220.8 }, style: { fontSize: 10.5, textAlign: 'center', letterSpacing: 1.68 } } }),
      'the-day-event-3': dayText('the-day-event-3', 'Dinner', { x: 130, y: 275.5, width: 236, height: 32 },
        { fontFamily: 'Instrument Serif', fontSize: 21, color: '#F4EFE7', textAlign: 'left', lineHeight: 1.25, letterSpacing: 0.315 },
        { ipad: { frame: { x: 316.8, y: 285.1, width: 134.4 }, style: { fontSize: 22, textAlign: 'center', letterSpacing: 0.33 } }, desktop: { frame: { x: 489.6, y: 308.4, width: 220.8 }, style: { fontSize: 22.8, textAlign: 'center', letterSpacing: 0.342 } } }),
      'the-day-time-4': dayText('the-day-time-4', '7:00 PM', { x: 24, y: 334.75, width: 82, height: 32 },
        { fontFamily: 'Instrument Sans', fontSize: 11, color: '#F4EFE7', textAlign: 'right', lineHeight: 1.4, letterSpacing: 1.76, opacity: 0.72 },
        { ipad: { frame: { x: 451.2, y: 254.4, width: 134.4 }, style: { fontSize: 10.5, textAlign: 'center', letterSpacing: 1.68 } }, desktop: { frame: { x: 710.4, y: 275.7, width: 220.8 }, style: { fontSize: 10.5, textAlign: 'center', letterSpacing: 1.68 } } }),
      'the-day-event-4': dayText('the-day-event-4', 'Dancing', { x: 130, y: 325.75, width: 236, height: 32 },
        { fontFamily: 'Instrument Serif', fontSize: 21, color: '#F4EFE7', textAlign: 'left', lineHeight: 1.25, letterSpacing: 0.315 },
        { ipad: { frame: { x: 451.2, y: 285.1, width: 134.4 }, style: { fontSize: 22, textAlign: 'center', letterSpacing: 0.33 } }, desktop: { frame: { x: 710.4, y: 308.4, width: 220.8 }, style: { fontSize: 22.8, textAlign: 'center', letterSpacing: 0.342 } } }),
      'the-day-time-5': dayText('the-day-time-5', '10:00 PM', { x: 24, y: 385, width: 82, height: 32 },
        { fontFamily: 'Instrument Sans', fontSize: 11, color: '#F4EFE7', textAlign: 'right', lineHeight: 1.4, letterSpacing: 1.76, opacity: 0.72 },
        { ipad: { frame: { x: 585.6, y: 254.4, width: 134.4 }, style: { fontSize: 10.5, textAlign: 'center', letterSpacing: 1.68 } }, desktop: { frame: { x: 931.2, y: 275.7, width: 220.8 }, style: { fontSize: 10.5, textAlign: 'center', letterSpacing: 1.68 } } }),
      'the-day-event-5': dayText('the-day-event-5', 'Late Night', { x: 130, y: 376, width: 236, height: 32 },
        { fontFamily: 'Instrument Serif', fontSize: 21, color: '#F4EFE7', textAlign: 'left', lineHeight: 1.25, letterSpacing: 0.315 },
        { ipad: { frame: { x: 585.6, y: 285.1, width: 134.4 }, style: { fontSize: 22, textAlign: 'center', letterSpacing: 0.33 } }, desktop: { frame: { x: 931.2, y: 308.4, width: 220.8 }, style: { fontSize: 22.8, textAlign: 'center', letterSpacing: 0.342 } } }),
      'the-day-divider-1': dayDivider('the-day-divider-1', { x: 130, y: 135, width: 1, height: 112 }, { ipad: { visible: true, frame: { x: 182.4, y: 227.5 } }, desktop: { visible: true, frame: { x: 268.8, y: 246.3, height: 120 } } }),
      'the-day-divider-2': dayDivider('the-day-divider-2', { x: 130, y: 185.25, width: 1, height: 112 }, { ipad: { visible: true, frame: { x: 316.8, y: 227.5 } }, desktop: { visible: true, frame: { x: 489.6, y: 246.3, height: 120 } } }),
      'the-day-divider-3': dayDivider('the-day-divider-3', { x: 130, y: 235.5, width: 1, height: 112 }, { ipad: { visible: true, frame: { x: 451.2, y: 227.5 } }, desktop: { visible: true, frame: { x: 710.4, y: 246.3, height: 120 } } }),
      'the-day-divider-4': dayDivider('the-day-divider-4', { x: 130, y: 285.75, width: 1, height: 112 }, { ipad: { visible: true, frame: { x: 585.6, y: 227.5 } }, desktop: { visible: true, frame: { x: 931.2, y: 246.3, height: 120 } } }),
      'details-label': detailsText('details-label', 'DETAILS', { x: 24, y: 78, width: 342, height: 32 },
        { fontFamily: 'Instrument Sans', fontSize: 10, color: '#626753', lineHeight: 1.5, letterSpacing: 3.2, opacity: 0.9 },
        { ipad: { frame: { x: 48, y: 167.5, width: 672 } }, desktop: { frame: { x: 80, y: 182.5, width: 1040 } } }),
      'details-dress-code-title': detailsText('details-dress-code-title', 'Dress Code', { x: 24, y: 133, width: 342, height: 32 },
        { fontFamily: 'Instrument Sans', fontSize: 13.5, color: '#44463D', lineHeight: 1.4, letterSpacing: 1.485 },
        { ipad: { frame: { x: 78, y: 232.5, width: 164 }, style: { textAlign: 'center' } }, desktop: { frame: { x: 122, y: 253.5, width: 262.67 }, style: { fontSize: 13, textAlign: 'center', letterSpacing: 1.43 } } }),
      'details-dress-code-copy': detailsText('details-dress-code-copy', 'Formal attire', { x: 24, y: 160.9, width: 310, height: 32 },
        { fontFamily: 'Instrument Sans', fontSize: 13, color: '#5F6051', lineHeight: 1.6, letterSpacing: 0.325, opacity: 0.82 },
        { ipad: { frame: { x: 78, y: 264.4, width: 164, height: 42 }, style: { fontSize: 12.5, textAlign: 'center', letterSpacing: 0.3125, lineHeight: 1.65 } }, desktop: { frame: { x: 128.33, y: 285.7, width: 250, height: 40 }, style: { fontSize: 12, textAlign: 'center', letterSpacing: 0.3, lineHeight: 1.65 } } }),
      'details-divider-1': detailsDivider('details-divider-1', { x: 24, y: 133, width: 1, height: 206.1 }, { ipad: { visible: true, frame: { x: 272, y: 230.5, height: 102 } }, desktop: { visible: true, frame: { x: 426.67, y: 251.5, height: 106 } } }),
      'details-parking-title': detailsText('details-parking-title', 'Parking', { x: 24, y: 211.7, width: 342, height: 32 },
        { fontFamily: 'Instrument Sans', fontSize: 13.5, color: '#44463D', lineHeight: 1.4, letterSpacing: 1.485 },
        { ipad: { frame: { x: 302, y: 232.5, width: 164 }, style: { textAlign: 'center' } }, desktop: { frame: { x: 468.67, y: 253.5, width: 262.67 }, style: { fontSize: 13, textAlign: 'center', letterSpacing: 1.43 } } }),
      'details-parking-copy': detailsText('details-parking-copy', 'Complimentary parking is available on site.', { x: 24, y: 239.6, width: 310, height: 32 },
        { fontFamily: 'Instrument Sans', fontSize: 13, color: '#5F6051', lineHeight: 1.6, letterSpacing: 0.325, opacity: 0.82 },
        { ipad: { frame: { x: 302, y: 264.4, width: 164, height: 42 }, style: { fontSize: 12.5, textAlign: 'center', letterSpacing: 0.3125, lineHeight: 1.65 } }, desktop: { frame: { x: 475, y: 285.7, width: 250, height: 40 }, style: { fontSize: 12, textAlign: 'center', letterSpacing: 0.3, lineHeight: 1.65 } } }),
      'details-divider-2': detailsDivider('details-divider-2', { x: 24, y: 211.7, width: 1, height: 127.4 }, { ipad: { visible: true, frame: { x: 496, y: 230.5, height: 102 } }, desktop: { visible: true, frame: { x: 773.33, y: 251.5, height: 106 } } }),
      'details-adults-only-title': detailsText('details-adults-only-title', 'Adults Only', { x: 24, y: 290.4, width: 342, height: 32 },
        { fontFamily: 'Instrument Sans', fontSize: 13.5, color: '#44463D', lineHeight: 1.4, letterSpacing: 1.485 },
        { ipad: { frame: { x: 526, y: 232.5, width: 164 }, style: { textAlign: 'center' } }, desktop: { frame: { x: 815.33, y: 253.5, width: 262.67 }, style: { fontSize: 13, textAlign: 'center', letterSpacing: 1.43 } } }),
      'details-adults-only-copy': detailsText('details-adults-only-copy', 'We kindly request an adults-only celebration.', { x: 24, y: 318.3, width: 310, height: 32 },
        { fontFamily: 'Instrument Sans', fontSize: 13, color: '#5F6051', lineHeight: 1.6, letterSpacing: 0.325, opacity: 0.82 },
        { ipad: { frame: { x: 526, y: 264.4, width: 164, height: 42 }, style: { fontSize: 12.5, textAlign: 'center', letterSpacing: 0.3125, lineHeight: 1.65 } }, desktop: { frame: { x: 821.67, y: 285.7, width: 250, height: 40 }, style: { fontSize: 12, textAlign: 'center', letterSpacing: 0.3, lineHeight: 1.65 } } })
    }
  };
  const clone = () => JSON.parse(JSON.stringify(defaultDocument));
  globalThis.GreenSageVisualTemplate = Object.freeze({
    templateId: 'green-sage', storageKey: 'storiel-visual-document:green-sage:v1', defaultDocument: Object.freeze(defaultDocument), cloneDefault: clone
  });
})();
