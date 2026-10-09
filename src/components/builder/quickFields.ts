import { copy } from '@/config/copy'
import type { BuilderKey } from './sections'

export interface QuickField {
  /** Path into InvitationData, e.g. ['events', 0, 'venue']. */
  path: (string | number)[]
  label: string
  kind: 'text' | 'textarea' | 'date' | 'time' | 'url'
  placeholder?: string
}

export interface QuickEdit {
  section: BuilderKey
  fields: QuickField[]
}

/**
 * Tap-to-edit registry: renderer `data-sec` block -> a few scalar fields.
 * Blocks with complex editors (story/gallery/gifts/theme/...) have no entry
 * and fall through to jumping to the full section form.
 */
export const QUICK_EDITS: Record<string, QuickEdit> = {
  cover: {
    section: 'basic',
    fields: [
      { path: ['title'], label: copy.builder.basic.titleLabel, kind: 'text', placeholder: copy.builder.basic.titlePh },
      { path: ['greeting'], label: copy.builder.basic.greeting, kind: 'text' },
    ],
  },
  couple: {
    section: 'basic',
    fields: [
      { path: ['greeting'], label: copy.builder.basic.greeting, kind: 'text' },
      { path: ['opening_text'], label: copy.builder.basic.opening, kind: 'textarea' },
    ],
  },
  closing: {
    section: 'basic',
    fields: [{ path: ['closing_text'], label: copy.builder.basic.closing, kind: 'textarea' }],
  },
  profile: {
    section: 'couple',
    fields: [
      { path: ['groom', 'nickname'], label: `${copy.builder.couple.groom} · ${copy.builder.couple.nickname}`, kind: 'text' },
      { path: ['bride', 'nickname'], label: `${copy.builder.couple.bride} · ${copy.builder.couple.nickname}`, kind: 'text' },
      { path: ['groom', 'name'], label: `${copy.builder.couple.groom} · ${copy.builder.couple.fullName}`, kind: 'text' },
      { path: ['bride', 'name'], label: `${copy.builder.couple.bride} · ${copy.builder.couple.fullName}`, kind: 'text' },
    ],
  },
  date: {
    section: 'events',
    fields: [
      { path: ['events', 0, 'date'], label: copy.builder.events.date, kind: 'date' },
      { path: ['events', 0, 'start_time'], label: copy.builder.events.start, kind: 'time' },
      { path: ['events', 0, 'venue'], label: copy.builder.events.venue, kind: 'text', placeholder: copy.builder.events.venuePh },
    ],
  },
  countdown: {
    section: 'events',
    fields: [
      { path: ['events', 0, 'date'], label: copy.builder.events.date, kind: 'date' },
      { path: ['events', 0, 'start_time'], label: copy.builder.events.start, kind: 'time' },
    ],
  },
  events: {
    section: 'events',
    fields: [
      { path: ['events', 0, 'name'], label: copy.builder.events.name, kind: 'text', placeholder: copy.builder.events.namePh },
      { path: ['events', 0, 'date'], label: copy.builder.events.date, kind: 'date' },
      { path: ['events', 0, 'venue'], label: copy.builder.events.venue, kind: 'text', placeholder: copy.builder.events.venuePh },
    ],
  },
  maps: {
    section: 'events',
    fields: [
      { path: ['events', 0, 'venue'], label: copy.builder.events.venue, kind: 'text', placeholder: copy.builder.events.venuePh },
      { path: ['events', 0, 'address'], label: copy.builder.events.address, kind: 'text' },
      { path: ['events', 0, 'maps_url'], label: copy.builder.events.maps, kind: 'url', placeholder: 'https://…' },
    ],
  },
  rsvp: {
    section: 'rsvp',
    fields: [{ path: ['settings', 'rsvp_deadline'], label: copy.builder.rsvp.deadline, kind: 'date' }],
  },
  music: {
    section: 'music',
    fields: [{ path: ['settings', 'music_url'], label: copy.builder.music.url, kind: 'url', placeholder: 'https://…' }],
  },
}
