<script setup lang="ts">
import { computed } from 'vue'
import { company } from '@/config/company'
import { companyImage } from '@/config/companyImages'

const props = withDefaults(
  defineProps<{
    /** Kunci slot di COMPANY_IMAGES (atau alias). */
    slot: string
    /** Prioritaskan pemuatan (hanya hero). */
    eager?: boolean
    /** Kelas bentuk bingkai, mis. 'rounded-3xl' atau lengkung undangan. */
    frameClass?: string
  }>(),
  { eager: false, frameClass: 'rounded-3xl' },
)

const meta = computed(() => companyImage(props.slot))
</script>

<template>
  <figure class="m-0 overflow-hidden" :class="frameClass">
    <img
      v-if="meta?.src"
      :src="meta.src"
      :alt="meta.alt"
      :width="meta.width"
      :height="meta.height"
      :loading="eager ? 'eager' : 'lazy'"
      :fetchpriority="eager ? 'high' : 'auto'"
      decoding="async"
      class="h-full w-full object-cover"
    />
    <!-- Fallback elegan bila file foto belum ditaruh (tanpa gambar rusak). -->
    <div
      v-else
      role="img"
      :aria-label="meta?.alt ?? company.company_name"
      class="relative grid h-full min-h-48 w-full place-items-center"
      style="background: radial-gradient(circle at 30% 20%, #fbf6ec 0%, #f1e4cd 45%, #dcc19a 100%)"
    >
      <span aria-hidden="true" class="pointer-events-none absolute inset-3 rounded-[inherit] border border-[#b99a5b]/50"></span>
      <span aria-hidden="true" class="font-display text-4xl text-[#8a6d3f]/70">T</span>
    </div>
  </figure>
</template>
