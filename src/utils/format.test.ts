import { describe, expect, it } from 'vitest'
import { isValidSlug, normalizeWhatsapp, sanitizeGuestName, slugify } from '@/utils/format'
import { checkClientRateLimit, retryAfterMs } from '@/utils/rateLimit'

describe('slugify', () => {
  it('converts names to slugs', () => {
    expect(slugify('Raka & Sinta')).toBe('raka-sinta')
    expect(slugify('  Akad Nikah 2026! ')).toBe('akad-nikah-2026')
  })
  it('strips diacritics and caps length', () => {
    expect(slugify('André Müller')).toBe('andre-muller')
    expect(slugify('a'.repeat(100)).length).toBeLessThanOrEqual(60)
  })
  it('handles empty input', () => {
    expect(slugify('')).toBe('')
    expect(slugify('---')).toBe('')
  })
})

describe('isValidSlug', () => {
  it('accepts well-formed slugs', () => {
    expect(isValidSlug('raka-sinta')).toBe(true)
    expect(isValidSlug('a1b-2c3')).toBe(true)
  })
  it('rejects malformed and reserved slugs', () => {
    expect(isValidSlug('ab')).toBe(false)
    expect(isValidSlug('-raka')).toBe(false)
    expect(isValidSlug('raka-')).toBe(false)
    expect(isValidSlug('raka--sinta')).toBe(false)
    expect(isValidSlug('Raka-Sinta')).toBe(false)
    for (const reserved of ['admin', 'login', 'api', 'invite']) {
      expect(isValidSlug(reserved)).toBe(false)
    }
  })
})

describe('normalizeWhatsapp', () => {
  it('normalizes Indonesian numbers', () => {
    expect(normalizeWhatsapp('081234567890')).toBe('6281234567890')
    expect(normalizeWhatsapp('+6281234567890')).toBe('6281234567890')
    expect(normalizeWhatsapp('6281234567890')).toBe('6281234567890')
    expect(normalizeWhatsapp('0812-3456-7890')).toBe('6281234567890')
  })
})

describe('sanitizeGuestName', () => {
  it('strips tags, control chars and limits length', () => {
    expect(sanitizeGuestName('Bapak <b>Andi</b>')).toBe('Bapak bAndi/b')
    expect(sanitizeGuestName('A\u0000B\u001fC')).toBe('ABC')
    expect(sanitizeGuestName('  Sinta  ')).toBe('Sinta')
    expect(sanitizeGuestName('x'.repeat(100)).length).toBeLessThanOrEqual(60)
    expect(sanitizeGuestName(undefined)).toBe('')
    expect(sanitizeGuestName(123)).toBe('')
  })
})

describe('checkClientRateLimit', () => {
  it('allows the first attempts then blocks', () => {
    const key = `test:${Date.now()}:${Math.random()}`
    expect(checkClientRateLimit(key, 2, 60_000)).toBe(true)
    expect(checkClientRateLimit(key, 2, 60_000)).toBe(true)
    expect(checkClientRateLimit(key, 2, 60_000)).toBe(false)
  })
  it('reports retry delay while limited', () => {
    const key = `test:${Date.now()}:${Math.random()}`
    expect(checkClientRateLimit(key, 1, 60_000)).toBe(true)
    expect(checkClientRateLimit(key, 1, 60_000)).toBe(false)
    expect(retryAfterMs(key, 1, 60_000)).toBeGreaterThan(0)
  })
})
