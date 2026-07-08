/* ══════════════════════════════════════════════════════════════════
   OUR STORY · scroll choreography
   Scene 01 — The Opening
   (Nothing here needs editing to customize the template —
    all editable text lives in index.html.)
   ══════════════════════════════════════════════════════════════════ */

gsap.registerPlugin(ScrollTrigger);

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (prefersReducedMotion) {
  /* Accessibility: no pinning, no scrub — a calm, static page. */
  document.body.classList.add('reduced-motion');
} else {
  initOpening();
}

function initOpening() {

  /* ── Load-in: the hushed first screen (time-based, not scroll) ── */
  gsap.timeline({ defaults: { ease: 'power2.out' } })
    .to('.intro-ornament', { opacity: 1, duration: 1.4, delay: 0.5 })
    .to('.intro-label',    { opacity: 1, y: 0, duration: 1.2 }, '-=0.8')
    .to('.scroll-cue',     { opacity: 1, duration: 1.2 }, '-=0.5');

  /* ── The master scrub: scrolling is the playhead ──
     One pinned timeline drives every moment of the opening.
     Duration units below are relative beats, not seconds.       */
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '.scene-opening',
      start: 'top top',
      end: '+=420%',
      pin: true,
      scrub: 0.6,
      anticipatePin: 1,
    },
  });

  /* Moment 1 → out: the intro screen dissolves upward */
  tl.to('.intro-screen', { opacity: 0, y: -70, duration: 1.0, ease: 'power1.in' })
    .set('.intro-screen', { visibility: 'hidden' })

    /* Moment 2a: line one unmasks upward, blur clearing as it lands,
       then a reading hold (the '+=0.8' gap) before it dissolves up */
    .set('.line-1', { visibility: 'visible' }, '+=0.25')
    .fromTo('.line-1 .mask-inner',
      { yPercent: 115, filter: 'blur(7px)' },
      { yPercent: 0, filter: 'blur(0px)', duration: 1.1, ease: 'power2.out' })
    .to('.line-1', { opacity: 0, y: -60, duration: 0.8, ease: 'power1.in' }, '+=0.8')

    /* Moment 2b: line two */
    .set('.line-2', { visibility: 'visible' }, '+=0.2')
    .fromTo('.line-2 .mask-inner',
      { yPercent: 115, filter: 'blur(7px)' },
      { yPercent: 0, filter: 'blur(0px)', duration: 1.1, ease: 'power2.out' })
    .to('.line-2', { opacity: 0, y: -60, duration: 0.8, ease: 'power1.in' }, '+=0.8')

    /* Moment 3: the arrival of the names */
    /* the candlelight warms first */
    .to('.opening-glow', { opacity: 1, duration: 1.6, ease: 'sine.inOut' }, '+=0.2')
    /* the script word */
    .to('.names-script',
      { opacity: 1, rotate: -2.5, y: 0, duration: 0.9, ease: 'power2.out' }, '<+0.2')
    /* the names: fade in while the letterspacing breathes into place */
    .fromTo('.names-title',
      { opacity: 0, letterSpacing: '0.3em', y: 24 },
      { opacity: 1, letterSpacing: '0.12em', y: 0, duration: 1.5, ease: 'power2.out' }, '<+0.35')
    /* the gold rule draws outward from center */
    .fromTo('.names-rule',
      { scaleX: 0 },
      { scaleX: 1, duration: 0.9, ease: 'power2.inOut' }, '<+0.55')
    /* the date settles in last */
    .to('.names-date', { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, '<+0.45')

    /* hold with depth: layers drift at slightly different speeds */
    .to('.names-script', { yPercent: -34, duration: 2.2, ease: 'none' }, '+=0.3')
    .to('.names-title',  { yPercent: -14, duration: 2.2, ease: 'none' }, '<')
    .to('.names-rule',   { yPercent: -8,  duration: 2.2, ease: 'none' }, '<')
    .to('.names-date',   { yPercent: -4,  duration: 2.2, ease: 'none' }, '<');

  /* ── The handoff: cream paper rises, the dark scene dims beneath it ── */
  gsap.timeline({
    scrollTrigger: {
      trigger: '.scene-beginning',
      start: 'top bottom',
      end: 'top 25%',
      scrub: 0.6,
    },
  })
    .to('.opening-stage', { opacity: 0.18, y: '-9vh', ease: 'none' }, 0)
    .to('.opening-glow',  { opacity: 0.1, ease: 'none' }, 0)
    .to('.scroll-cue',    { opacity: 0, ease: 'none', duration: 0.35 }, 0);
}
