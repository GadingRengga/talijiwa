import { ViteSSG } from 'vite-ssg'
import { createPinia } from 'pinia'
import App from './App.vue'
import { registerGuards, routes } from './router'
import './style.css'

export const createApp = ViteSSG(App, { routes }, ({ app, router }) => {
  app.config.errorHandler = (err, _instance, info) => {
    // Single place to plug in error reporting later.
    console.error('[app error]', info, err)
  }
  app.use(createPinia())
  registerGuards(router)
})
