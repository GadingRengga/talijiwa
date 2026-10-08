import type { SupabaseClient } from '@supabase/supabase-js'
import type { EventItem, GalleryItem, GiftAccount, InvitationData, InvitationStatus, Person, SectionKey, StoryItem } from '@/types'
import { isValidSlug, slugify, uid } from '@/utils/format'
import { createEmptyInvitation, defaultSettings } from '@/utils/invitation'
import { commit, clone, db, delay } from '../mock/db'
import { storageService } from '../storage'
import { requireSupabase, useMock } from '../supabase/client'

type Sb = SupabaseClient

/** Storage paths become public URLs; absolute/data URLs pass through untouched. */
function resolveFile(path: string): string {
  if (!path || path.startsWith('data:') || path.startsWith('http')) return path
  return requireSupabase().storage.from('invitation-images').getPublicUrl(path).data.publicUrl
}

const dateOut = (v: string | null): string => v ?? ''
const dateIn = (v: string): string | null => (v ? v : null)
const timeOut = (v: string | null): string => (v ? v.slice(0, 5) : '')

function personOut(rows: { role: string; name: string; nickname: string; father: string; mother: string; photo_path: string; instagram: string }[], role: string): Person {
  const r = rows.find((x) => x.role === role)
  return {
    name: r?.name ?? '',
    nickname: r?.nickname ?? '',
    father: r?.father ?? '',
    mother: r?.mother ?? '',
    photo: resolveFile(r?.photo_path ?? ''),
    instagram: r?.instagram ?? '',
  }
}

async function assemble(sb: Sb, inv: Record<string, unknown>): Promise<InvitationData> {
  const id = inv.id as string
  const [couples, events, stories, gallery, gifts, settings] = await Promise.all([
    sb.from('invitation_couples').select('*').eq('invitation_id', id),
    sb.from('invitation_events').select('*').eq('invitation_id', id).order('position'),
    sb.from('invitation_stories').select('*').eq('invitation_id', id),
    sb.from('invitation_gallery').select('*').eq('invitation_id', id).order('position'),
    sb.from('gift_accounts').select('*').eq('invitation_id', id),
    sb.from('invitation_settings').select('*').eq('invitation_id', id).maybeSingle(),
  ])
  for (const r of [couples, events, stories, gallery, gifts, settings]) {
    if (r.error) throw new Error(r.error.message)
  }
  const s = (settings.data ?? {}) as Record<string, unknown>
  return {
    id,
    customer_id: inv.customer_id as string,
    title: (inv.title as string) ?? '',
    slug: (inv.slug as string) ?? '',
    status: inv.status as InvitationStatus,
    theme: inv.theme as InvitationData['theme'],
    published_at: (inv.published_at as string | null) ?? null,
    created_at: inv.created_at as string,
    updated_at: inv.updated_at as string,
    greeting: (inv.greeting as string) ?? '',
    opening_text: (inv.opening_text as string) ?? '',
    closing_text: (inv.closing_text as string) ?? '',
    bride: personOut(couples.data ?? [], 'bride'),
    groom: personOut(couples.data ?? [], 'groom'),
    stories: ((stories.data ?? []) as Record<string, string>[]).map((x) => ({
      id: x.id, title: x.title ?? '', date: dateOut((x.story_date as string) ?? null),
      description: x.description ?? '', image: resolveFile(x.image_path ?? ''),
    })) as StoryItem[],
    events: ((events.data ?? []) as Record<string, string>[]).map((x) => ({
      id: x.id, name: x.name ?? '', date: dateOut((x.event_date as string) ?? null),
      start_time: timeOut((x.start_time as string) ?? null), end_time: timeOut((x.end_time as string) ?? null),
      venue: x.venue ?? '', address: x.address ?? '', maps_url: x.maps_url ?? '',
    })) as EventItem[],
    gallery: ((gallery.data ?? []) as Record<string, string | boolean>[]).map((x) => ({
      id: x.id as string, url: resolveFile((x.image_path as string) ?? ''),
      caption: (x.caption as string) ?? '', is_cover: (x.is_cover as boolean) ?? false,
    })) as GalleryItem[],
    gifts: ((gifts.data ?? []) as Record<string, string>[]).map((x) => ({
      id: x.id, kind: x.kind as GiftAccount['kind'], provider: x.provider ?? '',
      number: x.account_number ?? '', holder: x.account_holder ?? '',
    })) as GiftAccount[],
    settings: {
      sections: { ...defaultSettings().sections, ...((s.sections as Record<SectionKey, boolean>) ?? {}) },
      section_order: (s.section_order as SectionKey[] | null) ?? undefined,
      style: (s.style as InvitationData['settings']['style']) ?? undefined,
      guest_names: (s.guest_names as string) ?? '',
      share_template: (s.share_template as string) ?? '',
      rsvp_deadline: dateOut((s.rsvp_deadline as string) ?? null),
      music_enabled: (s.music_enabled as boolean) ?? false,
      music_url: (s.music_url as string) ?? '',
      seo_title: (s.seo_title as string) ?? '',
      seo_description: (s.seo_description as string) ?? '',
      seo_noindex: (s.seo_noindex as boolean) ?? false,
      show_in_portfolio: (s.show_in_portfolio as boolean) ?? false,
    },
  }
}

