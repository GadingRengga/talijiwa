import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { myCustomerId } from '@/services/auth'
import { invitationService } from '@/services/invitations'
import type { InvitationData } from '@/types'

/**
 * Data for the couple portal shell: the customer's invitations, loaded once
 * and shared by CoupleLayout (menu links) and the dashboard.
 */
export const useCoupleStore = defineStore('couple', () => {
  const items = ref<InvitationData[]>([])
  const loading = ref(false)
  const loaded = ref(false)
  const customerId = ref<string | null>(null)

  async function load(force = false) {
    if (loaded.value && !force) return
    loading.value = true
    try {
      customerId.value = await myCustomerId()
      items.value = customerId.value ? await invitationService.listByCustomer(customerId.value) : []
      loaded.value = true
    } catch {
      items.value = []
      loaded.value = true
    } finally {
      loading.value = false
    }
  }

  /** The first invitation (couples normally have exactly one). */
  const primary = computed(() => items.value[0] ?? null)

  /** Drop cached invitations (account switch without a page reload). */
  function reset() {
    items.value = []
    customerId.value = null
    loaded.value = false
    loading.value = false
  }

  return { items, primary, customerId, loading, loaded, load, reset }
})
