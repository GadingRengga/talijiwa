import { compressImage } from '@/utils/image'
import { requireSupabase, useMock } from '../supabase/client'

const BUCKET = 'invitation-images'
export type StorageKind = 'cover' | 'couple' | 'gallery'

export function isStorageUrl(url: string): boolean {
  return url.includes(`${BUCKET}/invitations/`)
}

function pathFromUrl(url: string): string | null {
  const m = url.match(new RegExp(`${BUCKET}/([^?]+)`))
  return m?.[1] ?? null
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  return (await fetch(dataUrl)).blob()
}

export const storageService = {
  /**
   * Compress (if given a File) and upload to
   * invitations/{invitationId}/{kind}/<uuid>.jpg. Returns the public URL.
   * In mock mode returns the compressed data URL (localStorage).
   */
  async uploadImage(invitationId: string, kind: StorageKind, source: File | string, maxSide = 1000, quality = 0.72): Promise<string> {
    const dataUrl = typeof source === 'string' ? source : await compressImage(source, maxSide, quality)
    if (useMock || !invitationId) return dataUrl
    const sb = requireSupabase()
    const blob = await dataUrlToBlob(dataUrl)
    const path = `invitations/${invitationId}/${kind}/${crypto.randomUUID()}.jpg`
    const { error } = await sb.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg', upsert: false })
    if (error) throw new Error(error.message)
    return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
  },
  /** Delete the storage object behind a public URL. Best-effort, never throws. */
  async removeUrl(url: string): Promise<void> {
    try {
      const path = url ? pathFromUrl(url) : null
      if (!path || useMock) return
      await requireSupabase().storage.from(BUCKET).remove([path])
    } catch {
      /* stale URL or already deleted: ignore */
    }
  },
  /** Delete everything under invitations/{id}/. Best-effort, never throws. */
  async removeInvitationFolder(invitationId: string): Promise<void> {
    if (useMock || !invitationId) return
    try {
      const sb = requireSupabase()
      const paths: string[] = []
      for (const kind of ['cover', 'couple', 'gallery'] as const) {
        const { data } = await sb.storage.from(BUCKET).list(`invitations/${invitationId}/${kind}`)
        for (const f of data ?? []) paths.push(`invitations/${invitationId}/${kind}/${f.name}`)
      }
      if (paths.length) await sb.storage.from(BUCKET).remove(paths)
    } catch {
      /* bucket empty or unreachable: ignore */
    }
  },
}
