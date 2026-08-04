(() => {
  const defaults = {
    couple: {
      firstName: 'ALEXANDRA',
      secondName: 'GABRIEL'
    },
    date: {
      day: '24',
      month: '08',
      year: '2027'
    },
    location: {
      city: 'Toronto, Ontario'
    },
    schedule: {
      title: 'The Celebration',
      events: [
        { time: '4:00 PM', title: 'Ceremony', place: 'The Glasshouse Estate' },
        { time: '5:30 PM', title: 'Cocktail Hour', place: 'The Olive Terrace' },
        { time: '7:00 PM', title: 'Dinner', place: 'The Conservatory' },
        { time: '9:00 PM', title: 'Dancing', place: 'Under the Stars' }
      ]
    },
    story: {
      title: 'From this day forward.',
      body: 'Some stories arrive quietly, and then change everything. We found a home in one another. On this day, surrounded by the people we love most, we begin our next chapter together.',
      signoff: 'With love, Alexandra & Gabriel'
    },
    details: {
      title: 'Your presence is part of the story.',
      body: 'This celebration would not feel complete without the family and friends who have stood beside us. We hope you will spend the day laughing, dining, and making memories with us.'
    },
    closing: {
      names: 'Alexandra & Gabriel'
    },
    sections: {
      opening: {
        background: 'invitation-assets/opening-background-sage-flatlay.png',
        positionX: 50,
        positionY: 50,
        zoom: 100
      },
      schedule: {
        background: '',
        positionX: 50,
        positionY: 50,
        zoom: 100
      },
      story: {
        background: '',
        positionX: 50,
        positionY: 50,
        zoom: 100
      },
      details: {
        background: '',
        positionX: 50,
        positionY: 50,
        zoom: 100
      }
    },
    wax: {
      name: 'Antique gold',
      filter: 'none'
    }
  };

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const mergeWithDefaults = (fallback, value) => {
    if (Array.isArray(fallback)) {
      return fallback.map((item, index) => mergeWithDefaults(item, value?.[index]));
    }

    if (fallback && typeof fallback === 'object') {
      return Object.fromEntries(
        Object.entries(fallback).map(([key, item]) => [key, mergeWithDefaults(item, value?.[key])])
      );
    }

    return value ?? fallback;
  };

  window.GreenSageTemplate = Object.freeze({
    storageKey: 'green-sage-template-draft-v1',
    defaults,
    cloneDefaults: () => clone(defaults),
    normalize: (value) => mergeWithDefaults(defaults, value),
    clone
  });
})();
