(() => {
  document.documentElement.classList.add('opening-animation-ready');

  const envelopeButton = document.getElementById('replayOpening');

  envelopeButton?.addEventListener('click', () => {
    envelopeButton.disabled = true;
    window.location.replace('index.html');
  });
})();
