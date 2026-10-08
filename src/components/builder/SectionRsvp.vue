<script setup lang="ts">
import BuilderSection from './BuilderSection.vue'
import FormField from '@/components/ui/FormField.vue'
import ToggleSwitch from '@/components/ui/ToggleSwitch.vue'
import { copy } from '@/config/copy'
import type { InvitationData } from '@/types'

const inv = defineModel<InvitationData>({ required: true })
</script>

<template>
  <BuilderSection :title="copy.builder.sections.rsvp" :description="copy.builder.rsvp.desc">
    <div class="card divide-y divide-line px-4">
      <ToggleSwitch v-model="inv.settings.sections.rsvp" :label="copy.builder.rsvp.show" :description="copy.builder.rsvp.showOff" />
    </div>
    <FormField :label="copy.builder.rsvp.deadline" optional :hint="copy.builder.rsvp.deadlineHint" v-slot="{ id }">
      <input :id="id" v-model="inv.settings.rsvp_deadline" type="date" class="field-input max-w-xs" />
    </FormField>
    <RouterLink :to="`/admin/invitations/${inv.id}/rsvp`" class="inline-block text-sm font-medium text-brand hover:underline">{{ copy.builder.rsvp.viewData }}</RouterLink>
  </BuilderSection>
</template>
