<script setup lang="ts">
import { Crop, ImagePlus, Loader2, Trash2 } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { copy } from '@/config/copy'
import { ACCEPTED_TYPES, compressImage } from '@/utils/image'
import { storageService } from '@/services/storage'
import ImageCropper from './ImageCropper.vue'

const props = withDefaults(
  defineProps<{ label: string; aspect?: 'square' | 'portrait' | 'wide'; invitationId?: string; storageKind?: 'couple' | 'gallery' }>(),
  { aspect: 'portrait', invitationId: '', storageKind: 'couple' },
)
const model = defineModel<string>({ required: true })

const ASPECT = { square: 1, portrait: 4 / 5, wide: 16 / 9 }
const cropSrc = ref('')
const busy = ref(false)
const error = ref('')
const dragging = ref(false)
const input = ref<HTMLInputElement | null>(null)
const ratio = computed(() => ({ square: 'aspect-square', portrait: 'aspect-[4/5]', wide: 'aspect-video' })[props.aspect])

async function handle(file: File | undefined) {
  if (!file) return
  error.value = ''
  busy.value = true
  try {
    cropSrc.value = await compressImage(file, 1600, 0.88) // crop first, then store
  } catch (e) {
    error.value = e instanceof Error ? e.message : copy.builder.gallery.failed
  } finally {
    busy.value = false
    if (input.value) input.value.value = ''
  }
}

async function onCropped(dataUrl: string) {
  const old = model.value
  busy.value = true
  try {
    model.value = await storageService.uploadImage(props.invitationId, props.storageKind, dataUrl)
    if (old) void storageService.removeUrl(old)
  } catch (e) {
    error.value = e instanceof Error ? e.message : copy.builder.gallery.uploadFailed
  } finally {
    busy.value = false
    cropSrc.value = ''
  }
}

function clear() {
  const old = model.value
  model.value = ''
  if (old) void storageService.removeUrl(old)
}
</script>

<template>
  <div class="space-y-1.5">
    <p class="text-[13px] font-medium">{{ label }}</p>
    <div
      class="group relative overflow-hidden rounded-xl border border-dashed bg-paper transition-colors"
      :class="[ratio, dragging ? 'border-brand bg-brand-soft' : 'border-line']"
      @dragover.prevent="dragging = true"
      @dragleave="dragging = false"
      @drop.prevent="(dragging = false), handle($event.dataTransfer?.files?.[0])"
    >
      <img v-if="model" :src="model" :alt="label" class="size-full object-cover" />
      <label v-else class="flex size-full cursor-pointer flex-col items-center justify-center gap-1.5 p-3 text-center text-xs text-muted">
        <ImagePlus class="size-6" aria-hidden="true" />
        {{ copy.builder.gallery.dropHint }}
        <input ref="input" type="file" class="sr-only" :accept="ACCEPTED_TYPES.join(',')" @change="handle(($event.target as HTMLInputElement).files?.[0])" />
      </label>
      <div v-if="busy" class="absolute inset-0 grid place-items-center bg-white/70"><Loader2 class="size-5 animate-spin text-brand" /></div>
      <button v-if="model && !busy" type="button" class="absolute right-11 top-2 rounded-lg bg-white/90 p-1.5 text-ink shadow hover:bg-white" :aria-label="`${copy.builder.gallery.recrop} ${label}`" @click="cropSrc = model"><Crop class="size-4" /></button>
      <button
        v-if="model && !busy"
        type="button"
        class="absolute right-2 top-2 rounded-lg bg-white/90 p-1.5 text-danger shadow hover:bg-white"
        :aria-label="`${copy.builder.gallery.removeImage} ${label}`"
        @click="clear"
      >
        <Trash2 class="size-4" />
      </button>
    </div>
    <ImageCropper v-if="cropSrc" :src="cropSrc" :aspect="ASPECT[aspect]" :out-width="aspect === 'wide' ? 1200 : 900" @done="onCropped" @cancel="cropSrc = ''" />
    <p v-if="error" class="text-xs text-danger" role="alert">{{ error }}</p>
  </div>
</template>
