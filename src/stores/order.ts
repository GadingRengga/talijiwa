import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Order } from '@/types'
import { orderService } from '@/services/orders'
import type { OrderInput } from '@/services/orders'

export const useOrderStore = defineStore('order', () => {
  const items = ref<Order[]>([])
  const loading = ref(false)
  const loaded = ref(false)

  async function load(force = false) {
    if (loaded.value && !force) return
    loading.value = true
    try {
      items.value = await orderService.list()
      loaded.value = true
    } finally {
      loading.value = false
    }
  }
  async function create(input: OrderInput) {
    const o = await orderService.create(input)
    items.value.unshift(o)
    return o
  }
  async function update(id: string, input: OrderInput) {
    const o = await orderService.update(id, input)
    items.value = items.value.map((x) => (x.id === id ? o : x))
    return o
  }
  async function remove(id: string) {
    await orderService.remove(id)
    items.value = items.value.filter((x) => x.id !== id)
  }
  const byId = (id: string) => items.value.find((o) => o.id === id)

  return { items, loading, loaded, load, create, update, remove, byId }
})
