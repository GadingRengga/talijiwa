import type { Attendance, GiftConfirmation, GiftType, GuestMessage, Rsvp } from '@/types'
import { normalizeWhatsapp, uid } from '@/utils/format'
import { checkClientRateLimit } from '@/utils/rateLimit'
import { commit, clone, db, delay } from '../mock/db'
import { requireSupabase, useMock } from '../supabase/client'

/** Client-side throttle for public inserts (server enforces via RPC too). */
function throttle(kind: string, invitationId: string): void {
  if (!checkClientRateLimit(`public:${kind}:${invitationId}`, 3, 60_000)) {
    throw new Error('Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.')
  }
}

/** Server-side sliding-window check (anon-callable RPC). Never throws on infra errors (fail-open for UX, logged by RLS table). */
async function checkServerRateLimit(kind: string, invitationId: string): Promise<void> {
  try {
    const { data, error } = await requireSupabase().rpc('check_public_rate_limit', {
      p_key: `${kind}:${invitationId}`,
      p_max: 5,
      p_window_seconds: 60,
    })
    if (!error && data === false) {
      throw new Error('Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.')
    }
  } catch (e) {
    if (e instanceof Error && e.message.includes('Terlalu banyak')) throw e
    /* RPC missing (migration not run yet) or network: allow, client throttle already applied */
  }
}

export const rsvpService = {
  async listRsvps(invitationId: string): Promise<Rsvp[]> {
    if (useMock) return delay(clone(db().rsvps.filter((r) => r.invitation_id === invitationId)))
    const { data, error } = await requireSupabase().from('rsvps').select('*').eq('invitation_id', invitationId).order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data ?? []) as Rsvp[]
  },
  async createRsvp(input: {
    invitation_id: string
    name: string
    whatsapp: string
    guest_count: number
    attendance: Attendance
    message: string
  }): Promise<void> {
    throttle('rsvp', input.invitation_id)
    if (useMock) {
      const row: Rsvp = {
        id: uid('rsvp'),
        ...input,
        name: input.name.trim().slice(0, 80),
        whatsapp: normalizeWhatsapp(input.whatsapp),
        guest_count: Math.min(Math.max(1, input.guest_count), 20),
        message: input.message.trim().slice(0, 500),
        created_at: new Date().toISOString(),
      }
      db().rsvps.push(row)
      commit()
      await delay(null)
      return
    }
    // No .select(): anon has INSERT-only on this table (see docs/DATABASE.md).
    await checkServerRateLimit('rsvp', input.invitation_id)
    const { error } = await requireSupabase().from('rsvps').insert({
      invitation_id: input.invitation_id,
      name: input.name.trim().slice(0, 80),
      whatsapp: normalizeWhatsapp(input.whatsapp),
      guest_count: Math.min(Math.max(1, input.guest_count), 20),
      attendance: input.attendance,
      message: input.message.trim().slice(0, 500),
    })
    if (error) throw new Error(error.message)
  },
  async listMessages(invitationId: string, onlyVisible: boolean): Promise<GuestMessage[]> {
    if (useMock) {
      const rows = db().messages.filter((m) => m.invitation_id === invitationId && (!onlyVisible || m.is_visible))
      return delay(clone(rows.sort((a, b) => b.created_at.localeCompare(a.created_at))))
    }
    let q = requireSupabase().from('guest_messages').select('*').eq('invitation_id', invitationId)
    if (onlyVisible) q = q.eq('is_visible', true)
    const { data, error } = await q.order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data ?? []) as GuestMessage[]
  },
  async createMessage(input: { invitation_id: string; name: string; message: string }): Promise<void> {
    throttle('message', input.invitation_id)
    if (useMock) {
      db().messages.push({
        id: uid('msg'),
        invitation_id: input.invitation_id,
        name: input.name.trim().slice(0, 80),
        message: input.message.trim().slice(0, 500),
        is_visible: true,
        created_at: new Date().toISOString(),
      })
      commit()
      await delay(null)
      return
    }
    await checkServerRateLimit('message', input.invitation_id)
    const { error } = await requireSupabase().from('guest_messages').insert({
      invitation_id: input.invitation_id,
      name: input.name.trim().slice(0, 80),
      message: input.message.trim().slice(0, 500),
    })
    if (error) throw new Error(error.message)
  },
  async setMessageVisible(id: string, visible: boolean): Promise<void> {
    if (useMock) {
      const m = db().messages.find((x) => x.id === id)
      if (m) m.is_visible = visible
      commit()
      await delay(null)
      return
    }
    const { error } = await requireSupabase().from('guest_messages').update({ is_visible: visible }).eq('id', id)
    if (error) throw new Error(error.message)
  },
  async removeMessage(id: string): Promise<void> {
    if (useMock) {
      const data = db()
      data.messages = data.messages.filter((m) => m.id !== id)
      commit()
      await delay(null)
      return
    }
    const { error } = await requireSupabase().from('guest_messages').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },
  async listGiftConfirmations(invitationId: string): Promise<GiftConfirmation[]> {
    if (useMock) return delay(clone(db().giftConfirmations.filter((g) => g.invitation_id === invitationId)))
    const { data, error } = await requireSupabase().from('gift_confirmations').select('*').eq('invitation_id', invitationId).order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return ((data ?? []) as Record<string, unknown>[]).map((g) => ({ ...g, amount: g.amount == null ? null : Number(g.amount) })) as GiftConfirmation[]
  },
  async createGiftConfirmation(input: {
    invitation_id: string
    name: string
    gift_type: GiftType
    amount: number | null
    message: string
  }): Promise<void> {
    throttle('gift', input.invitation_id)
    if (useMock) {
      db().giftConfirmations.push({
        id: uid('gift'),
        ...input,
        name: input.name.trim().slice(0, 80),
        message: input.message.trim().slice(0, 500),
        created_at: new Date().toISOString(),
      })
      commit()
      await delay(null)
      return
    }
    await checkServerRateLimit('gift', input.invitation_id)
    const { error } = await requireSupabase().from('gift_confirmations').insert({
      invitation_id: input.invitation_id,
      name: input.name.trim().slice(0, 80),
      gift_type: input.gift_type,
      amount: input.amount,
      message: input.message.trim().slice(0, 500),
    })
    if (error) throw new Error(error.message)
  },
}
