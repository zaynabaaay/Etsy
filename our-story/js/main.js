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

  /* every spoken line, in order — however many the owner kept or added.
     The first is the greeting (it loads in); the rest are the confession,
     each emerging then lifting away in turn before the title. */
  const lines = gsap.utils.toArray('.opening-line');

  /* give the section scroll room in proportion to how many lines there are,
     so the pacing stays the same whether there's one line or ten —
     kept tight, so each flick of the wheel brings the next line on */
  const stage = document.querySelector('.scene-opening');
  if (stage) stage.style.height = Math.round((0.9 + Math.max(lines.length, 1) * 0.75) * 100) + 'vh';

  /* ── Load-in: the greeting settles onto the page ──
     (time-based) It unmasks upward, the blur clearing as it lands,
     and the scroll cue invites you on. */
  const loadIn = gsap.timeline({ defaults: { ease: 'power2.out' } });
  if (lines[0]) {
    loadIn.set(lines[0], { visibility: 'visible' }, 0.6)
      .fromTo(lines[0].querySelector('.mask-inner'),
        { yPercent: 115, filter: 'blur(7px)' },
        { yPercent: 0, filter: 'blur(0px)', duration: 1.3 }, 0.6);
  }
  loadIn.to('.scroll-cue', { opacity: 1, duration: 1.1 }, '-=0.6');

  /* ── The master scrub: scrolling is the playhead ──
     The panel holds still via CSS sticky. Scrolling lifts the greeting
     away, plays the confession line by line, then the title emerges. */
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '.scene-opening',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.6,
    },
  });

  /* the greeting lifts away */
  if (lines[0]) tl.to(lines[0], { opacity: 0, y: -60, duration: 0.8, ease: 'power1.in' }, 0);

  /* every following line emerges the same way, holds briefly, then lifts
     away — short holds, so the next line is never more than a nudge of
     scrolling away */
  for (let i = 1; i < lines.length; i++) {
    const ln = lines[i];
    tl.set(ln, { visibility: 'visible' }, '+=0.08')
      .fromTo(ln.querySelector('.mask-inner'),
        { yPercent: 115, filter: 'blur(7px)' },
        { yPercent: 0, filter: 'blur(0px)', duration: 1.1, ease: 'power2.out' })
      .to(ln, { opacity: 0, y: -60, duration: 0.6, ease: 'power1.in' }, '+=0.25');
  }

  /* ── The reveal: the title emerges, warm and slow — the payoff ──
     the candlelight warms, then the title rises and clears while its
     letters breathe into place. */
  tl.to('.opening-glow', { opacity: 1, duration: 1.5, ease: 'sine.inOut' }, '+=0.15')
    .fromTo('.intro-title .tline',
      { opacity: 0, y: 40, letterSpacing: '0.2em', filter: 'blur(9px)' },
      { opacity: 1, y: 0, letterSpacing: '0.005em', filter: 'blur(0px)', duration: 1.4, stagger: 0.2, ease: 'power2.out' }, '<+0.2')
    .to('.intro-title', { duration: 0.4 }); // brief hold on the title before the handoff

  /* ── The handoff: the next section's paper rises, the opening dims.
     Sections can be reordered in edit mode, so this targets whatever
     visible section follows the opening — not a hard-coded scene. ── */
  const openSec = document.querySelector('.scene-opening');
  let nextSec = openSec && openSec.nextElementSibling;
  while (nextSec && (nextSec.tagName !== 'SECTION' || nextSec.classList.contains('is-removed'))) {
    nextSec = nextSec.nextElementSibling;
  }
  if (nextSec) {
    gsap.timeline({
      scrollTrigger: {
        trigger: nextSec,
        start: 'top bottom',
        end: 'top 25%',
        scrub: 0.6,
      },
    })
      .to('.opening-stage', { opacity: 0.18, y: '-9vh', ease: 'none' }, 0)
      .to('.opening-glow',  { opacity: 0.1, ease: 'none' }, 0)
      .to('.scroll-cue',    { opacity: 0, ease: 'none', duration: 0.35 }, 0);
  }
}

/* ══════════════════════════════════════════════════════════════════
   Scene 02 — The Beginning
   Free-scrolling (not pinned): the chapter head reveals, a gold
   thread draws itself down the page, and each moment's polaroid
   settles into place as it enters the viewport.
   ══════════════════════════════════════════════════════════════════ */
