function ReferenceHtml({ html, className = '', as: Tag = 'div' }) {
  return (
    <Tag
      className={`reference-html ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export default ReferenceHtml
