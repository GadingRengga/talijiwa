<script setup lang="ts">
import { Pencil, Plus, Star, Trash2 } from 'lucide-vue-next'
import { onMounted, reactive, ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import FormField from '@/components/ui/FormField.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import Modal from '@/components/ui/Modal.vue'
import { useToast } from '@/composables/useToast'
import { copy } from '@/config/copy'
import { contentService } from '@/services/content'
import { useContentStore } from '@/stores/content'

const store = useContentStore()
const toast = useToast()
const tab = ref<'content' | 'testimonials' | 'faqs'>('content')
const tabs = [['content', copy.settings.tabs.content], ['testimonials', copy.settings.tabs.testimonials], ['faqs', copy.settings.tabs.faqs]] as const

const form = reactive({ hero_title: '', hero_subtitle: '', seo_title: '', seo_description: '', contact_text: '' })
const savingContent = ref(false)

const tForm = reactive({ id: '', name: '', message: '', rating: 5, is_visible: true, position: 0 })
const fForm = reactive({ id: '', question: '', answer: '', is_visible: true, position: 0 })
const tOpen = ref(false)
const fOpen = ref(false)
const saving = ref(false)
const toDelete = ref<{ kind: 't' | 'f'; id: string } | null>(null)

onMounted(async () => {
  await store.load(true, true)
  Object.assign(form, {
    hero_title: store.settings.hero_title ?? '',
    hero_subtitle: store.settings.hero_subtitle ?? '',
    seo_title: store.settings.seo_title ?? '',
    seo_description: store.settings.seo_description ?? '',
    contact_text: store.settings.contact_text ?? '',
  })
})

async function saveContent() {
  savingContent.value = true
  try {
    await Promise.all(Object.entries(form).map(([k, v]) => contentService.saveSetting(k, v)))
    await store.load(true, true)
    toast.success(copy.settings.savedContent)
  } catch (e) {
    toast.error(e instanceof Error ? e.message : copy.common.genericError)
  } finally {
    savingContent.value = false
  }
}

function openT(id = '') {
  const t = store.testimonials.find((x) => x.id === id)
  Object.assign(tForm, { id, name: t?.name ?? '', message: t?.message ?? '', rating: t?.rating ?? 5, is_visible: t?.is_visible ?? true, position: t?.position ?? store.testimonials.length + 1 })
  tOpen.value = true
}
function openF(id = '') {
  const f = store.faqs.find((x) => x.id === id)
  Object.assign(fForm, { id, question: f?.question ?? '', answer: f?.answer ?? '', is_visible: f?.is_visible ?? true, position: f?.position ?? store.faqs.length + 1 })
  fOpen.value = true
}

async function saveT() {
  saving.value = true
  try {
    await contentService.saveTestimonial({ name: tForm.name, message: tForm.message, rating: tForm.rating, is_visible: tForm.is_visible, position: tForm.position }, tForm.id || undefined)
    await store.load(true, true)
    tOpen.value = false
    toast.success(copy.settings.savedTestimonial)
  } catch (e) {
    toast.error(e instanceof Error ? e.message : copy.common.genericError)
  } finally {
    saving.value = false
  }
}
async function saveF() {
  saving.value = true
  try {
    await contentService.saveFaq({ question: fForm.question, answer: fForm.answer, is_visible: fForm.is_visible, position: fForm.position }, fForm.id || undefined)
    await store.load(true, true)
    fOpen.value = false
    toast.success(copy.settings.savedFaq)
  } catch (e) {
    toast.error(e instanceof Error ? e.message : copy.common.genericError)
  } finally {
    saving.value = false
  }
}
async function confirmDelete() {
  const d = toDelete.value
  toDelete.value = null
  if (!d) return
  try {
    if (d.kind === 't') await contentService.removeTestimonial(d.id)
    else await contentService.removeFaq(d.id)
    await store.load(true, true)
    toast.success(copy.settings.deleted)
  } catch (e) {
    toast.error(e instanceof Error ? e.message : copy.common.genericError)
  }
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="font-display text-3xl font-semibold">{{ copy.nav.settings }}</h1>

    <div class="flex gap-1 rounded-xl border border-line bg-panel p-1 sm:w-fit" role="tablist" :aria-label="copy.settings.tabAria">
      <button v-for="t in tabs" :key="t[0]" type="button" role="tab" :aria-selected="tab === t[0]" class="flex-1 rounded-lg px-4 py-1.5 text-[13px] font-medium sm:flex-none" :class="tab === t[0] ? 'bg-ink text-white' : 'text-muted hover:text-ink'" @click="tab = t[0]">{{ t[1] }}</button>
    </div>

    <LoadingState v-if="store.loading && !store.loaded" />

    <form v-else-if="tab === 'content'" class="max-w-2xl space-y-4" @submit.prevent="saveContent">
      <FormField :label="copy.settings.heroTitle" v-slot="{ id }"><input :id="id" v-model="form.hero_title" class="field-input" /></FormField>
      <FormField :label="copy.settings.heroSubtitle" v-slot="{ id }"><textarea :id="id" v-model="form.hero_subtitle" rows="2" class="field-input" /></FormField>
      <FormField :label="copy.settings.seoTitle" v-slot="{ id }"><input :id="id" v-model="form.seo_title" class="field-input" /></FormField>
      <FormField :label="copy.settings.seoDescription" v-slot="{ id }"><textarea :id="id" v-model="form.seo_description" rows="2" class="field-input" /></FormField>
      <FormField :label="copy.settings.contactText" v-slot="{ id }"><textarea :id="id" v-model="form.contact_text" rows="2" class="field-input" /></FormField>
      <AppButton type="submit" :loading="savingContent">{{ copy.common.save }}</AppButton>
    </form>

    <template v-else-if="tab === 'testimonials'">
      <AppButton @click="openT()"><Plus class="size-4" /> {{ copy.settings.addTestimonial }}</AppButton>
      <EmptyState v-if="!store.testimonials.length" :message="copy.settings.noTestimonials" />
      <ul v-else class="card divide-y divide-line">
        <li v-for="t in store.testimonials" :key="t.id" class="flex items-start gap-3 px-4 py-3" :class="t.is_visible ? '' : 'opacity-60'">
          <div class="min-w-0 flex-1">
            <p class="flex items-center gap-1.5 text-sm font-medium">{{ t.name }} <span class="inline-flex items-center gap-0.5 text-xs text-warn"><Star class="size-3" fill="currentColor" />{{ t.rating }}</span></p>
            <p class="mt-0.5 text-sm text-muted">“{{ t.message }}”</p>
          </div>
          <div class="flex shrink-0">
            <button type="button" class="rounded-lg p-2 text-muted hover:bg-black/5" :aria-label="`${copy.common.edit} ${t.name}`" @click="openT(t.id)"><Pencil class="size-4" /></button>
            <button type="button" class="rounded-lg p-2 text-danger hover:bg-danger-soft" :aria-label="`${copy.common.delete} ${t.name}`" @click="toDelete = { kind: 't', id: t.id }"><Trash2 class="size-4" /></button>
          </div>
        </li>
      </ul>
    </template>

    <template v-else>
      <AppButton @click="openF()"><Plus class="size-4" /> {{ copy.settings.addFaq }}</AppButton>
      <EmptyState v-if="!store.faqs.length" :message="copy.settings.noFaqs" />
      <ul v-else class="card divide-y divide-line">
        <li v-for="f in store.faqs" :key="f.id" class="flex items-start gap-3 px-4 py-3" :class="f.is_visible ? '' : 'opacity-60'">
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium">{{ f.question }}</p>
            <p class="mt-0.5 line-clamp-2 text-sm text-muted">{{ f.answer }}</p>
          </div>
          <div class="flex shrink-0">
            <button type="button" class="rounded-lg p-2 text-muted hover:bg-black/5" :aria-label="copy.settings.editFaq" @click="openF(f.id)"><Pencil class="size-4" /></button>
            <button type="button" class="rounded-lg p-2 text-danger hover:bg-danger-soft" :aria-label="copy.settings.deleteFaq" @click="toDelete = { kind: 'f', id: f.id }"><Trash2 class="size-4" /></button>
          </div>
        </li>
      </ul>
    </template>

    <Modal :open="tOpen" :title="copy.settings.testimonialModal" @close="tOpen = false">
      <form class="space-y-4" @submit.prevent="saveT">
        <FormField :label="copy.settings.tName" v-slot="{ id }"><input :id="id" v-model="tForm.name" class="field-input" required /></FormField>
        <FormField :label="copy.settings.tMessage" v-slot="{ id }"><textarea :id="id" v-model="tForm.message" rows="3" class="field-input" required /></FormField>
        <div class="grid grid-cols-2 gap-4">
          <FormField :label="copy.settings.tRating" v-slot="{ id }"><input :id="id" v-model.number="tForm.rating" type="number" min="1" max="5" class="field-input" /></FormField>
          <FormField :label="copy.settings.tPosition" v-slot="{ id }"><input :id="id" v-model.number="tForm.position" type="number" min="0" class="field-input" /></FormField>
        </div>
        <label class="flex cursor-pointer items-center gap-2 text-sm"><input v-model="tForm.is_visible" type="checkbox" class="size-4 accent-[var(--color-brand)]" /> {{ copy.settings.tVisible }}</label>
        <div class="flex justify-end gap-2">
          <AppButton variant="secondary" @click="tOpen = false">{{ copy.common.cancel }}</AppButton>
          <AppButton type="submit" :loading="saving">{{ copy.common.save }}</AppButton>
        </div>
      </form>
    </Modal>

    <Modal :open="fOpen" :title="copy.settings.faqModal" @close="fOpen = false">
      <form class="space-y-4" @submit.prevent="saveF">
        <FormField :label="copy.settings.fQuestion" v-slot="{ id }"><input :id="id" v-model="fForm.question" class="field-input" required /></FormField>
        <FormField :label="copy.settings.fAnswer" v-slot="{ id }"><textarea :id="id" v-model="fForm.answer" rows="3" class="field-input" required /></FormField>
        <FormField :label="copy.settings.fPosition" v-slot="{ id }"><input :id="id" v-model.number="fForm.position" type="number" min="0" class="field-input" /></FormField>
        <label class="flex cursor-pointer items-center gap-2 text-sm"><input v-model="fForm.is_visible" type="checkbox" class="size-4 accent-[var(--color-brand)]" /> {{ copy.settings.fVisible }}</label>
        <div class="flex justify-end gap-2">
          <AppButton variant="secondary" @click="fOpen = false">{{ copy.common.cancel }}</AppButton>
          <AppButton type="submit" :loading="saving">{{ copy.common.save }}</AppButton>
        </div>
      </form>
    </Modal>
    <ConfirmDialog :open="!!toDelete" :title="copy.settings.deleteTitle" :message="copy.settings.deleteMsg" :confirm-label="copy.common.delete" @confirm="confirmDelete" @cancel="toDelete = null" />
  </div>
</template>
