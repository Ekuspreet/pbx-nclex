import BrandLogo from './BrandLogo.jsx'

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
