<script setup lang="ts">
import { ChevronsLeft, ChevronsRight, X } from 'lucide-vue-next'
import { computed } from 'vue'
import type { Component } from 'vue'
import { useRoute } from 'vue-router'

export interface SidebarItem {
  to: string
  label: string
  icon: Component
  exact?: boolean
}

const props = withDefaults(
  defineProps<{
    items: SidebarItem[]
    brandTitle: string
    subtitle: string
    menuLabel: string
    email?: string | null
    roleLabel: string
    closeLabel: string
    expandLabel: string
    collapseLabel: string
  }>(),
  { email: null },
)

const drawer = defineModel<boolean>('drawer', { required: true })
const collapsed = defineModel<boolean>('collapsed', { default: false })

const route = useRoute()
const isActive = (to: string, exact?: boolean) => (exact ? route.path === to : route.path.startsWith(to))
const initial = computed(() => (props.email?.trim().charAt(0) ?? props.brandTitle.charAt(0)).toUpperCase())
</script>

<template>
  <div v-if="drawer" class="fixed inset-0 z-40 bg-ink/50 backdrop-blur-[1px] lg:hidden" @click="drawer = false" />

  <aside
    class="fixed inset-y-0 left-0 z-50 flex w-70 flex-col bg-[linear-gradient(180deg,var(--color-sidebar)_0%,var(--color-sidebar-deep)_100%)] transition-[width,transform] duration-200 lg:sticky lg:top-0 lg:h-dvh"
    :class="[drawer ? 'translate-x-0' : '-translate-x-full lg:translate-x-0', collapsed ? 'lg:w-20' : 'lg:w-70']"
  >
    <!-- ambient gold glow -->
    <div
      class="pointer-events-none absolute inset-x-0 top-0 h-44 bg-[radial-gradient(18rem_9rem_at_50%_0rem,rgba(200,164,94,0.16),transparent)]"
      aria-hidden="true"
    />

    <!-- Brand -->
    <div class="relative flex items-center gap-3 px-4 pb-5 pt-6" :class="collapsed ? 'lg:flex-col lg:px-0' : ''">
      <span
        class="grid size-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#e8d096] to-[#a97f3c] font-display text-xl font-bold text-[#2b1608] shadow-[0_6px_16px_-6px_rgba(200,164,94,0.7)] ring-1 ring-white/25"
        aria-hidden="true"
        >{{ brandTitle.charAt(0) }}</span
      >
      <div class="min-w-0 flex-1" :class="collapsed ? 'lg:hidden' : ''">
        <p class="truncate font-display text-xl font-semibold leading-tight tracking-tight text-white">{{ brandTitle }}</p>
        <p class="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c8a45e]">{{ subtitle }}</p>
      </div>
      <button
        class="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white lg:hidden"
        type="button"
        :aria-label="closeLabel"
        @click="drawer = false"
      >
        <X class="size-5" aria-hidden="true" />
      </button>
    </div>

    <!-- Nav -->
    <nav class="nav-scroll relative min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-4" :aria-label="menuLabel">
      <p
        class="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35"
        :class="collapsed ? 'lg:hidden' : ''"
        aria-hidden="true"
      >
        {{ menuLabel }}
      </p>
      <RouterLink
        v-for="i in items"
        :key="i.to"
        :to="i.to"
        class="group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150"
        :class="[
          isActive(i.to, i.exact)
            ? 'bg-gradient-to-r from-brand to-brand-dark font-semibold text-white shadow-[0_10px_24px_-10px_rgba(123,50,80,0.9)]'
            : 'text-[var(--color-sidebar-ink)] hover:bg-white/[0.06] hover:text-white',
          collapsed ? 'lg:justify-center lg:px-0' : '',
        ]"
        :aria-current="isActive(i.to, i.exact) ? 'page' : undefined"
        :title="collapsed ? i.label : undefined"
      >
        <span
          class="grid size-8 shrink-0 place-items-center rounded-lg transition-colors"
          :class="isActive(i.to, i.exact) ? 'bg-white/20 text-white' : 'bg-white/[0.07] text-[var(--color-sidebar-ink)] group-hover:bg-white/[0.12] group-hover:text-white'"
          aria-hidden="true"
        >
          <component :is="i.icon" class="size-4" />
        </span>
        <span class="truncate" :class="collapsed ? 'lg:hidden' : ''">{{ i.label }}</span>
      </RouterLink>
    </nav>

    <!-- Footer: user + collapse -->
    <div class="relative space-y-2 border-t border-white/10 p-3">
      <div
        class="flex items-center gap-3 rounded-xl bg-white/[0.06] px-3 py-2.5 ring-1 ring-white/10"
        :class="collapsed ? 'lg:justify-center lg:px-0' : ''"
      >
        <span
          class="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#e8d096] to-[#a97f3c] text-sm font-bold text-[#2b1608]"
          aria-hidden="true"
          >{{ initial }}</span
        >
        <div class="min-w-0 flex-1 leading-tight" :class="collapsed ? 'lg:hidden' : ''">
          <p class="truncate text-[13px] font-semibold text-white">{{ email }}</p>
          <p class="truncate text-[11px] text-white/50">{{ roleLabel }}</p>
        </div>
      </div>
      <button
        class="flex w-full items-center gap-2.5 rounded-xl bg-white/[0.06] px-3 py-2 text-[13px] font-medium text-[var(--color-sidebar-ink)] ring-1 ring-white/10 transition-colors hover:bg-white/[0.12] hover:text-white"
        :class="collapsed ? 'lg:justify-center lg:px-0' : ''"
        type="button"
        :title="collapsed ? expandLabel : collapseLabel"
        :aria-label="collapsed ? expandLabel : collapseLabel"
        @click="collapsed = !collapsed"
      >
        <component :is="collapsed ? ChevronsRight : ChevronsLeft" class="size-4 shrink-0" aria-hidden="true" />
        <span class="truncate" :class="collapsed ? 'lg:hidden' : ''">{{ collapsed ? expandLabel : collapseLabel }}</span>
      </button>
    </div>
  </aside>
</template>
