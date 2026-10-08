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
  <BuilderSection :title="copy.builder.sections.gift" :description="copy.builder.gift.desc">
    <div class="card px-4">
      <ToggleSwitch v-model="inv.settings.sections.gift" :label="copy.builder.gift.show" />
    </div>
    <EmptyState v-if="!inv.gifts.length" :message="copy.empty.gifts" />
    <div v-else class="space-y-3">
      <article v-for="g in inv.gifts" :key="g.id" class="card space-y-4 p-4">
        <header class="flex items-center justify-between">
          <h3 class="text-sm font-semibold">{{ g.kind === 'bank' ? copy.builder.gift.bank : copy.builder.gift.wallet }}</h3>
          <button type="button" class="rounded p-1.5 text-danger hover:bg-danger-soft" :aria-label="copy.builder.gift.removeAccount" @click="remove(g.id)"><Trash2 class="size-4" /></button>
        </header>
        <div class="grid gap-4 sm:grid-cols-2">
          <FormField :label="g.kind === 'bank' ? copy.builder.gift.bankName : copy.builder.gift.walletName" v-slot="{ id }">
            <input :id="id" v-model="g.provider" class="field-input" :placeholder="g.kind === 'bank' ? copy.builder.gift.bankNamePh : copy.builder.gift.walletNamePh" />
          </FormField>
          <FormField :label="g.kind === 'bank' ? copy.builder.gift.accountNumber : copy.builder.gift.walletNumber" v-slot="{ id }">
            <input :id="id" v-model="g.number" class="field-input" inputmode="numeric" autocomplete="off" />
          </FormField>
        </div>
        <FormField :label="copy.builder.gift.holder" v-slot="{ id }"><input :id="id" v-model="g.holder" class="field-input" /></FormField>
      </article>
    </div>
    <div class="flex flex-wrap gap-2">
      <AppButton variant="secondary" size="sm" @click="add('bank')"><Plus class="size-4" /> {{ copy.builder.gift.addBank }}</AppButton>
      <AppButton variant="secondary" size="sm" @click="add('e_wallet')"><Plus class="size-4" /> {{ copy.builder.gift.addWallet }}</AppButton>
    </div>
    <RouterLink :to="`/admin/invitations/${inv.id}/gifts`" class="inline-block text-sm font-medium text-brand hover:underline">{{ copy.builder.gift.viewConfirmations }}</RouterLink>
  </BuilderSection>
</template>
