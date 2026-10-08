import { SECTION_KEYS } from '@/types'
import type { FontChoice, InvitationData, InvitationSettings, InvitationStyle, Person, SectionKey, ThemeId } from '@/types'
import { uid } from './format'

/** Offline-safe placeholder image (SVG data URI). */
export function placeholderImage(label: string, from = '#d9cfc1', to = '#b8a58e'): string {
  const text = label.replace(/[<>&"']/g, '')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="800" height="1000" fill="url(#g)"/><text x="400" y="520" font-family="Georgia,serif" font-size="56" fill="rgba(255,255,255,.85)" text-anchor="middle">${text}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export function emptyPerson(): Person {
  return { name: '', nickname: '', father: '', mother: '', photo: '', instagram: '' }
}

export function defaultSettings(): InvitationSettings {
  const sections = Object.fromEntries(SECTION_KEYS.map((k) => [k, true])) as Record<SectionKey, boolean>
  return {
    sections,
    rsvp_deadline: '',
    music_enabled: false,
    music_url: '',
    seo_title: '',
    seo_description: '',
    seo_noindex: false,
    show_in_portfolio: false,
  }
}

export function createEmptyInvitation(customerId: string, theme: ThemeId = 'classic'): InvitationData {
  const now = new Date().toISOString()
  return {
    id: uid('inv'),
    customer_id: customerId,
    title: '',
    slug: '',
    status: 'draft',
    theme,
    published_at: null,
    created_at: now,
    updated_at: now,
    greeting: 'Assalamualaikum Warahmatullahi Wabarakatuh',
    opening_text:
      'Dengan memohon rahmat dan ridho Allah SWT, kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri acara pernikahan kami.',
    closing_text:
      'Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.',
    bride: emptyPerson(),
    groom: emptyPerson(),
    stories: [],
    events: [],
    gallery: [],
    gifts: [],
    settings: defaultSettings(),
  }
}

/** Couple display name from the title, falling back to the nicknames. */
export function coupleLabel(inv: Pick<InvitationData, 'title' | 'bride' | 'groom'>): string {
  if (inv.title.trim()) return inv.title.trim()
  const a = inv.groom.nickname || inv.groom.name
  const b = inv.bride.nickname || inv.bride.name
  return [a, b].filter(Boolean).join(' & ') || 'Undangan baru'
}

/** First event date, used as the "wedding date" and countdown target. */
export function weddingDate(inv: Pick<InvitationData, 'events'>): string {
  const sorted = [...inv.events].filter((e) => e.date).sort((a, b) => a.date.localeCompare(b.date))
  return sorted[0]?.date ?? ''
}

export function publicUrl(slug: string, origin = window.location.origin): string {
  return `${origin}/invite/${slug}`
}

/** Rough completeness (0-100) for a builder section, used as progress hints. */
export function sectionProgress(inv: InvitationData) {
  return {
    basic: !!(inv.title && inv.slug) ? 100 : inv.title || inv.slug ? 50 : 0,
    couple: Math.round(
      ([inv.bride.name, inv.bride.photo, inv.groom.name, inv.groom.photo].filter(Boolean).length / 4) * 100,
    ),
    story: inv.stories.length ? 100 : 0,
    events: inv.events.length && inv.events.every((e) => e.date && e.venue) ? 100 : inv.events.length ? 50 : 0,
    gallery: inv.gallery.length >= 3 ? 100 : inv.gallery.length ? 50 : 0,
    rsvp: 100,
    messages: 100,
    gift: inv.gifts.length ? 100 : 0,
    music: !inv.settings.music_enabled || inv.settings.music_url ? 100 : 50,
    theme: 100,
    seo: inv.settings.seo_title || inv.settings.seo_description ? 100 : 0,
    publish: inv.status === 'published' ? 100 : 0,
  } as Record<string, number>
}

/** Blocking problems that prevent publishing (used by the list view; the builder adds slug-availability checks). */
export function publishErrors(inv: InvitationData): string[] {
  const errors: string[] = []
  if (!inv.title.trim() || !inv.slug) errors.push('Judul dan slug belum diisi.')
  if (!inv.bride.name.trim() || !inv.groom.name.trim()) errors.push('Nama mempelai belum lengkap.')
  if (!inv.events.some((e) => e.date && e.venue.trim())) errors.push('Belum ada acara lengkap (tanggal dan tempat).')
  if (inv.settings.music_enabled && !inv.settings.music_url) errors.push('Tautan musik belum diisi.')
  return errors
}

export const DEFAULT_STYLE: InvitationStyle = { accent: '', font: 'theme', fontBody: 'theme', headingScale: 'm', animation: 'full', intro: 'theme', text: '', muted: '', surface: '' }
export const FONT_FAMILY: Record<Exclude<FontChoice, 'theme'>, string> = {
  serif: 'Playfair Display',
  classic: 'Cormorant Garamond',
  script: 'Great Vibes',
  modern: 'Inter',
}
export function resolveStyle(s: InvitationSettings): InvitationStyle {
  return { ...DEFAULT_STYLE, ...(s.style ?? {}) }
}
export function resolveOrder(s: InvitationSettings): SectionKey[] {
  const o = (s.section_order ?? []).filter((k) => SECTION_KEYS.includes(k))
  return [...new Set([...o, ...SECTION_KEYS])]
}
function luminance(hex: string): number {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return 0
  const n = parseInt(m[1]!, 16)
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * ch[0]! + 0.7152 * ch[1]! + 0.0722 * ch[2]!
}
export function contrastRatio(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p)
  return (x! + 0.05) / (y! + 0.05)
}
/** Readable text color (dark/light) for a given background. */
export function contrastOn(hex: string): string {
  return luminance(hex) > 0.45 ? '#1b1b1b' : '#ffffff'
}
