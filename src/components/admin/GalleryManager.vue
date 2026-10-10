<script setup lang="ts">
import { ArrowLeft, ArrowRight, Crop, ImagePlus, Loader2, Star, Trash2 } from 'lucide-vue-next'
import { ref } from 'vue'
import { copy } from '@/config/copy'
import type { GalleryItem } from '@/types'
import { uid } from '@/utils/format'
import { ACCEPTED_TYPES, compressImage } from '@/utils/image'
import { storageService } from '@/services/storage'
import { useMock } from '@/services/supabase/client'
import ImageCropper from './ImageCropper.vue'
import EmptyState from '@/components/ui/EmptyState.vue'

const props = withDefaults(defineProps<{ invitationId?: string }>(), { invitationId: '' })

const MAX_PHOTOS = 24
const items = defineModel<GalleryItem[]>({ required: true })

const cropId = ref<string | null>(null)
const cropItem = () => items.value.find((g) => g.id === cropId.value)
const busy = ref(false)
const error = ref('')
const dragIndex = ref<number | null>(null)
const overIndex = ref<number | null>(null)
const input = ref<HTMLInputElement | null>(null)

async function addFiles(files: FileList | null) {
  if (!files?.length) return
  error.value = ''
  busy.value = true
  const room = MAX_PHOTOS - items.value.length
  if (files.length > room) error.value = copy.builder.gallery.tooMany.replace('{max}', String(MAX_PHOTOS))
  for (const file of Array.from(files).slice(0, Math.max(room, 0))) {
    try {
      const url = useMock
        ? await compressImage(file)
        : await storageService.uploadImage(props.invitationId, 'gallery', file)
      items.value.push({ id: uid('gl'), url, caption: '', is_cover: items.value.length === 0 })
    } catch (e) {
      error.value = e instanceof Error ? e.message : copy.builder.gallery.failed
    }
  }
  busy.value = false
  if (input.value) input.value.value = ''
}

function move(from: number, to: number) {
  if (to < 0 || to >= items.value.length || from === to) return
  const next = [...items.value]
  const [it] = next.splice(from, 1)
  next.splice(to, 0, it)
  items.value = next
}
function setCover(id: string) {
  items.value = items.value.map((g) => ({ ...g, is_cover: g.id === id }))
}
function remove(id: string) {
  const gone = items.value.find((g) => g.id === id)
  const wasCover = gone?.is_cover
  items.value = items.value.filter((g) => g.id !== id)
  if (wasCover && items.value[0]) items.value[0].is_cover = true
  if (gone) void storageService.removeUrl(gone.url)
}
async function onCropped(url: string) {
  const item = cropItem()
  const old = item?.url ?? ''
  cropId.value = null
  if (!item) return
  busy.value = true
  try {
    item.url = useMock ? url : await storageService.uploadImage(props.invitationId, 'gallery', url)
    if (old && item.url !== old) void storageService.removeUrl(old)
  } catch (e) {
    error.value = e instanceof Error ? e.message : copy.builder.gallery.uploadFailed
  } finally {
    busy.value = false
  }
}
function onDrop(to: number) {
  if (dragIndex.value !== null) move(dragIndex.value, to)
  dragIndex.value = overIndex.value = null
}
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between gap-3">
      <p class="text-xs text-muted">{{ items.length }}/{{ MAX_PHOTOS }} {{ copy.builder.gallery.counter }}</p>
      <label class="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-panel px-3 py-1.5 text-[13px] font-medium hover:bg-paper">
        <Loader2 v-if="busy" class="size-4 animate-spin" />
        <ImagePlus v-else class="size-4" />
        {{ copy.builder.gallery.upload }}
        <input ref="input" type="file" multiple class="sr-only" :accept="ACCEPTED_TYPES.join(',')" :disabled="busy" @change="addFiles(($event.target as HTMLInputElement).files)" />
      </label>
    </div>
    <p v-if="error" class="text-xs text-danger" role="alert">{{ error }}</p>

    <EmptyState v-if="!items.length" :message="copy.empty.gallery" />
    <ul v-else class="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <li
        v-for="(g, i) in items"
        :key="g.id"
        draggable="true"
        class="group relative overflow-hidden rounded-xl border bg-panel"
        :class="overIndex === i && dragIndex !== i ? 'border-brand ring-2 ring-brand/30' : 'border-line'"
        @dragstart="dragIndex = i"
        @dragover.prevent="overIndex = i"
        @dragend="dragIndex = overIndex = null"
        @drop.prevent="onDrop(i)"
      >
        <img :src="g.url" :alt="g.caption || `${copy.builder.gallery.photoAlt} ${i + 1}`" class="aspect-[4/5] w-full object-cover" draggable="false" />
        <span v-if="g.is_cover" class="absolute left-2 top-2 rounded-full bg-brand px-2 py-0.5 text-[11px] font-medium text-white">{{ copy.builder.gallery.cover }}</span>
        <div class="flex items-center justify-between gap-1 p-1.5">
          <div class="flex">
            <button type="button" class="min-h-11 min-w-11 rounded p-2 text-muted hover:bg-black/5 disabled:opacity-30" :disabled="i === 0" :aria-label="copy.builder.gallery.moveLeft" @click="move(i, i - 1)"><ArrowLeft class="size-3.5" /></button>
            <button type="button" class="min-h-11 min-w-11 rounded p-2 text-muted hover:bg-black/5 disabled:opacity-30" :disabled="i === items.length - 1" :aria-label="copy.builder.gallery.moveRight" @click="move(i, i + 1)"><ArrowRight class="size-3.5" /></button>
          </div>
          <div class="flex">
            <button type="button" class="min-h-11 min-w-11 rounded p-2 text-muted hover:bg-black/5" :aria-label="copy.builder.gallery.crop" @click="cropId = g.id"><Crop class="size-3.5" /></button>
            <button type="button" class="min-h-11 min-w-11 rounded p-2 hover:bg-black/5" :class="g.is_cover ? 'text-brand' : 'text-muted'" :aria-pressed="g.is_cover" :aria-label="copy.builder.gallery.setCover" @click="setCover(g.id)"><Star class="size-3.5" :fill="g.is_cover ? 'currentColor' : 'none'" /></button>
            <button type="button" class="min-h-11 min-w-11 rounded p-2 text-danger hover:bg-danger-soft" :aria-label="copy.builder.gallery.removePhoto" @click="remove(g.id)"><Trash2 class="size-3.5" /></button>
          </div>
        </div>
      </li>
    </ul>
  <ImageCropper v-if="cropItem()" :src="cropItem()!.url" :aspect="0.8" @done="onCropped" @cancel="cropId = null" />
  </div>
</template>
