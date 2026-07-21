/* ──────────────────────────────────────────────────────────────
   Storiel keepsake host — Cloudflare Worker + static assets + R2.

   The template (everything in ./our-story) is served automatically as
   static assets. This Worker only adds two dynamic routes:
     POST /publish  → store a finished keepsake in R2, return /k/<id>
     GET  /k/<id>   → serve a stored keepsake at its unique link
   The R2 bucket is bound as KEEPSAKES (see wrangler.jsonc).
   ────────────────────────────────────────────────────────────── */

const ALPHABET = '23456789abcdefghjkmnpqrstuvwxyz'; // no look-alike characters
const MAX_BYTES = 45 * 1024 * 1024;                 // ~45 MB safety cap

function makeId() {
  const b = new Uint8Array(8);
  crypto.getRandomValues(b);
  let s = '';
  for (const x of b) s += ALPHABET[x % ALPHABET.length];
  return s;
}

/* a longer secret so only the owner's device can update their keepsake */
function makeToken() {
  const b = new Uint8Array(24);
  crypto.getRandomValues(b);
  let s = '';
  for (const x of b) s += ALPHABET[x % ALPHABET.length];
  return s;
}

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

function notFound() {
  return new Response(
    '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>Keepsake not found</title>' +
    '<div style="font-family:Georgia,serif;text-align:center;padding:80px 22px;color:#2E1F19;background:#F5F1E9;min-height:100vh">' +
    '<div style="font-size:40px">❤</div>' +
    '<h1 style="font-weight:400;margin:.4em 0">This keepsake link isn’t available</h1>' +
    '<p style="color:#6b5d50">The link may be mistyped, or this keepsake may have been removed.</p></div>',
    { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' } }
  );
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    /* POST /publish — store a keepsake, return its unique link */
    if (url.pathname === '/publish') {
      if (request.method !== 'POST') return json({ ok: true, usage: 'POST keepsake HTML here to get a link.' });
      if (!env.KEEPSAKES) return json({ error: 'storage-not-configured' }, 500);
      const html = await request.text();
      if (!html || html.length < 50) return json({ error: 'empty' }, 400);
      if (html.length > MAX_BYTES) return json({ error: 'too-large' }, 413);
      const put = (id, token) => env.KEEPSAKES.put('k/' + id, html, {
        httpMetadata: { contentType: 'text/html; charset=utf-8' },
        customMetadata: { editToken: token },
      });
      /* UPDATE: a device that published before sends its id + secret edit key,
         so re-publishing overwrites the SAME link (one stable link per
         keepsake). Only the matching key can update — the id is public. */
      const reqId = request.headers.get('x-keepsake-id');
      const reqToken = request.headers.get('x-keepsake-token');
      if (reqId && reqToken) {
        const existing = await env.KEEPSAKES.head('k/' + reqId);
        if (existing && existing.customMetadata && existing.customMetadata.editToken === reqToken) {
          await put(reqId, reqToken);
          return json({ url: '/k/' + reqId, id: reqId, token: reqToken, updated: true });
        }
        /* unknown id or wrong key → fall through and mint a fresh keepsake */
      }
      /* CREATE: a new keepsake with a fresh id + secret edit key */
      let id = makeId();
      for (let i = 0; i < 5 && (await env.KEEPSAKES.head('k/' + id)); i++) id = makeId();
      const token = makeToken();
      await put(id, token);
      return json({ url: '/k/' + id, id, token });
    }

    /* GET /k/<id> — serve a stored keepsake */
    const m = url.pathname.match(/^\/k\/([a-z0-9]+)$/i);
    if (m) {
      if (!env.KEEPSAKES) return new Response('Storage not configured', { status: 500 });
      const obj = await env.KEEPSAKES.get('k/' + m[1]);
      if (!obj) return notFound();
      return new Response(obj.body, {
        headers: {
          'content-type': 'text/html; charset=utf-8',
          /* short cache so an owner's re-publish shows up quickly (was
             immutable-for-a-year, which would have frozen the old version) */
          'cache-control': 'public, max-age=60, must-revalidate',
        },
      });
    }

    /* anything else → static assets (the template), or 404 */
    if (env.ASSETS) return env.ASSETS.fetch(request);
    return notFound();
  },
};
