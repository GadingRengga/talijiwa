<script setup lang="ts">
import { computed, provide, ref } from 'vue'
import { useRoute } from 'vue-router'
import BuilderShell from '@/components/builder/BuilderShell.vue'
import { ALLOWED_THEMES_KEY } from '@/components/builder/allowedThemes'
import type { BuilderKey } from '@/components/builder/sections'
import { useBuilder } from '@/composables/useBuilder'
import { useHistory } from '@/composables/useHistory'
import { copy } from '@/config/copy'
import type { Ref } from 'vue'
import type { ThemeId } from '@/types'

const route = useRoute()
const builder = useBuilder(computed(() => String(route.params.id)))
const history = useHistory(builder.draft)
// The admin builder allows every theme (couple portal provides its entitlement instead).
const noThemes: Ref<ThemeId[] | null> = ref(null)
provide(ALLOWED_THEMES_KEY, noThemes)
const todoSkip: BuilderKey[] = ['publish', 'share']
</script>

<template>
  <BuilderShell
    :builder="builder"
    :history="history"
    back-to="/admin/invitations"
    :back-label="copy.builder.edit.backToList"
    initial-key="basic"
    :todo-skip="todoSkip"
    preview-mode="admin"
  />
</template>
