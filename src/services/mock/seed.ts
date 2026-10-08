import type { Customer, Faq, GiftConfirmation, GuestMessage, InvitationData, Order, Payment, Rsvp, Testimonial, ThemeCatalogEntry, ThemeCategory, ThemeId } from '@/types'
import { createEmptyInvitation, placeholderImage } from '@/utils/invitation'

export interface MockDb {
  version: number
  customers: Customer[]
  invitations: InvitationData[]
  rsvps: Rsvp[]
  messages: GuestMessage[]
  giftConfirmations: GiftConfirmation[]
  views: { id: string; invitation_id: string; visitor_hash: string; created_at: string }[]
  orders: Order[]
  payments: Payment[]
  themeCatalog: ThemeCatalogEntry[]
  siteSettings: Record<string, string>
  testimonials: Testimonial[]
  faqs: Faq[]
}

const iso = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000).toISOString()

interface DemoSpec {
  slug: string
  theme: ThemeId
  groom: [string, string]
  bride: [string, string]
  date: string
  palette: [string, string]
}

const demos: DemoSpec[] = [
  { slug: 'demo-classic', theme: 'classic', groom: ['Budi Pratama', 'Budi'], bride: ['Ayu Lestari', 'Ayu'], date: '2026-12-20', palette: ['#d8c7a8', '#a98d5f'] },
  { slug: 'demo-minimal', theme: 'minimal', groom: ['Dimas Anggara', 'Dimas'], bride: ['Rani Maharani', 'Rani'], date: '2026-11-14', palette: ['#cfcfcf', '#8c8c8c'] },
  { slug: 'demo-floral', theme: 'floral', groom: ['Arga Wicaksono', 'Arga'], bride: ['Nadia Safitri', 'Nadia'], date: '2027-01-09', palette: ['#f0c4cb', '#c4687b'] },
  { slug: 'demo-luxury', theme: 'luxury', groom: ['Reza Mahendra', 'Reza'], bride: ['Salsa Kirana', 'Salsa'], date: '2027-02-06', palette: ['#5a4426', '#d1ab5a'] },
  { slug: 'demo-gerbang', theme: 'gerbang', groom: ['Bayu Saputra', 'Bayu'], bride: ['Laras Wulandari', 'Laras'], date: '2027-03-13', palette: ['#5a3b25', '#c9a15a'] },
  { slug: 'demo-amplop', theme: 'amplop', groom: ['Fajar Nugroho', 'Fajar'], bride: ['Mira Anjani', 'Mira'], date: '2027-03-27', palette: ['#e9b8b4', '#b5535f'] },
  { slug: 'demo-sinematik', theme: 'sinematik', groom: ['Rendra Pranata', 'Rendra'], bride: ['Citra Maheswari', 'Citra'], date: '2027-04-10', palette: ['#1d2b4a', '#7fa8ff'] },
  { slug: 'demo-garden', theme: 'garden', groom: ['Satria Wibowo', 'Satria'], bride: ['Kirana Dewi', 'Kirana'], date: '2027-04-24', palette: ['#a9c3a5', '#d98a94'] },
  { slug: 'demo-jawa', theme: 'jawa', groom: ['Aryo Seto', 'Aryo'], bride: ['Sekar Ayu', 'Sekar'], date: '2027-05-08', palette: ['#d9bf94', '#9a5b24'] },
  { slug: 'demo-celestial', theme: 'celestial', groom: ['Naufal Hakim', 'Naufal'], bride: ['Aurel Safira', 'Aurel'], date: '2027-05-22', palette: ['#262a55', '#b79cff'] },
  { slug: 'demo-watercolor', theme: 'watercolor', groom: ['Galih Prakoso', 'Galih'], bride: ['Tiara Melati', 'Tiara'], date: '2027-06-05', palette: ['#a9c8d4', '#d98c8c'] },
]

