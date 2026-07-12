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
     so the pacing stays the same whether there's one line or ten */
  const stage = document.querySelector('.scene-opening');
  if (stage) stage.style.height = Math.round((1.5 + Math.max(lines.length, 1) * 1.3) * 100) + 'vh';

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

  /* every following line emerges the same way, holds, then lifts away */
  for (let i = 1; i < lines.length; i++) {
    const ln = lines[i];
    tl.set(ln, { visibility: 'visible' }, '+=0.15')
      .fromTo(ln.querySelector('.mask-inner'),
        { yPercent: 115, filter: 'blur(7px)' },
        { yPercent: 0, filter: 'blur(0px)', duration: 1.1, ease: 'power2.out' })
      .to(ln, { opacity: 0, y: -60, duration: 0.8, ease: 'power1.in' }, '+=0.85');
  }

  /* ── The reveal: the title emerges, warm and slow — the payoff ──
     the candlelight warms, then the title rises and clears while its
     letters breathe into place. */
  tl.to('.opening-glow', { opacity: 1, duration: 1.5, ease: 'sine.inOut' }, '+=0.15')
    .fromTo('.intro-title .tline',
      { opacity: 0, y: 40, letterSpacing: '0.2em', filter: 'blur(9px)' },
      { opacity: 1, y: 0, letterSpacing: '0.005em', filter: 'blur(0px)', duration: 1.4, stagger: 0.2, ease: 'power2.out' }, '<+0.2')
    .to('.intro-title', { duration: 1.0 }); // hold on the title before the handoff

  /* ── The handoff: Chapter One's cream paper rises, the opening dims ── */
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
   A slideshow: the stage pins, and one print at a time fades in and
   holds while it slowly zooms (Ken Burns), then cross-fades into the
   next — a breath between each, so every memory can be looked at.
   ══════════════════════════════════════════════════════════════════ */
function initMontage() {

  /* The camera travels across the table. A single scrubbed timeline moves
     the table under a fixed viewport: it frames the first print, then
     flies to each in turn (holding on each — the breath), then pulls all
     the way back to reveal the whole table of moments together. */
  const table = document.querySelector('.table');
  const photos = gsap.utils.toArray('.mphoto');
  if (!table || !photos.length) return;

  const TABLE_W = 1600, TABLE_H = 2200;

  /* the transform that frames a group of prints (one, or a pair), centred
     and filling the screen. `zoom` lets a beat drift a touch closer while
     it "holds", so the camera is never fully frozen (smoother, filmic). */
  const frameGroup = (els, zoom = 1) => {
    let l = Infinity, t = Infinity, r = -Infinity, btm = -Infinity;
    els.forEach((el) => {
      l = Math.min(l, el.offsetLeft);
      t = Math.min(t, el.offsetTop);
      r = Math.max(r, el.offsetLeft + el.offsetWidth);
      btm = Math.max(btm, el.offsetTop + el.offsetHeight);
    });
    const cx = (l + r) / 2, cy = (t + btm) / 2;
    const vw = window.innerWidth, vh = window.innerHeight;
    const pad = els.length > 1 ? 0.82 : 0.74;
    const s = Math.min(vw * pad / (r - l), vh * pad / (btm - t)) * zoom;
    return { scale: s, x: vw / 2 - cx * s, y: vh / 2 - cy * s };
  };
  /* the pulled-back transform that fits the whole table on screen */
  const framePull = () => {
    const vw = window.innerWidth, vh = window.innerHeight;
    const s = Math.min(vw * 0.9 / TABLE_W, vh * 0.9 / TABLE_H);
    return { scale: s, x: vw / 2 - (TABLE_W / 2) * s, y: vh / 2 - (TABLE_H / 2) * s };
  };

  /* the camera path: a mix of single prints and two-shots */
  const path = [[0], [1, 2], [3], [4, 5]].map((g) => g.map((i) => photos[i]));
  const at = (g, z) => ({ x: () => frameGroup(g, z).x, y: () => frameGroup(g, z).y, scale: () => frameGroup(g, z).scale });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '.montage',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.5,               /* floatier follow — smooths scroll jitter */
      invalidateOnRefresh: true,
    },
    defaults: { ease: 'sine.inOut' },
  });

  /* start on the first target, then let it drift slowly closer (the breath) */
  tl.fromTo(table, at(path[0], 1), { ...at(path[0], 1), duration: 0.001, immediateRender: true }, 0)
    .to(table, { ...at(path[0], 1.06), duration: 1.4 });

  /* glide to each target, then drift gently while it holds — the camera
     never comes to a hard stop, so the motion stays smooth throughout */
  for (let k = 1; k < path.length; k++) {
    tl.to(table, { ...at(path[k], 1), duration: 2.1, ease: 'power2.inOut' })
      .to(table, { ...at(path[k], 1.06), duration: 1.4 });
  }

  /* pull all the way back: the whole table of moments, together —
     then hold it there (the payoff) before the section releases */
  tl.to(table, {
    x: () => framePull().x,
    y: () => framePull().y,
    scale: () => framePull().scale,
    duration: 2.6,
    ease: 'power2.inOut',
  })
    .to(table, { duration: 2.3 });

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

  /* the remembered little things — quicker, gentler, accumulating.
     Built from however many the owner kept or added (not a fixed three). */
  const smalls = gsap.utils.toArray('.quiet-small');
  const base = 4.2, step = 0.35;
  smalls.forEach((el, i) => {
    tl.fromTo(el, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power1.out' }, base + i * step);
  });
  const stackEnd = base + smalls.length * step + 0.65;
  tl.to('.quiet-stack', { opacity: 0, duration: 0.5, ease: 'power1.in' }, stackEnd);

  /* the section is made taller when there are more little things, so the
     extra beats don't speed the whole scene up */
  const quiet = document.querySelector('.scene-quiet');
  if (quiet) quiet.style.height = Math.max(360, Math.round(520 + (smalls.length - 3) * 60)) + 'vh';

  /* the final line lands alone, and stays */
  const finalAt = stackEnd + 0.7;
  tl.set('.ql-final', { visibility: 'visible' }, finalAt)
    .fromTo('.ql-final .mask-inner',
      { yPercent: 115, filter: 'blur(6px)' },
      { yPercent: 0, filter: 'blur(0px)', duration: 0.9, ease: 'power2.out' }, finalAt)
    .to('.ql-final', { yPercent: 0, duration: 0.9 }, finalAt + 0.9); /* held beat before release */
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
