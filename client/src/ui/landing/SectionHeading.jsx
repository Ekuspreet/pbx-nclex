function SectionHeading({ eyebrow, title, description, align = 'start' }) {
  const alignmentClass = align === 'center' ? 'mx-auto text-center' : ''

  return (
    <div className={`container-readable grid gap-4 ${alignmentClass}`}>
      {eyebrow ? <p className="text-kicker">{eyebrow}</p> : null}
      <h2 className="text-h2">{title}</h2>
      {description ? <p className="text-lead text-muted">{description}</p> : null}
    </div>
  )
}

export default SectionHeading
