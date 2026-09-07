(() => {
  const model = globalThis.GreenSageVisualDocument;
  const resources = [globalThis.StorielVisualProofFixture, globalThis.GreenSageVisualTemplate].filter(Boolean);
  const byTemplateId = new Map(resources.map((resource) => [resource.templateId, resource]));
  const getTemplate = (templateId) => byTemplateId.get(templateId) || null;
  const supportedSavedState = (value, templateId) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    const version = Number(value.schemaVersion);
    return Number.isInteger(version) && version >= 1 && version <= model.schemaVersion
      && value.document && typeof value.document === 'object'
      && value.document.templateId === templateId
      && value.sections && typeof value.sections === 'object' && !Array.isArray(value.sections)
      && value.elements && typeof value.elements === 'object' && !Array.isArray(value.elements)
      && Array.isArray(value.document.sectionOrder) && value.document.sectionOrder.length > 0;
  };
  const normalizeDefault = (resource) => model.normalize(resource.cloneDefault());
  const load = (templateId, storage = globalThis.localStorage) => {
    const resource = getTemplate(templateId);
    if (!resource) throw new Error(`Unknown visual template: ${templateId}`);
    const fallback = normalizeDefault(resource);
    try {
      const serialized = storage?.getItem(resource.storageKey);
      if (!serialized) return fallback;
      const parsed = JSON.parse(serialized);
      if (!supportedSavedState(parsed, templateId)) return fallback;
      const normalized = model.normalize(parsed);
      return normalized.document.templateId === templateId ? normalized : fallback;
    } catch {
      return fallback;
    }
  };
  const save = (templateId, authoredState, storage = globalThis.localStorage) => {
    const resource = getTemplate(templateId);
    if (!resource || !supportedSavedState(authoredState, templateId)) return false;
    storage?.setItem(resource.storageKey, JSON.stringify(authoredState));
    return true;
  };
  globalThis.StorielVisualTemplateLoader = Object.freeze({ getTemplate, load, save });
})();
