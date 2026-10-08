<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import BuilderSection from './BuilderSection.vue'
import AppButton from '@/components/ui/AppButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import StoryEditor from '@/components/admin/StoryEditor.vue'
import { copy } from '@/config/copy'
import { storageService } from '@/services/storage'
import type { InvitationData } from '@/types'
import { uid } from '@/utils/format'

const inv = defineModel<InvitationData>({ required: true })

function add(title = '') {
  inv.value.stories.push({ id: uid('st'), title, date: '', description: '', image: '' })
}
function remove(id: string) {
  const gone = inv.value.stories.find((s) => s.id === id)
  inv.value.stories = inv.value.stories.filter((s) => s.id !== id)
  if (gone?.image) void storageService.removeUrl(gone.image)
}
const presets = ['Pertemuan Pertama', 'Lamaran', 'Hari Pernikahan']
</script>

<template>
  <BuilderSection :title="copy.builder.sections.story" description="Tampil sebagai timeline, diurutkan otomatis berdasarkan tanggal.">
    <EmptyState v-if="!inv.stories.length" :message="copy.empty.stories" />
    <div v-else class="space-y-3">
      <StoryEditor v-for="(s, i) in inv.stories" :key="s.id" v-model="inv.stories[i]" :invitation-id="inv.id" @remove="remove(s.id)" />
    </div>
    <div class="flex flex-wrap gap-2">
      <AppButton variant="secondary" size="sm" @click="add()"><Plus class="size-4" /> Tambah kisah</AppButton>
      <AppButton v-for="p in presets" :key="p" variant="ghost" size="sm" @click="add(p)">+ {{ p }}</AppButton>
    </div>
  </BuilderSection>
</template>
