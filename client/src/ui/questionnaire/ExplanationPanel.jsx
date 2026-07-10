import { useEffect, useMemo, useRef } from 'react'
import ReferenceHtml from './ReferenceHtml.jsx'

const BROKEN_IMAGE_ALT = 'Image is broken. We are working to fix it.'
const BROKEN_IMAGE_PLACEHOLDER = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
<svg xmlns="https://www.w3.org/2000/svg" width="720" height="260" viewBox="0 0 720 260">
  <rect width="720" height="260" rx="14" fill="#f8fafc"/>
  <rect x="1" y="1" width="718" height="258" rx="13" fill="none" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="12 10"/>
  <text x="360" y="112" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#334155">Image is broken</text>
  <text x="360" y="154" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" fill="#475569">We are working to fix it.</text>
</svg>
`)}`

function getApiOrigin() {
  const apiBase = (import.meta.env.VITE_API_BASE_URL || 'https://localhost:5000/api/v1').replace(/\/$/, '')

  try {
    const url = new URL(apiBase)
    return url.origin
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

function getDownloadImageUrl(source) {
  if (!source) return ''

  try {
    const url = new URL(String(source).trim().replace(/\\/g, '/'), `${getApiOrigin()}/`)
    const segments = url.pathname.split('/').filter(Boolean)
    const downloadsIndex = segments.findIndex((segment) => segment.toLowerCase() === 'downloads')
    const fileSegments = downloadsIndex >= 0 ? segments.slice(downloadsIndex + 1) : segments.slice(-1)
    const filePath = fileSegments.map(encodePathSegment).join('/')

    return filePath ? `${getApiOrigin()}/public/downloads/${filePath}` : ''
  } catch {
    const fileName = String(source).trim().replace(/\\/g, '/').split(/[?#]/)[0].split('/').filter(Boolean).pop()
    return fileName ? `${getApiOrigin()}/public/downloads/${encodePathSegment(fileName)}` : ''
  }
}

function normalizeExplanationImages(html) {
  if (!html || typeof DOMParser === 'undefined') return html || ''

  const document = new DOMParser().parseFromString(String(html), 'text/html')

  document.querySelectorAll('img').forEach((image) => {
    const source = image.getAttribute('src') || ''
    const downloadUrl = getDownloadImageUrl(source)

    image.setAttribute('src', downloadUrl || BROKEN_IMAGE_PLACEHOLDER)
    image.setAttribute('alt', image.getAttribute('alt') || 'Explanation image')
    image.setAttribute('loading', 'lazy')
  })

  return document.body.innerHTML
}

function replaceBrokenImage(image) {
  if (image.dataset.brokenPlaceholder === 'true') return

  image.dataset.brokenPlaceholder = 'true'
  image.alt = BROKEN_IMAGE_ALT
  image.src = BROKEN_IMAGE_PLACEHOLDER
}

function ExplanationPanel({ html, hidden = false, className = '' }) {
  const panelRef = useRef(null)
  const normalizedHtml = useMemo(() => normalizeExplanationImages(html), [html])

  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return undefined

    const handleImageError = (event) => {
      if (event.target instanceof HTMLImageElement) {
        replaceBrokenImage(event.target)
      }
    }

    panel.addEventListener('error', handleImageError, true)

    return () => {
      panel.removeEventListener('error', handleImageError, true)
    }
  }, [normalizedHtml])

  return (
    <div className={`overflow-scroll ${className}`} hidden={hidden} ref={panelRef}>
      <p className="my-2 text-md font-semibold">Explanation</p>
      <ReferenceHtml html={normalizedHtml} className="space-y-2" />
    </div>
  )
}

export default ExplanationPanel
