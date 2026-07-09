/* ══════════════════════════════════════════════════════════════════
   OUR STORY · scroll choreography
   Scene 01 — The Opening
   (Nothing here needs editing to customize the template —
    all editable text lives in index.html.)
   ══════════════════════════════════════════════════════════════════ */

gsap.registerPlugin(ScrollTrigger);

/* On phones the address bar hides/shows as you scroll, resizing the
   viewport. Left alone, ScrollTrigger re-measures on every one of those
   resizes and the pinned scenes can jump to the wrong scroll position —
   which is what made the dusk panel paint over an earlier chapter.
   Ignoring that resize keeps every pin locked where it belongs.
   (Image space is reserved in CSS via aspect-ratio, so lazy photos no
   longer shift the layout — no per-image re-measure needed.) */
ScrollTrigger.config({ ignoreMobileResize: true });

/* one safety re-measure once everything (fonts, above-the-fold imagery)
   has settled */
window.addEventListener('load', () => ScrollTrigger.refresh());

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Edit Mode (js/edit.js) presents a calm, static, fully-revealed page
   so photos and text are easy to click — same still layout as the
   reduced-motion experience. */
const editing = localStorage.getItem('ourstory:editing') === '1';
const still = prefersReducedMotion || editing;

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

if (still) {
  /* No pinning, no scrub — a calm, static page (accessibility + editing). */
  document.body.classList.add('reduced-motion');
  /* polaroids and montage prints still get their resting tilt */
  gsap.utils.toArray('[data-tilt]').forEach((p) => {
    gsap.set(p, { rotation: parseFloat(p.dataset.tilt || 0) });
  });
} else {
  document.body.classList.add('cinematic');
  initOpening();
  initChapterHeads();
  initBeginning();
  initNumbers();
  initMontage();
  initQuiet();
  initLetter();
  initClose();
}

/* the replay control works in every mode */
document.querySelector('.replay')?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: still ? 'auto' : 'smooth' });
});

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
    { x0: 70,  ra: 0,  rb: 0,  spin: 180 },   // falls back-first, flips face-up
    { x0: -35, ra: -5, rb: 2,  spin: 0 },
    { x0: 55,  ra: 8,  rb: -3, spin: 0 },
    { x0: 85,  ra: 13, rb: -5, spin: 0 },     // the widest sway
    { x0: -50, ra: 0,  rb: 0,  spin: -180 },  // same, flipping the other way
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
      /* flipper: falls showing its plain white back, then turns over
         once — a single half-flip — landing face-up */
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

/* ══════════════════════════════════════════════════════════════════
   Scene 05 — The Quiet
   The panel holds still via CSS sticky (not JS pinning) while the
   section scrolls past; this timeline is scrubbed over that scroll.
   Lines appear one beat at a time while evening falls on the page:
   the background dims from cream through dusk to espresso, so the
   scene ends already inside the dark world of the letter.
   ══════════════════════════════════════════════════════════════════ */
