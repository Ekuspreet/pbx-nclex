import DOMPurify from 'dompurify'

function getApiOrigin() {
  const apiBase = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '')

  try {
    return new URL(apiBase).origin
  } catch {
    return apiBase.replace(/\/api\/v\d+$/, '')
  }
}

function encodePathSegment(segment) {
  try {
    return encodeURIComponent(decodeURIComponent(segment))
  } catch {
    return encodeURIComponent(segment)
  }
}

function rewriteQuestionAssetUrls(html) {
  if (!html || typeof DOMParser === 'undefined') return html

  const document = new DOMParser().parseFromString(html, 'text/html')

  document.querySelectorAll('img[src]').forEach((image) => {
    const source = image.getAttribute('src')?.trim().replace(/\\/g, '/') || ''
    const pathOnly = source.split(/[?#]/)[0]
    const segments = pathOnly.split('/').filter(Boolean)
    const downloadsIndex = segments.findIndex((segment) => segment.toLowerCase() === 'downloads')

    if (downloadsIndex < 0) return

    const assetPath = segments.slice(downloadsIndex + 1).map(encodePathSegment).join('/')
    if (assetPath) image.setAttribute('src', `${getApiOrigin()}/public/assets/${assetPath}`)
  })

  return document.body.innerHTML
}

export function sanitizeReferenceHtml(html) {
  const sanitizedHtml = DOMPurify.sanitize(String(html || ''), {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['form', 'iframe', 'object', 'embed', 'template'],
    FORBID_ATTR: ['style'],
  })

  return rewriteQuestionAssetUrls(sanitizedHtml)
}
