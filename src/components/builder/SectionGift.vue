<script setup lang="ts">
import { Plus, Trash2 } from 'lucide-vue-next'
import BuilderSection from './BuilderSection.vue'
import AppButton from '@/components/ui/AppButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import FormField from '@/components/ui/FormField.vue'
import ToggleSwitch from '@/components/ui/ToggleSwitch.vue'
import { copy } from '@/config/copy'
import type { GiftAccount, InvitationData } from '@/types'
import { uid } from '@/utils/format'

const inv = defineModel<InvitationData>({ required: true })

function add(kind: GiftAccount['kind']) {
  inv.value.gifts.push({ id: uid('gf'), kind, provider: '', number: '', holder: '' })
}
function remove(id: string) {
  inv.value.gifts = inv.value.gifts.filter((g) => g.id !== id)
}
</script>

<template>
  <BuilderSection :title="copy.builder.sections.gift" description="Rekening bank dan e-wallet. Tamu bisa menyalin nomor dan mengirim konfirmasi.">
    <div class="card px-4">
      <ToggleSwitch v-model="inv.settings.sections.gift" label="Tampilkan amplop digital" />
    </div>
    <EmptyState v-if="!inv.gifts.length" :message="copy.empty.gifts" />
    <div v-else class="space-y-3">
      <article v-for="g in inv.gifts" :key="g.id" class="card space-y-4 p-4">
        <header class="flex items-center justify-between">
          <h3 class="text-sm font-semibold">{{ g.kind === 'bank' ? 'Rekening bank' : 'E-wallet' }}</h3>
          <button type="button" class="rounded p-1.5 text-danger hover:bg-danger-soft" aria-label="Hapus rekening" @click="remove(g.id)"><Trash2 class="size-4" /></button>
        </header>
        <div class="grid gap-4 sm:grid-cols-2">
          <FormField :label="g.kind === 'bank' ? 'Nama bank' : 'Nama e-wallet'" v-slot="{ id }">
            <input :id="id" v-model="g.provider" class="field-input" :placeholder="g.kind === 'bank' ? 'BCA' : 'GoPay'" />
          </FormField>
          <FormField :label="g.kind === 'bank' ? 'Nomor rekening' : 'Nomor e-wallet'" v-slot="{ id }">
            <input :id="id" v-model="g.number" class="field-input" inputmode="numeric" autocomplete="off" />
          </FormField>
        </div>
        <FormField label="Atas nama" v-slot="{ id }"><input :id="id" v-model="g.holder" class="field-input" /></FormField>
      </article>
    </div>
    <div class="flex flex-wrap gap-2">
      <AppButton variant="secondary" size="sm" @click="add('bank')"><Plus class="size-4" /> Rekening bank</AppButton>
      <AppButton variant="secondary" size="sm" @click="add('e_wallet')"><Plus class="size-4" /> E-wallet</AppButton>
    </div>
    <RouterLink :to="`/admin/invitations/${inv.id}/gifts`" class="inline-block text-sm font-medium text-brand hover:underline">Lihat konfirmasi hadiah</RouterLink>
  </BuilderSection>
</template>
