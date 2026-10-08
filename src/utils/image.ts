/**
 * Resize + compress an image file to a JPEG data URL.
 * Mock-mode "upload". The Supabase adapter will upload the Blob to
 * the `invitation-images` bucket and return the public URL instead.
 */
import { copy } from '@/config/copy'

export const MAX_UPLOAD_MB = 8
export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export async function compressImage(file: File, maxSide = 1000, quality = 0.72): Promise<string> {
  if (!ACCEPTED_TYPES.includes(file.type)) throw new Error(copy.builder.gallery.badType)
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) throw new Error(copy.builder.gallery.tooBig.replace('{max}', String(MAX_UPLOAD_MB)))

  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error(copy.builder.gallery.noCanvas)
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return canvas.toDataURL('image/jpeg', quality)
}
