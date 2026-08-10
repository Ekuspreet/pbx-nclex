import { sanitizeReferenceHtml } from './sanitizeReferenceHtml.js'

function ReferenceHtml({ html, className = '', as: Tag = 'div', ...props }) {
  return (
    <Tag
      {...props}
      className={`reference-html ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizeReferenceHtml(html) }}
    />
  )
}

export default ReferenceHtml