function childRows(inv: InvitationData) {
  const id = inv.id
  const couples = [
    { invitation_id: id, role: 'groom', name: inv.groom.name, nickname: inv.groom.nickname, father: inv.groom.father, mother: inv.groom.mother, photo_path: inv.groom.photo, instagram: inv.groom.instagram },
    { invitation_id: id, role: 'bride', name: inv.bride.name, nickname: inv.bride.nickname, father: inv.bride.father, mother: inv.bride.mother, photo_path: inv.bride.photo, instagram: inv.bride.instagram },
  ]
  const events = inv.events.map((e, i) => ({
    invitation_id: id, position: i, name: e.name, event_date: dateIn(e.date),
    start_time: e.start_time || null, end_time: e.end_time || null,
    venue: e.venue, address: e.address, maps_url: e.maps_url,
  }))
  const stories = inv.stories.map((x) => ({
    invitation_id: id, title: x.title, story_date: dateIn(x.date), description: x.description, image_path: x.image,
  }))
  const gallery = inv.gallery.map((g, i) => ({
    invitation_id: id, position: i, image_path: g.url, caption: g.caption, is_cover: g.is_cover,
  }))
  const gifts = inv.gifts.map((g) => ({
    invitation_id: id, kind: g.kind, provider: g.provider, account_number: g.number, account_holder: g.holder,
  }))
  const settings = {
    invitation_id: id,
    sections: inv.settings.sections,
    rsvp_deadline: dateIn(inv.settings.rsvp_deadline),
    music_enabled: inv.settings.music_enabled,
    music_url: inv.settings.music_url,
    seo_title: inv.settings.seo_title,
    seo_description: inv.settings.seo_description,
    seo_noindex: inv.settings.seo_noindex,
    show_in_portfolio: inv.settings.show_in_portfolio,
    style: inv.settings.style ?? {},
    section_order: inv.settings.section_order ?? [],
    guest_names: inv.settings.guest_names ?? '',
    share_template: inv.settings.share_template ?? '',
  }
  return { couples, events, stories, gallery, gifts, settings }
}

async function throwIfFailed(promises: PromiseLike<{ error: unknown }>[]) {
  const results = await Promise.all(promises)
  for (const r of results) {
    const err = r.error as { message?: string } | null
    if (err) throw new Error(err.message ?? 'Database error.')
  }
}

function slugTakenMock(slug: string, exceptId?: string): boolean {
  return db().invitations.some((i) => i.slug === slug && i.id !== exceptId)
}

async function slugTakenSb(sb: Sb, slug: string, exceptId?: string): Promise<boolean> {
  const { data, error } = await sb.from('invitations').select('id').eq('slug', slug).maybeSingle()
  if (error) throw new Error(error.message)
  return !!data && (data as { id: string }).id !== exceptId
}

