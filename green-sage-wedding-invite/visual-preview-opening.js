(() => {
  if (document.documentElement.dataset.editorSurface !== 'preview') return;

  const root = document.getElementById('canvasRoot');
  const overlay = document.querySelector('[data-recipient-envelope]');
  if (!root || !overlay || overlay.dataset.recipientOpeningReady !== undefined) return;
  overlay.dataset.recipientOpeningReady = '';
  overlay.setAttribute('aria-busy', 'false');

  const openingAnimations = Object.freeze({
    'opening-intro-1': { duration: 720, delay: 180 },
    'opening-intro-2': { duration: 720, delay: 180 },
    'opening-isabella': { duration: 860, delay: 920 },
    'opening-and': { duration: 860, delay: 920 },
    'opening-julian': { duration: 860, delay: 920 },
    'opening-date': { duration: 720, delay: 1800 },
    'opening-location': { duration: 720, delay: 1900 },
    'opening-scroll': { duration: 640, delay: 2480 }
  });
  const copySettledAfter = 3120;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let phase = 'envelope';
  let openingStarted = false;
  let copyStartedAt = 0;
  let copyCompletionTimer = 0;

  const seal = overlay.querySelector('.recipient-envelope-seal');
  const flapBack = overlay.querySelector('.recipient-envelope-flap-back');
  const card = overlay.querySelector('.recipient-envelope-card');
  const status = overlay.querySelector('[data-recipient-status]');

  const updateSealInitials = () => {
    const firstName = root.querySelector('[data-element-id="opening-isabella"] .element-content')?.textContent.trim();
    const secondName = root.querySelector('[data-element-id="opening-julian"] .element-content')?.textContent.trim();
    const first = overlay.querySelector('[data-recipient-initial="first"]');
    const second = overlay.querySelector('[data-recipient-initial="second"]');
    if (firstName && first) first.textContent = firstName.charAt(0).toUpperCase();
    if (secondName && second) second.textContent = secondName.charAt(0).toUpperCase();
  };

  const waitForAnimation = (target, animationName, fallbackDelay) => new Promise((resolve) => {
    let finished = false;
    let fallback = 0;
    const finish = (event) => {
      if (finished || (event && event.animationName !== animationName)) return;
      finished = true;
      window.clearTimeout(fallback);
      target.removeEventListener('animationend', finish);
      target.removeEventListener('animationcancel', finish);
      resolve();
    };
    fallback = window.setTimeout(() => finish(), fallbackDelay);
    target.addEventListener('animationend', finish);
    target.addEventListener('animationcancel', finish);
  });

  const openingLayer = (id) => root.querySelector(`[data-element-id="${id}"] .element-animation-layer`);
  const clearOpeningAnimationStyles = () => Object.keys(openingAnimations).forEach((id) => openingLayer(id)?.removeAttribute('style'));

  const applyOpeningAnimations = () => {
    if (phase !== 'copy') return;
    const elapsed = Math.max(0, performance.now() - copyStartedAt);
    Object.entries(openingAnimations).forEach(([id, timing]) => {
      const layer = openingLayer(id);
      if (!layer || layer.dataset.recipientOpeningAttached === String(copyStartedAt)) return;
      layer.dataset.recipientOpeningAttached = String(copyStartedAt);
      layer.style.animationName = 'recipientOpeningFade';
      layer.style.animationDuration = `${timing.duration}ms`;
      layer.style.animationDelay = `${timing.delay - elapsed}ms`;
      layer.style.animationTimingFunction = 'cubic-bezier(.22,.66,.2,1)';
      layer.style.animationFillMode = 'both';
    });
  };

  const completeCopyReveal = () => {
    if (phase !== 'copy') return;
    phase = 'complete';
    window.clearTimeout(copyCompletionTimer);
    document.documentElement.classList.remove('recipient-opening-copy');
    document.documentElement.classList.add('recipient-opening-complete');
    clearOpeningAnimationStyles();
  };

  const startCopyReveal = () => {
    phase = 'copy';
    copyStartedAt = performance.now();
    document.documentElement.classList.remove('recipient-envelope-active', 'recipient-opening-pending');
    document.documentElement.classList.add('recipient-opening-copy');
    overlay.remove();
    applyOpeningAnimations();
    copyCompletionTimer = window.setTimeout(completeCopyReveal, copySettledAfter + 40);
  };

  const showInvitationImmediately = () => {
    phase = 'complete';
    document.documentElement.classList.remove('recipient-envelope-active', 'recipient-opening-pending', 'recipient-opening-copy');
    document.documentElement.classList.add('recipient-opening-complete');
    overlay.remove();
    clearOpeningAnimationStyles();
  };

  const runOpening = async () => {
    if (openingStarted) return;
    openingStarted = true;
    seal.disabled = true;
    status.textContent = 'Opening the invitation.';

    if (reduceMotion) {
      showInvitationImmediately();
      return;
    }

    overlay.classList.add('is-opening');
    await waitForAnimation(flapBack, 'recipientFlapBackOpen', 1500);
    overlay.classList.add('is-card-rising');
    await waitForAnimation(card, 'recipientCardRise', 1300);
    overlay.classList.remove('is-card-rising');
    overlay.classList.add('is-card-turning');
    await waitForAnimation(card, 'recipientCardTurn', 900);
    overlay.classList.remove('is-card-turning');
    overlay.classList.add('is-card-approaching');
    await waitForAnimation(card, 'recipientCardApproach', 700);
    startCopyReveal();
  };

  const renderObserver = new MutationObserver(() => {
    updateSealInitials();
    if (phase === 'copy') requestAnimationFrame(applyOpeningAnimations);
    if (phase === 'complete') requestAnimationFrame(clearOpeningAnimationStyles);
  });
  renderObserver.observe(root, { childList: true, subtree: true });

  seal.addEventListener('click', runOpening, { once: true });
  updateSealInitials();
})();
