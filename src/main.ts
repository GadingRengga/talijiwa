import { ViteSSG } from 'vite-ssg'
import { createPinia } from 'pinia'
import App from './App.vue'
import { useToast } from './composables/useToast'
import { registerGuards, routes } from './router'
import './style.css'

/** Show runtime errors on screen (for devices where devtools can't be opened). No-op on server. */
function installErrorPanel() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  if (import.meta.env.PROD) return // production guests must never see raw internals
  if (document.querySelector('[data-error-panel]')) return
  const show = (message: string) => {
    let el = document.querySelector<HTMLElement>('[data-error-panel]')
    if (!el) {
      el = document.createElement('div')
      el.setAttribute('data-error-panel', '')
      el.setAttribute('role', 'alert')
      el.style.cssText = 'position:fixed;left:8px;right:8px;bottom:8px;z-index:9999;background:#7a1f1f;color:#fff;font:12px/1.5 system-ui;padding:10px 12px;border-radius:10px;white-space:pre-wrap;word-break:break-word;'
      document.body.appendChild(el)
    }
    el.textContent = `Galat aplikasi: ${message.slice(0, 300)}`
  }
  window.addEventListener('error', (e) => show(e.message || String(e.error ?? e)))
  window.addEventListener('unhandledrejection', (e) => show((e.reason as Error)?.message ?? String(e.reason)))
}

export const createApp = ViteSSG(App, { routes }, ({ app, router, isClient }) => {
  if (isClient) installErrorPanel()
  app.config.errorHandler = (err, _instance, info) => {
    // Single place to plug in error reporting later.
    console.error('[app error]', info, err)
    if (isClient) {
      try {
        useToast().error('Terjadi kesalahan. Muat ulang halaman bila tampilan kosong.')
      } catch {
        /* toast unavailable (SSR): ignore */
      }
    }
  }
  router.onError((err) => console.error('[router error]', err))
  app.use(createPinia())
  registerGuards(router)
})
