<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import BuilderSection from './BuilderSection.vue'
import AppButton from '@/components/ui/AppButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import EventEditor from '@/components/admin/EventEditor.vue'
import { copy } from '@/config/copy'
import type { InvitationData } from '@/types'
import { uid } from '@/utils/format'

const inv = defineModel<InvitationData>({ required: true })

function add(name = '') {
  // New events inherit the previous event's date/place to save typing.
  const prev = inv.value.events[inv.value.events.length - 1]
  inv.value.events.push({
    id: uid('ev'),
    name,
    date: prev?.date ?? '',
    start_time: '',
    end_time: '',
    venue: prev?.venue ?? '',
    address: prev?.address ?? '',
    maps_url: prev?.maps_url ?? '',
  })
}
function remove(id: string) {
  inv.value.events = inv.value.events.filter((e) => e.id !== id)
}
function move(from: number, to: number) {
  const list = [...inv.value.events]
  if (to < 0 || to >= list.length) return
  const [it] = list.splice(from, 1)
  list.splice(to, 0, it)
  inv.value.events = list
}
</script>

<template>
  <BuilderSection :title="copy.builder.sections.events" description="Tanggal acara paling awal dipakai untuk hitung mundur.">
    <EmptyState v-if="!inv.events.length" :message="copy.empty.events" />
    <div v-else class="space-y-3">
      <EventEditor
        v-for="(e, i) in inv.events"
        :key="e.id"
        v-model="inv.events[i]"
        :index="i"
        :first="i === 0"
        :last="i === inv.events.length - 1"
        @remove="remove(e.id)"
        @up="move(i, i - 1)"
        @down="move(i, i + 1)"
      />
    </div>
    <div class="flex flex-wrap gap-2">
      <AppButton variant="secondary" size="sm" @click="add('Akad Nikah')"><Plus class="size-4" /> Akad Nikah</AppButton>
      <AppButton variant="secondary" size="sm" @click="add('Resepsi')"><Plus class="size-4" /> Resepsi</AppButton>
      <AppButton variant="ghost" size="sm" @click="add()"><Plus class="size-4" /> Acara lain</AppButton>
    </div>
  </BuilderSection>
</template>
