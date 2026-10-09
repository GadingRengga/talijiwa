import { readCodeSession } from '@/services/access-codes'
import { copy } from '@/config/copy'
import { requireSupabase, useMock } from '@/services/supabase/client'

const KEY = 'talijiwa:auth'
const MOCK_EMAIL = 'admin@talijiwa.id'
const MOCK_PASSWORD = 'admin123'
const COUPLE_KEY = 'talijiwa:couple'

export type UserRole = 'admin' | 'customer' | null

function readCouple(): { email: string; customer_id: string } | null {
  try {
    const raw = localStorage.getItem(COUPLE_KEY)
    return raw ? (JSON.parse(raw) as { email: string; customer_id: string }) : null
  } catch {
    return null
  }
}

function readMock(): string | null {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

function writeMock(email: string | null) {
  try {
    if (email) localStorage.setItem(KEY, email)
    else localStorage.removeItem(KEY)
  } catch {
    /* session lives in memory only */
  }
}

/** Email of the current session, or null. Never throws. */
export async function getSessionEmail(): Promise<string | null> {
  if (useMock) return readMock()
  try {
    const { data } = await requireSupabase().auth.getSession()
    return data.session?.user.email ?? null
  } catch {
    return null
  }
}

/** True when the current user has an admin row in profiles. Never throws. */
export async function isCurrentUserAdmin(): Promise<boolean> {
  if (useMock) return readMock() === MOCK_EMAIL
  try {
    const sb = requireSupabase()
    const { data: user } = await sb.auth.getUser()
    if (!user.user) return false
    const { data } = await sb.from('profiles').select('role').eq('id', user.user.id).maybeSingle()
    return data?.role === 'admin'
  } catch {
    return false
  }
}

/** Sign in and enforce the admin role. Resolves the email. */
export async function signIn(inputEmail: string, password: string): Promise<string> {
  if (useMock) {
    await new Promise((r) => setTimeout(r, 250))
    if (inputEmail.trim().toLowerCase() !== MOCK_EMAIL || password !== MOCK_PASSWORD) {
      throw new Error(copy.auth.invalid)
    }
    writeMock(MOCK_EMAIL)
    return MOCK_EMAIL
  }
  const sb = requireSupabase()
  const { data, error } = await sb.auth.signInWithPassword({ email: inputEmail.trim(), password })
  if (error || !data.user?.email) {
    await sb.auth.signOut().catch(() => undefined)
    throw new Error(copy.auth.invalid)
  }
  const { data: profile } = await sb.from('profiles').select('role').eq('id', data.user.id).maybeSingle()
  if (profile?.role !== 'admin') {
    await sb.auth.signOut().catch(() => undefined)
    throw new Error(copy.auth.notAdmin)
  }
  return data.user.email
}

export async function signOut(): Promise<void> {
  if (useMock) {
    writeMock(null)
    try {
      localStorage.removeItem(COUPLE_KEY)
    } catch {
      /* ignore */
    }
    return
  }
  await requireSupabase().auth.signOut().catch(() => undefined)
}

/** Customer id linked to the current user (matched by email), or null. Never throws. */
export async function myCustomerId(): Promise<string | null> {
  if (useMock) return readCouple()?.customer_id ?? null
  // Code session: the anonymous session is linked to the customer (migration
  // 015), so the stored id is authoritative and RLS-safe.
  const code = readCodeSession()
  if (code?.customer_id) return code.customer_id
  try {
    const sb = requireSupabase()
    const { data: user } = await sb.auth.getUser()
    const email = user.user?.email
    if (!email) return null
    const { data } = await sb.from('customers').select('id').ilike('email', email).maybeSingle()
    return (data as { id: string } | null)?.id ?? null
  } catch {
    return null
  }
}

/** Resolve the current session's role: admin, customer, or none. */
export async function currentRole(): Promise<{ email: string | null; role: UserRole }> {
  const email = await getSessionEmail()
  if (!email) return { email: null, role: null }
  if (useMock) {
    if (email === MOCK_EMAIL) return { email, role: 'admin' }
    return readCouple()?.email === email ? { email, role: 'customer' } : { email: null, role: null }
  }
  if (await isCurrentUserAdmin()) return { email, role: 'admin' }
  if (await myCustomerId()) return { email, role: 'customer' }
  return { email: null, role: null }
}

/** Send a magic login link to a registered customer email. Resolves when sent. */
export async function requestMagicLink(inputEmail: string): Promise<void> {
  const email = inputEmail.trim().toLowerCase()
  if (!email) throw new Error('Masukkan alamat email.')
  if (useMock) {
    // Demo: any seed customer email signs in instantly (no email is really sent).
    const { db } = await import('../mock/db')
    const customer = db().customers.find((c) => c.email.toLowerCase() === email)
    if (!customer) throw new Error('Email tidak terdaftar. Hubungi admin via WhatsApp.')
    try {
      localStorage.setItem(COUPLE_KEY, JSON.stringify({ email: customer.email, customer_id: customer.id }))
    } catch {
      /* ignore */
    }
    return
  }
  const { error } = await requireSupabase().auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${window.location.origin}/pasangan` },
  })
  if (error) throw new Error(error.message)
}

/** Subscribe to session changes. Returns an unsubscribe function. */
export function onAuthChange(cb: (email: string | null) => void): () => void {
  if (useMock) return () => undefined
  const { data } = requireSupabase().auth.onAuthStateChange((_event, session) => cb(session?.user.email ?? null))
  return () => data.subscription.unsubscribe()
}
