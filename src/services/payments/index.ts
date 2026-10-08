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
  /** Record a payment and add it to the order's paid total. */
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
    const sb = requireSupabase()
    const order = await sb.from('orders').select('paid, amount, status').eq('id', orderId).maybeSingle()
    if (order.error) throw new Error(order.error.message)
    if (!order.data) throw new Error('Pesanan tidak ditemukan.')
    const current = order.data as { paid: number; amount: number; status: string }
    const { data, error } = await sb.from('payments').insert({
      order_id: orderId, amount, method: input.method,
      paid_at: input.paid_at || new Date().toISOString().slice(0, 10), note: input.note,
    }).select('*').single()
    if (error) throw new Error(error.message)
    const paid = Number(current.paid ?? 0) + amount
    const status = current.status === 'cancelled' ? 'cancelled' : paid >= Number(current.amount ?? 0) ? 'paid' : 'dp'
    const { error: upErr } = await sb.from('orders').update({ paid, status }).eq('id', orderId)
    if (upErr) throw new Error(upErr.message)
    return toApp(data as Record<string, unknown>)
  },
  /** Delete a payment and subtract it from the order's paid total. */
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
    const sb = requireSupabase()
    const row = await sb.from('payments').select('order_id, amount').eq('id', id).maybeSingle()
    if (row.error) throw new Error(row.error.message)
    if (!row.data) return
    const { error } = await sb.from('payments').delete().eq('id', id)
    if (error) throw new Error(error.message)
    const order = await sb.from('orders').select('paid, amount, status').eq('id', (row.data as { order_id: string }).order_id).maybeSingle()
    if (order.error || !order.data) return
    const cur = order.data as { paid: number; amount: number; status: string }
    const paid = Math.max(0, Number(cur.paid ?? 0) - Number((row.data as { amount: number }).amount ?? 0))
    const status = cur.status === 'cancelled' ? 'cancelled' : paid >= Number(cur.amount ?? 0) ? 'paid' : paid > 0 ? 'dp' : 'pending'
    await sb.from('orders').update({ paid, status }).eq('id', (row.data as { order_id: string }).order_id)
  },
}
