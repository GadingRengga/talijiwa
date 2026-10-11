import type { Component } from 'vue'
import type { OrnamentKind } from '@/types'
import OrnamentFloral from './OrnamentFloral.vue'

/** Map ornament kind → dedicated component. Register new theme artwork here. */
export const ORNAMENT_COMPONENTS: Partial<Record<OrnamentKind, Component>> = {
  floral: OrnamentFloral,
}
