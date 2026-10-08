import { ViteSSG } from 'vite-ssg'
import { createPinia } from 'pinia'
import App from './App.vue'
import { useToast } from './composables/useToast'
import { registerGuards, routes } from './router'
import './style.css'

export const createApp = ViteSSG(App, { routes }, ({ app, router, isClient }) => {
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
