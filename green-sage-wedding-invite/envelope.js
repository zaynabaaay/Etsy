(() => {
  const sealInitials = { first: 'A', second: 'G' };
  const seal = document.getElementById('seal');
  const control = document.getElementById('openControl');
  const artboard = document.querySelector('.artboard');
  const card = document.querySelector('.invitation-card');
  const flap = document.querySelector('.flap');
  const status = document.getElementById('status');

  if (!seal || !control || !artboard || !card || !flap || !status) return;

  document.querySelectorAll('[data-seal-initial]').forEach((initial) => {
    initial.textContent = sealInitials[initial.dataset.sealInitial] || '';
  });

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let openingStarted = false;
  let cardPullStarted = false;
  let navigationStarted = false;
  let openingFallback = 0;
  let flapFallback = 0;
  let cardFallback = 0;

  const resetEnvelope = () => {
    window.clearTimeout(openingFallback);
    window.clearTimeout(flapFallback);
    window.clearTimeout(cardFallback);

    openingStarted = false;
    cardPullStarted = false;
    navigationStarted = false;
    openingFallback = 0;
    flapFallback = 0;
    cardFallback = 0;

    control.checked = false;
    seal.disabled = false;
    seal.classList.remove('is-tapped');
    artboard.classList.remove('card-pulling');
    status.textContent = '';
  };

  const finishOpening = () => {
    if (navigationStarted) return;
    navigationStarted = true;
    window.clearTimeout(openingFallback);
    window.clearTimeout(flapFallback);
    window.clearTimeout(cardFallback);
    window.location.assign('invitation.html');
  };

  const startCardPull = () => {
    if (cardPullStarted) return;
    cardPullStarted = true;

    const finishCardPull = (event) => {
      if (event && event.animationName !== 'cardJourney') return;
      card.removeEventListener('animationend', finishCardPull);
      window.clearTimeout(cardFallback);
      finishOpening();
    };

    card.addEventListener('animationend', finishCardPull);
    cardFallback = window.setTimeout(finishCardPull, 2300);
    artboard.classList.add('card-pulling');
  };

  const openInvitation = () => {
    if (openingStarted) return;
    openingStarted = true;
    seal.disabled = true;
    seal.classList.add('is-tapped');
    control.checked = true;
    status.textContent = 'Opening the invitation.';

    if (reduceMotion) {
      finishOpening();
      return;
    }

    openingFallback = window.setTimeout(finishOpening, 4800);

    const finishFlap = (event) => {
      if (event?.type === 'animationend' && event.animationName !== 'flapBackOpen') return;
      flap.removeEventListener('animationend', finishFlap);
      flap.removeEventListener('animationcancel', finishFlap);
      window.clearTimeout(flapFallback);
      startCardPull();
    };

    flap.addEventListener('animationend', finishFlap);
    flap.addEventListener('animationcancel', finishFlap);
    flapFallback = window.setTimeout(finishFlap, 1500);
  };

  const requestOpening = (event) => {
    if (event.type === 'mousedown' && event.button !== 0) return;
    openInvitation();
  };

  seal.addEventListener('mousedown', requestOpening);
  seal.addEventListener('click', requestOpening);

  resetEnvelope();
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) resetEnvelope();
  });
})();
