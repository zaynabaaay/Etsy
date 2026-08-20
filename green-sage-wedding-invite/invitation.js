(() => {
  document.documentElement.classList.add('opening-animation-ready');

  const sectionTwoStyles = document.createElement('link');
  sectionTwoStyles.rel = 'stylesheet';
  sectionTwoStyles.href = 'section2-overrides.css?v=20260820';
  document.head.appendChild(sectionTwoStyles);

  const envelopeButton = document.getElementById('replayOpening');

  envelopeButton?.addEventListener('click', () => {
    envelopeButton.disabled = true;
    window.location.replace('index.html');
  });
})();
