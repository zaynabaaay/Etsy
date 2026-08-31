(() => {
  const defaults = {
    couple: {
      firstName: 'ISABELLA',
      secondName: 'JULIAN'
    },
    date: {
      day: '24',
      month: '08',
      year: '2027',
      display: 'Saturday, August 24, 2027'
    },
    location: {
      city: 'Ottawa, Ontario'
    },
    ceremony: {
      venue: 'Miller Lash House',
      time: '4:30 PM',
      address: '130 Old Kingston Road',
      location: 'Toronto, Ontario'
    },
    sections: {
      opening: {
        background: 'invitation-assets/opening-background-reference.jpg?v=20260830-hero-v2',
        positionX: 50,
        positionY: 50,
        zoom: 100
      }
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
