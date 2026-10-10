import type { Component } from 'vue'
import type { OrnamentKind } from '@/types'
import OrnamentJawa from './OrnamentJawa.vue'

/** Map ornament kind → dedicated component. Empty = fall back to inline SVG in OrnamentLayer. */
export const ORNAMENT_COMPONENTS: Partial<Record<OrnamentKind, Component>> = {
  jawa: OrnamentJawa,
}
