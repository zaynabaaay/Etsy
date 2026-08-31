(() => {
  const sectionTwoStyles = document.createElement('link');
  sectionTwoStyles.rel = 'stylesheet';
  sectionTwoStyles.href = 'section2-overrides.css?v=20260831-ceremony-system-v2';
  document.head.appendChild(sectionTwoStyles);

  const sectionThreeStyles = document.createElement('link');
  sectionThreeStyles.rel = 'stylesheet';
  sectionThreeStyles.href = 'section3-overrides.css?v=20260831-schedule-serif-v1';
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
  typographyStyles.href = 'typography-system.css?v=20260831-scroll-arrow-v1';
  document.head.appendChild(typographyStyles);

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
