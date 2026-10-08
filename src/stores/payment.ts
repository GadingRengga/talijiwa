import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Payment } from '@/types'
import { paymentService } from '@/services/payments'
import type { PaymentInput } from '@/services/payments'

export const usePaymentStore = defineStore('payment', () => {
  const items = ref<Payment[]>([])
  const loading = ref(false)

  async function load(orderId: string) {
    loading.value = true
    try {
      items.value = await paymentService.listByOrder(orderId)
    } finally {
      loading.value = false
    }
  }
  async function record(orderId: string, input: PaymentInput) {
    const p = await paymentService.record(orderId, input)
    items.value.unshift(p)
    return p
  }
  async function remove(id: string) {
    await paymentService.remove(id)
    items.value = items.value.filter((p) => p.id !== id)
  }

  return { items, loading, load, record, remove }
})
