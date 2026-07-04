function BrandLogo({ brand, className = '' }) {
  return (
    <a
      className={`inline-flex min-w-0 items-center gap-3 no-underline ${className}`}
      href="/"
      aria-label={brand.name}
    >
      <img
        className="size-22 flex-none object-contain"
        src={brand.logoSrc}
        alt={brand.logoAlt}
      />

    </a>
  )
}

export default BrandLogo
