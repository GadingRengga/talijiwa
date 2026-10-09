import type { Order, PaymentStatus } from '@/types'
import { uid } from '@/utils/format'
import { commit, clone, db, delay } from '../mock/db'
import { requireSupabase, useMock } from '../supabase/client'

export type OrderInput = Pick<Order, 'customer_id' | 'invitation_id' | 'tier' | 'theme' | 'amount' | 'paid' | 'status' | 'due_date' | 'notes'>

function toApp(row: Record<string, unknown>): Order {
  return {
    id: row.id as string,
    customer_id: row.customer_id as string,
    invitation_id: (row.invitation_id as string | null) ?? null,
    tier: (row.tier as Order['tier']) ?? 'basic',
    theme: row.theme as Order['theme'],
    amount: Number(row.amount ?? 0),
    paid: Number(row.paid ?? 0),
    status: row.status as PaymentStatus,
    due_date: (row.due_date as string | null) ?? '',
    notes: (row.notes as string) ?? '',
    delivered_at: (row.delivered_at as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  }
}



export const orderService = {
  async list(): Promise<Order[]> {
    if (useMock) {
      return delay(clone([...db().orders].sort((a, b) => b.created_at.localeCompare(a.created_at))))
    }
    const { data, error } = await requireSupabase().from('orders').select('*').order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data ?? []).map((r) => toApp(r as Record<string, unknown>))
  },
  async getByInvitation(invitationId: string): Promise<Order | null> {
    if (useMock) return delay(clone(db().orders.find((o) => o.invitation_id === invitationId) ?? null))
    const { data, error } = await requireSupabase().from('orders').select('*').eq('invitation_id', invitationId).maybeSingle()
    if (error) throw new Error(error.message)
    return data ? toApp(data as Record<string, unknown>) : null
  },
  /** Orders of one customer (couple dashboard quota). RLS enforces ownership. */
  async listByCustomer(customerId: string): Promise<Order[]> {
    if (useMock) {
      return delay(clone([...db().orders].filter((o) => o.customer_id === customerId).sort((a, b) => b.created_at.localeCompare(a.created_at))))
    }
    const { data, error } = await requireSupabase().from('orders').select('*').eq('customer_id', customerId).order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data ?? []).map((r) => toApp(r as Record<string, unknown>))
  },
  async setDelivered(id: string, delivered: boolean): Promise<Order> {
    const delivered_at = delivered ? new Date().toISOString() : null
    if (useMock) {
      const o = db().orders.find((x) => x.id === id)
      if (!o) throw new Error('Pesanan tidak ditemukan.')
      o.delivered_at = delivered_at
      o.updated_at = new Date().toISOString()
      commit()
      return delay(clone(o))
    }
    const { data, error } = await requireSupabase().from('orders').update({ delivered_at }).eq('id', id).select('*').single()
    if (error) throw new Error(error.message)
    return toApp(data as Record<string, unknown>)
  },
  async get(id: string): Promise<Order | null> {
    if (useMock) return delay(clone(db().orders.find((o) => o.id === id) ?? null))
    const { data, error } = await requireSupabase().from('orders').select('*').eq('id', id).maybeSingle()
    if (error) throw new Error(error.message)
    return data ? toApp(data as Record<string, unknown>) : null
  },
  async create(input: OrderInput): Promise<Order> {
    if (useMock) {
      const now = new Date().toISOString()
      const order: Order = { id: uid('ord'), ...input, delivered_at: null, created_at: now, updated_at: now }
      db().orders.push(order)
      commit()
      return delay(clone(order))
    }
    const { data, error } = await requireSupabase().from('orders').insert({
      customer_id: input.customer_id,
      invitation_id: input.invitation_id,
      tier: input.tier,
      theme: input.theme,
      amount: input.amount,
      paid: input.paid,
      status: input.status,
      due_date: input.due_date || null,
      notes: input.notes,
    }).select('*').single()
    if (error) throw new Error(error.message)
    return toApp(data as Record<string, unknown>)
  },
  async update(id: string, input: OrderInput): Promise<Order> {
    if (useMock) {
      const data = db()
      const o = data.orders.find((x) => x.id === id)
      if (!o) throw new Error('Pesanan tidak ditemukan.')
      Object.assign(o, input, { updated_at: new Date().toISOString() })
      // Tier follows the order: upgrading/downgrading an order re-entitles its invitation.
      if (o.invitation_id) {
        const inv = data.invitations.find((i) => i.id === o.invitation_id)
        if (inv) {
          inv.tier = o.tier
          inv.updated_at = new Date().toISOString()
        }
      }
      commit()
      return delay(clone(o))
    }
    const { data, error } = await requireSupabase().from('orders').update({
      customer_id: input.customer_id,
      invitation_id: input.invitation_id,
      tier: input.tier,
      theme: input.theme,
      amount: input.amount,
      paid: input.paid,
      status: input.status,
      due_date: input.due_date || null,
      notes: input.notes,
    }).eq('id', id).select('*').single()
    if (error) throw new Error(error.message)
    const saved = toApp(data as Record<string, unknown>)
    // Keep the linked invitation's entitlement in sync with the order tier.
    if (saved.invitation_id) {
      const { error: tierError } = await requireSupabase().from('invitations').update({ tier: saved.tier }).eq('id', saved.invitation_id)
      if (tierError) throw new Error(tierError.message)
    }
    return saved
  },
  async remove(id: string): Promise<void> {
    if (useMock) {
      const data = db()
      data.orders = data.orders.filter((o) => o.id !== id)
      commit()
      await delay(null)
      return
    }
    const { error } = await requireSupabase().from('orders').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },
}
