# Our Story — A Cinematic Scrolling Keepsake

A private, scrolling anniversary keepsake that plays like a short film. It
opens on a title card — *"The story of us"* — and as you scroll, your story
unfolds scene by scene: how you met, a few numbers only the two of you would
know, a montage of your years, a quiet moment, a hand-written letter, and a
closing goodbye. One person, telling the other how it's been.

Everything runs from plain files in this folder — no build step, no accounts,
no code required. You edit the words and photos right in the browser.

> **Status: in active development.** The scenes and copy are still being
> refined, so details below may change.

---

## Quick start

1. **Open it.** Open `index.html` in a web browser (or host the folder — see
   [Sharing & hosting](#sharing--hosting)).
2. **Make it yours.** Tap the **♥ Make it yours** button in the bottom-right.
   - Tap any words to rewrite them.
   - Tap a photo to choose a picture from your device.
   - **Sections** lets you hide scenes you don't want (with undo).
   - **Start over** returns the words and layout to the template (your added
     photos are kept).
3. **View it.** Leave edit mode to watch the finished, animated keepsake.
4. **Download my site.** In the edit bar, tap **Download my site** — you get a
   single `our-story.html` file with your words, photos, fonts, and animation
   all baked in. That one file *is* your finished keepsake (see
   [Sharing & hosting](#sharing--hosting)).

> Your edits are saved automatically **in the browser you edit them on.**
> **Download my site** is how you take them with you.

---

## What you can change without touching any code

Tap **Make it yours**, then tap directly on any of these:

| Scene | What it is |
| --- | --- |
| The Opening | Your names, the "Happy Anniversary" sign-off, the date, and the two short lines above and below |
| The Beginning | Three dated moments — each a photo, a handwritten caption, and a few sentences |
| In Numbers | Your stats and their labels (one counts the days since your date, on its own) |
| The Moments That Made Us | A stack of memories — each a title and one to a few photos (three sit two-up with one centered below) |
| The Quiet | The short, quiet lines |
| The Letter | The whole letter and the signature |
| The Close | The final line, your names, and the closing note |

Photos and words are the whole story — most people never need the code.

---

## For deeper personalizing (optional)

Open `index.html` in any plain text editor. Editable spots are marked with
`EDIT ME` comments throughout — the browser-tab title, every line of copy, and
each photo's filename. A couple of useful ones:

- **The days-together counter** computes itself. Set your date in the
  `data-count-from-date="YYYY-MM-DD"` attribute and it counts up on its own,
  every day the page is opened.
- **Replacing photos permanently** (so they show for everyone, not just in your
  own browser): drop your images into `assets/photos/` using the same
  filenames, or point each `<img src="...">` at your own file.

If you edit the CSS or JS, bump the `?v=` number on the `<link>`/`<script>`
tags in `index.html` so browsers load the fresh files instead of a stale mix.

---

## Sharing & hosting

The easiest path — **one file, works anywhere:**

1. Edit in the browser, then tap **Download my site**.
2. You get a single `our-story.html` with everything baked in — your words,
   your photos, the fonts, and the animation. No other files, no internet
   needed.
3. Share that one file however you like:
   - **Send it directly** — email or message the `.html` file; they open it and
     it just plays.
   - **Host it for a link.** Drag `our-story.html` onto
     [Netlify Drop](https://app.netlify.com/drop) for a private link you can
     text to someone.
   - **A QR code.** Turn that link into a QR code and tuck it inside a real card
     or a framed print.

> Prefer to edit the files by hand? You can also host the whole `our-story/`
> folder (Netlify Drop or [GitHub Pages](https://pages.github.com/)) — but then
> your words need to be typed into `index.html` directly, since browser edits
> live only on your device. For most people, **Download my site** is simpler.

---

## Good to know

- **Fonts are bundled** in `assets/fonts/` — the lettering looks right even
  with no internet connection.
- **Works on** phones, tablets, and computers, in any modern browser.
- **Respects "reduce motion"** — if a device asks for reduced motion, the story
  is shown as a calm, static page instead of the full scroll animation.
- **Photos are private** — they're stored only in the viewer's own browser and
  are never uploaded anywhere.

---

## Files in this folder

| Path | What it's for |
| --- | --- |
| `index.html` | The keepsake itself, with all the editable words. |
| `css/style.css` | The look of every scene. |
| `css/edit.css` | Styling for the "Make it yours" edit mode. |
| `js/main.js` | The scroll choreography. |
| `js/edit.js` | The in-browser editing (text + photos). |
| `js/vendor/` | GSAP + ScrollTrigger (the animation engine). |
| `assets/fonts/` | The bundled typefaces. |
| `assets/photos/` | The placeholder photos you replace with your own. |
| `README.md` | This guide. |

Made with love. Happy anniversary. 🤍
