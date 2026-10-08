<script setup lang="ts">
import BuilderSection from './BuilderSection.vue'
import GalleryManager from '@/components/admin/GalleryManager.vue'
import { copy } from '@/config/copy'
import type { InvitationData } from '@/types'

const inv = defineModel<InvitationData>({ required: true })
</script>

<template>
  <BuilderSection :title="copy.builder.sections.gallery" :description="copy.builder.gallery.desc">
    <GalleryManager v-model="inv.gallery" :invitation-id="inv.id" />
  </BuilderSection>
</template>
