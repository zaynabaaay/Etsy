(() => {
  const sealInitials = { first: 'A', second: 'G' };
  const envelopeButton = document.getElementById('replayOpening');
  const rsvpButton = document.getElementById('rsvpButton');
  const rsvpFeedback = document.getElementById('rsvpFeedback');
  const revealItems = document.querySelectorAll('.reveal');

  document.querySelectorAll('[data-seal-initial]').forEach((initial) => {
    initial.textContent = sealInitials[initial.dataset.sealInitial] || '';
  });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });

    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  envelopeButton?.addEventListener('click', () => {
    envelopeButton.disabled = true;
    window.location.replace('index.html');
  });

  rsvpButton?.addEventListener('click', () => {
    if (!rsvpFeedback) return;
    rsvpFeedback.textContent = 'The response form will be connected when your final guest details are added.';
  });
})();
