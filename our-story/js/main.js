/* ══════════════════════════════════════════════════════════════════
   OUR STORY · scroll choreography
   Scene 01 — The Opening
   (Nothing here needs editing to customize the template —
    all editable text lives in index.html.)
   ══════════════════════════════════════════════════════════════════ */

gsap.registerPlugin(ScrollTrigger);

/* Lazy-loaded photos change the page height as they arrive, which
   would leave every scroll trigger measured against a stale layout —
   re-measure when the page and each image finish loading. */
window.addEventListener('load', () => ScrollTrigger.refresh());
document.querySelectorAll('img[loading="lazy"]').forEach((img) => {
  img.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
});

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* live-computed stat: days since the date in data-count-from-date.
   Runs first (and in all modes) so the number is right everywhere. */
document.querySelectorAll('[data-count-from-date]').forEach((stat) => {
  const from = new Date(stat.dataset.countFromDate + 'T00:00:00');
  if (!isNaN(from)) {
    const days = Math.max(0, Math.floor((Date.now() - from) / 86400000));
    stat.dataset.count = days;
    stat.querySelector('.stat-value').textContent = days.toLocaleString('en-US');
  }
});

if (prefersReducedMotion) {
  /* Accessibility: no pinning, no scrub — a calm, static page. */
  document.body.classList.add('reduced-motion');
  /* polaroids and montage prints still get their resting tilt */
  gsap.utils.toArray('[data-tilt]').forEach((p) => {
    gsap.set(p, { rotation: parseFloat(p.dataset.tilt || 0) });
  });
} else {
  initOpening();
  initChapterHeads();
  initBeginning();
  initNumbers();
  initMontage();
}

/* shared: every chapter head reveals the same way — ornament, label,
   masked title, subtitle */
function initChapterHeads() {
  gsap.utils.toArray('.chapter-head').forEach((head) => {
    gsap.timeline({
      scrollTrigger: {
        trigger: head,
        start: 'top 88%',
        end: 'top 42%',
        scrub: 0.6,
      },
    })
      .from(head.querySelector('.chapter-ornament'), { opacity: 0, y: 18 }, 0)
      .from(head.querySelector('.chapter-label'), { opacity: 0, y: 14 }, 0.12)
      .from(head.querySelector('.chapter-title .mask-inner'), { yPercent: 115, ease: 'power2.out' }, 0.18)
      .from(head.querySelector('.chapter-sub'), { opacity: 0, y: 16 }, 0.5);
  });
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

/* ══════════════════════════════════════════════════════════════════
   Scene 02 — The Beginning
   Free-scrolling (not pinned): the chapter head reveals, a gold
   thread draws itself down the page, and each moment's polaroid
   settles into place as it enters the viewport.
   ══════════════════════════════════════════════════════════════════ */
function initBeginning() {

  /* the thread draws downward as the section scrolls */
  const threadPath = document.querySelector('.thread path');
  if (threadPath) {
    const len = threadPath.getTotalLength();
    gsap.set(threadPath, { strokeDasharray: len, strokeDashoffset: len });
    gsap.to(threadPath, {
      strokeDashoffset: 0,
      ease: 'none',
      scrollTrigger: {
        trigger: '.moments',
        start: 'top 72%',
        end: 'bottom 65%',
        scrub: 0.6,
      },
    });
  }

  /* each moment plays like a hand assembling the page:
     the photo appears hovering above the paper (oversized, big soft
     shadow), is pressed flat (scale + shadow tighten together), the
     tape stamps on, and only then is the caption + story written in */
  gsap.utils.toArray('.moment').forEach((moment) => {
    const polaroid = moment.querySelector('.polaroid');
    const tape = moment.querySelector('.tape');
    const tilt = parseFloat(polaroid.dataset.tilt || 0);

    gsap.timeline({
      scrollTrigger: {
        trigger: moment,
        start: 'top 86%',
        end: 'top 30%',
        scrub: 0.6,
      },
    })
      .from(moment.querySelector('.moment-date'), { opacity: 0, y: 16, duration: 0.5 }, 0)
      /* beat 1 · lifted: fades in hovering, barely any slide */
      .fromTo(polaroid,
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: 'power1.out' }, 0.1)
      /* beat 2 · pressed: shrinking to rest reads as moving down onto
         the page; the shadows cross-fade from soft/far to tight/flat */
      .fromTo(polaroid,
        { y: 16, scale: 1.13, rotation: tilt * 2.2, '--lift': 1 },
        { y: 0, scale: 1, rotation: tilt, '--lift': 0, duration: 1.1, ease: 'power2.inOut' }, 0.1)
      /* beat 3 · taped: the strip stamps on once the photo is flat */
      .fromTo(tape,
        { opacity: 0, scaleY: 1.4, scaleX: 1.2 },
        { opacity: 1, scaleY: 1, scaleX: 1, duration: 0.3, ease: 'power3.out' }, 1.15)
      /* beat 4 · written: caption, then the story */
      .from(moment.querySelector('.polaroid-caption'), { opacity: 0, duration: 0.4 }, 1.4)
      .from(moment.querySelector('.moment-text'), { opacity: 0, y: 26, duration: 0.6 }, 1.35);
  });
}

