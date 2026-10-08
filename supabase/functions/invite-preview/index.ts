// Supabase Edge Function: invite-preview
// Returns crawler-friendly HTML (og:title/image/description) for /invite/:slug,
// then redirects humans to the real invitation page.
// Deploy: supabase functions deploy invite-preview (see docs/WA_PREVIEW.md).

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.2'

const SITE = Deno.env.get('SITE_URL') ?? ''
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

serve(async (req) => {
  const url = new URL(req.url)
  const slug = (url.searchParams.get('slug') ?? '').trim()
  if (!slug) return new Response('Missing slug', { status: 400 })

  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { data: inv } = await sb.from('invitations').select('id, title, greeting, status').eq('slug', slug).maybeSingle()
  if (!inv || inv.status !== 'published') {
    return new Response('Undangan tidak ditemukan', { status: 404 })
  }

  const { data: cover } = await sb.from('invitation_gallery').select('image_path').eq('invitation_id', inv.id).eq('is_cover', true).maybeSingle()
  let image = ''
  if (cover?.image_path) {
    image = cover.image_path.startsWith('http')
      ? cover.image_path
      : `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/invitation-images/${cover.image_path}`
  }
  const target = `${SITE}/invite/${encodeURIComponent(slug)}`
  const title = `${inv.title} — Wedding Invitation`
  const desc = inv.greeting || `Undangan pernikahan ${inv.title}.`

  const html = `<!doctype html><html lang="id"><head><meta charset="utf-8"><title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${esc(target)}">
${image ? `<meta property="og:image" content="${esc(image)}">` : ''}
<meta name="twitter:card" content="summary_large_image">
<meta http-equiv="refresh" content="0;url=${esc(target)}"></head>
<body><p><a href="${esc(target)}">Buka undangan</a></p>
<script>location.replace(${JSON.stringify(target)})</script></body></html>`
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=3600' } })
})
