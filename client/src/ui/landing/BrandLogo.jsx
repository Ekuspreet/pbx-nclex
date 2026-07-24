import { Link } from 'react-router-dom'

function BrandLogo({ brand, className = '' }) {
  return (
    <Link
      className={`inline-flex min-w-0 items-center gap-3 no-underline ${className}`}
      to="/"
      aria-label={brand.name}
    >
      <img
        className="h-20 w-auto max-w-28 flex-none object-contain sm:max-w-32"
        src={brand.logoSrc}
        alt={brand.logoAlt}
      />
    </Link>
  )
}

export default BrandLogo