export const invitationService = {
  async list(): Promise<InvitationData[]> {
    if (useMock) {
      return delay(clone([...db().invitations].sort((a, b) => b.created_at.localeCompare(a.created_at))))
    }
    const sb = requireSupabase()
    const { data, error } = await sb.from('invitations').select('*').order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return Promise.all((data ?? []).map((row) => assemble(sb, row as Record<string, unknown>)))
  },

  /** Invitations of one customer (couple portal). RLS enforces ownership. */
  async listByCustomer(customerId: string): Promise<InvitationData[]> {
    if (useMock) {
      return delay(clone(db().invitations.filter((i) => i.customer_id === customerId).sort((a, b) => b.created_at.localeCompare(a.created_at))))
    }
    const sb = requireSupabase()
    const { data, error } = await sb.from('invitations').select('*').eq('customer_id', customerId).order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return Promise.all((data ?? []).map((row) => assemble(sb, row as Record<string, unknown>)))
  },

  async get(id: string): Promise<InvitationData | null> {
    if (useMock) return delay(clone(db().invitations.find((i) => i.id === id) ?? null))
    const sb = requireSupabase()
    const { data, error } = await sb.from('invitations').select('*').eq('id', id).maybeSingle()
    if (error) throw new Error(error.message)
    return data ? assemble(sb, data as Record<string, unknown>) : null
  },

  /** Public lookup. Returns null when missing or not visible to the caller (RLS). */
  async getBySlug(slug: string): Promise<InvitationData | null> {
    if (useMock) return delay(clone(db().invitations.find((i) => i.slug === slug) ?? null))
    const sb = requireSupabase()
    const { data, error } = await sb.from('invitations').select('*').eq('slug', slug).maybeSingle()
    if (error) throw new Error(error.message)
    return data ? assemble(sb, data as Record<string, unknown>) : null
  },

  async isSlugAvailable(slug: string, exceptId?: string): Promise<boolean> {
    if (useMock) return delay(isValidSlug(slug) && !slugTakenMock(slug, exceptId), 80)
    if (!isValidSlug(slug)) return false
    return !(await slugTakenSb(requireSupabase(), slug, exceptId))
  },

  async create(customerId: string, title: string, theme: InvitationData['theme']): Promise<InvitationData> {
    if (useMock) {
      const inv = createEmptyInvitation(customerId, theme)
      inv.title = title
      let slug = slugify(title) || 'undangan'
      let n = 2
      while (slugTakenMock(slug) || !isValidSlug(slug)) slug = `${slugify(title) || 'undangan'}-${n++}`
      inv.slug = slug
      db().invitations.push(inv)
      commit()
      return delay(clone(inv))
    }
    const sb = requireSupabase()
    const base = slugify(title) || 'undangan'
    let slug = base
    let n = 2
    while (!isValidSlug(slug) || (await slugTakenSb(sb, slug))) slug = `${base}-${n++}`
    const inv = createEmptyInvitation(customerId, theme)
    inv.id = crypto.randomUUID()
    inv.title = title
    inv.slug = slug
    const { couples, events, stories, gallery, gifts, settings } = childRows(inv)
    const { error } = await sb.from('invitations').insert({
      id: inv.id, customer_id: customerId, title, slug, theme,
      greeting: inv.greeting, opening_text: inv.opening_text, closing_text: inv.closing_text,
    })
    if (error) throw new Error(error.message)
    await throwIfFailed([
      sb.from('invitation_couples').insert(couples),
      ...(events.length ? [sb.from('invitation_events').insert(events)] : []),
      ...(stories.length ? [sb.from('invitation_stories').insert(stories)] : []),
      ...(gallery.length ? [sb.from('invitation_gallery').insert(gallery)] : []),
      ...(gifts.length ? [sb.from('gift_accounts').insert(gifts)] : []),
      sb.from('invitation_settings').insert(settings),
    ])
    const saved = await this.get(inv.id)
    if (!saved) throw new Error('Undangan tidak ditemukan.')
    return saved
  },

  async save(next: InvitationData): Promise<InvitationData> {
    if (useMock) {
      const data = db()
      const idx = data.invitations.findIndex((i) => i.id === next.id)
      if (idx < 0) throw new Error('Undangan tidak ditemukan.')
      if (!isValidSlug(next.slug)) throw new Error('Slug tidak valid. Gunakan huruf kecil, angka, dan tanda hubung (minimal 3 karakter).')
      if (slugTakenMock(next.slug, next.id)) throw new Error('Slug sudah dipakai undangan lain.')
      const saved: InvitationData = { ...clone(next), updated_at: new Date().toISOString() }
      data.invitations[idx] = saved
      commit()
      return delay(clone(saved))
    }
    const sb = requireSupabase()
    if (!isValidSlug(next.slug)) throw new Error('Slug tidak valid. Gunakan huruf kecil, angka, dan tanda hubung (minimal 3 karakter).')
    if (await slugTakenSb(sb, next.slug, next.id)) throw new Error('Slug sudah dipakai undangan lain.')
    const { error } = await sb.from('invitations').update({
      title: next.title, slug: next.slug, theme: next.theme,
      greeting: next.greeting, opening_text: next.opening_text, closing_text: next.closing_text,
    }).eq('id', next.id)
    if (error) throw new Error(error.message)
    const { couples, events, stories, gallery, gifts, settings } = childRows(next)
    const tables = ['invitation_couples', 'invitation_events', 'invitation_stories', 'invitation_gallery', 'gift_accounts'] as const
    await throwIfFailed(tables.map((t) => sb.from(t).delete().eq('invitation_id', next.id)))
    await throwIfFailed([
      sb.from('invitation_couples').insert(couples),
      ...(events.length ? [sb.from('invitation_events').insert(events)] : []),
      ...(stories.length ? [sb.from('invitation_stories').insert(stories)] : []),
      ...(gallery.length ? [sb.from('invitation_gallery').insert(gallery)] : []),
      ...(gifts.length ? [sb.from('gift_accounts').insert(gifts)] : []),
      sb.from('invitation_settings').upsert(settings, { onConflict: 'invitation_id' }),
    ])
    const saved = await this.get(next.id)
    if (!saved) throw new Error('Undangan tidak ditemukan.')
    return saved
  },

  async setStatus(id: string, status: InvitationStatus): Promise<InvitationData> {
    if (useMock) {
      const inv = db().invitations.find((i) => i.id === id)
      if (!inv) throw new Error('Undangan tidak ditemukan.')
      inv.status = status
      inv.published_at = status === 'published' ? (inv.published_at ?? new Date().toISOString()) : inv.published_at
      inv.updated_at = new Date().toISOString()
      commit()
      return delay(clone(inv))
    }
    const sb = requireSupabase()
    const patch: Record<string, string | null> = { status }
    if (status === 'published') {
      const current = await this.get(id)
      if (!current) throw new Error('Undangan tidak ditemukan.')
      if (!current.published_at) patch.published_at = new Date().toISOString()
    }
    const { error } = await sb.from('invitations').update(patch).eq('id', id)
    if (error) throw new Error(error.message)
    const saved = await this.get(id)
    if (!saved) throw new Error('Undangan tidak ditemukan.')
    return saved
  },

  async duplicate(id: string): Promise<InvitationData> {
    if (useMock) {
      const src = db().invitations.find((i) => i.id === id)
      if (!src) throw new Error('Undangan tidak ditemukan.')
      const copy = clone(src)
      copy.id = uid('inv')
      copy.title = `${src.title} (salinan)`
      let slug = `${src.slug}-salinan`
      let n = 2
      while (slugTakenMock(slug)) slug = `${src.slug}-salinan-${n++}`
      copy.slug = slug
      copy.status = 'draft'
      copy.published_at = null
      copy.created_at = copy.updated_at = new Date().toISOString()
      db().invitations.push(copy)
      commit()
      return delay(clone(copy))
    }
    const sb = requireSupabase()
    const src = await this.get(id)
    if (!src) throw new Error('Undangan tidak ditemukan.')
    let slug = `${src.slug}-salinan`
    let n = 2
    while (await slugTakenSb(sb, slug)) slug = `${src.slug}-salinan-${n++}`
    const now = new Date().toISOString()
    const copy: InvitationData = {
      ...clone(src), id: crypto.randomUUID(), title: `${src.title} (salinan)`, slug,
      status: 'draft', published_at: null, created_at: now, updated_at: now,
    }
    const { couples, events, stories, gallery, gifts, settings } = childRows(copy)
    const { error } = await sb.from('invitations').insert({
      id: copy.id, customer_id: copy.customer_id, title: copy.title, slug: copy.slug,
      status: 'draft', theme: copy.theme, greeting: copy.greeting,
      opening_text: copy.opening_text, closing_text: copy.closing_text,
    })
    if (error) throw new Error(error.message)
    await throwIfFailed([
      sb.from('invitation_couples').insert(couples),
      ...(events.length ? [sb.from('invitation_events').insert(events)] : []),
      ...(stories.length ? [sb.from('invitation_stories').insert(stories)] : []),
      ...(gallery.length ? [sb.from('invitation_gallery').insert(gallery)] : []),
      ...(gifts.length ? [sb.from('gift_accounts').insert(gifts)] : []),
      sb.from('invitation_settings').insert(settings),
    ])
    const saved = await this.get(copy.id)
    if (!saved) throw new Error('Undangan tidak ditemukan.')
    return saved
  },

  async remove(id: string): Promise<void> {
    if (useMock) {
      const data = db()
      data.invitations = data.invitations.filter((i) => i.id !== id)
      data.rsvps = data.rsvps.filter((r) => r.invitation_id !== id)
      data.messages = data.messages.filter((m) => m.invitation_id !== id)
      data.giftConfirmations = data.giftConfirmations.filter((g) => g.invitation_id !== id)
      data.views = data.views.filter((v) => v.invitation_id !== id)
      commit()
      await delay(null)
      return
    }
    // Storage objects under invitations/{id}/… are cleaned up too (best-effort).
    const { error } = await requireSupabase().from('invitations').delete().eq('id', id)
    if (error) throw new Error(error.message)
    await storageService.removeInvitationFolder(id)
  },
}
