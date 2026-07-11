/* ==========================================================================
   HEIRLOOM — engine
   Buyers: nothing to edit here. Everything you can change lives in config.js
   ========================================================================== */
(function () {
  'use strict';

  var C = window.HEIRLOOM_CONFIG;
  if (!C) { document.body.innerHTML = '<p style="padding:2em;font-family:serif">config.js is missing or has an error. Please re-check your edits (a missing quote or comma is the usual culprit).</p>'; return; }

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  };
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };

  /* ------------------------------------------------------------------
     AUDIO — tiny synthesized paper/wax sounds + optional music
     ------------------------------------------------------------------ */
  var audio = {
    ctx: null, master: null, music: null,
    muted: localStorage.getItem('heirloom_muted') === '1',
    ensure: function () {
      if (this.ctx || !window.AudioContext && !window.webkitAudioContext) return;
      var AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 1;
      this.master.connect(this.ctx.destination);
    },
    noise: function (dur, filterType, freq, peak, attack) {
      if (!C.effects.soundEffects || !this.ctx) return;
      var ctx = this.ctx;
      var len = Math.floor(ctx.sampleRate * dur);
      var buf = ctx.createBuffer(1, len, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      var src = ctx.createBufferSource(); src.buffer = buf;
      var filt = ctx.createBiquadFilter(); filt.type = filterType; filt.frequency.value = freq;
      var g = ctx.createGain();
      var t = ctx.currentTime;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(filt); filt.connect(g); g.connect(this.master);
      src.start(); src.stop(t + dur + 0.05);
    },
    crack: function () {
      this.ensure(); if (!this.ctx) return;
      this.noise(0.16, 'bandpass', 2100, 0.5, 0.006);
      var self = this;
      setTimeout(function () { self.noise(0.09, 'bandpass', 3200, 0.3, 0.004); }, 45);
    },
    slide: function () {
      this.ensure(); if (!this.ctx) return;
      this.noise(0.55, 'lowpass', 850, 0.16, 0.18);
    },
    startMusic: function () {
      if (!C.music.file) return;
      if (!this.music) {
        this.music = new Audio(C.music.file);
        this.music.loop = true;
        this.music.volume = Math.min(1, Math.max(0, C.music.volume || 0.4));
        this.music.muted = this.muted;
      }
      this.music.play().catch(function () {});
    },
    setMuted: function (m) {
      this.muted = m;
      localStorage.setItem('heirloom_muted', m ? '1' : '0');
      if (this.master) this.master.gain.value = m ? 0 : 1;
      if (this.music) this.music.muted = m;
    }
  };

  var muteBtn = $('#muteBtn');
  function showMuteBtn() {
    if (!C.music.file && !C.effects.soundEffects) return;
    muteBtn.hidden = false;
    muteBtn.classList.toggle('muted', audio.muted);
  }
  muteBtn.addEventListener('click', function () {
    audio.setMuted(!audio.muted);
    muteBtn.classList.toggle('muted', audio.muted);
    muteBtn.setAttribute('aria-label', audio.muted ? 'Unmute sound' : 'Mute sound');
  });

  /* ------------------------------------------------------------------
     FILL THE INTRO
     ------------------------------------------------------------------ */
  var i1 = C.couple.firstInitial, i2 = C.couple.secondInitial;
  document.title = C.couple.firstName + ' & ' + C.couple.secondName;
  document.querySelectorAll('.seal-init.i1').forEach(function (el) { el.textContent = i1; });
  document.querySelectorAll('.seal-init.i2').forEach(function (el) { el.textContent = i2; });
  $('#kick1').textContent = C.wording.envelopeLine;
  $('#kick2').textContent = C.wording.envelopeLine2 || 'Prepared for you';
  $('#introDate').textContent = C.wedding.shortDate.day + ' · ' + C.wedding.shortDate.month + ' · ' + C.wedding.year;
  $('#tapHint').textContent = C.wording.tapHint;
  $('#fcInviteLine').textContent = C.wording.inviteLine;
  $('#fcName1').textContent = C.couple.firstName;
  $('#fcName2').textContent = C.couple.secondName;
  $('#fcDate').textContent = C.wedding.displayDate;
  $('#fcMonogram').textContent = i1 + ' & ' + i2;
  $('#embossDate').innerHTML =
    '<span>' + esc(C.wedding.shortDate.day) + '</span>' +
    '<span>' + esc(C.wedding.shortDate.month) + '</span>' +
    '<span>' + esc(C.wedding.shortDate.year) + '</span>';

  /* ------------------------------------------------------------------
     BUILD THE SITE
     ------------------------------------------------------------------ */
  var ICONS = ['rings', 'glass', 'dinner', 'cake', 'music', 'sparkle'];
  function icon(name) {
    if (ICONS.indexOf(name) === -1) return '';
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-' + name + '"/></svg>';
  }
  function head(script) {
    return '<div class="sec-head reveal"><span class="sec-script">' + esc(script) + '</span>' +
      '<span class="sec-rule"><svg viewBox="0 0 24 24"><path d="M12 3 C13 8 16 11 21 12 C16 13 13 16 12 21 C11 16 8 13 3 12 C8 11 11 8 12 3 Z"/></svg></span></div>';
  }
  function decor(kind, style, plx) {
    var views = {
      orchid: '<svg viewBox="-95 -75 190 160"><use href="#orchid"/></svg>',
      sprig: '<svg viewBox="-20 -6 48 72" fill="#F1E9D8"><use href="#sprig"/></svg>',
      stem: '<svg viewBox="-8 -4 44 130" stroke="#A98F6F"><use href="#driedStem"/></svg>'
    };
    return '<div class="decor decor--shadow" data-plx="' + plx + '" style="' + style + '">' + views[kind] + '</div>';
  }

  var mono =
    '<svg class="closing-monogram" viewBox="0 0 100 100" aria-hidden="true">' +
    '<circle cx="50" cy="50" r="46" fill="none" stroke="#A98B5F" stroke-width="1" opacity="0.6"/>' +
    '<circle cx="50" cy="50" r="41.5" fill="none" stroke="#A98B5F" stroke-width="0.6" opacity="0.45"/>' +
    '<text x="33" y="60" text-anchor="middle" style="font-family:var(--serif);font-weight:500;font-size:30px;fill:#453626">' + esc(i1) + '</text>' +
    '<text x="50" y="66" text-anchor="middle" style="font-family:var(--script);font-size:26px;fill:#A98B5F">&amp;</text>' +
    '<text x="68" y="60" text-anchor="middle" style="font-family:var(--serif);font-weight:500;font-size:30px;fill:#453626">' + esc(i2) + '</text>' +
    '</svg>';

  var miniSeal =
    '<svg class="mini-seal" viewBox="0 0 40 40" aria-hidden="true">' +
    '<path d="M20 3 C25 2 29 5 32 8 C35 11 38 15 37 20 C36 25 35 29 32 32 C29 35 25 38 20 37.5 C15 38 10 35 7 32 C4 29 2.5 25 3 20 C3.5 15 5 11 8 8 C11 5 15 3.5 20 3 Z" fill="url(#sealGrad)"/>' +
    '<text x="20" y="26" text-anchor="middle" style="font-family:var(--script);font-size:15px;fill:#E9CDBE">&amp;</text>' +
    '</svg>';

  function buildSite() {
    var w = C.wording, S = C.sections;
    var html = '';

    /* — hero: the opened invitation card — */
    html +=
      '<section class="section hero">' +
        decor('orchid', 'width:clamp(120px,20vw,200px); top:4%; right:2%; opacity:.95', '0.05') +
        decor('sprig', 'width:clamp(46px,8vw,72px); bottom:8%; left:4%; transform:rotate(-30deg)', '0.09') +
        '<div class="invite-card">' +
          '<svg class="card-flourish tl" viewBox="0 0 200 170" aria-hidden="true"><g class="flourish-ink" filter="url(#emboss)"><use href="#flourish" transform="scale(0.9)"/></g></svg>' +
          '<svg class="card-flourish br" viewBox="0 0 200 170" aria-hidden="true"><g class="flourish-ink" filter="url(#emboss)"><use href="#flourish" transform="translate(200 170) rotate(180) scale(0.9)"/></g></svg>' +
          '<p class="invite-line">' + esc(w.inviteLine) + '</p>' +
          '<h1 class="hero-names"><span class="name">' + esc(C.couple.firstName) + '</span><span class="amp">and</span><span class="name">' + esc(C.couple.secondName) + '</span></h1>' +
          '<p class="invite-line">' + esc(w.inviteLine2) + '</p>' +
          '<p class="hero-date" style="margin-top:2em">' + esc(C.wedding.displayDate) + '<br>' + esc(C.wedding.displayYear) + '<br>at ' + esc(C.wedding.displayTime) + '</p>' +
          '<p class="hero-city">' + esc(C.wedding.cityLine) + '</p>' +
          '<div class="scroll-cue" aria-hidden="true"><span>' + esc(w.scrollHint) + '</span><i></i></div>' +
        '</div>' +
      '</section>';

    /* — countdown — */
    if (S.countdown) {
      html +=
        '<section class="section" id="sec-countdown">' +
          decor('stem', 'width:clamp(36px,6vw,58px); top:10%; left:6%; transform:rotate(24deg)', '0.11') +
          '<div class="paper deckle1 tilt-l shift-l reveal">' +
            head(w.countdownTitle) +
            '<div class="big-date">' +
              '<span>' + esc(C.wedding.shortDate.day) + '</span><i></i>' +
              '<span>' + esc(C.wedding.shortDate.month) + '</span><i></i>' +
              '<span>' + esc(C.wedding.shortDate.year) + '</span>' +
            '</div>' +
            '<div class="countdown" id="countdown" role="timer" aria-live="off"></div>' +
            '<div class="cal-row"><button class="btn" id="calBtn">' + icon('sparkle') + 'Add to calendar</button></div>' +
          '</div>' +
        '</section>';
    }

    /* — story — */
    if (S.story && C.story.length) {
      html += '<section class="section" id="sec-story">' +
        decor('orchid', 'width:clamp(110px,17vw,170px); top:2%; left:3%; opacity:.9', '0.07') +
        '<div class="story-wrap">' + head(w.storyTitle);
      C.story.forEach(function (ch, idx) {
        var side = idx % 2 ? 'shift-r tilt-r' : 'shift-l tilt-l';
        var deck = 'deckle' + ((idx % 3) + 1);
        html +=
          '<div class="paper paper--note ' + deck + ' ' + side + ' reveal">' +
            (ch.photo ? '<figure class="story-photo"><img src="' + esc(ch.photo) + '" alt="' + esc(ch.title) + '"></figure>' : '') +
            '<span class="tag">' + esc(ch.tag) + '</span>' +
            '<h3>' + esc(ch.title) + '</h3>' +
            '<p>' + esc(ch.text) + '</p>' +
          '</div>';
      });
      html += '</div></section>';
    }

    /* — venues — */
    if (S.venues && C.venues.length) {
      html +=
        '<section class="section" id="sec-venues">' +
          decor('sprig', 'width:clamp(50px,9vw,80px); bottom:4%; right:5%; transform:rotate(18deg)', '0.1') +
          '<div class="paper deckle2 reveal" style="width:min(94vw,760px)">' +
            head(w.venueTitle) +
            '<div class="venue-grid">' +
            C.venues.map(function (v) {
              return '<div class="venue">' +
                '<h3>' + esc(v.label) + '</h3>' +
                '<p class="v-name">' + esc(v.name) + '</p>' +
                '<p class="v-time">' + esc(v.time) + '</p>' +
                '<p class="v-addr">' + esc(v.address) + '</p>' +
                (v.note ? '<p class="v-note">' + esc(v.note) + '</p>' : '') +
                (v.mapLink ? '<a class="btn" href="' + esc(v.mapLink) + '" target="_blank" rel="noopener">Directions</a>' : '') +
              '</div>';
            }).join('') +
            '</div>' +
          '</div>' +
        '</section>';
    }

    /* — schedule — */
    if (S.schedule && C.schedule.length) {
      html +=
        '<section class="section" id="sec-schedule">' +
          decor('stem', 'width:clamp(34px,6vw,56px); bottom:8%; left:5%; transform:rotate(-18deg) scaleX(-1)', '0.12') +
          '<div class="paper deckle3 tilt-r shift-r reveal" style="width:min(92vw,680px)">' +
            head(w.scheduleTitle) +
            '<div class="timeline">' +
            C.schedule.map(function (ev) {
              return '<div class="tl-item">' +
                '<span class="tl-time">' + esc(ev.time) + '</span>' +
                '<span class="tl-dot" aria-hidden="true"></span>' +
                '<div class="tl-body">' +
                  '<div class="tl-title">' + icon(ev.icon) + esc(ev.title) + '</div>' +
                  (ev.note ? '<p class="tl-note">' + esc(ev.note) + '</p>' : '') +
                '</div>' +
              '</div>';
            }).join('') +
            '</div>' +
          '</div>' +
        '</section>';
    }

    /* — detail tags — */
    var tags = [];
    if (S.dressCode) {
      tags.push('<div class="paper paper--note deckle1 tilt-l detail-tag reveal" style="text-align:center">' +
        '<h3>' + esc(C.dressCode.title) + '</h3><p>' + esc(C.dressCode.text) + '</p>' +
        '<div class="swatches">' + C.dressCode.swatches.map(function (c) { return '<i style="background:' + esc(c) + '"></i>'; }).join('') + '</div></div>');
    }
    if (S.gifts) {
      tags.push('<div class="paper paper--note deckle2 detail-tag reveal" style="text-align:center">' +
        '<h3>' + esc(C.gifts.title) + '</h3><p>' + esc(C.gifts.text) + '</p></div>');
    }
    if (S.accommodation) {
      tags.push('<div class="paper paper--note deckle3 tilt-r detail-tag reveal" style="text-align:center">' +
        '<h3>' + esc(C.accommodation.title) + '</h3><p>' + esc(C.accommodation.text) + '</p></div>');
    }
    if (tags.length) {
      html += '<section class="section" id="sec-details">' + head(C.wording.detailsTitle) +
        '<div class="details-row">' + tags.join('') + '</div></section>';
    }

    /* — RSVP — */
    if (S.rsvp) {
      html +=
        '<section class="section" id="sec-rsvp">' +
          decor('orchid', 'width:clamp(110px,18vw,180px); bottom:0; right:2%; opacity:.92', '0.06') +
          decor('sprig', 'width:clamp(44px,8vw,70px); top:6%; left:6%; transform:rotate(-22deg)', '0.1') +
          '<div class="paper paper--dark deckle2 rsvp-paper reveal">' +
            '<p class="rsvp-script">' + esc(C.wording.rsvpTitle) + '</p>' +
            '<div class="rsvp-hairline"></div>' +
            '<p class="rsvp-deadline">' + esc(C.rsvp.deadline) + '</p>' +
            (C.rsvp.note ? '<p class="rsvp-note">' + esc(C.rsvp.note) + '</p>' : '') +
            '<a class="btn btn--seal" href="' + esc(C.rsvp.link) + '" target="_blank" rel="noopener">' + miniSeal + esc(C.rsvp.buttonText) + '</a>' +
          '</div>' +
        '</section>';
    }

    /* — closing — */
    html +=
      '<section class="section closing">' +
        '<div class="reveal" style="display:grid;justify-items:center">' +
          mono +
          '<p class="closing-words">' + esc(C.wording.closingWords) + '</p>' +
          '<p class="closing-sign">' + esc(C.couple.firstName) + ' &amp; ' + esc(C.couple.secondName) + '</p>' +
          '<button class="replay" id="replayBtn">' + esc(C.wording.replayIntro) + '</button>' +
        '</div>' +
      '</section>';

    $('#site').innerHTML = html;
  }
  buildSite();

  /* ------------------------------------------------------------------
     COUNTDOWN + ADD TO CALENDAR
     ------------------------------------------------------------------ */
  var target = new Date(C.wedding.year, C.wedding.month - 1, C.wedding.day, C.wedding.hour, C.wedding.minute);
  var cdEl = $('#countdown');
  function renderCountdown() {
    if (!cdEl) return;
    var now = new Date();
    var diff = target - now;
    var dayEnd = new Date(target); dayEnd.setHours(23, 59, 59);
    if (diff <= 0) {
      cdEl.innerHTML = '<span class="cd-done">' + esc(now <= dayEnd ? C.wording.onTheDay : C.wording.afterTheDay) + '</span>';
      return;
    }
    var d = Math.floor(diff / 864e5),
        h = Math.floor(diff % 864e5 / 36e5),
        m = Math.floor(diff % 36e5 / 6e4),
        s = Math.floor(diff % 6e4 / 1e3);
    var units = [[d, 'days'], [h, 'hours'], [m, 'minutes'], [s, 'seconds']];
    cdEl.innerHTML = units.map(function (u) {
      return '<span class="cd-unit"><span class="cd-num">' + pad(u[0]) + '</span><span class="cd-lbl">' + u[1] + '</span></span>';
    }).join('');
  }
  renderCountdown();
  setInterval(renderCountdown, 1000);

  var calBtn = $('#calBtn');
  if (calBtn) {
    calBtn.addEventListener('click', function () {
      var dt = function (d) {
        return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + 'T' + pad(d.getHours()) + pad(d.getMinutes()) + '00';
      };
      var end = new Date(target.getTime() + (C.wedding.durationHours || 5) * 36e5);
      var ics = [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Heirloom//Invitation//EN',
        'BEGIN:VEVENT',
        'UID:' + Date.now() + '@heirloom',
        'DTSTAMP:' + dt(new Date()),
        'DTSTART:' + dt(target),
        'DTEND:' + dt(end),
        'SUMMARY:' + C.wedding.calendarTitle.replace(/([,;])/g, '\\$1'),
        'LOCATION:' + C.wedding.calendarLocation.replace(/([,;])/g, '\\$1'),
        'END:VEVENT', 'END:VCALENDAR'
      ].join('\r\n');
      var a = document.createElement('a');
      a.href = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics);
      a.download = 'wedding.ics';
      document.body.appendChild(a); a.click(); a.remove();
    });
  }

  /* ------------------------------------------------------------------
     SCROLL: reveals, parallax, warmth
     ------------------------------------------------------------------ */
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); observer.unobserve(e.target); }
    });
  }, { threshold: 0.16, rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('.reveal').forEach(function (el) { observer.observe(el); });

  var plxEls = Array.prototype.slice.call(document.querySelectorAll('[data-plx]'));
  var warmthEl = $('#warmth');
  var rsvpSec = $('#sec-rsvp');
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var vh = window.innerHeight;
      var mid = window.scrollY + vh / 2;
      if (!reducedMotion) {
        plxEls.forEach(function (el) {
          var host = el.parentElement;
          var c = host.offsetTop + host.offsetHeight / 2;
          el.style.transform = 'translate3d(0,' + ((mid - c) * parseFloat(el.dataset.plx)).toFixed(1) + 'px,0)';
        });
      }
      var endAnchor = rsvpSec ? rsvpSec.offsetTop : document.body.scrollHeight - vh * 1.6;
      var p = (window.scrollY + vh - endAnchor) / (vh * 1.35);
      warmthEl.style.opacity = Math.max(0, Math.min(1, p)) * 0.9;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  /* ------------------------------------------------------------------
     PETALS
     ------------------------------------------------------------------ */
  var petalsOn = false;
  function startPetals() {
    if (petalsOn || !C.effects.petals || reducedMotion) return;
    petalsOn = true;
    var box = $('#petals');
    (function spawn() {
      if (document.visibilityState === 'visible' && box.childElementCount < 9) {
        var p = document.createElement('span');
        p.className = 'petal' + (Math.random() < 0.3 ? ' blur' : '') + (Math.random() < 0.35 ? ' dim' : '');
        var size = 9 + Math.random() * 9;
        p.style.width = size + 'px';
        p.style.height = size * 0.86 + 'px';
        p.style.left = Math.random() * 100 + 'vw';
        p.style.animationDuration = (9 + Math.random() * 6) + 's';
        var inner = document.createElement('i');
        inner.className = 'petal-inner';
        inner.style.animationDuration = (2.1 + Math.random() * 1.4) + 's';
        inner.style.animationDelay = (-Math.random() * 2) + 's';
        p.appendChild(inner);
        p.addEventListener('animationend', function () { p.remove(); });
        box.appendChild(p);
      }
      setTimeout(spawn, 1300 + Math.random() * 900);
    })();
  }

  /* ------------------------------------------------------------------
     THE OPENING SEQUENCE
     ------------------------------------------------------------------ */
  var intro = $('#intro');
  var seal = $('#seal');
  var opened = false;

  setTimeout(function () { intro.classList.add('hinting'); }, 1800);

  function reveal(instant) {
    document.body.classList.remove('is-locked');
    var site = $('#site');
    site.setAttribute('aria-hidden', 'false');
    site.classList.add('shown');
    intro.classList.add('gone');
    window.scrollTo(0, 0);
    onScroll();
    startPetals();
    showMuteBtn();
    setTimeout(function () { intro.style.display = 'none'; }, instant ? 0 : 900);
    if (C.effects.rememberVisit) { try { localStorage.setItem('heirloom_opened', '1'); } catch (e) {} }
  }

  function playSequence() {
    if (opened) return;
    opened = true;
    audio.ensure();
    audio.startMusic();

    if (reducedMotion) { reveal(true); return; }

    intro.classList.add('pressed');
    setTimeout(function () { audio.crack(); intro.classList.add('cracked'); }, 140);
    setTimeout(function () { intro.classList.add('flap-open'); }, 500);
    setTimeout(function () { audio.slide(); intro.classList.add('card-risen'); }, 1050);
    setTimeout(function () { intro.classList.add('zoomed'); }, 1750);
    setTimeout(function () { intro.classList.add('card-open'); }, 2150);
    setTimeout(function () { reveal(false); }, 3150);
  }

  seal.addEventListener('click', playSequence);
  $('#skipIntro').addEventListener('click', function () {
    opened = true;
    audio.ensure();
    audio.startMusic();
    reveal(true);
  });

  /* returning guests go straight in */
  var seen = false;
  try { seen = localStorage.getItem('heirloom_opened') === '1'; } catch (e) {}
  if (C.effects.rememberVisit && seen) {
    opened = true;
    intro.style.display = 'none';
    document.body.classList.remove('is-locked');
    var site = $('#site');
    site.setAttribute('aria-hidden', 'false');
    site.classList.add('shown');
    startPetals();
    showMuteBtn();
    onScroll();
  }

  /* replay from the closing section */
  var replayBtn = $('#replayBtn');
  if (replayBtn) {
    replayBtn.addEventListener('click', function () {
      try { localStorage.removeItem('heirloom_opened'); } catch (e) {}
      location.reload();
    });
  }
})();
