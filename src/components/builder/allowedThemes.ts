import type { InjectionKey, Ref } from 'vue'
import type { BuilderKey } from './BuilderSidebar.vue'
import type { ThemeId } from '@/types'

/** Pages provide the theme entitlement (null = all themes). The admin builder provides nothing. */
export const ALLOWED_THEMES_KEY: InjectionKey<Ref<ThemeId[] | null>> = Symbol('allowed-themes')

/** Sections visible to customers in the couple portal (admin-only sections excluded). */
export const COUPLE_BUILDER_KEYS: BuilderKey[] = ['couple', 'events', 'gallery', 'music', 'theme', 'rsvp', 'messages', 'gift', 'publish']
