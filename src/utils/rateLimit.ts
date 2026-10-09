/**
 * Client-side submission throttling for public forms.
 * This is UX-only (never a security boundary): the server enforces the real
 * limit via the `check_public_rate_limit` RPC (see migration 013).
 */

const PREFIX = 'talijiwa:ratelimit:'

/** In-memory fallback for non-browser runtimes (SSR, vitest node env). */
const memory = new Map<string, number[]>()

function storageAvailable(): boolean {
  try {
    return typeof localStorage !== 'undefined'
  } catch {
    return false
  }
}

function read(key: string): number[] {
  if (!storageAvailable()) return [...(memory.get(key) ?? [])]
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return []
    const parsed = JSON.parse(raw) as number[]
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === 'number') : []
  } catch {
    return []
  }
}

function write(key: string, stamps: number[]): void {
  const trimmed = stamps.slice(-20)
  memory.set(key, [...trimmed])
  if (!storageAvailable()) return
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(trimmed))
  } catch {
    /* storage unavailable: ignore */
  }
}

/**
 * Returns true when the caller may proceed, and records the attempt.
 * `max` attempts per `windowMs` per `key`.
 */
export function checkClientRateLimit(key: string, max = 3, windowMs = 60_000): boolean {
  const now = Date.now()
  const recent = read(key).filter((t) => now - t < windowMs)
  if (recent.length >= max) {
    write(key, recent)
    return false
  }
  recent.push(now)
  write(key, recent)
  return true
}

/** Milliseconds until the caller may retry (0 when allowed now). */
export function retryAfterMs(key: string, max = 3, windowMs = 60_000): number {
  const now = Date.now()
  const recent = read(key).filter((t) => now - t < windowMs).sort((a, b) => a - b)
  if (recent.length < max) return 0
  return Math.max(0, windowMs - (now - recent[0]!))
}
