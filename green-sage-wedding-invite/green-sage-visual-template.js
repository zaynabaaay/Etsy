(() => {
  const TEMPLATE_REVISION = 3;
  const permissions = { editable: true, movable: true, resizable: true, deletable: true, locked: false };
  const text = (id, content, frame, style, overrides = {}) => {
    const { opacity = 1, ...textStyle } = style;
    return {
      id, sectionId: 'ceremony', type: 'text', content, frame, rotation: 0, opacity,
      style: { fontWeight: 400, fontStyle: 'normal', textAlign: 'center', ...textStyle },
      responsive: { strategy: 'scale', anchorX: 'center', ...(Object.keys(overrides).length ? { overrides } : {}) },
      permissions: { ...permissions }
    };
  };
  const openingText = (id, content, frame, style, overrides = {}) => {
    const { opacity = 1, ...textStyle } = style;
    return {
      id, sectionId: 'opening', type: 'text', content, frame, rotation: 0, opacity,
      style: { fontWeight: 400, fontStyle: 'normal', textAlign: 'center', ...textStyle },
      responsive: { strategy: 'scale', anchorX: 'center', ...(Object.keys(overrides).length ? { overrides } : {}) },
      permissions: { ...permissions }
    };
  };
  const dayText = (id, content, frame, style, overrides = {}) => {
    const { opacity = 1, ...textStyle } = style;
    return {
      id, sectionId: 'the-day', type: 'text', content, frame, rotation: 0, opacity,
      style: { fontWeight: 400, fontStyle: 'normal', textAlign: 'center', ...textStyle },
      responsive: { strategy: 'scale', anchorX: 'center', ...(Object.keys(overrides).length ? { overrides } : {}) },
      permissions: { ...permissions }
    };
  };
  const dayDivider = (id, frame, overrides) => ({
    id, sectionId: 'the-day', type: 'divider', visible: false, frame, rotation: 0, opacity: 0.18,
    style: { color: '#F4EFE7' },
    responsive: { strategy: 'scale', anchorX: 'center', overrides },
    permissions: { ...permissions }
  });
  const detailsText = (id, content, frame, style, overrides = {}) => {
    const { opacity = 1, ...textStyle } = style;
    return {
      id, sectionId: 'details', type: 'text', content, frame, rotation: 0, opacity,
      style: { fontWeight: 400, fontStyle: 'normal', textAlign: 'center', ...textStyle },
      responsive: { strategy: 'scale', anchorX: 'center', ...(Object.keys(overrides).length ? { overrides } : {}) },
      permissions: { ...permissions }
    };
  };
  const detailsIcon = (id, assetId, alt, frame, overrides = {}) => ({
    id, sectionId: 'details', type: 'decorative', assetId, assetKind: 'template', alt, frame, rotation: 0, opacity: 0.9,
    crop: { flipX: false, flipY: false, fit: 'contain', focalX: 50, focalY: 50, zoom: 1 },
    responsive: { strategy: 'scale', anchorX: 'center', ...(Object.keys(overrides).length ? { overrides } : {}) },
    permissions: { ...permissions }
  });
  const detailsDivider = (id, frame, visible, overrides) => ({
    id, sectionId: 'details', type: 'divider', visible, frame, rotation: 0, opacity: 0.22,
    style: { color: '#858977' },
    responsive: { strategy: 'scale', anchorX: 'center', overrides },
    permissions: { ...permissions }
  });
  const storyText = (id, content, frame, style, overrides = {}) => {
    const { opacity = 1, ...textStyle } = style;
    return {
      id, sectionId: 'our-story', type: 'text', content, frame, rotation: 0, opacity,
      style: { fontWeight: 400, fontStyle: 'normal', textAlign: 'left', ...textStyle },
      responsive: { strategy: 'scale', anchorX: 'center', ...(Object.keys(overrides).length ? { overrides } : {}) },
      permissions: { ...permissions }
    };
  };
  const rsvpText = (id, content, frame, style, overrides = {}) => {
    const { opacity = 1, ...textStyle } = style;
    return {
      id, sectionId: 'rsvp', type: 'text', content, frame, rotation: 0, opacity,
      style: { fontWeight: 400, fontStyle: 'normal', textAlign: 'center', ...textStyle },
      responsive: { strategy: 'scale', anchorX: 'center', ...(Object.keys(overrides).length ? { overrides } : {}) },
      permissions: { ...permissions }
    };
  };
  const cloneValue = (value) => JSON.parse(JSON.stringify(value));
  const valuesEqual = (left, right) => {
    if (Object.is(left, right)) return true;
    if (!left || !right || typeof left !== 'object' || typeof right !== 'object') return false;
    if (Array.isArray(left) || Array.isArray(right)) {
      return Array.isArray(left) && Array.isArray(right)
        && left.length === right.length
        && left.every((value, index) => valuesEqual(value, right[index]));
    }
    const leftKeys = Object.keys(left).sort();
    const rightKeys = Object.keys(right).sort();
    return valuesEqual(leftKeys, rightKeys) && leftKeys.every((key) => valuesEqual(left[key], right[key]));
  };
  const readPath = (target, path) => path.reduce((value, key) => value?.[key], target);
  const writePath = (target, path, value) => {
    let cursor = target;
    path.slice(0, -1).forEach((key) => {
      if (!cursor[key] || typeof cursor[key] !== 'object' || Array.isArray(cursor[key])) cursor[key] = {};
      cursor = cursor[key];
    });
    cursor[path[path.length - 1]] = cloneValue(value);
  };
  const migrateValue = (target, path, historicalValue, authoredValue) => {
    if (valuesEqual(readPath(target, path), historicalValue)) writePath(target, path, authoredValue);
  };
  const migrateLeaves = (target, path, historicalValue, authoredValue) => {
    const bothObjects = historicalValue && authoredValue
      && typeof historicalValue === 'object' && typeof authoredValue === 'object'
      && !Array.isArray(historicalValue) && !Array.isArray(authoredValue);
    if (!bothObjects) {
      migrateValue(target, path, historicalValue, authoredValue);
      return;
    }
    [...new Set([...Object.keys(historicalValue), ...Object.keys(authoredValue)])]
      .forEach((key) => migrateLeaves(target, [...path, key], historicalValue[key], authoredValue[key]));
  };
  const historicalStoryText = (id, content, frame, style, overrides = {}) => storyText(id, content, frame, style, overrides);
  const historicalStoryDivider = (id, frame, opacity, color, overrides) => ({
    id, sectionId: 'our-story', type: 'divider', frame, rotation: 0, opacity,
    style: { color }, responsive: { strategy: 'scale', anchorX: 'center', overrides },
    permissions: { ...permissions }
  });
  const historicalBody3 = historicalStoryText(
    'our-story-body-3',
    'Now we get to celebrate the next chapter with the people who have been part of our story along the way.',
    { x: 24, y: 401.13, width: 342, height: 75 },
    { fontFamily: 'Libre Baskerville', fontSize: 14, color: '#3F4037', lineHeight: 1.78, letterSpacing: 0 },
    {
      ipad: { frame: { x: 56, y: 447.36, width: 280.27, height: 77 }, style: { lineHeight: 1.82 } },
      desktop: { frame: { x: 84, y: 511.13, width: 457.91, height: 51 }, style: { lineHeight: 1.82 } }
    }
  );
  const historicalFrameElements = {
    'our-story-offset-top': historicalStoryDivider('our-story-offset-top', { x: 39.3, y: 581.27, width: 335.4, height: 1 }, 0.38, '#AD9B78', { ipad: { frame: { x: 404.27, y: 150.02, width: 320 } }, desktop: { frame: { x: 664, y: 126, width: 470 } } }),
    'our-story-offset-right': historicalStoryDivider('our-story-offset-right', { x: 373.7, y: 581.27, width: 1, height: 419.24 }, 0.38, '#AD9B78', { ipad: { frame: { x: 723.27, y: 150.02, height: 400 } }, desktop: { frame: { x: 1133, y: 126, height: 587.5 } } }),
    'our-story-offset-bottom': historicalStoryDivider('our-story-offset-bottom', { x: 39.3, y: 999.51, width: 335.4, height: 1 }, 0.38, '#AD9B78', { ipad: { frame: { x: 404.27, y: 549.02, width: 320 } }, desktop: { frame: { x: 664, y: 712.5, width: 470 } } }),
    'our-story-offset-left': historicalStoryDivider('our-story-offset-left', { x: 39.3, y: 581.27, width: 1, height: 419.24 }, 0.38, '#AD9B78', { ipad: { frame: { x: 404.27, y: 150.02, height: 400 } }, desktop: { frame: { x: 664, y: 126, height: 587.5 } } }),
    'our-story-border-top': historicalStoryDivider('our-story-border-top', { x: 27.3, y: 569.27, width: 335.4, height: 1 }, 1, '#D2CEC5', { ipad: { frame: { x: 386.27, y: 132.02, width: 320 } }, desktop: { frame: { x: 646, y: 108, width: 470 } } }),
    'our-story-border-right': historicalStoryDivider('our-story-border-right', { x: 361.7, y: 569.27, width: 1, height: 419.24 }, 1, '#D2CEC5', { ipad: { frame: { x: 705.27, y: 132.02, height: 400 } }, desktop: { frame: { x: 1115, y: 108, height: 587.5 } } }),
    'our-story-border-bottom': historicalStoryDivider('our-story-border-bottom', { x: 27.3, y: 987.51, width: 335.4, height: 1 }, 1, '#D2CEC5', { ipad: { frame: { x: 386.27, y: 531.02, width: 320 } }, desktop: { frame: { x: 646, y: 694.5, width: 470 } } }),
    'our-story-border-left': historicalStoryDivider('our-story-border-left', { x: 27.3, y: 569.27, width: 1, height: 419.24 }, 1, '#D2CEC5', { ipad: { frame: { x: 386.27, y: 132.02, height: 400 } }, desktop: { frame: { x: 646, y: 108, height: 587.5 } } })
  };
  const storyElementChanges = {
    'our-story-label': {
      historical: { frame: { x: 24, y: 82, width: 342, height: 18 }, opacity: 1, style: { fontFamily: 'Libre Baskerville' }, responsive: { overrides: { ipad: { frame: { x: 56, y: 88, width: 280.27 } }, desktop: { frame: { x: 84, y: 185.16, width: 457.91 } } } } },
      authored: { frame: { x: 32, y: 64, width: 326, height: 18 }, opacity: 0.92, style: { fontFamily: 'Instrument Sans' }, responsive: { overrides: { ipad: { frame: { x: 56, y: 88, width: 280 } }, desktop: { frame: { x: 84, y: 114, width: 430 } } } } }
    },
    'our-story-motif': {
      historical: { frame: { x: 24, y: 112.34, width: 118, height: 9.65 }, responsive: { overrides: { ipad: { frame: { x: 56, y: 118.5 } }, desktop: { frame: { x: 84, y: 217.66, width: 132, height: 10.8 } } } } },
      authored: { frame: { x: 32, y: 96, width: 118, height: 9.65 }, responsive: { overrides: { ipad: { frame: { x: 56, y: 118.5 } }, desktop: { frame: { x: 84, y: 146, width: 132, height: 10.8 } } } } }
    },
    'our-story-heading': {
      historical: { frame: { x: 24, y: 145.98, width: 342, height: 58 }, style: { fontSize: 50.7, lineHeight: 0.94, letterSpacing: -1.2675 }, responsive: { overrides: { ipad: { frame: { x: 56, y: 156.15, width: 280.27 }, style: { fontSize: 52, letterSpacing: -1.3 } }, desktop: { frame: { x: 84, y: 258.46, width: 457.91, height: 64 }, style: { fontSize: 61.8, letterSpacing: -1.545 } } } } },
      authored: { frame: { x: 32, y: 128, width: 326, height: 50 }, style: { fontSize: 42, lineHeight: 0.98, letterSpacing: -1.05 }, responsive: { overrides: { ipad: { frame: { x: 56, y: 151, width: 280 }, style: { fontSize: 44, letterSpacing: -1.1 } }, desktop: { frame: { x: 84, y: 178, width: 430, height: 58 }, style: { fontSize: 50, letterSpacing: -1.25 } } } } }
    },
    'our-story-body-1': {
      historical: { content: 'We met the way the best things often happen — unexpectedly, and at exactly the right time.', frame: { x: 24, y: 219.64, width: 342, height: 50 }, style: { lineHeight: 1.78 }, responsive: { overrides: { ipad: { frame: { x: 56, y: 233.02, width: 280.27, height: 77 }, style: { lineHeight: 1.82 } }, desktop: { frame: { x: 84, y: 347.74, width: 457.91, height: 51 }, style: { lineHeight: 1.82 } } } } },
      authored: { content: 'We first met unexpectedly, and what started as an easy conversation quickly turned into hours together. After that came long walks, shared dinners, and the kind of friendship that slowly became something more.', frame: { x: 32, y: 198, width: 326, height: 145 }, style: { lineHeight: 1.72 }, responsive: { overrides: { ipad: { frame: { x: 56, y: 220, width: 280, height: 170 }, style: { lineHeight: 1.7 } }, desktop: { frame: { x: 84, y: 260, width: 430, height: 104 }, style: { lineHeight: 1.72 } } } } }
    },
    'our-story-body-2': {
      historical: { content: 'What started with easy conversation became long walks, shared plans, and the kind of everyday moments that quietly turn into a life together.', frame: { x: 24, y: 285.47, width: 342, height: 100 }, style: { lineHeight: 1.78 }, responsive: { overrides: { ipad: { frame: { x: 56, y: 327.45, width: 280.27, height: 102 }, style: { lineHeight: 1.82 } }, desktop: { frame: { x: 84, y: 416.7, width: 457.91, height: 77 }, style: { lineHeight: 1.82 } } } } },
      authored: { content: 'A few years later, we’re beginning our next chapter together — and we’re so happy to celebrate it with the people we love most.', frame: { x: 32, y: 365, width: 326, height: 121 }, style: { lineHeight: 1.72 }, responsive: { overrides: { ipad: { frame: { x: 56, y: 412, width: 280, height: 100 }, style: { lineHeight: 1.7 } }, desktop: { frame: { x: 84, y: 386, width: 430, height: 104 }, style: { lineHeight: 1.72 } } } } }
    },
    'our-story-signoff': {
      historical: { frame: { x: 24, y: 499.87, width: 342, height: 36 }, style: { fontSize: 28 }, responsive: { overrides: { ipad: { frame: { x: 56, y: 549.79, width: 280.27 }, style: { fontSize: 25 } }, desktop: { frame: { x: 84, y: 592.08, width: 457.91 }, style: { fontSize: 25 } } } } },
      authored: { frame: { x: 32, y: 510, width: 326, height: 32 }, style: { fontSize: 22 }, responsive: { overrides: { ipad: { frame: { x: 56, y: 536, width: 280 }, style: { fontSize: 20 } }, desktop: { frame: { x: 84, y: 516, width: 430 }, style: { fontSize: 20 } } } } }
    },
    'our-story-photo': {
      historical: { frame: { x: 27.3, y: 569.27, width: 335.4, height: 419.24 }, responsive: { overrides: { ipad: { frame: { x: 386.27, y: 132.02, width: 320, height: 400 } }, desktop: { frame: { x: 646, y: 108, width: 470, height: 587.5 } } } } },
      authored: { frame: { x: 32, y: 574, width: 326, height: 407.5 }, responsive: { overrides: { ipad: { frame: { x: 400, y: 130, width: 320, height: 400 } }, desktop: { frame: { x: 646, y: 100, width: 470, height: 587.5 } } } } }
    }
  };
  const migrateResponsiveFontSize = (element, breakpoint, historicalValue, authoredValue) => {
    const override = element?.responsive?.overrides?.[breakpoint]?.style;
    const effective = override && Object.prototype.hasOwnProperty.call(override, 'fontSize') ? override.fontSize : element?.style?.fontSize;
    if (valuesEqual(effective, historicalValue)) {
      if (!element.responsive) element.responsive = { strategy: 'scale', anchorX: 'center' };
      if (!element.responsive.overrides) element.responsive.overrides = {};
      if (!element.responsive.overrides[breakpoint]) element.responsive.overrides[breakpoint] = {};
      if (!element.responsive.overrides[breakpoint].style) element.responsive.overrides[breakpoint].style = {};
      element.responsive.overrides[breakpoint].style.fontSize = authoredValue;
    }
  };
  const migrateOurStoryRefinement = (source) => {
    const next = cloneValue(source);
    const section = next.sections?.['our-story'];
    if (!section || !next.elements) return next;
    migrateLeaves(section, [],
      { height: 1081, responsive: { overrides: { ipad: { height: 1024 }, desktop: { height: 1000 } } } },
      { height: 1030, responsive: { overrides: { ipad: { height: 650 }, desktop: { height: 760 } } } });
    Object.entries(storyElementChanges).forEach(([id, change]) => {
      if (next.elements[id]) migrateLeaves(next.elements[id], [], change.historical, change.authored);
    });
    ['our-story-body-1', 'our-story-body-2'].forEach((id) => {
      if (next.elements[id]) migrateResponsiveFontSize(next.elements[id], 'ipad', 14, 13.5);
    });
    const removable = { 'our-story-body-3': historicalBody3, ...historicalFrameElements };
    Object.entries(removable).forEach(([id, historicalDefinition]) => {
      if (!valuesEqual(next.elements[id], historicalDefinition)) return;
      delete next.elements[id];
      section.elementOrder = section.elementOrder.filter((elementId) => elementId !== id);
    });
    return next;
  };
  const migrateOurStorySpacing = (source) => {
    const next = cloneValue(source);
    const section = next.sections?.['our-story'];
    if (!section || !next.elements) return next;
    migrateLeaves(section, [],
      { height: 1030, responsive: { overrides: { ipad: { height: 650 }, desktop: { height: 760 } } } },
      { height: 1004, responsive: { overrides: { ipad: { height: 630 }, desktop: { height: 740 } } } });
    const changes = {
      'our-story-body-2': {
        historical: { frame: { y: 365 }, responsive: { overrides: { ipad: { frame: { y: 412 } }, desktop: { frame: { y: 386 } } } } },
        authored: { frame: { y: 361 }, responsive: { overrides: { ipad: { frame: { y: 404 } }, desktop: { frame: { y: 380 } } } } }
      },
      'our-story-signoff': {
        historical: { frame: { y: 510 }, responsive: { overrides: { ipad: { frame: { y: 536 } }, desktop: { frame: { y: 516 } } } } },
        authored: { frame: { y: 490 }, responsive: { overrides: { ipad: { frame: { y: 516 } }, desktop: { frame: { y: 500 } } } } }
      },
      'our-story-photo': {
        historical: { frame: { y: 574 } },
        authored: { frame: { y: 548 } }
      }
    };
    Object.entries(changes).forEach(([id, change]) => {
      if (next.elements[id]) migrateLeaves(next.elements[id], [], change.historical, change.authored);
    });
    return next;
  };
  // Revision 3 is the immutable authored RSVP addition. Future RSVP refinements
  // should add a new revision instead of changing these historical values.
  const rsvpRevision3Section = {
    id: 'rsvp', name: 'RSVP', height: 474.02, heightPreset: 'custom',
    background: { kind: 'color', color: '#E6E3DC', assetId: '', assetKind: 'template', focalX: 50, focalY: 50, zoom: 1 },
    elementOrder: [
      'rsvp-label', 'rsvp-motif', 'rsvp-heading', 'rsvp-body',
      'rsvp-deadline-prefix', 'rsvp-deadline', 'rsvp-deadline-period',
      'rsvp-respond', 'rsvp-respond-underline'
    ],
    responsive: { overrides: { ipad: { height: 798.72 }, desktop: { height: 780 } } }
  };
  const rsvpRevision3Elements = {
    'rsvp-label': rsvpText('rsvp-label', 'RSVP', { x: 24, y: 68, width: 342, height: 32 },
      { fontFamily: 'Libre Baskerville', fontSize: 9, color: '#626753', lineHeight: 1.45, letterSpacing: 3.06 },
      { ipad: { frame: { x: 53.75, width: 660.5 }, style: { fontSize: 10, letterSpacing: 3.4 } }, desktop: { frame: { x: 240, y: 89.27, width: 720 }, style: { fontSize: 11.232, letterSpacing: 3.81888 } } }),
    'rsvp-motif': {
      id: 'rsvp-motif', sectionId: 'rsvp', type: 'decorative', assetId: 'our-story-motif', assetKind: 'template', alt: '',
      frame: { x: 132, y: 85.2, width: 126, height: 32 }, rotation: 0, opacity: 0.56, svgColor: '#626753',
      crop: { flipX: false, flipY: false, fit: 'contain', focalX: 50, focalY: 50, zoom: 1 },
      responsive: { strategy: 'scale', anchorX: 'center', overrides: {
        ipad: { frame: { x: 325, y: 86.32, width: 118 } },
        desktop: { frame: { x: 525, y: 110.69, width: 150 } }
      } },
      permissions: { ...permissions }
    },
    'rsvp-heading': rsvpText('rsvp-heading', 'Will You Join Us?', { x: 24, y: 133.34, width: 342, height: 44.64 },
      { fontFamily: 'Cormorant Garamond', fontSize: 46.02, color: '#3F4037', lineHeight: 0.97, letterSpacing: -0.9204 },
      { ipad: { frame: { x: 53.75, y: 137.14, width: 660.5, height: 46.56 }, style: { fontSize: 48, letterSpacing: -0.96 } }, desktop: { frame: { x: 240, y: 168.81, width: 720, height: 64.02 }, style: { fontSize: 66, letterSpacing: -1.32 } } }),
    'rsvp-body': rsvpText('rsvp-body', 'We would be so honored to celebrate this day with you.', { x: 24, y: 205.97, width: 342, height: 48.03 },
      { fontFamily: 'Libre Baskerville', fontSize: 13.5, color: '#3F4037', lineHeight: 1.78, letterSpacing: 0 },
      { ipad: { frame: { x: 124, y: 213.69, width: 520, height: 32 }, style: { fontSize: 13, lineHeight: 1.82 } }, desktop: { frame: { x: 340, y: 270.83, width: 520, height: 32 }, style: { fontSize: 13.824, lineHeight: 1.82 } } }),
    'rsvp-deadline-prefix': rsvpText('rsvp-deadline-prefix', 'Please reply by ', { x: 93.52, y: 264, width: 106.91, height: 32 },
      { fontFamily: 'Libre Baskerville', fontSize: 13.5, color: '#3F4037', textAlign: 'left', lineHeight: 1.78, letterSpacing: 0 },
      { ipad: { frame: { x: 286.27, y: 248.34, width: 102.94 }, style: { fontSize: 13, lineHeight: 1.82 } }, desktop: { frame: { x: 496.11, y: 306.98, width: 109.44 }, style: { fontSize: 13.824, lineHeight: 1.82 } } }),
    'rsvp-deadline': rsvpText('rsvp-deadline', 'June 30, 2027', { x: 200.42, y: 264, width: 100.49, height: 32 },
      { fontFamily: 'Libre Baskerville', fontSize: 13.5, color: '#626753', textAlign: 'left', lineHeight: 1.78, letterSpacing: 0 },
      { ipad: { frame: { x: 389.2, y: 248.34, width: 97.07 }, style: { fontSize: 13, lineHeight: 1.82 } }, desktop: { frame: { x: 605.55, y: 306.98, width: 102.67 }, style: { fontSize: 13.824, lineHeight: 1.82 } } }),
    'rsvp-deadline-period': rsvpText('rsvp-deadline-period', '.', { x: 292.91, y: 264, width: 40, height: 32 },
      { fontFamily: 'Libre Baskerville', fontSize: 13.5, color: '#3F4037', textAlign: 'left', lineHeight: 1.78, letterSpacing: 0 },
      { ipad: { frame: { x: 478.27, y: 248.34 }, style: { fontSize: 13, lineHeight: 1.82 } }, desktop: { frame: { x: 700.22, y: 306.98 }, style: { fontSize: 13.824, lineHeight: 1.82 } } }),
    'rsvp-respond': rsvpText('rsvp-respond', 'Respond Here', { x: 141.45, y: 320.02, width: 107.08, height: 32 },
      { fontFamily: 'Libre Baskerville', fontSize: 9, color: '#626753', lineHeight: 1.4, letterSpacing: 2.16 },
      { ipad: { frame: { x: 330.45, y: 306 } }, desktop: { frame: { x: 538.36, y: 372.14, width: 123.28 }, style: { fontSize: 10.368, letterSpacing: 2.48832 } } }),
    'rsvp-respond-underline': {
      id: 'rsvp-respond-underline', sectionId: 'rsvp', type: 'divider',
      frame: { x: 161.8, y: 377.02, width: 66.39, height: 1 }, rotation: 0, opacity: 0.34,
      style: { color: '#626753' }, responsive: { strategy: 'scale', anchorX: 'center', overrides: {
        ipad: { frame: { x: 350.79, y: 363, width: 66.39 } },
        desktop: { frame: { x: 561.79, y: 429.14, width: 76.43 } }
      } }, permissions: { ...permissions }
    }
  };
  const migrateRsvpAddition = (source) => {
    const next = cloneValue(source);
    if (!next.document || !next.sections || !next.elements) return next;
    const persistedRsvp = next.sections.rsvp
      || Object.values(next.elements).some((element) => element?.sectionId === 'rsvp');
    if (persistedRsvp) return next;
    next.sections.rsvp = cloneValue(rsvpRevision3Section);
    Object.assign(next.elements, cloneValue(rsvpRevision3Elements));
    const order = Array.isArray(next.document.sectionOrder) ? next.document.sectionOrder : [];
    const storyIndex = order.indexOf('our-story');
    order.splice(storyIndex >= 0 ? storyIndex + 1 : order.length, 0, 'rsvp');
    next.document.sectionOrder = order;
    return next;
  };
  const defaultDocument = {
    schemaVersion: 4,
    document: {
      id: 'green-sage-visual-template', templateId: 'green-sage', title: 'Green Sage invitation',
      templateRevision: TEMPLATE_REVISION,
      colors: ['#F4EFE7', '#EFECE7', '#858977', '#626753', '#44463D', '#5F6051'],
      canvas: { baseWidth: 390, maxRenderedWidth: 560, viewportBackground: '#F4EFE7', safeMargin: 20 },
      sectionOrder: ['opening', 'ceremony', 'the-day', 'details', 'our-story', 'rsvp'], media: { audio: null }
    },
    sections: {
      opening: {
        id: 'opening', name: 'Opening', height: 844, heightPreset: 'full',
        background: { kind: 'image', color: '#F4EFE7', assetId: 'background-green-sage-opening', assetKind: 'template', focalX: 50, focalY: 50, zoom: 1 },
        elementOrder: ['opening-intro-1', 'opening-intro-2', 'opening-isabella', 'opening-and', 'opening-julian', 'opening-date', 'opening-location', 'opening-scroll'],
        responsive: { overrides: { ipad: { height: 1024 }, desktop: { height: 1000 } } }
      },
      ceremony: {
        id: 'ceremony', name: 'Ceremony', height: 844, heightPreset: 'full',
        background: { kind: 'color', color: '#EFECE7', assetId: '', assetKind: 'template', focalX: 50, focalY: 50, zoom: 1 },
        elementOrder: ['ceremony-label', 'ceremony-glasshouse', 'ceremony-venue', 'ceremony-time', 'ceremony-address'],
        responsive: { overrides: { ipad: { height: 1024 }, desktop: { height: 1000 } } }
      },
      'the-day': {
        id: 'the-day', name: 'The Day', height: 450.25, heightPreset: 'custom',
        background: { kind: 'color', color: '#858977', assetId: '', assetKind: 'template', focalX: 50, focalY: 50, zoom: 1 },
        elementOrder: [
          'the-day-label',
          'the-day-time-1', 'the-day-event-1',
          'the-day-divider-1', 'the-day-time-2', 'the-day-event-2',
          'the-day-divider-2', 'the-day-time-3', 'the-day-event-3',
          'the-day-divider-3', 'the-day-time-4', 'the-day-event-4',
          'the-day-divider-4', 'the-day-time-5', 'the-day-event-5'
        ],
        responsive: { overrides: { ipad: { height: 500 }, desktop: { height: 540 } } }
      },
      details: {
        id: 'details', name: 'Details', height: 844, heightPreset: 'custom',
        background: { kind: 'image', color: '#F4EFE7', assetId: 'background-green-sage-opening', assetKind: 'template', fit: 'cover', focalX: 50, focalY: 50, zoom: 1 },
        elementOrder: [
          'details-label', 'details-subtitle',
          'details-dress-code-icon', 'details-dress-code-title', 'details-dress-code-copy',
          'details-parking-icon', 'details-parking-title', 'details-parking-copy',
          'details-adults-only-icon', 'details-adults-only-title', 'details-adults-only-copy',
          'details-accommodation-icon', 'details-accommodation-title', 'details-accommodation-copy',
          'details-transportation-icon', 'details-transportation-title', 'details-transportation-copy',
          'details-gifts-icon', 'details-gifts-title', 'details-gifts-copy',
          'details-divider-column-1', 'details-divider-column-2',
          'details-divider-row-1', 'details-divider-row-2'
        ],
        responsive: { overrides: { ipad: { height: 760 }, desktop: { height: 760 } } }
      },
      'our-story': {
        id: 'our-story', name: 'Our Story', height: 1004, heightPreset: 'custom',
        background: { kind: 'color', color: '#F3F2ED', assetId: '', assetKind: 'template', focalX: 50, focalY: 50, zoom: 1 },
        elementOrder: [
          'our-story-label', 'our-story-motif',
          'our-story-heading', 'our-story-body-1', 'our-story-body-2', 'our-story-signoff',
          'our-story-photo'
        ],
        responsive: { overrides: { ipad: { height: 630 }, desktop: { height: 740 } } }
      },
      rsvp: cloneValue(rsvpRevision3Section)
    },
    elements: {
      'opening-intro-1': openingText('opening-intro-1', 'Together with their families', { x: 32.38, y: 232.58, width: 325.23, height: 32 },
        { fontFamily: 'Instrument Sans', fontSize: 12, color: '#5F6051', lineHeight: 1.55, letterSpacing: 0.99, opacity: 0.96 },
        { ipad: { frame: { x: 151.97, y: 304.37, width: 464.06 } }, desktop: { frame: { x: 235.92, y: 230.8, width: 728.16 }, style: { fontSize: 13, letterSpacing: 1.08 } } }),
      'opening-intro-2': openingText('opening-intro-2', 'invite you to celebrate the marriage of', { x: 32.38, y: 254.63, width: 325.23, height: 32 },
        { fontFamily: 'Instrument Sans', fontSize: 12, color: '#5F6051', lineHeight: 1.55, letterSpacing: 0.99, opacity: 0.96 },
        { ipad: { frame: { x: 151.97, y: 326.42, width: 464.06 } }, desktop: { frame: { x: 235.92, y: 254.39, width: 728.16 }, style: { fontSize: 13, letterSpacing: 1.08 } } }),
      'opening-isabella': openingText('opening-isabella', 'ISABELLA', { x: 43.31, y: 295.67, width: 303.34, height: 53.55 },
        { fontFamily: 'Baskervville', fontSize: 54.7, color: '#44463D', lineHeight: 0.92, letterSpacing: 1.08 },
        { ipad: { frame: { x: 233.84, y: 371.47, width: 300.31, height: 52.98 }, style: { fontSize: 54.1 } }, desktop: { frame: { x: 335.73, y: 304.17, width: 528.52, height: 93.25 }, style: { fontSize: 95.3, letterSpacing: 1.9008 } } }),
      'opening-and': openingText('opening-and', 'and', { x: 105.55, y: 359.14, width: 178.88, height: 32 },
        { fontFamily: 'Cormorant Garamond', fontSize: 19.2, fontStyle: 'italic', color: '#626753', lineHeight: 1, letterSpacing: 0, opacity: 0.76 },
        { ipad: { frame: { x: 272.63, y: 434.36, width: 222.75 } }, desktop: { frame: { x: 475, y: 411.58, width: 250, height: 33.8 }, style: { fontSize: 33.792 } } }),
      'opening-julian': openingText('opening-julian', 'JULIAN', { x: 76.92, y: 386.72, width: 236.14, height: 56.3 },
        { fontFamily: 'Baskervville', fontSize: 57.5, color: '#44463D', lineHeight: 0.92, letterSpacing: 1.08 },
        { ipad: { frame: { x: 265.36, y: 461.94, width: 237.27, height: 56.58 }, style: { fontSize: 57.8 } }, desktop: { frame: { x: 391.2, y: 456.84, width: 417.58, height: 99.56 }, style: { fontSize: 101.75, letterSpacing: 1.9008 } } }),
      'opening-date': openingText('opening-date', 'Tuesday, August 24, 2027', { x: 32.38, y: 479.02, width: 325.23, height: 32 },
        { fontFamily: 'Instrument Sans', fontSize: 13, color: '#44463D', lineHeight: 1.45, letterSpacing: 0.96 },
        { ipad: { frame: { x: 151.97, y: 554.52, width: 464.06 } }, desktop: { frame: { x: 235.92, y: 597.2, width: 728.16 } } }),
      'opening-location': openingText('opening-location', 'Ottawa, Ontario', { x: 32.38, y: 504.41, width: 325.23, height: 32 },
        { fontFamily: 'Instrument Sans', fontSize: 11, color: '#5F6051', lineHeight: 1.5, letterSpacing: 1.2, opacity: 0.93 },
        { ipad: { frame: { x: 151.97, y: 579.91, width: 464.06 } }, desktop: { frame: { x: 235.92, y: 622.59, width: 728.16 } } }),
      'opening-scroll': openingText('opening-scroll', 'Scroll to view', { x: 32.38, y: 567.41, width: 325.23, height: 32 },
        { fontFamily: 'Instrument Sans', fontSize: 8, color: '#5F6051', lineHeight: 1.2, letterSpacing: 1.92 },
        { ipad: { frame: { x: 151.97, y: 644.91, width: 464.06 } }, desktop: { frame: { x: 235.92, y: 695.19, width: 728.16 } } }),
      'ceremony-label': text('ceremony-label', 'CEREMONY', { x: 95, y: 228, width: 200, height: 32 },
        { fontFamily: 'Instrument Sans', fontSize: 10, color: '#626753', lineHeight: 1.5, letterSpacing: 3, opacity: 0.92 },
        { ipad: { frame: { x: 284, y: 321 } }, desktop: { frame: { x: 500, y: 278 } } }),
      'ceremony-time': text('ceremony-time', '3:00 PM', { x: 95, y: 545, width: 200, height: 32 },
        { fontFamily: 'Instrument Sans', fontSize: 14, color: '#626753', lineHeight: 1.5, letterSpacing: 2.34, opacity: 0.92 },
        { ipad: { frame: { x: 284, y: 686 } }, desktop: { frame: { x: 500, y: 747 }, style: { fontSize: 15 } } }),
      'ceremony-glasshouse': {
        id: 'ceremony-glasshouse', sectionId: 'ceremony', type: 'decorative', assetId: 'venue-glasshouse', assetKind: 'template', alt: 'Glasshouse illustration',
        frame: { x: 30, y: 306, width: 330, height: 160.875 }, rotation: 0, opacity: 0.58,
        crop: { flipX: false, flipY: false, fit: 'contain', focalX: 50, focalY: 50, zoom: 1 },
        responsive: { strategy: 'scale', anchorX: 'center', overrides: {
          ipad: { frame: { x: 174, y: 405, width: 420, height: 204.75 } },
          desktop: { frame: { x: 300, y: 360, width: 600, height: 292.5 } }
        } },
        permissions: { ...permissions }
      },
      'ceremony-venue': text('ceremony-venue', 'The Glasshouse', { x: 35, y: 475, width: 320, height: 56 },
        { fontFamily: 'Instrument Serif', fontSize: 44.5, color: '#44463D', lineHeight: 0.98, letterSpacing: 0.468 },
        {
          ipad: { frame: { x: 224, y: 618 }, style: { fontSize: 46, letterSpacing: 0.48 } },
          desktop: { frame: { x: 350, y: 661, width: 500, height: 74 }, style: { fontSize: 59.5, letterSpacing: 0.624 } }
        }),
      'ceremony-address': text('ceremony-address', '123 Example Street\nOttawa, Ontario', { x: 70, y: 579, width: 250, height: 52 },
        { fontFamily: 'Instrument Sans', fontSize: 13, color: '#44463D', lineHeight: 2, letterSpacing: 0.88, opacity: 0.82 },
        { ipad: { frame: { x: 259, y: 720 } }, desktop: { frame: { x: 475, y: 781 }, style: { fontSize: 14 } } }),
      'the-day-label': dayText('the-day-label', 'THE DAY', { x: 24, y: 96, width: 342, height: 32 },
        { fontFamily: 'Instrument Sans', fontSize: 10, color: '#F4EFE7', lineHeight: 1.5, letterSpacing: 3.4, opacity: 0.94 },
        { ipad: { frame: { x: 48, y: 160.5, width: 672 } }, desktop: { frame: { x: 48, y: 173.7, width: 1104 } } }),
      'the-day-time-1': dayText('the-day-time-1', '3:00 PM', { x: 24, y: 160, width: 82, height: 32 },
        { fontFamily: 'Instrument Sans', fontSize: 11, color: '#F4EFE7', textAlign: 'right', lineHeight: 1.4, letterSpacing: 1.76, opacity: 0.72 },
        { ipad: { frame: { x: 48, y: 254.4, width: 134.4 }, style: { fontSize: 10.5, textAlign: 'center', letterSpacing: 1.68 } }, desktop: { frame: { x: 48, y: 275.7, width: 220.8 }, style: { fontSize: 10.5, textAlign: 'center', letterSpacing: 1.68 } } }),
      'the-day-event-1': dayText('the-day-event-1', 'Ceremony', { x: 130, y: 151, width: 236, height: 32 },
        { fontFamily: 'Instrument Serif', fontSize: 21, color: '#F4EFE7', textAlign: 'left', lineHeight: 1.25, letterSpacing: 0.315 },
        { ipad: { frame: { x: 48, y: 285.1, width: 134.4 }, style: { fontSize: 22, textAlign: 'center', letterSpacing: 0.33 } }, desktop: { frame: { x: 48, y: 308.4, width: 220.8 }, style: { fontSize: 22.8, textAlign: 'center', letterSpacing: 0.342 } } }),
      'the-day-time-2': dayText('the-day-time-2', '4:00 PM', { x: 24, y: 210.25, width: 82, height: 32 },
        { fontFamily: 'Instrument Sans', fontSize: 11, color: '#F4EFE7', textAlign: 'right', lineHeight: 1.4, letterSpacing: 1.76, opacity: 0.72 },
        { ipad: { frame: { x: 182.4, y: 254.4, width: 134.4 }, style: { fontSize: 10.5, textAlign: 'center', letterSpacing: 1.68 } }, desktop: { frame: { x: 268.8, y: 275.7, width: 220.8 }, style: { fontSize: 10.5, textAlign: 'center', letterSpacing: 1.68 } } }),
      'the-day-event-2': dayText('the-day-event-2', 'Cocktail Hour', { x: 130, y: 201.25, width: 236, height: 32 },
        { fontFamily: 'Instrument Serif', fontSize: 21, color: '#F4EFE7', textAlign: 'left', lineHeight: 1.25, letterSpacing: 0.315 },
        { ipad: { frame: { x: 182.4, y: 285.1, width: 134.4 }, style: { fontSize: 22, textAlign: 'center', letterSpacing: 0.33 } }, desktop: { frame: { x: 268.8, y: 308.4, width: 220.8 }, style: { fontSize: 22.8, textAlign: 'center', letterSpacing: 0.342 } } }),
      'the-day-time-3': dayText('the-day-time-3', '5:30 PM', { x: 24, y: 260.5, width: 82, height: 32 },
        { fontFamily: 'Instrument Sans', fontSize: 11, color: '#F4EFE7', textAlign: 'right', lineHeight: 1.4, letterSpacing: 1.76, opacity: 0.72 },
        { ipad: { frame: { x: 316.8, y: 254.4, width: 134.4 }, style: { fontSize: 10.5, textAlign: 'center', letterSpacing: 1.68 } }, desktop: { frame: { x: 489.6, y: 275.7, width: 220.8 }, style: { fontSize: 10.5, textAlign: 'center', letterSpacing: 1.68 } } }),
      'the-day-event-3': dayText('the-day-event-3', 'Dinner', { x: 130, y: 251.5, width: 236, height: 32 },
        { fontFamily: 'Instrument Serif', fontSize: 21, color: '#F4EFE7', textAlign: 'left', lineHeight: 1.25, letterSpacing: 0.315 },
        { ipad: { frame: { x: 316.8, y: 285.1, width: 134.4 }, style: { fontSize: 22, textAlign: 'center', letterSpacing: 0.33 } }, desktop: { frame: { x: 489.6, y: 308.4, width: 220.8 }, style: { fontSize: 22.8, textAlign: 'center', letterSpacing: 0.342 } } }),
      'the-day-time-4': dayText('the-day-time-4', '7:00 PM', { x: 24, y: 310.75, width: 82, height: 32 },
        { fontFamily: 'Instrument Sans', fontSize: 11, color: '#F4EFE7', textAlign: 'right', lineHeight: 1.4, letterSpacing: 1.76, opacity: 0.72 },
        { ipad: { frame: { x: 451.2, y: 254.4, width: 134.4 }, style: { fontSize: 10.5, textAlign: 'center', letterSpacing: 1.68 } }, desktop: { frame: { x: 710.4, y: 275.7, width: 220.8 }, style: { fontSize: 10.5, textAlign: 'center', letterSpacing: 1.68 } } }),
      'the-day-event-4': dayText('the-day-event-4', 'Dancing', { x: 130, y: 301.75, width: 236, height: 32 },
        { fontFamily: 'Instrument Serif', fontSize: 21, color: '#F4EFE7', textAlign: 'left', lineHeight: 1.25, letterSpacing: 0.315 },
        { ipad: { frame: { x: 451.2, y: 285.1, width: 134.4 }, style: { fontSize: 22, textAlign: 'center', letterSpacing: 0.33 } }, desktop: { frame: { x: 710.4, y: 308.4, width: 220.8 }, style: { fontSize: 22.8, textAlign: 'center', letterSpacing: 0.342 } } }),
      'the-day-time-5': dayText('the-day-time-5', '10:00 PM', { x: 24, y: 361, width: 82, height: 32 },
        { fontFamily: 'Instrument Sans', fontSize: 11, color: '#F4EFE7', textAlign: 'right', lineHeight: 1.4, letterSpacing: 1.76, opacity: 0.72 },
        { ipad: { frame: { x: 585.6, y: 254.4, width: 134.4 }, style: { fontSize: 10.5, textAlign: 'center', letterSpacing: 1.68 } }, desktop: { frame: { x: 931.2, y: 275.7, width: 220.8 }, style: { fontSize: 10.5, textAlign: 'center', letterSpacing: 1.68 } } }),
      'the-day-event-5': dayText('the-day-event-5', 'Late Night', { x: 130, y: 352, width: 236, height: 32 },
        { fontFamily: 'Instrument Serif', fontSize: 21, color: '#F4EFE7', textAlign: 'left', lineHeight: 1.25, letterSpacing: 0.315 },
        { ipad: { frame: { x: 585.6, y: 285.1, width: 134.4 }, style: { fontSize: 22, textAlign: 'center', letterSpacing: 0.33 } }, desktop: { frame: { x: 931.2, y: 308.4, width: 220.8 }, style: { fontSize: 22.8, textAlign: 'center', letterSpacing: 0.342 } } }),
      'the-day-divider-1': dayDivider('the-day-divider-1', { x: 130, y: 135, width: 1, height: 112 }, { ipad: { visible: true, frame: { x: 182.4, y: 227.5 } }, desktop: { visible: true, frame: { x: 268.8, y: 246.3, height: 120 } } }),
      'the-day-divider-2': dayDivider('the-day-divider-2', { x: 130, y: 185.25, width: 1, height: 112 }, { ipad: { visible: true, frame: { x: 316.8, y: 227.5 } }, desktop: { visible: true, frame: { x: 489.6, y: 246.3, height: 120 } } }),
      'the-day-divider-3': dayDivider('the-day-divider-3', { x: 130, y: 235.5, width: 1, height: 112 }, { ipad: { visible: true, frame: { x: 451.2, y: 227.5 } }, desktop: { visible: true, frame: { x: 710.4, y: 246.3, height: 120 } } }),
      'the-day-divider-4': dayDivider('the-day-divider-4', { x: 130, y: 285.75, width: 1, height: 112 }, { ipad: { visible: true, frame: { x: 585.6, y: 227.5 } }, desktop: { visible: true, frame: { x: 931.2, y: 246.3, height: 120 } } }),
      'details-label': detailsText('details-label', 'DETAILS', { x: 24, y: 62, width: 342, height: 24 },
        { fontFamily: 'Instrument Sans', fontSize: 10, color: '#626753', lineHeight: 1.4, letterSpacing: 3.2, opacity: 0.92 },
        { ipad: { frame: { x: 48, y: 62, width: 672 } }, desktop: { frame: { x: 48, y: 70, width: 1104 } } }),
      'details-subtitle': detailsText('details-subtitle', 'A few things to know', { x: 30, y: 94, width: 330, height: 46 },
        { fontFamily: 'Instrument Serif', fontSize: 31, fontStyle: 'italic', color: '#44463D', lineHeight: 1.15, letterSpacing: 0.31 },
        { ipad: { frame: { x: 84, y: 100, width: 600, height: 52 }, style: { fontSize: 38, letterSpacing: 0.38 } }, desktop: { frame: { x: 100, y: 104, width: 1000, height: 56 }, style: { fontSize: 42, letterSpacing: 0.42 } } }),

      'details-dress-code-icon': detailsIcon('details-dress-code-icon', 'details-icon-dress-code', 'Dress code', { x: 81, y: 170, width: 48, height: 48 },
        { ipad: { frame: { x: 125, y: 197 } }, desktop: { frame: { x: 226, y: 208 } } }),
      'details-dress-code-title': detailsText('details-dress-code-title', 'Dress Code', { x: 22, y: 217, width: 166, height: 32 },
        { fontFamily: 'Instrument Serif', fontSize: 18, color: '#44463D', lineHeight: 1.2, letterSpacing: 0.18 },
        { ipad: { frame: { x: 54, y: 245, width: 190 } }, desktop: { frame: { x: 110, y: 258, width: 280 }, style: { fontSize: 20, letterSpacing: 0.2 } } }),
      'details-dress-code-copy': detailsText('details-dress-code-copy', 'Formal attire', { x: 26, y: 250, width: 158, height: 70 },
        { fontFamily: 'Instrument Sans', fontSize: 10.5, color: '#5F6051', lineHeight: 1.5, letterSpacing: 0.105, opacity: 0.9 },
        { ipad: { frame: { x: 62, y: 278, width: 174, height: 72 }, style: { fontSize: 11.5, letterSpacing: 0.115 } }, desktop: { frame: { x: 125, y: 294, width: 250, height: 76 }, style: { fontSize: 12, letterSpacing: 0.12 } } }),

      'details-parking-icon': detailsIcon('details-parking-icon', 'details-icon-parking', 'Parking', { x: 262, y: 170, width: 48, height: 48 },
        { ipad: { frame: { x: 360, y: 197 } }, desktop: { frame: { x: 576, y: 208 } } }),
      'details-parking-title': detailsText('details-parking-title', 'Parking', { x: 202, y: 217, width: 166, height: 32 },
        { fontFamily: 'Instrument Serif', fontSize: 18, color: '#44463D', lineHeight: 1.2, letterSpacing: 0.18 },
        { ipad: { frame: { x: 289, y: 245, width: 190 } }, desktop: { frame: { x: 460, y: 258, width: 280 }, style: { fontSize: 20, letterSpacing: 0.2 } } }),
      'details-parking-copy': detailsText('details-parking-copy', 'Complimentary parking is available on site.', { x: 206, y: 250, width: 158, height: 70 },
        { fontFamily: 'Instrument Sans', fontSize: 10.5, color: '#5F6051', lineHeight: 1.5, letterSpacing: 0.105, opacity: 0.9 },
        { ipad: { frame: { x: 297, y: 278, width: 174, height: 72 }, style: { fontSize: 11.5, letterSpacing: 0.115 } }, desktop: { frame: { x: 475, y: 294, width: 250, height: 76 }, style: { fontSize: 12, letterSpacing: 0.12 } } }),

      'details-adults-only-icon': detailsIcon('details-adults-only-icon', 'details-icon-adults-only', 'Adults only', { x: 81, y: 370, width: 48, height: 48 },
        { ipad: { frame: { x: 595, y: 197 } }, desktop: { frame: { x: 926, y: 208 } } }),
      'details-adults-only-title': detailsText('details-adults-only-title', 'Adults Only', { x: 22, y: 417, width: 166, height: 32 },
        { fontFamily: 'Instrument Serif', fontSize: 18, color: '#44463D', lineHeight: 1.2, letterSpacing: 0.18 },
        { ipad: { frame: { x: 524, y: 245, width: 190 } }, desktop: { frame: { x: 810, y: 258, width: 280 }, style: { fontSize: 20, letterSpacing: 0.2 } } }),
      'details-adults-only-copy': detailsText('details-adults-only-copy', 'We kindly request an adults-only celebration.', { x: 26, y: 450, width: 158, height: 76 },
        { fontFamily: 'Instrument Sans', fontSize: 10.5, color: '#5F6051', lineHeight: 1.5, letterSpacing: 0.105, opacity: 0.9 },
        { ipad: { frame: { x: 532, y: 278, width: 174, height: 72 }, style: { fontSize: 11.5, letterSpacing: 0.115 } }, desktop: { frame: { x: 825, y: 294, width: 250, height: 76 }, style: { fontSize: 12, letterSpacing: 0.12 } } }),

      'details-accommodation-icon': detailsIcon('details-accommodation-icon', 'details-icon-accommodation', 'Accommodation', { x: 262, y: 370, width: 48, height: 48 },
        { ipad: { frame: { x: 125, y: 437 } }, desktop: { frame: { x: 226, y: 445 } } }),
      'details-accommodation-title': detailsText('details-accommodation-title', 'Accommodation', { x: 202, y: 417, width: 166, height: 32 },
        { fontFamily: 'Instrument Serif', fontSize: 18, color: '#44463D', lineHeight: 1.2, letterSpacing: 0.18 },
        { ipad: { frame: { x: 54, y: 485, width: 190 } }, desktop: { frame: { x: 110, y: 495, width: 280 }, style: { fontSize: 20, letterSpacing: 0.2 } } }),
      'details-accommodation-copy': detailsText('details-accommodation-copy', 'A list of nearby hotels is available on our website.', { x: 206, y: 450, width: 158, height: 76 },
        { fontFamily: 'Instrument Sans', fontSize: 10.5, color: '#5F6051', lineHeight: 1.5, letterSpacing: 0.105, opacity: 0.9 },
        { ipad: { frame: { x: 62, y: 518, width: 174, height: 88 }, style: { fontSize: 11.5, letterSpacing: 0.115 } }, desktop: { frame: { x: 125, y: 531, width: 250, height: 96 }, style: { fontSize: 12, letterSpacing: 0.12 } } }),

      'details-transportation-icon': detailsIcon('details-transportation-icon', 'details-icon-transportation', 'Transportation', { x: 81, y: 570, width: 48, height: 48 },
        { ipad: { frame: { x: 360, y: 437 } }, desktop: { frame: { x: 576, y: 445 } } }),
      'details-transportation-title': detailsText('details-transportation-title', 'Transportation', { x: 22, y: 617, width: 166, height: 32 },
        { fontFamily: 'Instrument Serif', fontSize: 18, color: '#44463D', lineHeight: 1.2, letterSpacing: 0.18 },
        { ipad: { frame: { x: 289, y: 485, width: 190 } }, desktop: { frame: { x: 460, y: 495, width: 280 }, style: { fontSize: 20, letterSpacing: 0.2 } } }),
      'details-transportation-copy': detailsText('details-transportation-copy', 'Shuttle service will be provided to and from the venue.', { x: 26, y: 650, width: 158, height: 96 },
        { fontFamily: 'Instrument Sans', fontSize: 10.5, color: '#5F6051', lineHeight: 1.5, letterSpacing: 0.105, opacity: 0.9 },
        { ipad: { frame: { x: 297, y: 518, width: 174, height: 88 }, style: { fontSize: 11.5, letterSpacing: 0.115 } }, desktop: { frame: { x: 475, y: 531, width: 250, height: 96 }, style: { fontSize: 12, letterSpacing: 0.12 } } }),

      'details-gifts-icon': detailsIcon('details-gifts-icon', 'details-icon-gifts', 'Gifts', { x: 262, y: 570, width: 48, height: 48 },
        { ipad: { frame: { x: 595, y: 437 } }, desktop: { frame: { x: 926, y: 445 } } }),
      'details-gifts-title': detailsText('details-gifts-title', 'Gifts', { x: 202, y: 617, width: 166, height: 32 },
        { fontFamily: 'Instrument Serif', fontSize: 18, color: '#44463D', lineHeight: 1.2, letterSpacing: 0.18 },
        { ipad: { frame: { x: 524, y: 485, width: 190 } }, desktop: { frame: { x: 810, y: 495, width: 280 }, style: { fontSize: 20, letterSpacing: 0.2 } } }),
      'details-gifts-copy': detailsText('details-gifts-copy', 'Your presence is the greatest gift. A registry is available for those who wish to contribute.', { x: 206, y: 650, width: 158, height: 96 },
        { fontFamily: 'Instrument Sans', fontSize: 10.5, color: '#5F6051', lineHeight: 1.5, letterSpacing: 0.105, opacity: 0.9 },
        { ipad: { frame: { x: 532, y: 518, width: 174, height: 88 }, style: { fontSize: 11.5, letterSpacing: 0.115 } }, desktop: { frame: { x: 825, y: 531, width: 250, height: 96 }, style: { fontSize: 12, letterSpacing: 0.12 } } }),

      'details-divider-column-1': detailsDivider('details-divider-column-1', { x: 195, y: 170, width: 1, height: 610 }, true,
        { ipad: { frame: { x: 266, y: 195, height: 430 } }, desktop: { frame: { x: 425, y: 202, height: 430 } } }),
      'details-divider-column-2': detailsDivider('details-divider-column-2', { x: 195, y: 170, width: 1, height: 610 }, false,
        { ipad: { visible: true, frame: { x: 501, y: 195, height: 430 } }, desktop: { visible: true, frame: { x: 775, y: 202, height: 430 } } }),
      'details-divider-row-1': detailsDivider('details-divider-row-1', { x: 28, y: 350, width: 334, height: 1 }, true,
        { ipad: { frame: { x: 54, y: 400, width: 660 } }, desktop: { frame: { x: 110, y: 405, width: 980 } } }),
      'details-divider-row-2': detailsDivider('details-divider-row-2', { x: 28, y: 550, width: 334, height: 1 }, true,
        { ipad: { visible: false }, desktop: { visible: false } }),

      'our-story-label': storyText('our-story-label', 'OUR STORY', { x: 32, y: 64, width: 326, height: 18 },
        { fontFamily: 'Instrument Sans', fontSize: 10, color: '#626753', lineHeight: 1.45, letterSpacing: 3.4, opacity: 0.92 },
        { ipad: { frame: { x: 56, y: 88, width: 280 } }, desktop: { frame: { x: 84, y: 114, width: 430 } } }),
      'our-story-motif': {
        id: 'our-story-motif', sectionId: 'our-story', type: 'decorative', assetId: 'our-story-motif', assetKind: 'template', alt: '',
        frame: { x: 32, y: 96, width: 118, height: 9.65 }, rotation: 0, opacity: 0.62, svgColor: '#626753',
        crop: { flipX: false, flipY: false, fit: 'contain', focalX: 50, focalY: 50, zoom: 1 },
        responsive: { strategy: 'scale', anchorX: 'center', overrides: {
          ipad: { frame: { x: 56, y: 118.5 } },
          desktop: { frame: { x: 84, y: 146, width: 132, height: 10.8 } }
        } },
        permissions: { ...permissions }
      },
      'our-story-heading': storyText('our-story-heading', 'How We Met', { x: 32, y: 128, width: 326, height: 50 },
        { fontFamily: 'Cormorant Garamond', fontSize: 42, color: '#3F4037', lineHeight: 0.98, letterSpacing: -1.05 },
        { ipad: { frame: { x: 56, y: 151, width: 280 }, style: { fontSize: 44, letterSpacing: -1.1 } }, desktop: { frame: { x: 84, y: 178, width: 430, height: 58 }, style: { fontSize: 50, letterSpacing: -1.25 } } }),
      'our-story-body-1': storyText('our-story-body-1', 'We first met unexpectedly, and what started as an easy conversation quickly turned into hours together. After that came long walks, shared dinners, and the kind of friendship that slowly became something more.', { x: 32, y: 198, width: 326, height: 145 },
        { fontFamily: 'Libre Baskerville', fontSize: 14, color: '#3F4037', lineHeight: 1.72, letterSpacing: 0 },
        { ipad: { frame: { x: 56, y: 220, width: 280, height: 170 }, style: { fontSize: 13.5, lineHeight: 1.7 } }, desktop: { frame: { x: 84, y: 260, width: 430, height: 104 }, style: { lineHeight: 1.72 } } }),
      'our-story-body-2': storyText('our-story-body-2', 'A few years later, we’re beginning our next chapter together — and we’re so happy to celebrate it with the people we love most.', { x: 32, y: 361, width: 326, height: 121 },
        { fontFamily: 'Libre Baskerville', fontSize: 14, color: '#3F4037', lineHeight: 1.72, letterSpacing: 0 },
        { ipad: { frame: { x: 56, y: 404, width: 280, height: 100 }, style: { fontSize: 13.5, lineHeight: 1.7 } }, desktop: { frame: { x: 84, y: 380, width: 430, height: 104 }, style: { lineHeight: 1.72 } } }),
      'our-story-signoff': storyText('our-story-signoff', 'With love, Isabella & Julian', { x: 32, y: 490, width: 326, height: 32 },
        { fontFamily: 'Allura', fontSize: 22, color: '#626753', lineHeight: 1.05, letterSpacing: 0 },
        { ipad: { frame: { x: 56, y: 516, width: 280 }, style: { fontSize: 20 } }, desktop: { frame: { x: 84, y: 500, width: 430 }, style: { fontSize: 20 } } }),
      'our-story-photo': {
        id: 'our-story-photo', sectionId: 'our-story', type: 'image', assetId: 'our-story-photo', assetKind: 'template', alt: 'Couple sharing a warm moment',
        frame: { x: 32, y: 548, width: 326, height: 407.5 }, rotation: 0, opacity: 1,
        crop: { flipX: false, flipY: false, fit: 'cover', focalX: 50, focalY: 50, zoom: 1 },
        responsive: { strategy: 'scale', anchorX: 'center', overrides: {
          ipad: { frame: { x: 400, y: 130, width: 320, height: 400 } },
          desktop: { frame: { x: 646, y: 100, width: 470, height: 587.5 } }
        } },
        permissions: { ...permissions }
      },
      ...cloneValue(rsvpRevision3Elements)
    }
  };
  const clone = () => JSON.parse(JSON.stringify(defaultDocument));
  globalThis.GreenSageVisualTemplate = Object.freeze({
    templateId: 'green-sage', storageKey: 'storiel-visual-document:green-sage:v1', templateRevision: TEMPLATE_REVISION,
    templateMigrations: Object.freeze([
      { revision: 1, migrate: migrateOurStoryRefinement },
      { revision: 2, migrate: migrateOurStorySpacing },
      { revision: 3, migrate: migrateRsvpAddition }
    ]),
    defaultDocument: Object.freeze(defaultDocument), cloneDefault: clone
  });
})();
