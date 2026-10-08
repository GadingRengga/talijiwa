<script setup lang="ts">
import BuilderSection from './BuilderSection.vue'
import FormField from '@/components/ui/FormField.vue'
import ImageUploader from '@/components/admin/ImageUploader.vue'
import { copy } from '@/config/copy'
import type { InvitationData } from '@/types'

const inv = defineModel<InvitationData>({ required: true })
const people = [
  { key: 'groom', title: 'Mempelai pria', father: 'Nama ayah mempelai pria', mother: 'Nama ibu mempelai pria' },
  { key: 'bride', title: 'Mempelai wanita', father: 'Nama ayah mempelai wanita', mother: 'Nama ibu mempelai wanita' },
] as const
</script>

<template>
  <BuilderSection :title="copy.builder.sections.couple" description="Data kedua mempelai dan orang tua.">
    <div v-for="p in people" :key="p.key" class="card space-y-4 p-4">
      <h3 class="text-sm font-semibold">{{ p.title }}</h3>
      <div class="grid gap-4 sm:grid-cols-[10rem_1fr]">
        <ImageUploader v-model="inv[p.key].photo" label="Foto" :invitation-id="inv.id" storage-kind="couple" />
        <div class="space-y-4">
          <FormField label="Nama lengkap" v-slot="{ id }"><input :id="id" v-model="inv[p.key].name" class="field-input" autocomplete="off" /></FormField>
          <FormField label="Nama panggilan" v-slot="{ id }"><input :id="id" v-model="inv[p.key].nickname" class="field-input" autocomplete="off" /></FormField>
          <FormField label="Instagram" optional v-slot="{ id }"><input :id="id" v-model="inv[p.key].instagram" class="field-input" placeholder="@username" autocomplete="off" /></FormField>
        </div>
      </div>
      <div class="grid gap-4 sm:grid-cols-2">
        <FormField label="Ayah" v-slot="{ id }"><input :id="id" v-model="inv[p.key].father" class="field-input" :placeholder="p.father" /></FormField>
        <FormField label="Ibu" v-slot="{ id }"><input :id="id" v-model="inv[p.key].mother" class="field-input" :placeholder="p.mother" /></FormField>
      </div>
    </div>
  </BuilderSection>
</template>
