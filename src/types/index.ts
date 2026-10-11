export type InvitationStatus = 'draft' | 'published' | 'archived'
export type ThemeId = 'floral'
/** Price tier: higher tiers unlock all themes of lower tiers. */
export type InvitationTier = 'basic' | 'premium' | 'luxury'
export type IntroKind = 'slide' | 'door' | 'curtain' | 'envelope' | 'zoom' | 'bloom' | 'gunungan' | 'iris' | 'split' | 'blossom' | 'flip' | 'cube'
export type RevealKind = 'fade' | 'rise' | 'stagger' | 'mask'
export type OrnamentKind = 'floral'
export type Attendance = 'attending' | 'not_attending'
export type GiftType = 'bank_transfer' | 'cash' | 'e_wallet' | 'other'

export interface Customer {
  id: string
  name: string
  phone: string
  email: string
  notes: string
  created_at: string
  updated_at: string
}

export interface Person {
  name: string
  nickname: string
  father: string
  mother: string
  photo: string
  instagram: string
}

export interface StoryItem {
  id: string
  title: string
  date: string
  description: string
  image: string
}

export interface EventItem {
  id: string
  name: string
  date: string
  start_time: string
  end_time: string
  venue: string
  address: string
  maps_url: string
}

export interface GalleryItem {
  id: string
  url: string
  caption: string
  is_cover: boolean
}

export interface GiftAccount {
  id: string
  kind: 'bank' | 'e_wallet'
  provider: string
  number: string
  holder: string
}

/** Section keys, in the order they appear on the public invitation. */
export const SECTION_KEYS = [
  'couple',
  'date',
  'countdown',
  'profile',
  'story',
  'events',
  'maps',
  'gallery',
  'rsvp',
  'messages',
  'gift',
] as const
export type SectionKey = (typeof SECTION_KEYS)[number]

export type FontChoice = 'theme' | 'serif' | 'classic' | 'script' | 'modern'
export type BodyFontChoice = 'theme' | 'serif' | 'classic' | 'modern'
export type HeadingScale = 's' | 'm' | 'l'
export type AnimationLevel = 'full' | 'light' | 'off'
export interface InvitationStyle {
  /** Hex override of the theme accent; empty = follow theme */
  accent: string
  font: FontChoice
  fontBody: BodyFontChoice
  /** Section heading size; m = theme default */
  headingScale: HeadingScale
  animation: AnimationLevel
  intro: 'theme' | IntroKind
  /** Hex overrides of theme tokens; empty = follow theme */
  text: string
  muted: string
  surface: string
}

export interface InvitationSettings {
  sections: Record<SectionKey, boolean>
  /** Display order of sections; missing keys fall back to SECTION_KEYS order */
  section_order?: SectionKey[]
  style?: Partial<InvitationStyle>
  /** Share section: one guest per line, optional ` | 08xxxxxxxx` */
  guest_names?: string
  share_template?: string
  rsvp_deadline: string
  music_enabled: boolean
  music_url: string
  seo_title: string
  seo_description: string
  seo_noindex: boolean
  show_in_portfolio: boolean
}

export interface InvitationData {
  id: string
  customer_id: string
  title: string
  slug: string
  status: InvitationStatus
  tier: InvitationTier
  theme: ThemeId
  published_at: string | null
  created_at: string
  updated_at: string
  greeting: string
  opening_text: string
  closing_text: string
  bride: Person
  groom: Person
  stories: StoryItem[]
  events: EventItem[]
  gallery: GalleryItem[]
  gifts: GiftAccount[]
  settings: InvitationSettings
}

export interface Rsvp {
  id: string
  invitation_id: string
  name: string
  whatsapp: string
  guest_count: number
  attendance: Attendance
  message: string
  created_at: string
}

export interface GuestMessage {
  id: string
  invitation_id: string
  name: string
  message: string
  is_visible: boolean
  created_at: string
}

export interface GiftConfirmation {
  id: string
  invitation_id: string
  name: string
  gift_type: GiftType
  amount: number | null
  message: string
  created_at: string
}

export type PaymentStatus = 'pending' | 'dp' | 'paid' | 'cancelled'

export interface Order {
  id: string
  customer_id: string
  invitation_id: string | null
  tier: InvitationTier
  theme: ThemeId
  amount: number
  paid: number
  status: PaymentStatus
  due_date: string
  notes: string
  delivered_at: string | null
  created_at: string
  updated_at: string
}

export type PaymentMethod = 'transfer' | 'ewallet' | 'cash' | 'other'

export interface Payment {
  id: string
  order_id: string
  amount: number
  method: PaymentMethod
  paid_at: string
  note: string
  created_at: string
}

export interface ThemeCatalogEntry {
  theme: ThemeId
  /** Fixed short code for admin/WA reference (e.g. CLS, GRB, LUX). */
  code: string
  is_active: boolean
  price: number
  position: number
  category: ThemeCategory
  /** Which tier this theme belongs to (basic < premium < luxury). */
  tier: InvitationTier
}

/** Master price per tier (for NEW orders; existing orders keep their snapshot). */
export interface TierPrice {
  tier: InvitationTier
  price: number
}

/** One-time code issued after payment so a customer can manage their own invitation. */
export interface AccessCode {
  code: string
  customer_id: string
  order_id: string
  tier: InvitationTier
  is_active: boolean
  expires_at: string | null
  redeemed_email: string
  redeemed_at: string | null
  /** Last successful code login (codes are reusable credentials). */
  last_used_at: string | null
  created_at: string
}

/** Local session for code-based couple logins (code + email, no Supabase Auth). */
export interface CodeSession {
  code: string
  email: string
  customer_id: string
  order_id: string
  tier: InvitationTier
}

export type ThemeCategory = 'klasik' | 'modern' | 'floral' | 'adat' | 'mewah'

export interface Testimonial {
  id: string
  name: string
  message: string
  rating: number
  is_visible: boolean
  position: number
  created_at: string
}

export interface Faq {
  id: string
  question: string
  answer: string
  is_visible: boolean
  position: number
}

export interface ThemeTokens {
  bg: string
  surface: string
  text: string
  muted: string
  accent: string
  accentContrast: string
  border: string
  fontHeading: string
  fontBody: string
  radius: string
  coverOverlay: string
}

export type DecorKind = 'float' | 'petals' | 'sparkle' | 'none'

export interface ThemeDefinition {
  id: ThemeId
  name: string
  description: string
  tokens: ThemeTokens
  decor: DecorKind
  /** Cover opening animation (default: slide) */
  intro?: IntroKind
  /** Scroll text reveal style (default: fade) */
  reveal?: RevealKind
  /** Signature background ornament (light, transform/opacity only) */
  ornament?: OrnamentKind
  swatches: string[]
}
