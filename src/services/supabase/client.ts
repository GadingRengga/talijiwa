import { createClient } from '@supabase/supabase-js'

/** True unless VITE_USE_MOCK=false. In mock mode all data lives in localStorage. */
export const useMock = import.meta.env.VITE_USE_MOCK !== 'false'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** Abort hanging requests so pages fall back instead of loading forever. */
function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  if (init?.signal || typeof AbortController === 'undefined') return fetch(input, init)
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 15000)
  return fetch(input, { ...init, signal: ctrl.signal }).finally(() => clearTimeout(timer))
}

/** Only the anon key is ever used in the frontend. Never add the service_role key. */
export const supabase = !useMock && url && anonKey ? createClient(url, anonKey, { global: { fetch: fetchWithTimeout } }) : null

export function requireSupabase() {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY.')
  return supabase
}

/** Adapter not written yet (Phase 2). Mock mode is the only working backend for now. */
export function notImplemented(name: string): never {
  throw new Error(`Adapter Supabase untuk "${name}" belum diimplementasikan. Gunakan VITE_USE_MOCK=true.`)
}
