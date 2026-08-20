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
    ceremony: {
      venue: 'Venue Name',
      time: 'Ceremony Time',
      address: 'Street Address',
      location: 'City, Region'
    },
    sections: {
      opening: {
        background: 'invitation-assets/opening-background-reference.jpg',
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
