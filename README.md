# An Anniversary Letter — A Keepsake Website

A private, hand-lettered keepsake website for an anniversary, a wedding, a
proposal, or any "I don't say it enough" moment. It opens as a wax-sealed
envelope; tap the seal and the letter rises out, unfolding into your story —
an opening line, how you met, a timeline of your years, a photo or two, and a
signed goodbye.

Everything is **one single file** (`index.html`). No build step, no accounts,
no code required. You edit the words and photos right in the browser.

![Cover: a wax-sealed envelope reading “For Ava — Five years.”](preview/cover.png)

---

## Quick start

1. **Open it.** Double-click `index.html` and it opens in your web browser.
2. **Edit it.** Tap **Edit** in the top-right corner.
   - Tap any words to rewrite them.
   - Tap a photo frame to choose a picture from your device.
   - Tap **Reset** in the edit bar to undo everything back to the original.
3. **View it.** Tap **View** to see the finished keepsake, seal and all.
4. **Share it** (see [Sharing & hosting](#sharing--hosting) below).

> Your edits are saved automatically **in the browser you edit them on.** To
> deliver a finished keepsake to someone else, host it online — see below.

---

## What you can change without touching any code

Tap **Edit**, then tap directly on any of these:

| Where | What it is |
| --- | --- |
| Cover | "For [Name]" label and the big "Five years." headline |
| Opening | The first line of the letter |
| Chapter One | The section title and the "how we met" paragraph |
| The Years | Five year markers and a one-line memory for each |
| Photos | Two framed photos and their handwritten captions |
| The Little Things | Five short lines — the small habits you love |
| And Counting | The caption under the big "days together" number |
| Closing | The final message and the signature |

Photos and text are the whole story — most people never need the code below.

---

## For deeper personalizing (optional)

Open `index.html` in any plain text editor. Near the bottom, in the
`<script>` tag, there is a small `CONFIG` block:

```js
var CONFIG = {
  sealColor: 'gold',                 // 'gold' or 'oxblood' (deep red)
  defaultMode: 'present',            // 'present' (read) or 'edit'
  initials: { left: 'A', right: 'J' },// the two letters on the wax seal
  startDate: '2020-06-14',           // powers the "days together" counter
  storageKey: 'keepsake_'            // keep separate copies from clashing
};
```

- **Seal color** — `'gold'` or `'oxblood'` for a deep oxblood-red wax.
- **Seal initials** — the two letters pressed into the wax.
- **Start date** — the day you're counting from (`YYYY-MM-DD`). The page
  counts the days for you, live, every time it's opened. Set it to `''` to
  hide the counter section entirely.
- **Default mode** — leave as `'present'` so recipients see the sealed
  envelope first.

### Adding or removing a year, or a third photo

The timeline and photo sections are plain HTML blocks. To add a year, copy one
`<div data-reveal ...>...</div>` timeline block and give its two inner fields a
new, unique `data-field` name (for example `tl-y-6` / `tl-t-6`). To add a third
photo, copy a whole `<figure>...</figure>` block and give its `data-photo` a
new name (for example `ph3`) — the same for its caption's `data-field`. The
`data-field` and `data-photo` names just have to be unique; they are the keys
your edits are saved under.

---

## Sharing & hosting

Because it is a single file, you have easy options:

- **Send the file.** Email or AirDrop `index.html`. The recipient double-clicks
  it. (Text edits you made in your own browser won't travel with the file —
  hard-code them in the HTML if you want them baked in, or host it online.)
- **Free hosting.** Drag `index.html` onto [Netlify Drop](https://app.netlify.com/drop)
  or push it to a [GitHub Pages](https://pages.github.com/) repo to get a
  private link you can text to someone.
- **A QR code.** Turn the hosted link into a QR code and tuck it inside a real
  card or a framed print.

To bake your words in permanently (so they show for everyone, everywhere),
edit the text directly in `index.html` between the `>` and `</...>` of each
`data-field` element, instead of only editing in the browser.

---

## Good to know

- **Fonts** load from Google Fonts, so the exact lettering needs an internet
  connection. Offline, it falls back to elegant system serifs.
- **Works on** phones, tablets, and computers, in any modern browser.
- **Respects "reduce motion"** — if a device asks for reduced motion, the
  envelope opens gently without the full animation.
- **Photos** are stored only in the viewer's own browser; nothing is uploaded
  anywhere. This keeps it completely private.

---

## Files in this package

| File | What it's for |
| --- | --- |
| `index.html` | The keepsake itself. This is the whole product. |
| `README.md` | This guide. |
| `LICENSE.txt` | How you're allowed to use it. |
| `etsy-listing.md` | Suggested listing copy (for sellers). |
| `preview/` | Preview images. |

Made with love. Happy anniversary. 🤍