function initQuiet() {

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '.scene-quiet',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.7,
    },
  });

  /* evening falls — one continuous dimming, timed so each line sits
     on a background it is readable against */
  tl.fromTo('.quiet-sticky',
    { backgroundColor: '#f3ecdc' },
    { backgroundColor: '#dccca9', duration: 3.2, ease: 'none' }, 0)
    .to('.quiet-sticky', { backgroundColor: '#6f5430', duration: 1.4, ease: 'none' }, 3.2)
    .to('.quiet-sticky', { backgroundColor: '#171009', duration: 2.0, ease: 'none' }, 4.6);

  /* beat one */
  tl.set('.ql-1', { visibility: 'visible' }, 0.2)
    .fromTo('.ql-1 .mask-inner',
      { yPercent: 115, filter: 'blur(6px)' },
      { yPercent: 0, filter: 'blur(0px)', duration: 0.8, ease: 'power2.out' }, 0.2)
    .to('.ql-1', { opacity: 0, y: -50, duration: 0.6, ease: 'power1.in' }, 1.5);

  /* beat two */
  tl.set('.ql-2', { visibility: 'visible' }, 2.2)
    .fromTo('.ql-2 .mask-inner',
      { yPercent: 115, filter: 'blur(6px)' },
      { yPercent: 0, filter: 'blur(0px)', duration: 0.8, ease: 'power2.out' }, 2.2)
    .to('.ql-2', { opacity: 0, y: -50, duration: 0.6, ease: 'power1.in' }, 3.4);

  /* the remembered little things — quicker, gentler, accumulating */
  tl.fromTo('.qs-1', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power1.out' }, 4.2)
    .fromTo('.qs-2', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power1.out' }, 4.55)
    .fromTo('.qs-3', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power1.out' }, 4.9)
    .to('.quiet-stack', { opacity: 0, duration: 0.5, ease: 'power1.in' }, 5.9);

  /* the final line lands alone in the dark, and stays */
  tl.set('.ql-final', { visibility: 'visible' }, 6.6)
    .fromTo('.ql-final .mask-inner',
      { yPercent: 115, filter: 'blur(6px)' },
      { yPercent: 0, filter: 'blur(0px)', duration: 0.9, ease: 'power2.out' }, 6.6)
    .to('.ql-final', { yPercent: 0, duration: 0.9 }, 7.5); /* held beat before release */
}

/* ══════════════════════════════════════════════════════════════════
   Scene 06 — The Letter
   The climax. Each part reveals tied to scroll, so the letter can
   only be read at reading pace. The signature arrives last.
   ══════════════════════════════════════════════════════════════════ */
function initLetter() {

  /* the head */
  gsap.timeline({
    scrollTrigger: {
      trigger: '.letter-head',
      start: 'top 90%',
      end: 'top 55%',
      scrub: 0.6,
    },
  })
    .from('.letter-ornament', { opacity: 0, y: 16 }, 0)
    .from('.letter-label', { opacity: 0, y: 12 }, 0.2);

  /* each paragraph rises into clarity as it is scrolled through —
     the pacing is the point, so the reveal spans real scroll distance */
  gsap.utils.toArray('.letter .lp').forEach((p) => {
    gsap.from(p, {
      opacity: 0,
      y: 26,
      filter: 'blur(4px)',
      ease: 'power1.out',
      scrollTrigger: {
        trigger: p,
        start: 'top 88%',
        end: 'top 58%',
        scrub: 0.7,
      },
    });
  });

  /* the signature arrives last, with a little warmth */
  gsap.timeline({
    scrollTrigger: {
      trigger: '.letter-sign',
      start: 'top 90%',
      end: 'top 55%',
      scrub: 0.7,
    },
  })
    .from('.sign-pre', { opacity: 0, y: 14 }, 0)
    .from('.sign-name', { opacity: 0, y: 20, scale: 0.94, ease: 'power2.out' }, 0.2)
    .fromTo('.letter-glow', { opacity: 0.45 }, { opacity: 1, ease: 'sine.out' }, 0);
}

/* ══════════════════════════════════════════════════════════════════
   Scene 07 — The Close
   Dawn has already lifted the dark to paper (CSS gradient). The final
   photo, closing line, and names arrive, bookending the opening.
   ══════════════════════════════════════════════════════════════════ */
function initClose() {

  /* the final photo settles in */
  gsap.from('.close-photo', {
    opacity: 0,
    y: 50,
    rotation: -8,
    ease: 'power2.out',
    scrollTrigger: { trigger: '.close-photo', start: 'top 88%', end: 'top 55%', scrub: 0.7 },
  });

  /* the closing line unmasks */
  gsap.from('.close-line .mask-inner', {
    yPercent: 115,
    ease: 'power2.out',
    scrollTrigger: { trigger: '.close-line', start: 'top 85%', end: 'top 55%', scrub: 0.7 },
  });

  /* the names bookend the opening */
  gsap.timeline({
    scrollTrigger: { trigger: '.close-names', start: 'top 85%', end: 'top 50%', scrub: 0.7 },
  })
    .from('.close-script', { opacity: 0, y: 14 }, 0)
    .from('.close-title', { opacity: 0, y: 18 }, 0.15)
    .from('.close-rule', { scaleX: 0, ease: 'power2.inOut' }, 0.3)
    .from('.close-date', { opacity: 0, y: 12 }, 0.4);

  /* the replay invitation */
  gsap.from('.replay', {
    opacity: 0,
    y: 20,
    ease: 'power1.out',
    scrollTrigger: { trigger: '.replay', start: 'top 92%', end: 'top 72%', scrub: 0.6 },
  });
}
