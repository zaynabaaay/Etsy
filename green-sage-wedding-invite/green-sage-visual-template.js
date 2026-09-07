(() => {
  // Temporary schema-4 template shell. Real Green Sage sections are migrated in
  // later, section-scoped passes.
  const defaultDocument = {
    schemaVersion: 4,
    document: {
      id: 'green-sage-visual-template', templateId: 'green-sage', title: 'Green Sage invitation',
      colors: ['#F4EFE7', '#EAE2D7', '#D8CEC1', '#A3A792', '#6B6A54', '#474232'],
      canvas: { baseWidth: 390, maxRenderedWidth: 560, viewportBackground: '#F4EFE7', safeMargin: 20 },
      sectionOrder: ['green-sage-placeholder'], media: { audio: null }
    },
    sections: {
      'green-sage-placeholder': {
        id: 'green-sage-placeholder', name: 'Green Sage template migration', height: 844, heightPreset: 'full',
        background: { kind: 'color', color: '#F4EFE7', assetId: '', assetKind: 'template', focalX: 50, focalY: 50, zoom: 1 },
        elementOrder: [], responsive: {}
      }
    },
    elements: {}
  };
  const clone = () => JSON.parse(JSON.stringify(defaultDocument));
  globalThis.GreenSageVisualTemplate = Object.freeze({
    templateId: 'green-sage', storageKey: 'storiel-visual-document:green-sage:v1', defaultDocument: Object.freeze(defaultDocument), cloneDefault: clone
  });
})();
