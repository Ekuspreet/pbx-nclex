import BrandLogo from './BrandLogo.jsx'
import { Link } from 'react-router-dom'

function LandingFooter({ footer }) {
  return (
    <footer className="surface-dark border-t border-neutral-content/15">
      <div className="container-page flex flex-col items-center px-4 py-12 text-center">
        <div className="rounded-xl bg-base-100 p-3 shadow-sm ring-1 ring-base-300">
          <BrandLogo brand={footer.brand} />
        </div>

        <p className="mt-5 max-w-md text-body leading-relaxed text-inverse-muted">
          {footer.brand.statement}
        </p>

        <p className="mt-3 max-w-md text-caption text-inverse-muted">
          {footer.footnote}
        </p>

        <div className="mt-8 grid w-full max-w-3xl grid-cols-1 gap-8 border-t border-neutral-content/15 pt-8 text-left md:grid-cols-2">
          {footer.groups.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h2 className="font-bold text-neutral-content">{group.title}</h2>
              <ul className="mt-3 grid gap-2">
                {group.links.map((link) => <li key={link.label}><Link className="text-sm text-neutral-content/70 hover:text-neutral-content" to={link.href}>{link.label}</Link></li>)}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-8 max-w-3xl text-caption text-inverse-muted">
          <p><strong>Legal name:</strong> {footer.legalName}</p>
          <p className="mt-1"><strong>Registered address:</strong> {footer.registeredAddress}</p>
        </div>

        <div className="mt-8 w-full border-t border-neutral-content/15 pt-5">
          <p className="text-caption text-inverse-muted">
            {footer.copyright}
          </p>
        </div>
      </div>
    </footer>
  )
}

export default LandingFooter
