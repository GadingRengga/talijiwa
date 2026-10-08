<script setup lang="ts">
import { ChevronDown, Trash2 } from 'lucide-vue-next'
import { ref } from 'vue'
import FormField from '@/components/ui/FormField.vue'
import ImageUploader from './ImageUploader.vue'
import { copy } from '@/config/copy'
import type { StoryItem } from '@/types'

const item = defineModel<StoryItem>({ required: true })
defineProps<{ invitationId?: string }>()
const emit = defineEmits<{ remove: [] }>()
const open = ref(true)
</script>

<template>
  <article class="card space-y-4 p-4">
    <header class="flex items-center justify-between gap-2">
      <button type="button" class="flex min-w-0 flex-1 items-center gap-1.5 rounded py-1 text-left" :aria-expanded="open" @click="open = !open">
        <ChevronDown class="size-4 shrink-0 text-muted transition-transform" :class="open ? '' : '-rotate-90'" aria-hidden="true" />
        <span class="min-w-0">
          <span class="block truncate text-sm font-semibold">{{ item.title || copy.builder.story.untitled }}</span>
          <span v-if="!open && item.date" class="block truncate text-xs text-muted">{{ item.date }}</span>
        </span>
      </button>
      <button type="button" class="shrink-0 rounded p-2 text-danger hover:bg-danger-soft" :aria-label="copy.builder.story.remove" @click="emit('remove')"><Trash2 class="size-4" /></button>
    </header>
    <template v-if="open">
    <div class="grid gap-4 sm:grid-cols-[1fr_11rem]">
      <FormField :label="copy.builder.story.title" v-slot="{ id }"><input :id="id" v-model="item.title" class="field-input" :placeholder="copy.builder.story.titlePh" /></FormField>
      <FormField :label="copy.builder.story.date" v-slot="{ id }"><input :id="id" v-model="item.date" type="date" class="field-input" /></FormField>
    </div>
    <FormField :label="copy.builder.story.story" v-slot="{ id }"><textarea :id="id" v-model="item.description" rows="3" class="field-input" /></FormField>
    <div class="max-w-[12rem]"><ImageUploader v-model="item.image" :label="copy.builder.story.photoOpt" aspect="wide" :invitation-id="invitationId" storage-kind="gallery" /></div>
    </template>
  </article>
</template>
