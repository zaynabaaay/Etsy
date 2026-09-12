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
  const applyTemplateMigrations = (resource, source) => {
    const currentRevision = Number.isInteger(resource.templateRevision) ? resource.templateRevision : 0;
    const completedRevision = Number.isInteger(source.document?.templateRevision) ? source.document.templateRevision : 0;
    if (completedRevision >= currentRevision) return { state: source, migrated: false };
    const migrations = [...(resource.templateMigrations || [])].sort((left, right) => left.revision - right.revision);
    let state = source;
    let revision = completedRevision;
    while (revision < currentRevision) {
      const nextRevision = revision + 1;
      const migration = migrations.find((candidate) => candidate.revision === nextRevision);
      if (!migration || typeof migration.migrate !== 'function') throw new Error(`Missing ${resource.templateId} template migration ${nextRevision}`);
      state = migration.migrate(state);
      if (!state?.document || state.document.templateId !== resource.templateId) throw new Error(`Invalid ${resource.templateId} template migration ${nextRevision}`);
      state.document.templateRevision = nextRevision;
      revision = nextRevision;
    }
    return { state, migrated: true };
  };
  const load = (templateId, storage = globalThis.localStorage) => {
    const resource = getTemplate(templateId);
    if (!resource) throw new Error(`Unknown visual template: ${templateId}`);
    const fallback = normalizeDefault(resource);
    try {
      const serialized = storage?.getItem(resource.storageKey);
      if (!serialized) return fallback;
      const parsed = JSON.parse(serialized);
      if (!supportedSavedState(parsed, templateId)) return fallback;
      const schemaMigrated = model.migrate(parsed);
      if (!supportedSavedState(schemaMigrated, templateId)) return fallback;
      const templateResult = applyTemplateMigrations(resource, schemaMigrated);
      const normalized = model.normalize(templateResult.state);
      if (normalized.document.templateId !== templateId) return fallback;
      if (templateResult.migrated) {
        try { storage?.setItem(resource.storageKey, JSON.stringify(normalized)); } catch { /* Return the upgraded in-memory state even when persistence is unavailable. */ }
      }
      return normalized;
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
  globalThis.StorielVisualTemplateLoader = Object.freeze({ getTemplate, load, save, applyTemplateMigrations });
})();