function initBeginning() {

  /* the thread draws downward as the section scrolls.
     It's rebuilt in real pixel coordinates that span however tall the
     moments end up (any number of memories), so the stroke-dash "draw"
     always matches the true on-screen length — no broken/repeating
     segments when the section grows. */
  const thread = document.querySelector('.thread');
  const threadPath = thread && thread.querySelector('path');
  if (threadPath) {
    const buildThread = () => {
      const r = thread.getBoundingClientRect();
      const w = Math.max(40, r.width), h = Math.max(40, r.height);
      thread.setAttribute('viewBox', '0 0 ' + Math.round(w) + ' ' + Math.round(h));
      threadPath.removeAttribute('vector-effect'); // 1:1 viewBox now — dash in real px
      const cx = w / 2;
      const amp = Math.min(w * 0.16, 24);
      const n = Math.max(3, Math.round(h / 300)); // a gentle bend every ~300px
      let d = 'M' + cx.toFixed(1) + ',0';
      for (let i = 1; i <= n; i++) {
        const y = h * i / n;
        const ctrlY = y - (h / n) / 2;
        const dir = (i % 2 === 1) ? 1 : -1;
        const a = (i === n) ? amp * 0.25 : amp; // settle back to center at the end
        d += ' Q' + (cx + dir * a).toFixed(1) + ',' + ctrlY.toFixed(1) + ' ' + cx.toFixed(1) + ',' + y.toFixed(1);
      }
      threadPath.setAttribute('d', d);
    };
    buildThread();
    gsap.fromTo(threadPath,
      { strokeDasharray: () => threadPath.getTotalLength(), strokeDashoffset: () => threadPath.getTotalLength() },
      {
        strokeDashoffset: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: '.moments',
          start: 'top 72%',
          end: 'bottom 65%',
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });
    /* re-measure the thread whenever the layout does (resize, images, edits) */
    ScrollTrigger.addEventListener('refreshInit', buildThread);
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

  const counter = document.querySelector('.counter');
  if (!counter) return;

  /* the beat reveals: script, then the number, its label, and the aside */
  gsap.timeline({
    scrollTrigger: { trigger: counter, start: 'top 72%', once: true },
    defaults: { ease: 'power2.out' },
  })
    .from('.counter-script', { opacity: 0, y: 16, duration: 0.9 })
    .from('.counter .stat-value', { opacity: 0, y: 26, duration: 1.0 }, '-=0.5')
    .from('.counter-label', { opacity: 0, y: 14, duration: 0.8 }, '-=0.45')
    .from('.counter-note', { opacity: 0, scale: 0.9, rotate: -7, duration: 0.7 }, '-=0.3');

  /* the number counts itself up from zero */
  const stat = counter.querySelector('.stat');
  const valueEl = stat && stat.querySelector('.stat-value');
  const target = parseInt(stat && stat.dataset.count, 10);
  if (valueEl && !isNaN(target)) {
    const c = { val: 0 };
    gsap.to(c, {
      val: target,
      duration: 1.9,
      ease: 'power2.out',
      scrollTrigger: { trigger: counter, start: 'top 66%', once: true },
      onUpdate: () => {
        valueEl.textContent = Math.round(c.val).toLocaleString('en-US');
      },
    });
  }
}

/* ══════════════════════════════════════════════════════════════════
   Scene 04 — The Moments That Made Us
   A one-at-a-time show on a sticky stage: the chapter line holds the
   first screen and lifts away, then each memory — its title over its
   1–3 photos — has the screen to itself before handing off to the
   next. Built from however many memories the owner kept or added.
   ══════════════════════════════════════════════════════════════════ */
function initMontage() {

  const mems = gsap.utils.toArray('.memory');
  const scene = document.querySelector('.scene-montage');
  if (!mems.length || !scene) return;

  /* about one screen of scroll for the chapter line, one per memory,
     and one for the closing bridge line */
  scene.style.height = Math.round((1.7 + (mems.length + 1) * 0.8) * 100) + 'vh';

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: scene,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.6,
    },
  });

  /* the chapter line says its piece, then gives the screen away
     (its arrival is handled by initChapterHeads, like every chapter) */
  tl.to('.scene-montage .chapter-head', { opacity: 0, y: -60, duration: 0.5, ease: 'power1.in' }, 0.3);

  /* each memory: title lands, photos settle, a beat to look — then it
     lifts away and the next takes the screen */
  const STEP = 1.8;
  mems.forEach((mem, i) => {
    const t = 0.75 + i * STEP;
    tl.set(mem, { visibility: 'visible' }, t)
      .fromTo(mem.querySelector('.memory-title'),
        { opacity: 0, y: 26 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, t)
      .fromTo(mem.querySelectorAll('.memory-photo'),
        { opacity: 0, y: 44 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.12, ease: 'power2.out' }, t + 0.12);
    tl.to(mem, { opacity: 0, y: -70, duration: 0.45, ease: 'power1.in' }, t + STEP - 0.5);
  });

  /* the final screen: the bridge line, alone — it stays as the stage
     releases into the next scene */
  const tExit = 0.75 + mems.length * STEP;
  tl.fromTo('.montage-exit',
    { opacity: 0, y: 26 },
    { opacity: 1, y: 0, duration: 0.6, ease: 'power1.out' }, tExit)
    .to('.montage-exit', { y: 0, duration: 0.8 }, tExit + 0.6); /* held beat before release */
}

/* ══════════════════════════════════════════════════════════════════
   Words pages (Scene 05 — The Quiet, and any the owner adds)
   The panel holds still via CSS sticky (not JS pinning) while the
   section scrolls past; this timeline is scrubbed over that scroll.
   Lines appear one beat at a time on the empty paper.
   ══════════════════════════════════════════════════════════════════ */
