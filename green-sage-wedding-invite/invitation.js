(() => {
  document.documentElement.classList.add('opening-animation-ready');

  const sectionTwoStyles = document.createElement('link');
  sectionTwoStyles.rel = 'stylesheet';
  sectionTwoStyles.href = 'section2-overrides.css?v=20260820';
  document.head.appendChild(sectionTwoStyles);

  const sectionThreeStyles = document.createElement('link');
  sectionThreeStyles.rel = 'stylesheet';
  sectionThreeStyles.href = 'section3-overrides.css?v=20260820-v2';
  document.head.appendChild(sectionThreeStyles);

  const scheduleList = document.querySelector('.schedule-list');
  const scheduleContent = document.querySelector('.schedule-content');

  if (scheduleList && scheduleContent) {
    const events = [
      {
        name: 'Ceremony',
        time: '4:30 PM',
        icon: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M18 54V30h28v24M24 30V20l8-9 8 9v10M28 54V41h8v13M16 54h32M29 24h6M32 21v6"/></svg>'
      },
      {
        name: 'Cocktail Hour',
        time: '5:30 PM',
        icon: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M18 14h28L34 31v17M27 54h14M21 18h22M23 22h18"/></svg>'
      },
      {
        name: 'Dinner',
        time: '6:30 PM',
        icon: '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="33" r="14"/><circle cx="32" cy="33" r="9"/><path d="M13 18v30M9 18v11c0 4 8 4 8 0V18M51 18c-4 6-4 13 0 18v12"/></svg>'
      },
      {
        name: 'Speeches',
        time: '8:00 PM',
        icon: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M38 13c6 2 9 8 7 14L27 49l-7-7 18-22c2-3 1-6 0-7ZM20 42l-5 9M24 46l-4 7M37 22l8 8"/></svg>'
      },
      {
        name: 'Dancing',
        time: '9:00 PM',
        icon: '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="14"/><path d="M18 32h28M32 18v28M22 23c6 5 14 5 20 0M22 41c6-5 14-5 20 0M26 19c-3 8-3 18 0 26M38 19c3 8 3 18 0 26M49 15l1.5 3.5L54 20l-3.5 1.5L49 25l-1.5-3.5L44 20l3.5-1.5L49 15Z"/></svg>'
      }
    ];

    scheduleList.innerHTML = events.map((event) => `
      <li class="schedule-event">
        <span class="schedule-icon">${event.icon}</span>
        <span class="schedule-event-name system-heading system-heading--item">${event.name}</span>
        <span class="schedule-event-time system-time">${event.time}</span>
      </li>
    `).join('');

    if (!scheduleContent.querySelector('.schedule-flow')) {
      scheduleContent.insertAdjacentHTML('beforeend', `
        <svg class="schedule-flow" viewBox="0 0 1000 82" preserveAspectRatio="none" aria-hidden="true">
          <path d="M20 42 C105 42 130 36 200 36 S330 48 400 48 S530 34 600 34 S730 46 800 46 S915 40 980 40"/>
          <circle cx="100" cy="40" r="2.4"/>
          <circle cx="300" cy="42" r="2.4"/>
          <circle cx="500" cy="40" r="2.4"/>
          <circle cx="700" cy="40" r="2.4"/>
          <circle cx="900" cy="41" r="2.4"/>
        </svg>
      `);
    }
  }

  const envelopeButton = document.getElementById('replayOpening');

  envelopeButton?.addEventListener('click', () => {
    envelopeButton.disabled = true;
    window.location.replace('index.html');
  });
})();
