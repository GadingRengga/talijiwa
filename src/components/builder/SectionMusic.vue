<script setup lang="ts">
import BuilderSection from './BuilderSection.vue'
import FormField from '@/components/ui/FormField.vue'
import ToggleSwitch from '@/components/ui/ToggleSwitch.vue'
import { copy } from '@/config/copy'
import type { InvitationData } from '@/types'
import { computed, ref, watch } from 'vue'

const inv = defineModel<InvitationData>({ required: true })
// Google Drive share links are not playable as-is: convert to a direct-download URL.
function normalize(u: string): string {
  const m = /drive\.google\.com\/file\/d\/([\w-]+)/.exec(u) ?? /drive\.google\.com\/open\?id=([\w-]+)/.exec(u)
  return m ? `https://drive.google.com/uc?export=download&id=${m[1]}` : u.trim()
}
function onUrl(e: Event) {
  const raw = (e.target as HTMLInputElement).value
  inv.value.settings.music_url = normalize(raw)
}
const playError = ref(false)
watch(() => inv.value.settings.music_url, () => (playError.value = false))
const urlError = computed(() => {
  const u = inv.value.settings.music_url.trim()
  if (!u) return ''
  return /^https:\/\/.+/i.test(u) ? '' : copy.builder.music.urlInvalid
})
</script>

<template>
  <BuilderSection :title="copy.builder.sections.music" :description="copy.builder.music.desc">
    <div class="card px-4">
      <ToggleSwitch v-model="inv.settings.music_enabled" :label="copy.builder.music.enable" />
    </div>
    <FormField :label="copy.builder.music.url" :error="urlError" :hint="copy.builder.music.urlHint" v-slot="{ id, invalid }">
      <input :id="id" type="url" :value="inv.settings.music_url" @change="onUrl" inputmode="url" class="field-input" placeholder="https://…/lagu.mp3" :aria-invalid="invalid" :disabled="!inv.settings.music_enabled" />
    </FormField>
    <audio v-if="inv.settings.music_enabled && inv.settings.music_url && !urlError" :src="inv.settings.music_url" controls preload="none" class="w-full" @error="playError = true" />
    <p v-if="playError" class="text-xs text-danger" role="alert">{{ copy.builder.music.badUrl }}</p>
  </BuilderSection>
</template>