function initQuiet() {

  /* A Words page is a reusable layout: the owner can add any number of
     them (edit mode → Sections → "Add a Words page") and reorder them.
     Each builds its own show from whatever it contains: every line but
     the last speaks and lifts away, an optional stack of little things
     accumulates, and the last line lands and stays. */
  gsap.utils.toArray('.scene-quiet').forEach((sec) => {
    if (sec.classList.contains('is-removed')) return;

    const lines = gsap.utils.toArray(sec.querySelectorAll('.quiet-line'));
    const smalls = gsap.utils.toArray(sec.querySelectorAll('.quiet-small'));
    const stack = sec.querySelector('.quiet-stack');
    if (!lines.length) return;
    const last = lines[lines.length - 1];
    const spoken = lines.slice(0, -1);

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sec,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.7,
      },
    });

    /* every beat begins while the one before it is still lifting away —
       the only pauses left are short reading beats, never dead scroll */
    let t = 0.1;
    spoken.forEach((ln) => {
      tl.set(ln, { visibility: 'visible' }, t)
        .fromTo(ln.querySelector('.mask-inner'),
          { yPercent: 115, filter: 'blur(6px)' },
          { yPercent: 0, filter: 'blur(0px)', duration: 0.7, ease: 'power2.out' }, t)
        .to(ln, { opacity: 0, y: -50, duration: 0.5, ease: 'power1.in' }, t + 0.9);
      t += 1.3;
    });

    /* the little things — quicker, gentler, accumulating */
    if (smalls.length && stack) {
      const base = t + 0.1;
      smalls.forEach((el, i) => {
        tl.fromTo(el, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power1.out' }, base + i * 0.25);
      });
      t = base + smalls.length * 0.25 + 0.35;
      tl.to(stack, { opacity: 0, duration: 0.45, ease: 'power1.in' }, t);
      t += 0.2;
    } else {
      t += 0.3;
    }

    /* the final line lands alone, and stays */
    tl.set(last, { visibility: 'visible' }, t)
      .fromTo(last.querySelector('.mask-inner'),
        { yPercent: 115, filter: 'blur(6px)' },
        { yPercent: 0, filter: 'blur(0px)', duration: 0.9, ease: 'power2.out' }, t)
      .to(last, { yPercent: 0, duration: 0.25 }, t + 0.8); /* brief held beat before release */

    /* scroll room in proportion to the beats this page actually has */
    sec.style.height = Math.max(200, Math.round(100 + (t + 1.05) * 36)) + 'vh';
  });
}

/* ══════════════════════════════════════════════════════════════════
   Scene 06 — The Letter
   Two devices, two rules (gsap.matchMedia cleans up + re-runs on resize):

   · PHONE — the card is taller than the screen, so the letter is read a
     paragraph at a time, each rising into clarity as it's scrolled past.
   · TABLET / DESKTOP — the whole card fits on screen at once, so a
     scrubbed reveal would leave the lower lines stuck half-faded. Here it
     arrives as one piece when it enters view, then stays fully legible.
   ══════════════════════════════════════════════════════════════════ */
function initLetter() {
  const mm = gsap.matchMedia();

  /* PHONE — reveal at reading pace, tied to scroll */
  mm.add('(max-width: 767px)', () => {
    gsap.timeline({
      scrollTrigger: { trigger: '.letter-head', start: 'top 90%', end: 'top 55%', scrub: 0.6 },
    })
      .from('.letter-ornament', { opacity: 0, y: 16 }, 0)
      .from('.letter-label', { opacity: 0, y: 12 }, 0.2);

    gsap.utils.toArray('.letter .lp').forEach((p) => {
      gsap.from(p, {
        opacity: 0, y: 26, filter: 'blur(4px)', ease: 'power1.out',
        scrollTrigger: { trigger: p, start: 'top 88%', end: 'top 58%', scrub: 0.7 },
      });
    });

    gsap.timeline({
      scrollTrigger: { trigger: '.letter-sign', start: 'top 90%', end: 'top 55%', scrub: 0.7 },
    })
      .from('.sign-pre', { opacity: 0, y: 14 }, 0)
      .from('.sign-name', { opacity: 0, y: 20, scale: 0.94, ease: 'power2.out' }, 0.2);
  });

  /* TABLET / DESKTOP — arrive as one piece, then hold clear */
  mm.add('(min-width: 768px)', () => {
    gsap.timeline({
      scrollTrigger: { trigger: '.letter', start: 'top 80%', toggleActions: 'play none none none' },
      defaults: { ease: 'power2.out' },
    })
      .from('.letter', { opacity: 0, y: 42, duration: 0.9 }, 0)
      .from('.letter-ornament', { opacity: 0, y: 14, duration: 0.6 }, 0.2)
      .from('.letter-label', { opacity: 0, y: 12, duration: 0.6 }, 0.32)
      .from('.letter-body .lp', { opacity: 0, y: 20, filter: 'blur(3px)', duration: 0.7, stagger: 0.16 }, 0.46)
      .from('.sign-pre', { opacity: 0, y: 12, duration: 0.6 }, '-=0.15')
      .from('.sign-name', { opacity: 0, y: 18, scale: 0.96, duration: 0.85 }, '-=0.3');
  });
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
