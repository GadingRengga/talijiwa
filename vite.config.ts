import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { PRERENDER_ROUTES, SITE, injectPrerenderMeta } from './src/config/seoPrerender.ts'

/** Regenerate dist/sitemap.xml from prerendered routes + build-time SITE_URL. */
function sitemapPlugin(): Plugin {
  return {
    name: 'talijiwa-sitemap',
    generateBundle() {
      const urls = PRERENDER_ROUTES.map((r) => `  <url><loc>${SITE}${r === '/' ? '/' : r}</loc><changefreq>weekly</changefreq></url>`).join('\n')
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
      })
    },
  }
}

export default defineConfig({
  plugins: [vue(), tailwindcss(), sitemapPlugin()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  ssgOptions: {
    includedRoutes: (paths) => paths.map((p) => (p.startsWith('/') ? p : `/${p}`)).filter((p) => PRERENDER_ROUTES.includes(p)),
    onPageRendered: (route, html) => injectPrerenderMeta(route, html),
  },
})
