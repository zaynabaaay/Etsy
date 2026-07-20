# Storiel — publishing keepsakes on Cloudflare (setup)

This turns the **"Publish my keepsake"** button into working, shareable links.
It's mostly point-and-click. One-time setup; after that, every buyer gets a
unique link automatically.

## What you're setting up
- **Cloudflare Pages** hosts the template (auto-deploys from your GitHub repo).
- **R2** (Cloudflare's storage) holds each published keepsake.
- Two functions (already in `functions/`) do the work:
  - `POST /publish` — saves a keepsake, returns `/k/<id>`
  - `GET /k/<id>` — shows the keepsake at its link

## Steps (in the Cloudflare dashboard)

1. **Sign up / log in** at cloudflare.com (free).

2. **Create the storage bucket**
   - Left menu → **R2** → **Create bucket**.
   - Name it `storiel-keepsakes` → **Create**.
   - Note: R2 asks for a payment method to activate. You stay within the free
     allowance (10 GB storage, plenty for hundreds of keepsakes) — it's just
     Cloudflare's standard requirement. *(If you'd rather not add a card, tell
     Claude — there's a no-card storage option, with a per-keepsake size limit.)*

3. **Create the Pages project**
   - Left menu → **Workers & Pages** → **Create** → **Pages** →
     **Connect to Git** → pick your `Etsy` repo.
   - **Production branch:** the branch we deploy from (e.g. `claude/new-session-l3gh93`).
   - **Build settings:**
     - Framework preset: **None**
     - Build command: *(leave empty)*
     - Build output directory: `our-story`
     - **Root directory (Advanced):** `our-story`
   - **Save and Deploy.**

4. **Connect the storage to the site**
   - Open the new Pages project → **Settings** → **Functions** (or
     **Bindings**) → **R2 bucket bindings** → **Add binding**:
     - **Variable name:** `KEEPSAKES`  ← must be exactly this
     - **R2 bucket:** `storiel-keepsakes`
   - Save, then **Deployments → Retry/redeploy** so the binding takes effect.

5. **Test it**
   - Open your new Pages URL (looks like `https://storiel.pages.dev`).
   - Enter edit mode, personalize, tap **Publish my keepsake**.
   - You'll get a link like `https://storiel.pages.dev/k/abc123` — open it on
     your phone. 🎉

## Optional: your own domain
- Buy/connect `storiel.co` → Pages project → **Custom domains** → add it.
- Links then read `https://storiel.co/k/abc123`.

## Notes
- Everything (photos included) is baked into each keepsake, so links work
  forever and offline-cache well.
- Keepsakes can be large because of photos. Ask Claude to add
  **photo-shrinking on upload** to keep them small, fast, and cheap.