/* ══════════════════════════════════════════════════════════════════
   Scene 03 — In Numbers
   Counters play once on arrival (not scrubbed — a counter running
   backwards reads as a machine, not a memory).
   ══════════════════════════════════════════════════════════════════ */
function initNumbers() {

  /* section intro */
  gsap.timeline({
    scrollTrigger: {
      trigger: '.numbers-head',
      start: 'top 85%',
      end: 'top 55%',
      scrub: 0.6,
    },
  })
    .from('.numbers-rule', { scaleX: 0, ease: 'power2.inOut' }, 0)
    .from('.numbers-script', { opacity: 0, y: 14 }, 0.3);

  gsap.utils.toArray('.stat').forEach((stat) => {
    const valueEl = stat.querySelector('.stat-value');
    const note = stat.querySelector('.stat-note');
    const target = parseInt(stat.dataset.count, 10);

    /* the stat block itself rises in */
    gsap.from(stat, {
      opacity: 0,
      y: 34,
      duration: 0.9,
      ease: 'power2.out',
      scrollTrigger: { trigger: stat, start: 'top 85%', once: true },
    });

    /* the count-up — skipped for the ∞ stat */
    if (!isNaN(target)) {
      const counter = { val: 0 };
      gsap.to(counter, {
        val: target,
        duration: 1.6,
        ease: 'power2.out',
        scrollTrigger: { trigger: stat, start: 'top 80%', once: true },
        onUpdate: () => {
          valueEl.textContent = Math.round(counter.val).toLocaleString('en-US');
        },
      });
    }

    /* the handwritten aside lands a beat after its stat */
    if (note) {
      gsap.from(note, {
        opacity: 0,
        scale: 0.9,
        duration: 0.6,
        delay: 0.7,
        ease: 'power2.out',
        scrollTrigger: { trigger: stat, start: 'top 80%', once: true },
      });
    }
  });
}

/* ══════════════════════════════════════════════════════════════════
   Scene 04 — The Moments That Made Us
   The montage. Every photo lives at its own depth: data-depth is how
   many px it drifts against the scroll over its journey across the
   screen. Big photos drift little (heavy, close); small ones drift a
   lot (light, floating past). Captions trail their photo slightly.
   ══════════════════════════════════════════════════════════════════ */
