const DATE_FMT = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
const LONG_DATE_FMT = new Intl.DateTimeFormat('id-ID', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})
const IDR = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })

/** Parse "YYYY-MM-DD" as a local date (avoids UTC shifting a day). */
export function parseLocalDate(value: string): Date | null {
  if (!value) return null
  const [y, m, d] = value.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

export function formatDate(value: string): string {
  const d = parseLocalDate(value)
  return d ? DATE_FMT.format(d) : ''
}

export function formatLongDate(value: string): string {
  const d = parseLocalDate(value)
  return d ? LONG_DATE_FMT.format(d) : ''
}

export function formatCurrency(value: number): string {
  return IDR.format(value)
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
}

/** "Raka & Sinta" -> "raka-sinta" */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

export const RESERVED_SLUGS = ['admin', 'login', 'api', 'invite', 'about', 'templates', 'portfolio', 'services', 'contact']

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length >= 3 && !RESERVED_SLUGS.includes(slug)
}

/** Normalize Indonesian WhatsApp numbers: 08.. / +62.. / 62.. -> 62.. */
export function normalizeWhatsapp(input: string): string {
  const digits = input.replace(/[^\d+]/g, '').replace(/^\+/, '')
  if (digits.startsWith('0')) return `62${digits.slice(1)}`
  if (digits.startsWith('62')) return digits
  if (digits.startsWith('8')) return `62${digits}`
  return digits
}

export function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`
}

/** Read the guest name from ?to= safely. Returned value must be rendered as text only. */
export function sanitizeGuestName(raw: unknown): string {
  if (typeof raw !== 'string') return ''
  return raw.replace(/[<>\u0000-\u001f\u007f]/g, '').trim().slice(0, 60)
}
