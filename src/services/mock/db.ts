import { createSeed } from './seed'
import type { MockDb } from './seed'

const KEY = 'talijiwa:mock:v1'
let cache: MockDb | null = null

function load(): MockDb {
  if (cache) return cache
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      cache = JSON.parse(raw) as MockDb
      // Forward-fill collections added after the snapshot was saved.
      const fresh = createSeed()
      cache.orders ??= fresh.orders
      cache.payments ??= fresh.payments
      cache.themeCatalog ??= fresh.themeCatalog
      cache.accessCodes ??= fresh.accessCodes
      for (const o of cache.orders) o.delivered_at ??= null
      for (const i of cache.invitations) {
        ;(i as { tier?: string }).tier ??= 'basic'
      }
      for (const o of cache.orders) {
        ;(o as { tier?: string }).tier ??= 'basic'
      }
      for (const t of cache.themeCatalog) {
        ;(t as { tier?: string }).tier ??= 'basic'
      }
      cache.siteSettings ??= fresh.siteSettings
      cache.testimonials ??= fresh.testimonials
      cache.faqs ??= fresh.faqs
      return cache
    }
  } catch {
    /* storage unavailable or corrupted: fall through to a fresh seed */
  }
  cache = createSeed()
  persist()
  return cache
}

function persist() {
  try {
    if (cache) localStorage.setItem(KEY, JSON.stringify(cache))
  } catch {
    /* quota exceeded or blocked: keep working in memory */
  }
}

/** Simulates network latency so loading states are visible during development. */
export const delay = <T>(value: T, ms = 120): Promise<T> => new Promise((r) => setTimeout(() => r(value), ms))

export function db(): MockDb {
  return load()
}

export function commit(): void {
  persist()
}

export function resetMockDb(): void {
  cache = createSeed()
  persist()
}

export const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T
