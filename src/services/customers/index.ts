import type { Customer } from '@/types'
import { uid } from '@/utils/format'
import { commit, clone, db, delay } from '../mock/db'
import { requireSupabase, useMock } from '../supabase/client'

export type CustomerInput = Pick<Customer, 'name' | 'phone' | 'email' | 'notes'>

export const customerService = {
  async list(): Promise<Customer[]> {
    if (useMock) {
      return delay(clone([...db().customers].sort((a, b) => b.created_at.localeCompare(a.created_at))))
    }
    const { data, error } = await requireSupabase().from('customers').select('*').order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data as Customer[]
  },
  async get(id: string): Promise<Customer | null> {
    if (useMock) return delay(clone(db().customers.find((c) => c.id === id) ?? null))
    const { data, error } = await requireSupabase().from('customers').select('*').eq('id', id).maybeSingle()
    if (error) throw new Error(error.message)
    return (data as Customer | null) ?? null
  },
  async create(input: CustomerInput): Promise<Customer> {
    if (useMock) {
      const now = new Date().toISOString()
      const customer: Customer = { id: uid('cus'), ...input, created_at: now, updated_at: now }
      db().customers.push(customer)
      commit()
      return delay(clone(customer))
    }
    const { data, error } = await requireSupabase().from('customers').insert(input).select('*').single()
    if (error) throw new Error(error.message)
    return data as Customer
  },
  async update(id: string, input: CustomerInput): Promise<Customer> {
    if (useMock) {
      const c = db().customers.find((x) => x.id === id)
      if (!c) throw new Error('Pelanggan tidak ditemukan.')
      Object.assign(c, input, { updated_at: new Date().toISOString() })
      commit()
      return delay(clone(c))
    }
    const { data, error } = await requireSupabase().from('customers').update(input).eq('id', id).select('*').single()
    if (error) throw new Error(error.message)
    return data as Customer
  },
  async remove(id: string): Promise<void> {
    if (useMock) {
      if (db().invitations.some((i) => i.customer_id === id)) {
        throw new Error('Pelanggan masih memiliki undangan. Hapus atau pindahkan undangannya terlebih dahulu.')
      }
      const data = db()
      data.customers = data.customers.filter((c) => c.id !== id)
      commit()
      await delay(null)
      return
    }
    const { error } = await requireSupabase().from('customers').delete().eq('id', id)
    if (error) {
      if (error.code === '23503') throw new Error('Pelanggan masih memiliki undangan atau pesanan. Hapus atau pindahkan dulu.')
      throw new Error(error.message)
    }
  },
}
