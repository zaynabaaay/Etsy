# PERIHELION
### A keepsake in light — by Studio Vesper

> *per·i·he·li·on (n.) — the point in an orbit at which two bodies are closest.*

Perihelion is not a webpage. It is a night sky with a story folded into it — a
single, unbroken cinematic shot that a person moves through by scrolling. It is
bought as an anniversary gift, personalized with a couple's own dates and
memories, and given as a private URL or a single self-contained file: a locket
made of code.

---

## The product identity

**Studio Vesper** (vesper: the evening star) makes digital keepsakes — small,
finished, permanent things. Perihelion is its signature piece. The promise on
the box, if it had a box: *"Ten years of nights, in one."*

The product is one HTML file. No accounts, no player, no app. It opens in the
dark and it ends at dawn. It can be emailed, printed to a frame as its final
constellation, or projected on a wall at the anniversary dinner. Its entire
content — names, dates, seven memories, one dedication — is a small `STORY`
object at the top of the file that the studio (or the buyer) fills in.

---

## The first five seconds

Nothing happens. That is the design.

A near-black indigo field. One star pulses faintly. After a beat, a single
line of small serif text breathes in: *"Every night sky holds a story."*
A pause that is slightly too long. Then: *"This one holds yours."*

Only after four full seconds does a hairline scroll cue appear, and it says
**"scroll, slowly"** — the two words that set the contract for everything
after. The viewer learns immediately that this experience will not rush them,
and that they are in the hands of something made carefully. The first feeling
must be: *someone dimmed the lights for me.*

## The emotional arc

The page is scored like a short film, in seven movements:

1. **Prologue — the held breath.** Darkness, one star, an address to *you*.
2. **Two Skies — tenderness for the "before."** Two separate lights, two
   separate lives, drifting unaware. Warm melancholy; the sweetness of
   near-misses.
3. **Perihelion — the spark.** The paths bend, cross, and the entire sky
   flares and warms rose-gold for one held moment. The date of the meeting
   stands alone at cinema-title scale. This is the page's first surprise:
   the background itself changes temperature and never fully cools again.
4. **The Slow Dance — joy.** The two lights braid into a binary orbit.
   Memories pass one at a time, each releasing a new star into the sky.
   Pacing quickens slightly; this is the montage, the laughing part.
5. **Weather — honesty.** The sky darkens and desaturates; the orbit wavers
   and trembles; the stars dim. The hard years are named without being
   dramatized. Then, at the darkest point: *"They did not go out."*
   A love story without weather is a greeting card. This chapter is what
   makes the ending earned.
6. **The Silence — the gut.** Almost a full screen-height of nothing.
   Then one small line about the unphotographed nights — the lamp, the book,
   two people breathing in the same quiet. The page's most important moment
   is its emptiest.
7. **Tonight — release.** The sky lifts toward pre-dawn blue. The stars that
   each memory released have quietly migrated across the sky this whole
   time; now thin gold lines connect them into a constellation — the shape
   of the relationship, drawn from its own moments. The names. The years.
   The dedication. And as the viewer reaches the very end, unannounced,
   a single shooting star crosses the sky.

After-feeling: the quiet, slightly-full-chested state of walking out of a
cinema in the afternoon. The viewer should want to hand their phone to the
person next to them and say nothing.

## Storytelling philosophy

- **One continuous shot.** There are no pages, panels, or slides. The canvas
  sky runs unbroken beneath everything; text floats through it like subtitles
  over footage. Scrolling is a camera dolly through ten years of night.
- **The sky remembers.** Nothing the viewer earns is taken away. The flare's
  warmth persists. Every memory's star stays in the sky. The ending is built
  from the middle — the constellation is literally made of the moments you
  scrolled through.
- **Specific, not grand.** The copy avoids "soulmate" and "forever." It says
  *the coffee that went cold* and *the apartment with the crooked floor.*
  Museums caption artifacts; they don't editorialize. Small true things carry
  more weight than large vague ones.
- **Honesty before triumph.** Chapter five (Weather) is contractual. Premium
  emotion requires acknowledged difficulty; the constellation means nothing
  if the sky was never dark.
- **Second person, at the edges.** The prologue and dedication speak to *you*;
  the middle speaks about *them*. The gift opens and closes by looking the
  recipient in the eye.

## Interaction philosophy

- **Scroll is time, and time is reversible.** Every visual state is a pure
  function of scroll position — scroll up and the lights retrace their paths,
  the flare un-blooms, the constellation unlaces. Memories behave like
  memories: you can go back to them.
- **The scrubbed film.** Scroll input is smoothed through inertia, so the sky
  always moves with cinematic weight — a flick never jerks the stars.
- **No UI unless earned.** No progress bar, no nav, no buttons except a tiny
  optional `sound` toggle and a chapter marker in the bottom corner, like a
  reel counter — small caps, barely there. Silence in the interface is part
  of the silence of the piece.
- **Sound is opt-in.** One quiet generated drone (WebAudio — no files), and a
  small bell each time a memory releases its star. Never autoplayed.
- **The viewer's presence is felt, faintly.** Star layers parallax a few
  pixels with the pointer — the sky knows you're there, and no more.
- **Respect for stillness.** `prefers-reduced-motion` collapses the piece to
  a still, fully readable night — the story survives with all motion removed.

## Pacing & silence

Pacing is authored in viewport-heights, the way a film is authored in seconds:
long empty runs between stanzas in the early chapters (anticipation), shorter
gaps through the memory montage (momentum), a deliberate stall in Weather, and
the longest darkness of the piece before the silence line. Roughly a three-to
four-minute scroll at natural pace. Where a lesser page would add content,
Perihelion adds distance.

## Visual language

- **Palette:** deep indigo night (`#05060d → #131226`), warm starlight text
  (`#e9e5d8`), old gold accents (`#d4af7a`), a rose flare (`#e8a087`) that
  tints the sky at the meeting, storm slate, and a pre-dawn blue for the end.
  Color temperature *is* the plot.
- **Type:** Cormorant Garamond — an old-style serif with candlelight in it —
  for stanzas, titles, and the enormous meeting date; Inter in letterspaced
  small caps for labels, years, and the chapter reel. Nothing bold. Weight is
  communicated with size and space, not heaviness.
- **Texture:** a whisper of film grain (SVG turbulence at 4% opacity) and a
  soft vignette, so the black feels like celluloid rather than a screen.
- **Marks:** hairline rules, letterspacing, and light itself — glows, trails,
  and blooms drawn additively on canvas. No cards, no borders, no boxes.

## Motion system

- Nothing moves faster than 600ms; text reveals take 1.2–3s.
- Two kinds of motion, never confused: **time-driven** (star twinkle, the
  lights' gentle idle pulse — the sky is alive even when you stop) and
  **scroll-driven** (paths, trails, color grade, flare, constellation — the
  story only advances when you do).
- Text enters by breathing in: opacity + 12px rise + a blur that resolves,
  like eyes adjusting to the dark.
- The meeting date reveals by tracking-in: letterspacing tightens as it
  fades up — a title card, not a paragraph.
- One surprise per act, maximum: the flare, the storm tremor, the
  constellation lacing, the shooting star. Restraint is what makes each land.

## After

The last screen offers two words — *begin again* — and the sky scrolls home.
Most people will. That is the metric that matters: not time-on-page, but
whether they immediately hand it to someone else and watch their face.

---

*Perihelion · Studio Vesper — digital keepsakes*