function initMontage() {

  /* every photo falls from above the top of the screen. Most sway
     down like paper (x0 = lateral entry, ra/rb = decaying rotation);
     a couple tumble — spin = a full revolution that unwinds as they
     fall, landing on their resting tilt. */
  const falls = [
    { x0: -60, ra: -8, rb: 3,  spin: 0 },
    { x0: 70,  ra: 0,  rb: 0,  spin: 360 },   // flips clockwise
    { x0: -35, ra: -5, rb: 2,  spin: 0 },
    { x0: 55,  ra: 8,  rb: -3, spin: 0 },
    { x0: 85,  ra: 13, rb: -5, spin: 0 },     // the widest sway
    { x0: -50, ra: 0,  rb: 0,  spin: -360 },  // flips the other way
  ];

  gsap.utils.toArray('.mdrift').forEach((wrap, i) => {
    const depth = parseFloat(wrap.dataset.depth || 40);
    const photo = wrap.querySelector('.mphoto');
    const caption = wrap.querySelector('.mcap');
    const tilt = parseFloat(photo.dataset.tilt || 0);
    const f = falls[i % falls.length];

    /* outer wrapper: parallax drift across the whole viewport journey */
    gsap.fromTo(wrap,
      { y: depth },
      {
        y: -depth,
        ease: 'none',
        scrollTrigger: {
          trigger: wrap,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      });

    /* inner print: the fall — appears near the top of the screen and
       descends over a long stretch of scroll (unhurried on purpose) */
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: wrap,
        start: 'top 96%',
        end: 'top 45%',
        scrub: 0.8,
        invalidateOnRefresh: true, /* height offset is viewport-based */
      },
    });

    /* hidden until its fall begins — otherwise the pre-fall photo
       would sit stacked over the content above it */
    tl.fromTo(photo, { opacity: 0 }, { opacity: 1, duration: 0.08, ease: 'none' }, 0);

    /* the descent: materializes just under the viewport top, falls
       the full height of the screen down to its spot */
    tl.fromTo(photo,
      {
        y: () => -(window.innerHeight * 0.9),
        x: f.x0,
        scale: 1.06,
        '--lift': 1,
      },
      {
        y: 0,
        scale: 1.01,
        duration: 1,
        ease: 'sine.out',
        immediateRender: true,
      }, 0);

    if (f.spin) {
      /* tumbler: flips end-over-end around its horizontal axis (the
         way paper actually falls), showing its white back mid-turn,
         finishing face-up as it lands */
      tl.fromTo(photo,
        { rotationX: f.spin },
        { rotationX: 0, duration: 0.85, ease: 'sine.out' }, 0);
      /* a whisper of in-plane settle so the landing isn't rigid */
      tl.fromTo(photo,
        { rotation: tilt + (f.x0 > 0 ? 5 : -5) },
        { rotation: tilt, duration: 1, ease: 'sine.out' }, 0);
    } else {
      /* swayer: drift out, correct, settle */
      tl.fromTo(photo,
        { rotation: tilt + f.ra },
        { rotation: tilt + f.rb, duration: 0.6, ease: 'sine.inOut' }, 0)
        .to(photo, { rotation: tilt, duration: 0.4, ease: 'sine.out' }, 0.6);
    }

    /* lateral sway back to center + the landing press */
    tl.to(photo, { x: f.x0 * -0.35, duration: 0.55, ease: 'sine.inOut' }, 0)
      .to(photo, { x: 0, duration: 0.45, ease: 'sine.out' }, 0.55)
      .to(photo, { scale: 1, '--lift': 0, duration: 0.3, ease: 'sine.out' }, 0.7)
      /* the label is written once the print has landed */
      .fromTo(caption, { opacity: 0 }, { opacity: 1, duration: 0.16, ease: 'none' }, 0.9);
  });

  /* the bridge line — slows the tempo back down */
  gsap.from('.montage-exit', {
    opacity: 0,
    y: 24,
    ease: 'power1.out',
    scrollTrigger: {
      trigger: '.montage-exit',
      start: 'top 90%',
      end: 'top 60%',
      scrub: 0.6,
    },
  });
}
