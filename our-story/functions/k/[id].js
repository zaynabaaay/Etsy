/* ──────────────────────────────────────────────────────────────
   GET /k/<id>  —  serve a published keepsake at its unique link.
   Reads from the R2 bucket bound to this Pages project as KEEPSAKES.
   ────────────────────────────────────────────────────────────── */

function notFound() {
  const body =
    '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>Keepsake not found</title>' +
    '<div style="font-family:Georgia,serif;text-align:center;padding:80px 22px;color:#2E1F19;background:#F5F1E9;min-height:100vh">' +
    '<div style="font-size:40px">❤</div>' +
    '<h1 style="font-weight:400;margin:.4em 0">This keepsake link isn’t available</h1>' +
    '<p style="color:#6b5d50">The link may be mistyped, or this keepsake may have been removed.</p></div>';
  return new Response(body, { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' } });
}

export async function onRequestGet({ params, env }) {
  if (!env.KEEPSAKES) return new Response('Storage not configured', { status: 500 });

  const id = String(params.id || '').replace(/[^a-z0-9]/gi, '');
  if (!id) return notFound();

  const obj = await env.KEEPSAKES.get('k/' + id);
  if (!obj) return notFound();

  return new Response(obj.body, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=31536000, immutable',
    },
  });
}
