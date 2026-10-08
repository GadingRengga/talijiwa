# Cloudflare Worker: wa-preview (paste ke dashboard, tanpa CLI)
#
# Cara pakai (5 menit, tanpa install apa pun):
# 1. Cloudflare Dashboard → Workers & Pages → Create Worker → paste SELURUH file ini.
# 2. Isi 3 konstanta di bawah (SUPABASE_URL, SUPABASE_ANON_KEY, SITE_URL).
# 3. Deploy → dapat URL https://wa-preview.<subdomain>.workers.dev
# 4. Tambahkan route di domain talijiwa.id:  talijiwa.id/invite-preview* → worker ini.
#    (Workers → Add route, atau Zones → Workers Routes.)
# 5. Sebarkan link undangan seperti biasa (/invite/:slug). Saat crawler WA/FB/X/Telegram
#    membuka link, ubah yang disebar menjadi:
#       https://talijiwa.id/invite-preview?slug=RAKA-SINTA
#    Manusia yang klik tetap sampai ke /invite/:slug via redirect.
#
# Cara kerja: deteksi User-Agent crawler → ambil data undangan via Supabase REST
# (anon key + RLS published, sama seperti browser tamu) → balas HTML og:*.
# Bukan crawler → 302 langsung ke halaman undangan (tak pernah disentuh user).

const SUPABASE_URL = 'https://upwvtfoalwpkejmhvoas.supabase.co'
const SUPABASE_ANON_KEY = 'ISI_DENGAN_ANON_KEY'
const SITE_URL = 'https://talijiwa.id'

const BOT = /whatsapp|facebookexternalhit|twitterbot|telegrambot|linkedinbot|slackbot|discordbot|googlebot/i

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

async function getInvitation(slug) {
  const q = `${SUPABASE_URL}/rest/v1/invitations?slug=eq.${encodeURIComponent(slug)}&select=id,title,greeting,status&limit=1`
  const r = await fetch(q, { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } })
  if (!r.ok) return null
  const rows = await r.json()
  const inv = rows[0]
  return inv && inv.status === 'published' ? inv : null
}

async function getCover(invitationId) {
  const q = `${SUPABASE_URL}/rest/v1/invitation_gallery?invitation_id=eq.${invitationId}&is_cover=eq.true&select=image_path&limit=1`
  const r = await fetch(q, { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } })
  if (!r.ok) return ''
  const rows = await r.json()
  const path = rows[0]?.image_path ?? ''
  if (!path || path.startsWith('data:')) return ''
  return path.startsWith('http') ? path : `${SUPABASE_URL}/storage/v1/object/public/invitation-images/${path}`
}

export default {
  async fetch(request) {
    const url = new URL(request.url)
    const slug = (url.searchParams.get('slug') ?? '').trim()
    if (!slug) return new Response('Missing slug', { status: 400 })
    const target = `${SITE_URL}/invite/${encodeURIComponent(slug)}`
    const ua = request.headers.get('user-agent') ?? ''
    if (!BOT.test(ua)) return Response.redirect(target, 302)

    const inv = await getInvitation(slug)
    if (!inv) return new Response('Undangan tidak ditemukan', { status: 404 })
    const image = await getCover(inv.id)
    const title = `${inv.title} — Wedding Invitation`
    const desc = inv.greeting || `Undangan pernikahan ${inv.title}.`
    const html = `<!doctype html><html lang="id"><head><meta charset="utf-8"><title>${esc(title)}</title>` +
      `<meta name="description" content="${esc(desc)}">` +
      `<meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}">` +
      `<meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${esc(target)}">` +
      (image ? `<meta property="og:image" content="${esc(image)}">` : '') +
      `<meta name="twitter:card" content="summary_large_image">` +
      `<meta http-equiv="refresh" content="0;url=${esc(target)}"></head>` +
      `<body><p><a href="${esc(target)}">Buka undangan</a></p></body></html>`
    return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=3600' } })
  },
}
