import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Faq, Testimonial } from '@/types'
import { contentService } from '@/services/content'

export const useContentStore = defineStore('content', () => {
  const settings = ref<Record<string, string>>({})
  const testimonials = ref<Testimonial[]>([])
  const faqs = ref<Faq[]>([])
  const loading = ref(false)
  const loaded = ref(false)

  async function load(admin: boolean, force = false) {
    if (loaded.value && !force) return
    loading.value = true
    try {
      const [s, t, f] = await Promise.all([contentService.settings(), contentService.testimonials(admin), contentService.faqs(admin)])
      settings.value = s
      testimonials.value = t
      faqs.value = f
      loaded.value = true
    } finally {
      loading.value = false
    }
  }

  const text = (key: string, fallback: string) => settings.value[key] ?? fallback

  return { settings, testimonials, faqs, loading, loaded, load, text }
})
