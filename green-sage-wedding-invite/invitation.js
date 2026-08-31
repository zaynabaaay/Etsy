(() => {
  const sectionTwoStyles = document.createElement('link');
  sectionTwoStyles.rel = 'stylesheet';
  sectionTwoStyles.href = 'section2-overrides.css?v=20260820';
  document.head.appendChild(sectionTwoStyles);

  const sectionThreeStyles = document.createElement('link');
  sectionThreeStyles.rel = 'stylesheet';
  sectionThreeStyles.href = 'section3-overrides.css?v=20260820-v3';
  document.head.appendChild(sectionThreeStyles);

  const sectionFourStyles = document.createElement('link');
  sectionFourStyles.rel = 'stylesheet';
  sectionFourStyles.href = 'section4-overrides.css?v=20260820-v2';
  document.head.appendChild(sectionFourStyles);

  const sectionFiveStyles = document.createElement('link');
  sectionFiveStyles.rel = 'stylesheet';
  sectionFiveStyles.href = 'section5-overrides.css?v=20260820-v1';
  document.head.appendChild(sectionFiveStyles);

  const typographyStyles = document.createElement('link');
  typographyStyles.rel = 'stylesheet';
  typographyStyles.href = 'typography-system.css?v=20260831-hero-intro-v1';
  document.head.appendChild(typographyStyles);

  const scheduleList = document.querySelector('.schedule-list');

  if (scheduleList) {
    const events = [
      { name: 'Ceremony', time: '4:30 PM', icon: '<svg viewBox="0 0 72 72" aria-hidden="true"><path d="M14 58h44M18 58V34l18-16 18 16v24M24 58V38h24v20M31 58V45h10v13M22 34h28M36 18v-7M32 14h8"/><path d="M23 49c-4-2-7-6-8-10 5 0 9 3 11 7M49 49c4-2 7-6 8-10-5 0-9 3-11 7"/><path d="M26 30c3-5 7-8 10-10 3 2 7 5 10 10"/></svg>' },
      { name: 'Cocktail Hour', time: '5:30 PM', icon: '<svg viewBox="0 0 72 72" aria-hidden="true"><path d="M15 20h32c0 8-4 15-12 21v14M27 59h16M18 24c4 3 9 4 14 4s10-1 14-4"/><path d="M44 17c6 0 10 4 10 9s-4 9-10 9M49 21l8-5M50 24l9 1"/><path d="M23 18c3-3 7-5 11-5"/></svg>' },
      { name: 'Dinner', time: '6:30 PM', icon: '<svg viewBox="0 0 72 72" aria-hidden="true"><circle cx="36" cy="38" r="16"/><circle cx="36" cy="38" r="11"/><path d="M13 20v38M9 20v11c0 5 8 5 8 0V20M59 20c-5 7-5 14 0 21v17"/><path d="M31 37c3-5 8-7 13-7M32 41c4-1 8 0 11 3"/><path d="M39 31c2-4 5-6 8-7M44 24c2 0 4 1 5 3"/></svg>' },
      { name: 'Speeches', time: '8:00 PM', icon: '<svg viewBox="0 0 72 72" aria-hidden="true"><rect x="27" y="12" width="18" height="28" rx="9"/><path d="M30 18h12M30 23h12M30 28h12M30 33h12M36 40v16M28 58h16M23 29c0 9 5 16 13 16s13-7 13-16"/><path d="M20 47c4-1 7-3 10-6M52 47c-4-1-7-3-10-6"/><path d="M18 44c-3 2-5 5-6 8M54 44c3 2 5 5 6 8"/></svg>' },
      { name: 'Dancing', time: '9:00 PM', icon: '<svg viewBox="0 0 72 72" aria-hidden="true"><circle cx="36" cy="38" r="15"/><path d="M21 38h30M36 23v30M26 27c6 4 14 4 20 0M26 49c6-4 14-4 20 0M30 24c-3 8-3 20 0 28M42 24c3 8 3 20 0 28"/><path d="M36 10v10M31 14l5-4 5 4"/><path d="M16 20l1.4 3.1L21 24.5l-3.6 1.4L16 29l-1.4-3.1L11 24.5l3.6-1.4L16 20ZM56 14l1.2 2.6L60 18l-2.8 1.2L56 22l-1.2-2.8L52 18l2.8-1.4L56 14ZM55 46l1.4 3L60 50.5l-3.6 1.4L55 55l-1.4-3.1L50 50.5l3.6-1.5L55 46Z"/></svg>' }
    ];

    scheduleList.innerHTML = events.map((event) => `
      <li class="schedule-event">
        <span class="schedule-icon">${event.icon}</span>
        <span class="schedule-event-name system-heading system-heading--item">${event.name}</span>
        <span class="schedule-event-time system-time">${event.time}</span>
      </li>
    `).join('');
  }

  document.querySelector('.schedule-flow')?.remove();

  const scheduleSection = document.querySelector('.schedule-section');
  if (scheduleSection && !document.querySelector('.our-story-section')) {
    scheduleSection.insertAdjacentHTML('afterend', `
      <section class="story-section our-story-section" aria-labelledby="ourStoryHeading">
        <div class="our-story-inner">
          <div class="our-story-copy">
            <p class="our-story-label">Our Story</p>
            <svg class="our-story-motif" viewBox="0 0 220 18" aria-hidden="true">
              <line x1="0" y1="9" x2="91" y2="9" stroke="currentColor" stroke-width="0.8" stroke-linecap="round"/>
              <path d="M110 2 C111.5 6 113 7.5 117 9 C113 10.5 111.5 12 110 16 C108.5 12 107 10.5 103 9 C107 7.5 108.5 6 110 2Z" fill="currentColor"/>
              <line x1="129" y1="9" x2="220" y2="9" stroke="currentColor" stroke-width="0.8" stroke-linecap="round"/>
            </svg>
            <h2 class="our-story-heading" id="ourStoryHeading">How We Met</h2>
            <div class="our-story-body">
              <p>We met the way the best things often happen — unexpectedly, and at exactly the right time.</p>
              <p>What started with easy conversation became long walks, shared plans, and the kind of everyday moments that quietly turn into a life together.</p>
              <p>Now we get to celebrate the next chapter with the people who have been part of our story along the way.</p>
            </div>
            <p class="our-story-signoff">With love, Isabella &amp; Julian</p>
          </div>
          <div class="our-story-photo-wrap">
            <img class="our-story-photo" src="https://images.unsplash.com/photo-1616687818402-c768b3638374?auto=format&fit=crop&fm=jpg&q=90&w=1800" alt="Couple sharing a warm moment" loading="lazy" decoding="async">
          </div>
        </div>
      </section>
    `);
  }

  const ourStorySection = document.querySelector('.our-story-section');
  if (ourStorySection && !document.querySelector('.rsvp-section')) {
    ourStorySection.insertAdjacentHTML('afterend', `
      <section class="story-section rsvp-section" aria-labelledby="rsvpHeading">
        <div class="rsvp-inner">
          <p class="rsvp-label">RSVP</p>
          <svg class="rsvp-motif" viewBox="0 0 220 18" aria-hidden="true">
            <line x1="0" y1="9" x2="91" y2="9" stroke="currentColor" stroke-width="0.8" stroke-linecap="round"/>
            <path d="M110 2 C111.5 6 113 7.5 117 9 C113 10.5 111.5 12 110 16 C108.5 12 107 10.5 103 9 C107 7.5 108.5 6 110 2Z" fill="currentColor"/>
            <line x1="129" y1="9" x2="220" y2="9" stroke="currentColor" stroke-width="0.8" stroke-linecap="round"/>
          </svg>
          <h2 class="rsvp-heading" id="rsvpHeading">Will You Join Us?</h2>
          <div class="rsvp-body">
            <p>We would be so honored to celebrate this day with you.</p>
            <p>Please reply by <span class="rsvp-deadline">June 30, 2027</span>.</p>
          </div>
          <a class="rsvp-button" href="#">Respond Here</a>
        </div>
      </section>
    `);
  }

  const envelopeButton = document.getElementById('replayOpening');
  envelopeButton?.addEventListener('click', () => {
    envelopeButton.disabled = true;
    window.location.replace('index.html');
  });
})();
