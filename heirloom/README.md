# HEIRLOOM — Cinematic Wedding Invitation Website

Thank you for your purchase! In about 15 minutes you'll have a beautiful,
interactive wedding invitation you can send to every guest as a simple link.

Guests receive a sealed envelope. They touch the wax seal, it cracks, the
envelope opens, and your invitation rises out — followed by your story,
venue, schedule and RSVP, all arranged like a fine stationery suite.

---

## 1. Edit your details (the only step that matters)

Open the file **`config.js`** in any text editor
(Notepad on Windows, TextEdit on Mac — no special software needed).

Everything is labelled and commented. Change the text between the
quotation marks:

```js
firstName: "Olivia",     →     firstName: "Amara",
```

Work top to bottom: names, date, wording, story, venues, schedule,
details, RSVP. Save the file when you're done.

**Golden rules**
- Keep the quotes `" "` and commas `,` exactly where they are.
- To hide a section, change `true` to `false` in the `sections` block.
- Preview after every few changes so you catch typos early.

## 2. Preview

Double-click **`index.html`** — it opens in your browser and works
completely offline. This is exactly what your guests will see.

> Tip: the invitation remembers that you've opened it. To watch the
> envelope sequence again, use the "Replay the opening" link at the very
> bottom of the page.

## 3. Set up your RSVP link

The RSVP button opens any link you give it. Pick one:

| Option | How |
|---|---|
| **Google Form** (recommended) | Create a free form at forms.google.com with Name + Attending? questions. Press **Send → link icon**, copy the link, paste it into `rsvp.link` in config.js |
| **WhatsApp** | Use `https://wa.me/15551234567` (your number, country code, no + or spaces) |
| **Email** | Use `mailto:you@example.com` |

## 4. Publish it free (get your link)

The easiest way — **Netlify Drop** (free, no account needed to start):

1. Go to **app.netlify.com/drop**
2. Drag your whole invitation folder onto the page
3. In a few seconds you get a link like `https://amara-and-daniel.netlify.app`
4. Send that link to your guests 🎉

Alternatives that work just as well: **Vercel**, **GitHub Pages**, or any
web hosting you already have (upload the folder as-is).

## 5. Optional extras

**Background music** — put an `.mp3` file into the `assets` folder and set
`music.file: "assets/your-song.mp3"` in config.js. It starts softly when a
guest opens the seal, and a mute button appears on screen. *Please only use
music you have the rights to.*

**Photos in your story** — put images in `assets` and set
`photo: "assets/my-photo.jpg"` on any story chapter. Photos around
1200px wide and under 500KB keep the page fast.

**Colors & fonts** — open `styles.css`; every color lives in the small
`THEME` block at the top.

---

## Troubleshooting

**The page is blank / shows a config error** — a quote or comma was
accidentally deleted in `config.js`. Undo your last change, save, refresh.

**My changes don't show** — make sure you saved `config.js`, then do a hard
refresh (Ctrl+Shift+R / Cmd+Shift+R).

**The envelope doesn't appear, it goes straight to the invitation** —
that's the "remember returning guests" feature. Use the replay link at the
bottom, or set `rememberVisit: false` while you're editing.

**Fonts look different** — the fonts are bundled in `assets/fonts`; make
sure you uploaded the *entire* folder, not just index.html.

---

*This template runs entirely in the guest's browser — no accounts, no
databases, nothing to maintain. Made with love. Congratulations!*
