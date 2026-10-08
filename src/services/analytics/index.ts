import { commit, db, delay } from '../mock/db'
import { requireSupabase, useMock } from '../supabase/client'
import { uid } from '@/utils/format'

const VISITOR_KEY = 'talijiwa:visitor'

/** Random per-browser id. No IP address is ever collected or stored. */
function visitorHash(): string {
  try {
    let v = localStorage.getItem(VISITOR_KEY)
    if (!v) {
      v = uid('v')
      localStorage.setItem(VISITOR_KEY, v)
    }
    return v
  } catch {
    return 'anonymous'
  }
}

export interface DashboardStats {
  customers: number
  invitations: number
  published: number
  rsvps: number
  guests: number
  messages: number
  views: number
}

export interface DayPoint {
  date: string
  label: string
  views: number
  rsvps: number
  guests: number
}

const dayKey = (d: Date) => d.toISOString().slice(0, 10)
const dayLabel = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })

function lastDays(n: number): string[] {
  const out: string[] = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    out.push(dayKey(d))
  }
  return out
}

function buildSeries(days: string[], views: { created_at: string; invitation_id: string }[], rsvps: { created_at: string; invitation_id: string; attendance: string; guest_count: number }[], invitationId?: string): DayPoint[] {
  return days.map((date) => {
    const v = views.filter((x) => x.created_at.slice(0, 10) === date && (!invitationId || x.invitation_id === invitationId)).length
    const r = rsvps.filter((x) => x.created_at.slice(0, 10) === date && (!invitationId || x.invitation_id === invitationId))
    return {
      date,
      label: dayLabel(date),
      views: v,
      rsvps: r.length,
      guests: r.filter((x) => x.attendance === 'attending').reduce((n, x) => n + x.guest_count, 0),
    }
  })
}

export const analyticsService = {
  async trackView(invitationId: string): Promise<void> {
    if (useMock) {
      db().views.push({
        id: uid('view'),
        invitation_id: invitationId,
        visitor_hash: visitorHash(),
        created_at: new Date().toISOString(),
      })
      commit()
      return
    }
    const { error } = await requireSupabase().from('invitation_views').insert({
      invitation_id: invitationId,
      visitor_hash: visitorHash(),
    })
    if (error) throw new Error(error.message)
  },
  async dashboard(): Promise<DashboardStats> {
    if (useMock) {
      const d = db()
      return delay({
        customers: d.customers.length,
        invitations: d.invitations.length,
        published: d.invitations.filter((i) => i.status === 'published').length,
        rsvps: d.rsvps.length,
        guests: d.rsvps.filter((r) => r.attendance === 'attending').reduce((n, r) => n + r.guest_count, 0),
        messages: d.messages.length,
        views: d.views.length,
      })
    }
    const sb = requireSupabase()
    const [customers, invitations, published, rsvps, rsvpRows, messages, views] = await Promise.all([
      sb.from('customers').select('id', { count: 'exact', head: true }),
      sb.from('invitations').select('id', { count: 'exact', head: true }),
      sb.from('invitations').select('id', { count: 'exact', head: true }).eq('status', 'published'),
      sb.from('rsvps').select('id', { count: 'exact', head: true }),
      sb.from('rsvps').select('guest_count, attendance'),
      sb.from('guest_messages').select('id', { count: 'exact', head: true }),
      sb.from('invitation_views').select('id', { count: 'exact', head: true }),
    ])
    for (const r of [customers, invitations, published, rsvps, rsvpRows, messages, views]) {
      if (r.error) throw new Error(r.error.message)
    }
    const rows = (rsvpRows.data ?? []) as { guest_count: number; attendance: string }[]
    return {
      customers: customers.count ?? 0,
      invitations: invitations.count ?? 0,
      published: published.count ?? 0,
      rsvps: rsvps.count ?? 0,
      guests: rows.filter((r) => r.attendance === 'attending').reduce((n, r) => n + r.guest_count, 0),
      messages: messages.count ?? 0,
      views: views.count ?? 0,
    }
  },
  /** Per-day views/RSVPs for the last `days` days, optionally scoped to one invitation. */
  async series(days = 14, invitationId?: string): Promise<DayPoint[]> {
    const keys = lastDays(days)
    if (useMock) {
      const d = db()
      return delay(buildSeries(keys, d.views, d.rsvps, invitationId))
    }
    const sb = requireSupabase()
    const since = new Date()
    since.setDate(since.getDate() - days)
    const iso = since.toISOString()
    let vq = sb.from('invitation_views').select('created_at, invitation_id').gte('created_at', iso)
    let rq = sb.from('rsvps').select('created_at, invitation_id, attendance, guest_count').gte('created_at', iso)
    if (invitationId) {
      vq = vq.eq('invitation_id', invitationId)
      rq = rq.eq('invitation_id', invitationId)
    }
    const [views, rsvps] = await Promise.all([vq, rq])
    if (views.error) throw new Error(views.error.message)
    if (rsvps.error) throw new Error(rsvps.error.message)
    return buildSeries(keys, (views.data ?? []) as never[], (rsvps.data ?? []) as never[], invitationId)
  },
}
