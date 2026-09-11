(() => {
  const surface = document.documentElement.dataset.editorSurface;
  const dependencies = {
    parent: {
      stylesheet: 'visual-editor.css',
      scripts: ['visual-document.js', 'green-sage-visual-template.js', 'visual-template-loader.js', 'visual-assets.js', 'visual-editor.js']
    },
    canvas: {
      stylesheet: 'visual-canvas.css',
      scripts: ['visual-document.js', 'visual-canvas.js']
    }
  };

  const versionedUrl = (path, version) => {
    const url = new URL(path, window.location.href);
    url.searchParams.set('v', version);
    return url.href;
  };

  const loadScript = (path, version) => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = versionedUrl(path, version);
    script.addEventListener('load', resolve, { once: true });
    script.addEventListener('error', () => reject(new Error(`Unable to load ${path}.`)), { once: true });
    document.body.append(script);
  });

  const loadStylesheet = (path, version) => new Promise((resolve, reject) => {
    const stylesheet = document.getElementById('editorStylesheet');
    stylesheet.addEventListener('load', resolve, { once: true });
    stylesheet.addEventListener('error', () => reject(new Error(`Unable to load ${path}.`)), { once: true });
    stylesheet.href = versionedUrl(path, version);
  });

  const showFailure = (error) => {
    console.error('Storiel editor cache bootstrap failed.', error);
    const message = document.createElement('p');
    message.setAttribute('role', 'alert');
    message.textContent = 'The editor could not load its current files. Refresh to try again.';
    document.body.replaceChildren(message);
  };

  const start = async () => {
    const config = dependencies[surface];
    if (!config) throw new Error(`Unknown editor surface: ${surface || 'missing'}.`);

    const manifestUrl = new URL('visual-editor-version.json', window.location.href);
    manifestUrl.searchParams.set('refresh', String(Date.now()));
    const response = await fetch(manifestUrl, { cache: 'no-store', credentials: 'same-origin' });
    if (!response.ok) throw new Error(`Unable to load editor version (${response.status}).`);
    const manifest = await response.json();
    const version = String(manifest.version || '').trim();
    if (!/^[a-z0-9._-]+$/i.test(version)) throw new Error('Editor version is missing or invalid.');

    const entryUrl = new URL(window.location.href);
    if (entryUrl.searchParams.get('v') !== version) {
      entryUrl.searchParams.set('v', version);
      window.location.replace(entryUrl.href);
      return;
    }

    await loadStylesheet(config.stylesheet, version);
    if (surface === 'parent') {
      const frame = document.getElementById('visualCanvas');
      frame.src = versionedUrl(frame.dataset.entry, version);
    }
    for (const script of config.scripts) await loadScript(script, version);
  };

  start().catch(showFailure);
})();
