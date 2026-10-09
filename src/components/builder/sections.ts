import { CalendarHeart, Gift, Heart, Image, Info, MessageSquareHeart, Music, Palette, Rocket, Search, Send, Share2, Users } from 'lucide-vue-next'
import type { Component } from 'vue'

export type BuilderKey =
  | 'basic' | 'couple' | 'story' | 'events' | 'gallery' | 'music' | 'theme'
  | 'rsvp' | 'messages' | 'gift' | 'seo' | 'publish' | 'share'

export const SECTION_ICONS: Record<BuilderKey, Component> = {
  basic: Info,
  couple: Users,
  story: Heart,
  events: CalendarHeart,
  gallery: Image,
  rsvp: Send,
  messages: MessageSquareHeart,
  gift: Gift,
  music: Music,
  theme: Palette,
  seo: Search,
  publish: Rocket,
  share: Share2,
}

/** Full admin order; the couple portal passes a subset via `sectionKeys`. */
export const ADMIN_SECTION_ORDER: BuilderKey[] = [
  'basic', 'couple', 'story', 'events', 'gallery', 'music', 'rsvp', 'messages', 'gift', 'theme', 'seo', 'publish', 'share',
]

/** Which preview block to scroll to when a builder section is opened. */
export const PREVIEW_TARGET: Partial<Record<BuilderKey, string>> = {
  basic: 'cover',
  couple: 'profile',
  story: 'story',
  events: 'events',
  gallery: 'gallery',
  rsvp: 'rsvp',
  messages: 'messages',
  gift: 'gift',
  music: 'cover',
  theme: 'cover',
}

/** Which builder section edits a given preview block (click-to-edit). */
export const PICK_MAP: Record<string, BuilderKey> = {
  cover: 'basic',
  couple: 'basic',
  closing: 'basic',
  date: 'events',
  countdown: 'events',
  maps: 'events',
  profile: 'couple',
  story: 'story',
  events: 'events',
  gallery: 'gallery',
  rsvp: 'rsvp',
  messages: 'messages',
  gift: 'gift',
}
