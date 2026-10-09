import type { AccessCode, CodeSession } from '@/types'
import { makeAccessCode } from '@/utils/invitation'
import { commit, clone, db, delay } from '../mock/db'
import { requireSupabase, useMock } from '../supabase/client'

const CODE_SESSION_KEY = 'talijiwa:code-session'

export function readCodeSession(): CodeSession | null {
  try {
    const raw = localStorage.getItem(CODE_SESSION_KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as CodeSession
    return s?.code && s?.email && s?.customer_id ? s : null
  } catch {
    return null
  }
}

function writeCodeSession(s: CodeSession): void {
  try {
    localStorage.setItem(CODE_SESSION_KEY, JSON.stringify(s))
    // Legacy key kept for myCustomerId()/currentRole() fallback readers.
    localStorage.setItem('talijiwa:couple', JSON.stringify({ email: s.email, customer_id: s.customer_id }))
  } catch {
    /* ignore */
  }
}

export function clearCodeSession(): void {
  try {
    localStorage.removeItem(CODE_SESSION_KEY)
    localStorage.removeItem('talijiwa:couple')
  } catch {
    /* ignore */
  }
}

function toApp(r: Record<string, unknown>): AccessCode {
  return {
    code: r.code as string,
    customer_id: r.customer_id as string,
    order_id: r.order_id as string,
    tier: (r.tier as AccessCode['tier']) ?? 'basic',
    is_active: (r.is_active as boolean) ?? true,
    expires_at: (r.expires_at as string | null) ?? null,
    redeemed_email: (r.redeemed_email as string) ?? '',
    redeemed_at: (r.redeemed_at as string | null) ?? null,
    last_used_at: (r.last_used_at as string | null) ?? null,
    created_at: r.created_at as string,
  }
}

export interface RedeemResult {
  customer_id: string
  order_id: string
  tier: AccessCode['tier']
}

export const accessCodeService = {
  /** Latest active code for an order (admin). */
  async getByOrder(orderId: string): Promise<AccessCode | null> {
    if (useMock) {
      const rows = db().accessCodes.filter((c) => c.order_id === orderId)
      return delay(clone(rows.sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null))
    }
    const { data, error } = await requireSupabase().from('access_codes').select('*').eq('order_id', orderId)
      .order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (error) throw new Error(error.message)
    return data ? toApp(data as Record<string, unknown>) : null
  },

  /** Issue a code for a paid order (admin). Reuses the active code when one exists. */
  async issue(orderId: string): Promise<AccessCode> {
    if (useMock) {
      const data = db()
      const order = data.orders.find((o) => o.id === orderId)
      if (!order) throw new Error('Pesanan tidak ditemukan.')
      const existing = data.accessCodes.find((c) => c.order_id === orderId && c.is_active)
      if (existing) return delay(clone(existing))
      const row: AccessCode = {
        code: makeAccessCode(),
        customer_id: order.customer_id,
        order_id: order.id,
        tier: order.tier,
        is_active: true,
        expires_at: null,
        redeemed_email: '',
        redeemed_at: null,
        last_used_at: null,
        created_at: new Date().toISOString(),
      }
      data.accessCodes.push(row)
      commit()
      return delay(clone(row))
    }
    const sb = requireSupabase()
    const { data: order, error: orderError } = await sb.from('orders').select('customer_id,tier').eq('id', orderId).single()
    if (orderError) throw new Error(orderError.message)
    const o = order as { customer_id: string; tier: string }
    const { data: existing } = await sb.from('access_codes').select('*').eq('order_id', orderId).eq('is_active', true)
      .order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (existing) return toApp(existing as Record<string, unknown>)
    const { data, error } = await sb.from('access_codes').insert({
      code: makeAccessCode(), customer_id: o.customer_id, order_id: orderId, tier: o.tier,
    }).select('*').single()
    if (error) throw new Error(error.message)
    return toApp(data as Record<string, unknown>)
  },

  async deactivate(code: string): Promise<void> {
    if (useMock) {
      const row = db().accessCodes.find((c) => c.code === code)
      if (!row) throw new Error('Kode tidak ditemukan.')
      row.is_active = false
      commit()
      await delay(null)
      return
    }
    const { error } = await requireSupabase().from('access_codes').update({ is_active: false }).eq('code', code)
    if (error) throw new Error(error.message)
  },

  /**
   * Credential-style login: code + email, reusable, no per-login verification.
   * Mock: matched locally. Supabase: validated via `validate_access_code` RPC
   * (falls back to legacy single-use `redeem_access_code` when 014 not deployed).
   * On success a local code session is stored for the auth store.
   */
  async loginWithCode(code: string, email: string): Promise<RedeemResult> {
    const cleanCode = code.trim().toUpperCase()
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleanEmail)) throw new Error('Masukkan alamat email yang valid.')
    if (useMock) {
      const data = db()
      const row = data.accessCodes.find((c) => c.code === cleanCode)
      if (!row) throw new Error('Kode tidak ditemukan. Periksa kembali kode dari admin.')
      if (!row.is_active) throw new Error('Kode dinonaktifkan. Hubungi admin.')
      if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) throw new Error('Kode sudah kedaluwarsa. Hubungi admin.')
      const order = data.orders.find((o) => o.id === row.order_id)
      if (!order || order.status === 'cancelled') throw new Error('Pesanan terkait kode ini dibatalkan. Hubungi admin.')
      const customer = data.customers.find((c) => c.id === row.customer_id)
      if (!customer) throw new Error('Pelanggan tidak ditemukan.')
      if (row.redeemed_email) {
        if (row.redeemed_email.toLowerCase() !== cleanEmail) throw new Error('Kode ini terdaftar untuk email lain.')
      } else {
        if (customer.email && customer.email.toLowerCase() !== cleanEmail) throw new Error('Kode ini terdaftar untuk pelanggan lain.')
        customer.email = cleanEmail
        customer.updated_at = new Date().toISOString()
        row.redeemed_email = cleanEmail
        row.redeemed_at = new Date().toISOString()
      }
      row.last_used_at = new Date().toISOString()
      commit()
      writeCodeSession({ code: row.code, email: cleanEmail, customer_id: row.customer_id, order_id: row.order_id, tier: row.tier })
      return delay({ customer_id: row.customer_id, order_id: row.order_id, tier: row.tier })
    }
    // Prefer reusable validation; fall back to legacy redeem on old backends.
    try {
      const { data, error } = await requireSupabase().rpc('validate_access_code', { p_code: cleanCode, p_email: cleanEmail })
      if (error) throw error
      const row = (Array.isArray(data) ? data[0] : data) as RedeemResult | undefined
      if (!row) throw new Error('Kode tidak ditemukan.')
      writeCodeSession({ code: cleanCode, email: cleanEmail, customer_id: row.customer_id, order_id: row.order_id, tier: row.tier })
      return row
    } catch (e) {
      const msg = e instanceof Error ? e.message : ''
      // Legacy backend without validate_access_code: single-use redeem still works for first login.
      if (/function .*validate_access_code.*does not exist|404|PGRST/.test(msg)) {
        const { data, error } = await requireSupabase().rpc('redeem_access_code', { p_code: cleanCode, p_email: cleanEmail })
        if (error) throw new Error(error.message)
        const row = (Array.isArray(data) ? data[0] : data) as RedeemResult | undefined
        if (!row) throw new Error('Kode tidak ditemukan.')
        writeCodeSession({ code: cleanCode, email: cleanEmail, customer_id: row.customer_id, order_id: row.order_id, tier: row.tier })
        return row
      }
      throw e instanceof Error ? e : new Error(msg || 'Kode tidak valid.')
    }
  },

  /**
   * Validate a code and link it to an email. Works for anonymous callers
   * (Supabase path delegates to the SECURITY DEFINER RPC).
   * Legacy single-use entry point; prefer loginWithCode for credential logins.
   */
  async redeem(code: string, email: string): Promise<RedeemResult> {
    return this.loginWithCode(code, email)
  },
}
