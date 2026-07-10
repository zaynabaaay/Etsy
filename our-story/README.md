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
   - Use the edit bar to reset everything back to the original.
3. **View it.** Leave edit mode to watch the finished, animated keepsake.
4. **Share it** (see below).

> Your edits are saved automatically **in the browser you edit them on.** To
> deliver a finished keepsake to someone else, host it online — see below.

---

## What you can change without touching any code

Tap **Make it yours**, then tap directly on any of these:

| Scene | What it is |
| --- | --- |
| The Opening | The "Happy Anniversary" line, the title, and the sentence beneath it |
| The Beginning | Three dated moments — each a photo, a handwritten caption, and a few sentences |
| In Numbers | Your stats and their labels (one counts the days since your date, on its own) |
| The Moments That Made Us | Six montage photos and their captions |
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

Because it's a folder of static files, hosting is free and easy:

- **Free hosting.** Drag the whole `our-story/` folder onto
  [Netlify Drop](https://app.netlify.com/drop), or push it to a
  [GitHub Pages](https://pages.github.com/) repo, to get a private link you can
  text to someone.
- **A QR code.** Turn the hosted link into a QR code and tuck it inside a real
  card or a framed print.

To bake your words in permanently (so they show for everyone, everywhere), edit
the text directly in `index.html` rather than only in the browser.

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
| `assets/art/` | Generated artwork (the dried-flower sprig). |
| `README.md` | This guide. |

Made with love. Happy anniversary. 🤍
