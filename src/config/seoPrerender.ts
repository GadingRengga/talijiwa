/** Static SEO for prerendered routes (single source: copy.site; also applied at runtime via useSeo). */
import { copy } from './copy'

// Node-only (imported by vite.config.ts): overridable via SITE_URL env at build time.
const rawSite = typeof process !== 'undefined' ? (process.env.SITE_URL ?? process.env.VITE_SITE_URL) : undefined

export const SITE = (rawSite || 'https://talijiwa.id').replace(/\/$/, '')

export const PRERENDER_SEO: Record<string, { title: string; description: string }> = {
  '/': { title: copy.site.homeTitle, description: copy.site.homeDescription },
  '/templates': { title: copy.site.templatesTitle, description: copy.site.templatesDescription },
  '/portfolio': { title: copy.site.portfolioTitle, description: copy.site.portfolioDescription },
  '/services': { title: copy.site.servicesTitle, description: copy.site.servicesDescription },
  '/about': { title: copy.site.aboutTitle, description: copy.site.aboutDescription },
  '/contact': { title: copy.site.contactTitle, description: copy.site.aboutDescription },
}

export const PRERENDER_ROUTES = Object.keys(PRERENDER_SEO)

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const ORG_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  name: 'Talijiwa',
  description: 'Layanan undangan pernikahan digital yang elegan, interaktif, dan mudah dibagikan.',
  url: SITE,
  address: { '@type': 'PostalAddress', addressLocality: 'Surakarta', addressRegion: 'Jawa Tengah', addressCountry: 'ID' },
}

export function injectPrerenderMeta(route: string, html: string): string {
  const meta = PRERENDER_SEO[route]
  if (!meta || typeof html !== 'string') return html
  const url = `${SITE}${route}`
  return html
    .replace(/<title>.*?<\/title>/, `<title>${esc(meta.title)}</title>`)
    .replace('</head>', [
      `<meta name="description" content="${esc(meta.description)}">`,
      `<link rel="canonical" href="${url}">`,
      `<meta property="og:type" content="website">`,
      `<meta property="og:title" content="${esc(meta.title)}">`,
      `<meta property="og:description" content="${esc(meta.description)}">`,
      `<meta property="og:url" content="${url}">`,
      `<meta property="og:image" content="${SITE}/og-share.jpg">`,
      `<meta name="twitter:card" content="summary_large_image">`,
      `<meta name="twitter:image" content="${SITE}/og-share.jpg">`,
      `<script type="application/ld+json" data-jsonld="org">${JSON.stringify(ORG_JSONLD)}</script>`,
    ].join('\n') + '\n</head>')
}
