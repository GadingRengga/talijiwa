<script setup lang="ts">
import BuilderSection from './BuilderSection.vue'
import FormField from '@/components/ui/FormField.vue'
import ToggleSwitch from '@/components/ui/ToggleSwitch.vue'
import { copy } from '@/config/copy'
import type { InvitationData } from '@/types'

const inv = defineModel<InvitationData>({ required: true })
</script>

<template>
  <BuilderSection :title="copy.builder.sections.rsvp" description="Tamu mengisi nama, WhatsApp, jumlah tamu, dan kehadiran.">
    <div class="card divide-y divide-line px-4">
      <ToggleSwitch v-model="inv.settings.sections.rsvp" label="Tampilkan form RSVP" description="Matikan jika konfirmasi dilakukan lewat cara lain." />
    </div>
    <FormField label="Batas konfirmasi" optional hint="Ditampilkan di atas form RSVP." v-slot="{ id }">
      <input :id="id" v-model="inv.settings.rsvp_deadline" type="date" class="field-input max-w-xs" />
    </FormField>
    <RouterLink :to="`/admin/invitations/${inv.id}/rsvp`" class="inline-block text-sm font-medium text-brand hover:underline">Lihat data RSVP</RouterLink>
  </BuilderSection>
</template>