function buildDemo(customerId: string, spec: DemoSpec, index: number): InvitationData {
  const inv = createEmptyInvitation(customerId, spec.theme)
  const [from, to] = spec.palette
  inv.id = `inv_demo_${index}`
  inv.slug = spec.slug
  inv.title = `${spec.groom[1]} & ${spec.bride[1]}`
  inv.status = 'published'
  inv.published_at = iso(10)
  inv.created_at = iso(20 - index)
  inv.settings.show_in_portfolio = true
  inv.groom = {
    name: spec.groom[0],
    nickname: spec.groom[1],
    father: 'Bapak Suryanto',
    mother: 'Ibu Wahyuni',
    photo: placeholderImage(spec.groom[1], from, to),
    instagram: spec.groom[1].toLowerCase(),
  }
  inv.bride = {
    name: spec.bride[0],
    nickname: spec.bride[1],
    father: 'Bapak Hartono',
    mother: 'Ibu Sulastri',
    photo: placeholderImage(spec.bride[1], to, from),
    instagram: spec.bride[1].toLowerCase(),
  }
  inv.stories = [
    { id: `st_${index}_1`, title: 'Pertemuan Pertama', date: '2021-03-12', description: 'Kami bertemu di sebuah acara kampus dan langsung betah mengobrol berjam-jam.', image: '' },
    { id: `st_${index}_2`, title: 'Lamaran', date: '2026-05-02', description: 'Dengan restu keluarga, kami memutuskan untuk melangkah ke jenjang yang lebih serius.', image: '' },
    { id: `st_${index}_3`, title: 'Hari Pernikahan', date: spec.date, description: 'Dan inilah hari yang kami nantikan. Kami berharap Anda bisa hadir.', image: '' },
  ]
  inv.events = [
    { id: `ev_${index}_1`, name: 'Akad Nikah', date: spec.date, start_time: '08:00', end_time: '10:00', venue: 'Masjid Agung', address: 'Jl. Slamet Riyadi No. 1, Surakarta', maps_url: 'https://maps.google.com/?q=Masjid+Agung+Surakarta' },
    { id: `ev_${index}_2`, name: 'Resepsi', date: spec.date, start_time: '11:00', end_time: '14:00', venue: 'Gedung Graha Bakti', address: 'Jl. Ir. Sutami No. 20, Surakarta', maps_url: 'https://maps.google.com/?q=Surakarta' },
  ]
  inv.gallery = [0, 1, 2, 3, 4, 5].map((n) => ({
    id: `gl_${index}_${n}`,
    url: placeholderImage(`Foto ${n + 1}`, n % 2 ? from : to, n % 2 ? to : from),
    caption: '',
    is_cover: n === 0,
  }))
  inv.gifts = [
    { id: `gf_${index}_1`, kind: 'bank', provider: 'BCA', number: '1234567890', holder: spec.groom[0] },
    { id: `gf_${index}_2`, kind: 'e_wallet', provider: 'GoPay', number: '081234567890', holder: spec.bride[0] },
  ]
  inv.settings.rsvp_deadline = spec.date
  return inv
}

