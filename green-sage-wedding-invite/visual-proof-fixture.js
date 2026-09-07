(() => {
  const defaultDocument = {
    schemaVersion: 4,
    document: {
      id: 'green-sage-visual-proof', templateId: 'visual-proof', title: 'Visual editor proof fixture',
      colors: ['#F4EFE7', '#EAE2D7', '#D8CEC1', '#A3A792', '#6B6A54', '#474232'],
      canvas: { baseWidth: 390, maxRenderedWidth: 560, viewportBackground: '#F4EFE7', safeMargin: 20 },
      sectionOrder: ['proof-section'], media: { audio: null }
    },
    sections: {
      'proof-section': {
        id: 'proof-section', name: 'Opening canvas', height: 844, heightPreset: 'full',
        background: { kind: 'color', color: '#EAE2D7', assetId: '', assetKind: 'template', focalX: 50, focalY: 50, zoom: 1 },
        elementOrder: ['proof-heading', 'proof-copy'], responsive: {}
      }
    },
    elements: {
      'proof-heading': {
        id: 'proof-heading', sectionId: 'proof-section', type: 'text', content: 'A BEAUTIFUL BEGINNING',
        frame: { x: 35, y: 184, width: 320, height: 92 }, rotation: 0, opacity: 1,
        style: { fontFamily: 'Instrument Serif', fontSize: 46, fontWeight: 400, fontStyle: 'normal', color: '#474232', textAlign: 'center', lineHeight: 1.04, letterSpacing: 0 },
        responsive: { strategy: 'scale', anchorX: 'center' }, permissions: { editable: true, movable: true, resizable: true, deletable: true, locked: false }
      },
      'proof-copy': {
        id: 'proof-copy', sectionId: 'proof-section', type: 'text', content: 'Tap once to select. Tap again to place the caret and type.',
        frame: { x: 58, y: 324, width: 274, height: 78 }, rotation: 0, opacity: 1,
        style: { fontFamily: 'Instrument Sans', fontSize: 15, fontWeight: 400, fontStyle: 'normal', color: '#6B6A54', textAlign: 'center', lineHeight: 1.5, letterSpacing: 0.35 },
        responsive: { strategy: 'scale', anchorX: 'center' }, permissions: { editable: true, movable: true, resizable: true, deletable: true, locked: false }
      }
    }
  };
  const clone = () => JSON.parse(JSON.stringify(defaultDocument));
  globalThis.StorielVisualProofFixture = Object.freeze({
    templateId: 'visual-proof', storageKey: 'green-sage-visual-proof-v1', defaultDocument: Object.freeze(defaultDocument), cloneDefault: clone
  });
})();
