<script setup lang="ts">
import { computed } from 'vue'
import BuilderSection from './BuilderSection.vue'
import ToggleSwitch from '@/components/ui/ToggleSwitch.vue'
import { copy } from '@/config/copy'
import { useAuthStore } from '@/stores/auth'
import type { InvitationData } from '@/types'

const inv = defineModel<InvitationData>({ required: true })
// Admin shortcuts stay admin-only; couples monitor via /pasangan dashboard.
const isAdmin = computed(() => useAuthStore().isAdmin)
</script>

<template>
  <BuilderSection :title="copy.builder.sections.messages" :description="copy.builder.messages.desc">
    <div class="card px-4">
      <ToggleSwitch v-model="inv.settings.sections.messages" :label="copy.builder.messages.show" :description="copy.builder.messages.showHint" />
    </div>
    <RouterLink v-if="isAdmin" :to="`/admin/invitations/${inv.id}/messages`" class="inline-block text-sm font-medium text-brand hover:underline">{{ copy.builder.messages.manage }}</RouterLink>
  </BuilderSection>
</template>
