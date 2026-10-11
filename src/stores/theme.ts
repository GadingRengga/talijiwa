import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getTheme, themeList } from '@/themes'
import type { ThemeId } from '@/types'

/** Theme catalogue + the theme currently highlighted in selectors (e.g. create-invitation form). */
export const useThemeStore = defineStore('theme', () => {
  const selected = ref<ThemeId>('floral')
  const list = computed(() => themeList)
  const current = computed(() => getTheme(selected.value))
  function select(id: ThemeId) {
    selected.value = id
  }
  return { selected, list, current, select }
})
