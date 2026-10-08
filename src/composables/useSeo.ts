const canDOM = typeof document !== 'undefined'

function setMeta(attr: 'name' | 'property', key: string, value: string) {
  if (!canDOM) return
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', value)
}

export interface SeoInput {
  title: string
  description: string
  image?: string
  noindex?: boolean
}

export function useSeo() {
  function apply(seo: SeoInput & { path?: string }) {
    if (!canDOM) return
    document.title = seo.title
    setMeta('name', 'description', seo.description)
    setMeta('property', 'og:title', seo.title)
    setMeta('property', 'og:description', seo.description)
    setMeta('property', 'og:type', 'website')
    setMeta('name', 'twitter:card', 'summary_large_image')
    setMeta('name', 'twitter:title', seo.title)
    setMeta('name', 'twitter:description', seo.description)
    if (seo.image && !seo.image.startsWith('data:')) {
      setMeta('property', 'og:image', seo.image)
      setMeta('name', 'twitter:image', seo.image)
    }
    setMeta('name', 'robots', seo.noindex ? 'noindex, nofollow' : 'index, follow')
    if (seo.path) {
      const url = `${typeof window !== 'undefined' ? window.location.origin : ''}${seo.path}`
      setMeta('property', 'og:url', url)
      let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
      if (!link) {
        link = document.createElement('link')
        link.setAttribute('rel', 'canonical')
        document.head.appendChild(link)
      }
      link.setAttribute('href', url)
    }
  }
  /** Replace the JSON-LD block with the given id (pass null to remove it). */
  function setJsonLd(id: string, data: Record<string, unknown> | null) {
    if (!canDOM) return
    document.head.querySelector(`script[data-jsonld="${id}"]`)?.remove()
    if (!data) return
    const el = document.createElement('script')
    el.setAttribute('type', 'application/ld+json')
    el.setAttribute('data-jsonld', id)
    el.textContent = JSON.stringify(data)
    document.head.appendChild(el)
  }
  return { apply, setJsonLd }
}
