<script setup lang="ts">
import { computed } from 'vue'
import BuilderSection from './BuilderSection.vue'
import FormField from '@/components/ui/FormField.vue'
import ToggleSwitch from '@/components/ui/ToggleSwitch.vue'
import { copy } from '@/config/copy'
import type { InvitationData } from '@/types'

const inv = defineModel<InvitationData>({ required: true })
const titleDefault = computed(() => `${inv.value.title || copy.builder.seo.coupleFallback} — Wedding Invitation`)
const descDefault = computed(() => `Undangan pernikahan ${inv.value.title || copy.builder.seo.coupleFallback}.`)
</script>

<template>
  <BuilderSection :title="copy.builder.sections.seo" :description="copy.builder.seo.desc">
    <FormField :label="copy.builder.seo.title" optional :hint="`${copy.builder.seo.titleHint}${titleDefault}`" v-slot="{ id }">
      <input :id="id" v-model="inv.settings.seo_title" class="field-input" maxlength="70" :placeholder="titleDefault" />
    </FormField>
    <FormField :label="copy.builder.seo.descLabel" optional :hint="`${copy.builder.seo.descHint}${descDefault}`" v-slot="{ id }">
      <textarea :id="id" v-model="inv.settings.seo_description" rows="2" class="field-input" maxlength="160" :placeholder="descDefault" />
    </FormField>
    <div class="card px-4">
      <ToggleSwitch v-model="inv.settings.seo_noindex" :label="copy.builder.seo.hideSeo" :description="copy.builder.seo.hideHint" />
    </div>
    <div class="card px-4">
      <ToggleSwitch v-model="inv.settings.show_in_portfolio" :label="copy.builder.seo.portfolio" :description="copy.builder.seo.portfolioHint" />
    </div>
    <div class="rounded-xl border border-line bg-panel p-4">
      <p class="text-xs text-muted">{{ copy.builder.seo.previewTitle }}</p>
      <p class="mt-1 truncate text-base text-[#1a0dab]">{{ inv.settings.seo_title || titleDefault }}</p>
      <p class="line-clamp-2 text-sm text-muted">{{ inv.settings.seo_description || descDefault }}</p>
    </div>
  </BuilderSection>
</template>
