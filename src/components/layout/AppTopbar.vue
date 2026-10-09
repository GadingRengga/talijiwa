<script setup lang="ts">
import { ChevronDown, House, LogOut, Menu } from 'lucide-vue-next'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const props = withDefaults(
  defineProps<{
    parentLabel: string
    parentTo: string
    email?: string | null
    roleLabel: string
    badge?: string
    menuLabel: string
    logoutLabel: string
  }>(),
  { email: null, badge: '' },
)

const emit = defineEmits<{ (e: 'menu'): void; (e: 'logout'): void }>()

const route = useRoute()
const title = computed(() => (typeof route.meta.title === 'string' ? route.meta.title : ''))
const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

const open = ref(false)
const root = ref<HTMLElement | null>(null)
const initial = computed(() => (props.email?.trim().charAt(0) ?? '?').toUpperCase())

function onDocClick(e: MouseEvent) {
  if (root.value && !root.value.contains(e.target as Node)) open.value = false
}
watch(open, (v) => {
  if (v) document.addEventListener('click', onDocClick)
  else document.removeEventListener('click', onDocClick)
})
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
</script>

<template>
  <header class="sticky top-0 z-30 border-b border-line bg-paper/85 backdrop-blur-md">
    <div class="flex h-16 items-center gap-2 px-4 sm:gap-3 sm:px-6">
      <button
        class="rounded-xl p-2 text-muted transition-colors hover:bg-black/5 hover:text-ink lg:hidden"
        type="button"
        :aria-label="menuLabel"
        @click="emit('menu')"
      >
        <Menu class="size-5" aria-hidden="true" />
      </button>

      <nav class="flex min-w-0 items-center gap-2 text-sm" aria-label="Breadcrumb">
        <RouterLink
          :to="parentTo"
          class="hidden shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-muted transition-colors hover:bg-black/5 hover:text-brand sm:inline-flex"
        >
          <House class="size-4" aria-hidden="true" />
          <span class="font-medium">{{ parentLabel }}</span>
        </RouterLink>
        <span class="hidden text-line sm:block" aria-hidden="true">/</span>
        <span class="truncate text-[15px] font-bold tracking-tight">{{ title }}</span>
      </nav>

      <div class="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
        <span class="hidden text-[13px] text-muted lg:block">{{ today }}</span>
        <span v-if="badge" class="hidden rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-semibold text-brand sm:block">{{
          badge
        }}</span>

        <div ref="root" class="relative">
          <button
            class="flex items-center gap-2 rounded-full border border-line bg-panel py-1 pl-1 pr-2 shadow-sm transition-all hover:border-brand/40 hover:shadow"
            type="button"
            aria-haspopup="menu"
            :aria-expanded="open"
            @click="open = !open"
            @keydown.escape="open = false"
          >
            <span
              class="grid size-7 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-dark text-[11px] font-bold text-white"
              aria-hidden="true"
              >{{ initial }}</span
            >
            <span class="hidden max-w-36 truncate text-[13px] font-medium md:block">{{ email }}</span>
            <ChevronDown class="size-3.5 text-muted transition-transform" :class="open ? 'rotate-180' : ''" aria-hidden="true" />
          </button>

          <div
            v-if="open"
            role="menu"
            class="card absolute right-0 top-full z-50 mt-2 w-60 p-1.5"
            :style="{ boxShadow: 'var(--shadow-pop)' }"
          >
            <div class="flex items-center gap-3 rounded-xl bg-paper px-3 py-2.5">
              <span
                class="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-dark text-sm font-bold text-white"
                aria-hidden="true"
                >{{ initial }}</span
              >
              <div class="min-w-0 leading-tight">
                <p class="truncate text-[13px] font-semibold">{{ email }}</p>
                <p class="truncate text-[11px] text-muted">{{ roleLabel }}</p>
              </div>
            </div>
            <button
              role="menuitem"
              class="mt-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-danger transition-colors hover:bg-danger-soft"
              type="button"
              @click="emit('logout')"
            >
              <LogOut class="size-4" aria-hidden="true" />
              {{ logoutLabel }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>
