import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Customer } from '@/types'
import { customerService } from '@/services/customers'
import type { CustomerInput } from '@/services/customers'

export const useCustomerStore = defineStore('customer', () => {
  const items = ref<Customer[]>([])
  const loading = ref(false)
  const loaded = ref(false)

  async function load(force = false) {
    if (loaded.value && !force) return
    loading.value = true
    try {
      items.value = await customerService.list()
      loaded.value = true
    } finally {
      loading.value = false
    }
  }
  async function create(input: CustomerInput) {
    const c = await customerService.create(input)
    items.value.unshift(c)
    return c
  }
  async function update(id: string, input: CustomerInput) {
    const c = await customerService.update(id, input)
    items.value = items.value.map((x) => (x.id === id ? c : x))
    return c
  }
  async function remove(id: string) {
    await customerService.remove(id)
    items.value = items.value.filter((x) => x.id !== id)
  }
  const byId = (id: string) => items.value.find((c) => c.id === id)

  return { items, loading, loaded, load, create, update, remove, byId }
})
