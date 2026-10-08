<script setup lang="ts">
import { ArrowDown, ArrowUp, ChevronDown, Trash2 } from 'lucide-vue-next'
import { ref } from 'vue'
import FormField from '@/components/ui/FormField.vue'
import { copy } from '@/config/copy'
import type { EventItem } from '@/types'

const item = defineModel<EventItem>({ required: true })
defineProps<{ index: number; first: boolean; last: boolean }>()
const emit = defineEmits<{ remove: []; up: []; down: [] }>()
const open = ref(true)
</script>

<template>
  <article class="card space-y-4 p-4">
    <header class="flex items-center justify-between gap-2">
      <button type="button" class="flex min-w-0 flex-1 items-center gap-1.5 rounded py-1 text-left" :aria-expanded="open" @click="open = !open">
        <ChevronDown class="size-4 shrink-0 text-muted transition-transform" :class="open ? '' : '-rotate-90'" aria-hidden="true" />
        <span class="min-w-0">
          <span class="block truncate text-sm font-semibold">{{ item.name || `${copy.builder.events.untitled} ${index + 1}` }}</span>
          <span v-if="!open && (item.date || item.venue)" class="block truncate text-xs text-muted">{{ [item.date, item.venue].filter(Boolean).join(' · ') }}</span>
        </span>
      </button>
      <div class="flex shrink-0">
        <button type="button" class="rounded p-2 text-muted hover:bg-black/5 disabled:opacity-30" :disabled="first" :aria-label="copy.builder.events.moveUp" @click="emit('up')"><ArrowUp class="size-4" /></button>
        <button type="button" class="rounded p-2 text-muted hover:bg-black/5 disabled:opacity-30" :disabled="last" :aria-label="copy.builder.events.moveDown" @click="emit('down')"><ArrowDown class="size-4" /></button>
        <button type="button" class="rounded p-2 text-danger hover:bg-danger-soft" :aria-label="copy.builder.events.remove" @click="emit('remove')"><Trash2 class="size-4" /></button>
      </div>
    </header>
    <template v-if="open">
    <div class="grid gap-4 sm:grid-cols-2">
      <FormField :label="copy.builder.events.name" v-slot="{ id }"><input :id="id" v-model="item.name" class="field-input" :placeholder="copy.builder.events.akad" /></FormField>
      <FormField :label="copy.builder.events.date" v-slot="{ id }"><input :id="id" v-model="item.date" type="date" class="field-input" /></FormField>
      <FormField :label="copy.builder.events.start" v-slot="{ id }"><input :id="id" v-model="item.start_time" type="time" class="field-input" /></FormField>
      <FormField :label="copy.builder.events.end" optional v-slot="{ id }"><input :id="id" v-model="item.end_time" type="time" class="field-input" /></FormField>
    </div>
    <FormField :label="copy.builder.events.venue" v-slot="{ id }"><input :id="id" v-model="item.venue" class="field-input" :placeholder="copy.builder.events.venuePh" /></FormField>
    <FormField :label="copy.builder.events.address" v-slot="{ id }"><textarea :id="id" v-model="item.address" rows="2" class="field-input" /></FormField>
    <FormField :label="copy.builder.events.maps" optional :hint="copy.builder.events.mapsHint" v-slot="{ id }">
      <input :id="id" v-model="item.maps_url" type="url" inputmode="url" class="field-input" placeholder="https://maps.google.com/…" />
    </FormField>
    </template>
  </article>
</template>
