import type { Payment, PaymentMethod } from '@/types'
import { uid } from '@/utils/format'
import { commit, clone, db, delay } from '../mock/db'
import { requireSupabase, useMock } from '../supabase/client'

export interface PaymentInput {
  amount: number
  method: PaymentMethod
  paid_at: string
  note: string
}

function toApp(row: Record<string, unknown>): Payment {
  return {
    id: row.id as string,
    order_id: row.order_id as string,
    amount: Number(row.amount ?? 0),
    method: row.method as PaymentMethod,
    paid_at: (row.paid_at as string) ?? '',
    note: (row.note as string) ?? '',
    created_at: row.created_at as string,
  }
}

export const paymentService = {
  async listByOrder(orderId: string): Promise<Payment[]> {
    if (useMock) {
      return delay(clone(db().payments.filter((p) => p.order_id === orderId).sort((a, b) => b.paid_at.localeCompare(a.paid_at))))
    }
    const { data, error } = await requireSupabase().from('payments').select('*').eq('order_id', orderId).order('paid_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data ?? []).map((r) => toApp(r as Record<string, unknown>))
  },
  /** Record a payment and add it to the order's paid total (atomic via RPC in Supabase mode). */
  async record(orderId: string, input: PaymentInput): Promise<Payment> {
    const amount = Math.round(input.amount) || 0
    if (amount <= 0) throw new Error('Nominal pembayaran harus lebih dari 0.')
    if (useMock) {
      const data = db()
      const order = data.orders.find((o) => o.id === orderId)
      if (!order) throw new Error('Pesanan tidak ditemukan.')
      const row: Payment = { id: uid('pay'), order_id: orderId, amount, method: input.method, paid_at: input.paid_at || new Date().toISOString().slice(0, 10), note: input.note, created_at: new Date().toISOString() }
      data.payments.push(row)
      order.paid += amount
      if (order.status !== 'cancelled') order.status = order.paid >= order.amount ? 'paid' : 'dp'
      order.updated_at = new Date().toISOString()
      commit()
      return delay(clone(row))
    }
    const { data, error } = await requireSupabase().rpc('record_payment', {
      p_order_id: orderId,
      p_amount: amount,
      p_method: input.method,
      p_paid_at: input.paid_at || null,
      p_note: input.note ?? '',
    })
    if (error) throw new Error(error.message)
    const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | undefined
    if (!row) throw new Error('Pembayaran tidak tersimpan.')
    return toApp({ ...row, created_at: new Date().toISOString() })
  },
  /** Delete a payment and subtract it from the order's paid total (atomic via RPC in Supabase mode). */
  async remove(id: string): Promise<void> {
    if (useMock) {
      const data = db()
      const row = data.payments.find((p) => p.id === id)
      if (!row) return
      const order = data.orders.find((o) => o.id === row.order_id)
      if (order) {
        order.paid = Math.max(0, order.paid - row.amount)
        if (order.status !== 'cancelled') order.status = order.paid >= order.amount ? 'paid' : order.paid > 0 ? 'dp' : 'pending'
        order.updated_at = new Date().toISOString()
      }
      data.payments = data.payments.filter((p) => p.id !== id)
      commit()
      await delay(null)
      return
    }
    const { error } = await requireSupabase().rpc('remove_payment', { p_payment_id: id })
    if (error) throw new Error(error.message)
  },
}
