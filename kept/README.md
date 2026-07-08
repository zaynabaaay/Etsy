# Kept

*Every love story leaves a paper trail.* A single-scroll digital keepsake —
an anniversary gift told through the ephemera a couple kept for ten years.
By Studio Vesper. Second in the series, after [Perihelion](../perihelion/).

A sealed envelope opens as you scroll: the wax cracks, the flap lifts, the
letter unfolds. The decade then unpacks down a writing desk as artifacts —
a bookshop receipt, a train ticket, a coffee-ringed napkin, dance steps on a
torn notebook page, a water-stained letter for the hard years, a blank page
for the quiet ones. At the end, everything you passed gathers into a framed
flat-lay, and a fresh seal presses it shut.

**Full creative direction in [VISION.md](VISION.md).**

## Viewing it

One self-contained file — fonts embedded, zero external requests:

```sh
python3 -m http.server 8000
# → http://localhost:8000/kept/
```

Or just open `index.html`. Scroll slowly. The `sound` toggle is worth it.

## Personalizing it (template)

Everything lives in the `STORY` object at the top of the `<script>`:

```js
const STORY = {
  names: ['June', 'Theo'],
  initials: 'J&T',                      // pressed into the wax seals
  yearsLabel: 'Ten Years · 2015 — 2025',
  dedication: '…',
  memories: [ { year, kind, title, cap, art }, … ],  // 7 artifacts
};
```

Each memory's `kind` picks its physical form: `napkin`, `ticket`, `polaroid`,
`note`, `invite`, `certificate`, or `flower` — with `art` fields for the text
printed on the object itself. The chapter prose (the meeting, the storm, the
silence) is plain HTML in `<main>`; the meeting date is the `<h2>` in the
date card.

## Notes

- No build step, no dependencies, no image assets — every artifact is drawn
  with CSS/SVG (deckled edges via SVG displacement, grain via turbulence).
- Every scene is a pure function of scroll: the seal un-cracks if you change
  your mind.
- `prefers-reduced-motion` is respected; sound is generated (WebAudio) and
  strictly opt-in.
