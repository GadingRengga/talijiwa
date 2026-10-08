<script setup lang="ts">
import { computed } from 'vue'
import { getTheme, themeStyle } from '@/themes'
import { placeholderImage } from '@/utils/invitation'
import InvitationCover from './InvitationCover.vue'

/** Cover-only banner of a theme, looping its opening animation. Used in the company profile, theme picker and /embed/banner/:theme. */
const props = withDefaults(defineProps<{ theme: string; couple?: string; date?: string; image?: string; active?: boolean }>(), {
  active: true,
  couple: 'Raka & Sinta',
  date: '20 Desember 2026',
  image: '',
})
const t = computed(() => getTheme(props.theme))
const src = computed(() => props.image || placeholderImage(props.couple, t.value.swatches[3], t.value.swatches[2]))
</script>

<template>
  <div class="inv h-full overflow-hidden [&_.inv-cover]:!min-h-0 [&_.inv-cover]:h-full" :style="themeStyle(theme)">
    <InvitationCover :couple="couple" :date="date" guest="Nama Tamu" :image="src" :decor="t.decor" :intro="t.intro ?? 'slide'" mode="static" loop :active="active" />
  </div>
</template>
