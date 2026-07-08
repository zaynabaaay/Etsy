# Trousseau

*A decade, in paper & petal.* A single-scroll anniversary keepsake told as a
wedding-stationery suite laid out among painted botanicals — bright ivory
linen, blush roses, eucalyptus, gold hairlines, wax. By Studio Vesper.
Third in the series, after [Perihelion](../perihelion/) and [Kept](../kept/).

One stationery piece per year — a café menu, a postcard, a change-of-address
card, a programme, a pressed rose, the invitation with painted liner, an RSVP
from the dog — each a layered, parallaxed cluster of paper and flowers. The
finale gathers the full suite into one flat-lay, and petals fall as you reach
the end.

**Full creative direction in [VISION.md](VISION.md).**

## Viewing it

One self-contained file — fonts embedded, no external requests, no build:

```sh
python3 -m http.server 8000
# → http://localhost:8000/trousseau/
```

## Personalizing it (template)

Everything lives in the `STORY` object at the top of the `<script>`:

```js
const STORY = {
  names: ['June', 'Theo'],
  yearsLabel: 'Ten Years · 2015 — 2025',
  metLabel: 'a bookshop · heavy rain',
  metDate: 'October 14, 2015',
  dedication: '…',
  memories: [ { year, kind, title, art }, … ],  // 7 pieces
};
```

Each memory's `kind` picks its stationery form — `menu`, `postcard`, `moved`,
`programme`, `pressed`, `invite`, `rsvp` — and `art` holds the words printed
on that piece. Narration beats are plain HTML in `<main>`.

## Notes

- All botanicals (roses, eucalyptus, baby's breath, petals, washes) are
  drawn SVG — no image assets anywhere.
- Parallax, the flat-lay gathering, and the cooling light of the hard-year
  chapter are pure functions of scroll; falling petals are the one
  time-based flourish, and only at the end.
- `prefers-reduced-motion` respected; sound generated and opt-in.
