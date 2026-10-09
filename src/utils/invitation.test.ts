import { describe, expect, it } from 'vitest'
import { allowedThemes, contrastOn, contrastRatio, isCustomAmount, isThemeAllowed, parseRupiah, resolveOrder, resolveStyle, resolveThemePrice } from '@/utils/invitation'
import { DEFAULT_STYLE } from '@/utils/invitation'
import type { InvitationSettings, ThemeCatalogEntry } from '@/types'

const baseSettings = (): InvitationSettings => ({
  sections: { couple: true, date: true, countdown: true, profile: true, story: true, events: true, maps: true, gallery: true, rsvp: true, messages: true, gift: true },
  rsvp_deadline: '',
  music_enabled: false,
  music_url: '',
  seo_title: '',
  seo_description: '',
  seo_noindex: false,
  show_in_portfolio: false,
})

describe('contrast', () => {
  it('ranks black-on-white above gray-on-white', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeGreaterThan(contrastRatio('#8a7566', '#ffffff'))
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0)
  })
  it('picks readable text color', () => {
    expect(contrastOn('#ffffff')).toBe('#1b1b1b')
    expect(contrastOn('#1b1b1b')).toBe('#ffffff')
  })
  it('handles invalid hex safely', () => {
    expect(contrastRatio('nonsense', '#ffffff')).toBeGreaterThan(0)
  })
})

describe('resolveStyle', () => {
  it('fills defaults for legacy settings', () => {
    expect(resolveStyle(baseSettings())).toEqual(DEFAULT_STYLE)
  })
  it('keeps custom overrides', () => {
    const s = resolveStyle({ ...baseSettings(), style: { accent: '#b99a5b' } })
    expect(s.accent).toBe('#b99a5b')
    expect(s.font).toBe('theme')
  })
})

describe('resolveOrder', () => {
  it('falls back to default key order', () => {
    expect(resolveOrder(baseSettings())).toEqual([
      'couple', 'date', 'countdown', 'profile', 'story', 'events', 'maps', 'gallery', 'rsvp', 'messages', 'gift',
    ])
  })
  it('respects custom order and drops unknown keys', () => {
    const s = resolveOrder({ ...baseSettings(), section_order: ['gift', 'nope' as never, 'couple'] })
    expect(s[0]).toBe('gift')
    expect(s).toContain('couple')
    expect(s).not.toContain('nope')
    expect(new Set(s).size).toBe(s.length)
  })
})

describe('tier entitlement (Option B: higher tiers unlock lower ones)', () => {
  const catalog: Pick<ThemeCatalogEntry, 'theme' | 'is_active' | 'tier'>[] = [
    { theme: 'classic', is_active: true, tier: 'basic' },
    { theme: 'gerbang', is_active: true, tier: 'premium' },
    { theme: 'luxury', is_active: true, tier: 'luxury' },
    { theme: 'minimal', is_active: false, tier: 'basic' },
  ]
  it('basic unlocks only active basic themes', () => {
    expect(allowedThemes('basic', catalog)).toEqual(['classic'])
  })
  it('premium unlocks basic + premium', () => {
    expect(allowedThemes('premium', catalog)).toEqual(['classic', 'gerbang'])
  })
  it('luxury unlocks everything active', () => {
    expect(allowedThemes('luxury', catalog)).toEqual(['classic', 'gerbang', 'luxury'])
  })
  it('guards a single theme', () => {
    expect(isThemeAllowed('luxury', 'premium', catalog)).toBe(false)
    expect(isThemeAllowed('classic', 'premium', catalog)).toBe(true)
  })
})

describe('resolveThemePrice', () => {
  it('prefers the tier master price when set', () => {
    expect(resolveThemePrice({ price: 123000 }, { basic: 149000 }, 'basic')).toBe(149000)
  })
  it('falls back to the per-theme price when the tier price is unset', () => {
    expect(resolveThemePrice({ price: 199000 }, { premium: 0 }, 'premium')).toBe(199000)
  })
})

describe('parseRupiah', () => {
  it('parses formatted and plain input', () => {
    expect(parseRupiah('Rp150.000')).toBe(150000)
    expect(parseRupiah('150000')).toBe(150000)
    expect(parseRupiah('Rp 1.234.567')).toBe(1234567)
    expect(parseRupiah('')).toBe(0)
  })
})

describe('isCustomAmount', () => {
  it('detects amounts outside every tier price', () => {
    const prices = { basic: 149000, premium: 199000, luxury: 249000 }
    expect(isCustomAmount(149000, prices)).toBe(false)
    expect(isCustomAmount(100000, prices)).toBe(true)
  })
})
