<script setup lang="ts">
import { computed, provide, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BuilderShell from '@/components/builder/BuilderShell.vue'
import { ALLOWED_THEMES_KEY, COUPLE_BUILDER_KEYS } from '@/components/builder/allowedThemes'
import type { BuilderKey } from '@/components/builder/sections'
import { useBuilder } from '@/composables/useBuilder'
import { useHistory } from '@/composables/useHistory'
import { copy } from '@/config/copy'
import { myCustomerId } from '@/services/auth'
import { themeCatalogService } from '@/services/catalog'
import { orderService } from '@/services/orders'
import type { ThemeId } from '@/types'
import { allowedThemes } from '@/utils/invitation'

const route = useRoute()
const router = useRouter()
const builder = useBuilder(computed(() => String(route.params.id)))
const history = useHistory(builder.draft)
const allowed = ref<ThemeId[] | null>(null)
provide(ALLOWED_THEMES_KEY, allowed)
builder.allowedThemes = allowed
const todoSkip: BuilderKey[] = ['publish']

// Customer entitlement: tier from the linked paid order (Option B: higher tiers unlock lower ones).
// Ownership is enforced; tier itself is never editable from the builder.
watch(
  () => builder.draft.value?.id,
  async (id) => {
    if (!id || !builder.draft.value) return
    const customerId = await myCustomerId().catch(() => null)
    if (!customerId || builder.draft.value.customer_id !== customerId) {
      await router.replace({ name: 'couple-dashboard' })
      return
    }
    try {
      const [orders, catalog] = await Promise.all([
        orderService.listByCustomer(customerId).catch(() => []),
        themeCatalogService.list().catch(() => []),
      ])
      const linked = orders.find((o) => o.invitation_id === id)
      const tier = linked?.tier ?? builder.draft.value.tier
      builder.draft.value.tier = tier
      allowed.value = allowedThemes(tier, catalog)
      if (allowed.value.length && !allowed.value.includes(builder.draft.value.theme)) {
        builder.draft.value.theme = allowed.value[0]!
      }
    } catch {
      allowed.value = builder.draft.value ? [builder.draft.value.theme] : null
    }
  },
)
</script>

<template>
  <BuilderShell
    :builder="builder"
    :history="history"
    back-to="/pasangan"
    :back-label="copy.couple.backToDashboard"
    :badge="copy.couple.portalBadge"
    :section-keys="COUPLE_BUILDER_KEYS"
    initial-key="couple"
    :todo-skip="todoSkip"
    preview-mode="public"
  />
</template>
