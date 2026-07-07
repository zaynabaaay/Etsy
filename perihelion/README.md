# Perihelion

*A love story, told in light.* A single-scroll digital keepsake — an anniversary
gift that unfolds like a short film. By Studio Vesper.

Two lights drift on opposite sides of a night sky. As you scroll, their paths
bend toward each other, cross in a flare of warmth on the day they met, and
braid into a slow binary orbit. Every memory you pass releases a star; by the
end, those stars lace together into a constellation drawn from the couple's
own moments.

**Read the full creative direction in [VISION.md](VISION.md).**

## Viewing it

The whole experience is one self-contained file. Open `index.html` in any
modern browser — or serve it:

```sh
python3 -m http.server 8000
# → http://localhost:8000/perihelion/
```

Scroll slowly. Headphones and the `sound` toggle (top right) are worth it.

## Personalizing it

Everything a couple needs to change lives in one `STORY` object at the top of
the `<script>` in `index.html`:

```js
const STORY = {
  names: ['June', 'Theo'],
  yearsLabel: 'Ten Years · 2015 — 2025',
  dedication: 'For every orbit so far, and every one still to come. …',
  memories: [ { year, title, cap }, … ],   // up to 7 — one star each
};
```

The chapter prose (the meeting, the storm, the silence) is plain HTML in the
`<main>` sections — edit it like a letter. The meeting date is the `<h2>`
inside `#meet-flare`.

## Notes

- No build step, no dependencies. Canvas 2D + vanilla JS.
- Every visual state is a pure function of scroll position — the story is
  fully reversible, like memory.
- `prefers-reduced-motion` is respected: the piece collapses to a still,
  fully readable night sky.
- Sound is generated with WebAudio (no audio files) and strictly opt-in.
