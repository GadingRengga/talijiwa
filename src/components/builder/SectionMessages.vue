<script setup lang="ts">
import BuilderSection from './BuilderSection.vue'
import ToggleSwitch from '@/components/ui/ToggleSwitch.vue'
import { copy } from '@/config/copy'
import type { InvitationData } from '@/types'

const inv = defineModel<InvitationData>({ required: true })
</script>

<template>
  <BuilderSection :title="copy.builder.sections.messages" description="Ucapan tamu tampil di undangan. Anda bisa menyembunyikan atau menghapusnya kapan saja.">
    <div class="card px-4">
      <ToggleSwitch v-model="inv.settings.sections.messages" label="Tampilkan ucapan & doa" description="Form dan daftar ucapan yang terlihat." />
    </div>
    <RouterLink :to="`/admin/invitations/${inv.id}/messages`" class="inline-block text-sm font-medium text-brand hover:underline">Kelola ucapan tamu</RouterLink>
  </BuilderSection>
</template>
