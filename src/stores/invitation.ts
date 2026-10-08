import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { InvitationData, InvitationStatus, ThemeId } from '@/types'
import { invitationService } from '@/services/invitations'

export const useInvitationStore = defineStore('invitation', () => {
  const items = ref<InvitationData[]>([])
  const loading = ref(false)
  const loaded = ref(false)

  async function load(force = false) {
    if (loaded.value && !force) return
    loading.value = true
    try {
      items.value = await invitationService.list()
      loaded.value = true
    } finally {
      loading.value = false
    }
  }
  function replace(inv: InvitationData) {
    const i = items.value.findIndex((x) => x.id === inv.id)
    if (i >= 0) items.value[i] = inv
    else items.value.unshift(inv)
  }
  async function create(customerId: string, title: string, theme: ThemeId) {
    const inv = await invitationService.create(customerId, title, theme)
    replace(inv)
    return inv
  }
  async function setStatus(id: string, status: InvitationStatus) {
    const inv = await invitationService.setStatus(id, status)
    replace(inv)
    return inv
  }
  async function duplicate(id: string) {
    const inv = await invitationService.duplicate(id)
    replace(inv)
    return inv
  }
  async function remove(id: string) {
    await invitationService.remove(id)
    items.value = items.value.filter((x) => x.id !== id)
  }

  return { items, loading, loaded, load, replace, create, setStatus, duplicate, remove }
})
