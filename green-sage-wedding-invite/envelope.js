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
  const cardStageClasses = ['card-rising', 'card-turning', 'card-approaching'];
  let openingStarted = false;
  let cardSequenceStarted = false;
  let navigationStarted = false;
  let openingFallback = 0;
  let flapFallback = 0;
  let cardStageFallback = 0;

  const resetEnvelope = () => {
    window.clearTimeout(openingFallback);
    window.clearTimeout(flapFallback);
    window.clearTimeout(cardStageFallback);

    openingStarted = false;
    cardSequenceStarted = false;
    navigationStarted = false;
    openingFallback = 0;
    flapFallback = 0;
    cardStageFallback = 0;

    control.checked = false;
    seal.disabled = false;
    seal.classList.remove('is-tapped');
    artboard.classList.remove(...cardStageClasses);
    status.textContent = '';
  };

  const finishOpening = () => {
    if (navigationStarted) return;
    navigationStarted = true;
    window.clearTimeout(openingFallback);
    window.clearTimeout(flapFallback);
    window.clearTimeout(cardStageFallback);
    window.location.assign('invitation.html?v=20260802-invitation-handoff');
  };

  const runCardStage = (className, animationName, fallbackDelay, nextStage) => {
    let stageFinished = false;

    const finishStage = (event) => {
      if (stageFinished) return;
      if (event && event.animationName !== animationName) return;

      stageFinished = true;
      card.removeEventListener('animationend', finishStage);
      card.removeEventListener('animationcancel', finishStage);
      window.clearTimeout(cardStageFallback);
      cardStageFallback = 0;
      nextStage();
    };

    artboard.classList.remove(...cardStageClasses);
    artboard.classList.add(className);
    card.addEventListener('animationend', finishStage);
    card.addEventListener('animationcancel', finishStage);
    cardStageFallback = window.setTimeout(finishStage, fallbackDelay);
  };

  const startCardSequence = () => {
    if (cardSequenceStarted) return;
    cardSequenceStarted = true;

    runCardStage('card-rising', 'cardRise', 1300, () => {
      runCardStage('card-turning', 'cardTurn', 900, () => {
        runCardStage('card-approaching', 'cardApproach', 700, finishOpening);
      });
    });
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

    openingFallback = window.setTimeout(finishOpening, 6500);

    const finishFlap = (event) => {
      if (event?.type === 'animationend' && event.animationName !== 'flapBackOpen') return;
      flap.removeEventListener('animationend', finishFlap);
      flap.removeEventListener('animationcancel', finishFlap);
      window.clearTimeout(flapFallback);
      startCardSequence();
    };

    flap.addEventListener('animationend', finishFlap);
    flap.addEventListener('animationcancel', finishFlap);
    flapFallback = window.setTimeout(finishFlap, 1500);
  };

  seal.addEventListener('click', openInvitation);

  resetEnvelope();
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) resetEnvelope();
  });
})();
