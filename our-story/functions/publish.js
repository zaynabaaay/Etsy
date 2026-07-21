/* ──────────────────────────────────────────────────────────────
   POST /publish  —  store a finished keepsake, return its unique link.

   Body: the full, self-contained keepsake HTML (built in edit.js).
   Storage: a Cloudflare R2 bucket bound to this Pages project as KEEPSAKES.
   Response: { url: "/k/<id>", id: "<id>" }
   ────────────────────────────────────────────────────────────── */

const MAX_BYTES = 45 * 1024 * 1024; // safety cap (~45 MB)
const ALPHABET = '23456789abcdefghjkmnpqrstuvwxyz'; // no look-alike chars

function makeId() {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let id = '';
  for (const b of bytes) id += ALPHABET[b % ALPHABET.length];
  return id;
}

/* a longer secret so only the owner's device can update their keepsake */
function makeToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  let t = '';
  for (const b of bytes) t += ALPHABET[b % ALPHABET.length];
  return t;
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

export async function onRequestPost({ request, env }) {
  if (!env.KEEPSAKES) return json({ error: 'storage-not-configured' }, 500);

  const html = await request.text();
  if (!html || html.length < 50) return json({ error: 'empty' }, 400);
  if (html.length > MAX_BYTES) return json({ error: 'too-large' }, 413);

  const put = (id, token) => env.KEEPSAKES.put('k/' + id, html, {
    httpMetadata: { contentType: 'text/html; charset=utf-8' },
    customMetadata: { editToken: token },
  });

  /* UPDATE: a device that published before sends its id + secret edit key, so
     re-publishing overwrites the SAME link (one stable link per keepsake, no
     pile-up). Only the matching key can update — the id alone is public. */
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

/* A GET to /publish just explains itself (useful when testing in a browser). */
export function onRequestGet() {
  return json({ ok: true, usage: 'POST your keepsake HTML here to get a shareable link.' });
}
