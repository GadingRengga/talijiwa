<script setup lang="ts">
import { Check, Loader2, RotateCcw, X } from 'lucide-vue-next'
import { inject } from 'vue'
import BuilderSection from './BuilderSection.vue'
import FormField from '@/components/ui/FormField.vue'
import { BUILDER_KEY } from '@/composables/useBuilder'
import { copy } from '@/config/copy'
import type { InvitationData } from '@/types'

const inv = defineModel<InvitationData>({ required: true })
const b = inject(BUILDER_KEY)!

const slugMessage = {
  idle: '',
  checking: 'Memeriksa ketersediaan…',
  ok: 'Slug tersedia.',
  taken: 'Slug sudah dipakai undangan lain.',
  invalid: 'Gunakan huruf kecil, angka, dan tanda hubung (minimal 3 karakter, bukan kata yang dicadangkan).',
} as const
</script>

<template>
  <BuilderSection :title="copy.builder.sections.basic" description="Judul, alamat undangan, dan teks sambutan.">
    <FormField label="Judul undangan" hint="Biasanya nama panggilan pasangan, mis. Raka & Sinta." v-slot="{ id }">
      <input :id="id" v-model="inv.title" class="field-input" placeholder="Raka & Sinta" maxlength="80" />
    </FormField>

    <FormField label="Alamat undangan (slug)" :error="b.slugState.value === 'taken' || b.slugState.value === 'invalid' ? slugMessage[b.slugState.value] : ''" v-slot="{ id, invalid }">
      <div class="flex items-stretch gap-2">
        <div class="flex min-w-0 flex-1 items-center rounded-lg border bg-panel focus-within:border-brand focus-within:ring-[3px] focus-within:ring-brand/15" :class="invalid ? 'border-danger' : 'border-line'">
          <span class="select-none pl-3 text-sm text-muted">/invite/</span>
          <input :id="id" v-model="inv.slug" class="min-w-0 flex-1 bg-transparent py-2 pr-3 text-sm outline-none" :aria-invalid="invalid" maxlength="60" @input="b.onSlugInput()" />
          <span class="pr-3" aria-hidden="true">
            <Loader2 v-if="b.slugState.value === 'checking'" class="size-4 animate-spin text-muted" />
            <Check v-else-if="b.slugState.value === 'ok'" class="size-4 text-sage" />
            <X v-else-if="invalid" class="size-4 text-danger" />
          </span>
        </div>
        <button v-if="b.slugTouched.value" type="button" class="inline-flex items-center gap-1.5 rounded-lg border border-line bg-panel px-3 text-[13px] hover:bg-paper" @click="b.resetSlugFromTitle()">
          <RotateCcw class="size-3.5" /> Ikuti judul
        </button>
      </div>
      <p v-if="b.slugState.value === 'ok' || b.slugState.value === 'checking'" class="mt-1.5 text-xs text-muted">{{ slugMessage[b.slugState.value] }}</p>
    </FormField>

    <FormField label="Salam pembuka" v-slot="{ id }"><input :id="id" v-model="inv.greeting" class="field-input" /></FormField>
    <FormField label="Teks pembuka" v-slot="{ id }"><textarea :id="id" v-model="inv.opening_text" rows="3" class="field-input" /></FormField>
    <FormField label="Teks penutup" v-slot="{ id }"><textarea :id="id" v-model="inv.closing_text" rows="3" class="field-input" /></FormField>
  </BuilderSection>
</template>
