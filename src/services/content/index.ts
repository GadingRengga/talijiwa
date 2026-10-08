import type { Faq, Testimonial } from '@/types'
import { uid } from '@/utils/format'
import { commit, clone, db, delay } from '../mock/db'
import { requireSupabase, useMock } from '../supabase/client'

const byPosition = <T extends { position: number }>(rows: T[]) => [...rows].sort((a, b) => a.position - b.position)

export const contentService = {
  async settings(): Promise<Record<string, string>> {
    if (useMock) return delay(clone(db().siteSettings))
    const { data, error } = await requireSupabase().from('site_settings').select('*')
    if (error) throw new Error(error.message)
    return Object.fromEntries(((data ?? []) as { key: string; value: string }[]).map((r) => [r.key, r.value]))
  },
  async saveSetting(key: string, value: string): Promise<void> {
    if (useMock) {
      db().siteSettings[key] = value
      commit()
      await delay(null)
      return
    }
    const { error } = await requireSupabase().from('site_settings').upsert({ key, value }, { onConflict: 'key' })
    if (error) throw new Error(error.message)
  },
  async testimonials(admin: boolean): Promise<Testimonial[]> {
    if (useMock) {
      const rows = db().testimonials.filter((t) => admin || t.is_visible)
      return delay(clone(byPosition(rows)))
    }
    let q = requireSupabase().from('testimonials').select('*')
    if (!admin) q = q.eq('is_visible', true)
    const { data, error } = await q.order('position')
    if (error) throw new Error(error.message)
    return ((data ?? []) as Testimonial[]).map((t) => ({ ...t, rating: Number(t.rating ?? 5) }))
  },
  async saveTestimonial(input: Pick<Testimonial, 'name' | 'message' | 'rating' | 'is_visible' | 'position'>, id?: string): Promise<Testimonial> {
    if (useMock) {
      const data = db()
      if (id) {
        const t = data.testimonials.find((x) => x.id === id)
        if (!t) throw new Error('Testimoni tidak ditemukan.')
        Object.assign(t, input)
        commit()
        return delay(clone(t))
      }
      const row: Testimonial = { id: uid('tm'), created_at: new Date().toISOString(), ...input }
      data.testimonials.push(row)
      commit()
      return delay(clone(row))
    }
    const sb = requireSupabase()
    if (id) {
      const { data, error } = await sb.from('testimonials').update(input).eq('id', id).select('*').single()
      if (error) throw new Error(error.message)
      return data as Testimonial
    }
    const { data, error } = await sb.from('testimonials').insert(input).select('*').single()
    if (error) throw new Error(error.message)
    return data as Testimonial
  },
  async removeTestimonial(id: string): Promise<void> {
    if (useMock) {
      const data = db()
      data.testimonials = data.testimonials.filter((t) => t.id !== id)
      commit()
      await delay(null)
      return
    }
    const { error } = await requireSupabase().from('testimonials').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },
  async faqs(admin: boolean): Promise<Faq[]> {
    if (useMock) {
      const rows = db().faqs.filter((f) => admin || f.is_visible)
      return delay(clone(byPosition(rows)))
    }
    let q = requireSupabase().from('faqs').select('*')
    if (!admin) q = q.eq('is_visible', true)
    const { data, error } = await q.order('position')
    if (error) throw new Error(error.message)
    return (data ?? []) as Faq[]
  },
  async saveFaq(input: Pick<Faq, 'question' | 'answer' | 'is_visible' | 'position'>, id?: string): Promise<Faq> {
    if (useMock) {
      const data = db()
      if (id) {
        const f = data.faqs.find((x) => x.id === id)
        if (!f) throw new Error('FAQ tidak ditemukan.')
        Object.assign(f, input)
        commit()
        return delay(clone(f))
      }
      const row: Faq = { id: uid('fq'), ...input }
      data.faqs.push(row)
      commit()
      return delay(clone(row))
    }
    const sb = requireSupabase()
    if (id) {
      const { data, error } = await sb.from('faqs').update(input).eq('id', id).select('*').single()
      if (error) throw new Error(error.message)
      return data as Faq
    }
    const { data, error } = await sb.from('faqs').insert(input).select('*').single()
    if (error) throw new Error(error.message)
    return data as Faq
  },
  async removeFaq(id: string): Promise<void> {
    if (useMock) {
      const data = db()
      data.faqs = data.faqs.filter((f) => f.id !== id)
      commit()
      await delay(null)
      return
    }
    const { error } = await requireSupabase().from('faqs').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },
}