export function createSeed(): MockDb {
  const customers: Customer[] = [
    { id: 'cus_budi', name: 'Budi Santoso', phone: '081234567890', email: 'budi@example.com', notes: 'Pelanggan demo.', created_at: iso(30), updated_at: iso(30) },
    { id: 'cus_raka', name: 'Raka Aditya', phone: '081298765432', email: 'raka@example.com', notes: 'Minta tema floral, acara outdoor.', created_at: iso(5), updated_at: iso(5) },
  ]
  const invitations = demos.map((d, i) => buildDemo('cus_budi', d, i))

  const raka = createEmptyInvitation('cus_raka', 'floral')
  raka.id = 'inv_raka'
  raka.title = 'Raka & Sinta'
  raka.slug = 'raka-sinta'
  raka.created_at = iso(4)
  raka.groom.name = 'Raka Aditya'
  raka.groom.nickname = 'Raka'
  raka.bride.name = 'Sinta Dewi'
  raka.bride.nickname = 'Sinta'
  raka.events = [
    { id: 'ev_raka_1', name: 'Akad Nikah', date: '2026-12-12', start_time: '09:00', end_time: '10:30', venue: 'Rumah Mempelai Wanita', address: 'Jl. Melati No. 5, Karanganyar', maps_url: '' },
  ]
  invitations.push(raka)

  const rsvps: Rsvp[] = [
    { id: 'r1', invitation_id: 'inv_demo_0', name: 'Andi Wijaya', whatsapp: '6281111111111', guest_count: 2, attendance: 'attending', message: 'Selamat ya!', created_at: iso(3) },
    { id: 'r2', invitation_id: 'inv_demo_0', name: 'Sari Utami', whatsapp: '6282222222222', guest_count: 1, attendance: 'not_attending', message: 'Maaf belum bisa hadir.', created_at: iso(2) },
    { id: 'r3', invitation_id: 'inv_demo_0', name: 'Keluarga Hartono', whatsapp: '6283333333333', guest_count: 4, attendance: 'attending', message: '', created_at: iso(1) },
  ]
  const messages: GuestMessage[] = [
    { id: 'm1', invitation_id: 'inv_demo_0', name: 'Andi Wijaya', message: 'Selamat menempuh hidup baru, semoga sakinah mawaddah warahmah.', is_visible: true, created_at: iso(3) },
    { id: 'm2', invitation_id: 'inv_demo_0', name: 'Sari Utami', message: 'Bahagia selalu untuk kalian berdua!', is_visible: true, created_at: iso(2) },
  ]
  const giftConfirmations: GiftConfirmation[] = [
    { id: 'g1', invitation_id: 'inv_demo_0', name: 'Andi Wijaya', gift_type: 'bank_transfer', amount: 500000, message: 'Semoga bermanfaat', created_at: iso(2) },
  ]
  const views = Array.from({ length: 40 }, (_, i) => ({
    id: `v${i}`,
    invitation_id: 'inv_demo_0',
    visitor_hash: `visitor_${i % 17}`,
    created_at: iso(i % 14),
  }))

  const categories: Record<string, ThemeCategory> = {
    classic: 'klasik', minimal: 'modern', floral: 'floral', luxury: 'mewah', gerbang: 'adat',
    amplop: 'modern', sinematik: 'modern', garden: 'floral', jawa: 'adat', celestial: 'modern', watercolor: 'floral',
  }
  const themeCatalog: ThemeCatalogEntry[] = (Object.keys(Object.fromEntries(demos.map((d) => [d.theme, true]))) as ThemeId[]).map(
    (theme, i) => ({
      theme,
      is_active: true,
      price: theme === 'luxury' ? 249000 : ['gerbang', 'amplop', 'sinematik', 'jawa', 'celestial'].includes(theme) ? 199000 : 149000,
      position: i + 1,
      category: categories[theme] ?? 'modern',
    }),
  )

  const orders: Order[] = [
    { id: 'ord_1', customer_id: 'cus_budi', invitation_id: 'inv_demo_0', theme: 'classic', amount: 149000, paid: 149000, status: 'paid', due_date: '2026-12-20', notes: '', delivered_at: iso(9), created_at: iso(25), updated_at: iso(11) },
    { id: 'ord_2', customer_id: 'cus_raka', invitation_id: 'inv_raka', theme: 'floral', amount: 149000, paid: 50000, status: 'dp', due_date: '2026-12-12', notes: 'Pelunasan maksimal H-7.', delivered_at: null, created_at: iso(4), updated_at: iso(4) },
  ]
  const payments: Payment[] = [
    { id: 'pay_1', order_id: 'ord_1', amount: 149000, method: 'transfer', paid_at: '2026-09-20', note: 'Pelunasan', created_at: iso(11) },
    { id: 'pay_2', order_id: 'ord_2', amount: 50000, method: 'ewallet', paid_at: '2026-10-03', note: 'DP', created_at: iso(4) },
  ]

  return { version: 1, customers, invitations, rsvps, messages, giftConfirmations, views, orders, payments, themeCatalog, siteSettings, testimonials, faqs }
}

const siteSettings: Record<string, string> = {
  hero_title: 'Undangan Pernikahan Digital yang Elegan dan Berkesan',
  hero_subtitle: 'Buat momen spesial Anda semakin berkesan dengan undangan digital yang indah, interaktif, dan mudah dibagikan.',
  seo_title: 'Undangan Pernikahan Digital Elegan — Talijiwa',
  seo_description: 'Buat undangan pernikahan digital yang indah, interaktif, dan mudah dibagikan lewat WhatsApp.',
  contact_text: 'Ceritakan tanggal dan impian pernikahan Anda, kami bantu wujudkan undangannya.',
}

const testimonials: Testimonial[] = [
  { id: 't1', name: 'Raka & Sinta', message: 'Undangannya bagus banget, tamu sampai tanya-tanya buatnya di mana!', rating: 5, is_visible: true, position: 1, created_at: iso(20) },
  { id: 't2', name: 'Budi & Ayu', message: 'Pengerjaan cepat, revisi juga gampang. Puas banget!', rating: 5, is_visible: true, position: 2, created_at: iso(15) },
]

const faqs: Faq[] = [
  { id: 'f1', question: 'Berapa lama pengerjaannya?', answer: 'Undangan jadi dalam 1–3 hari kerja setelah data dan foto lengkap kami terima.', is_visible: true, position: 1 },
  { id: 'f2', question: 'Bagaimana cara menyebar undangan?', answer: 'Anda dapat tautan + QR + pesan WhatsApp siap kirim untuk setiap tamu.', is_visible: true, position: 2 },
  { id: 'f3', question: 'Apakah tamu perlu install aplikasi?', answer: 'Tidak. Undangan terbuka langsung di browser HP maupun laptop.', is_visible: true, position: 3 },
]
