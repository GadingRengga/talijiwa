<script setup lang="ts">
import { Monitor, MousePointerClick, Smartphone, Tablet } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { copy } from '@/config/copy'
import type { GuestMessage } from '@/types'
import PublicInvitation from '@/pages/invitation/PublicInvitation.vue'

/**
 * Staging preview (uji tayang): the invitation exactly as guests will see it,
 * framed per device. Frame fills the available height; aspect ratio preserved.
 * Uji mode passes interactive=true so Gate3D / forms run the same flow as launch.
 */
const route = useRoute()
type Device = 'web' | 'tablet' | 'mobile'
const device = ref<Device>('mobile')
const interactive = ref(false)

const devices: { id: Device; label: string; icon: typeof Monitor }[] = [
  { id: 'web', label: 'Web', icon: Monitor },
  { id: 'tablet', label: 'Tablet', icon: Tablet },
  { id: 'mobile', label: 'Mobile', icon: Smartphone },
]

const sampleMessages = computed<GuestMessage[]>(() =>
  interactive.value
    ? copy.builder.edit.sampleWishes.map((w, i) => ({
        id: `sample-${i}`,
        invitation_id: String(route.params.id),
        name: w.name,
        message: w.message,
        is_visible: true,
        created_at: new Date().toISOString(),
      }))
    : [],
)

// Frame sizing: fills available height, aspect-ratio keeps device proportions.
// Web mode: full width, no frame decoration.
const frameWrapClass = computed(() => {
  if (device.value === 'web') return 'w-full h-full'
  return 'h-full flex items-center justify-center'
})

const frameClass = computed(() => {
  if (device.value === 'web')
    return 'w-full h-full overflow-hidden rounded-2xl border border-line shadow-2xl'
  if (device.value === 'tablet')
    return 'h-full max-h-full overflow-hidden rounded-[1.5rem] border-[10px] border-ink shadow-2xl'
  return 'h-full max-h-full overflow-hidden rounded-[2.5rem] border-[10px] border-ink shadow-2xl'
})

const frameStyle = computed(() => {
  if (device.value === 'web') return {}
  const ratio = device.value === 'tablet' ? 768 / 1024 : 390 / 844
  return { aspectRatio: String(ratio), width: 'auto' }
})
</script>

<template>
  <div class="flex h-[calc(100dvh-4rem)] flex-col overflow-hidden">
    <!-- Controls bar -->
    <div class="flex shrink-0 flex-wrap items-center justify-center gap-3 px-4 py-3">
      <div class="inline-flex items-center gap-1 rounded-xl border border-line bg-panel p-1 shadow-sm" role="radiogroup" aria-label="Perangkat pratinjau">
        <button
          v-for="d in devices"
          :key="d.id"
          type="button"
          role="radio"
          :aria-checked="device === d.id"
          class="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-all"
          :class="device === d.id ? 'bg-ink text-white shadow-sm' : 'text-muted hover:text-ink'"
          @click="device = d.id"
        >
          <component :is="d.icon" class="size-4" aria-hidden="true" /> {{ d.label }}
        </button>
      </div>
      <button
        type="button"
        :aria-pressed="interactive"
        :title="copy.builder.edit.tryHint"
        class="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-line bg-panel px-3 py-1.5 text-[13px] font-semibold shadow-sm transition-all"
        :class="interactive ? 'bg-brand !border-brand text-white' : 'text-muted hover:text-ink'"
        @click="interactive = !interactive"
      >
        <MousePointerClick class="size-4" aria-hidden="true" /> {{ copy.builder.edit.try }}
      </button>
    </div>

    <!-- Stage: fills remaining height, frame sized by aspect-ratio -->
    <div class="min-h-0 flex-1 overflow-hidden px-4 pb-4">
      <div :class="frameWrapClass" class="h-full">
        <div :class="frameClass" :style="frameStyle">
          <PublicInvitation
            :preview-id="String(route.params.id)"
            :interactive="interactive"
            :sample-messages="sampleMessages"
            hide-bar
          />
        </div>
      </div>
    </div>
  </div>
</template>
