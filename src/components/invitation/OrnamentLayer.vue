<script setup lang="ts">
import { computed } from 'vue'
import type { OrnamentKind } from '@/types'
import { ORNAMENT_COMPONENTS } from './ornaments/types'

const props = defineProps<{ kind: OrnamentKind }>()

/** Dedicated ornament component per theme (registered in ornaments/types). */
const detailedComponent = computed(() => ORNAMENT_COMPONENTS[props.kind] ?? null)
</script>

<template>
  <div class="orn" aria-hidden="true">
    <component v-if="detailedComponent" :is="detailedComponent" />
  </div>
</template>
