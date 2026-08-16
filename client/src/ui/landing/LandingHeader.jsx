import { getButtonClass } from './buttonClass.js'
import BrandLogo from './BrandLogo.jsx'

function LandingHeader({ brand, navigation }) {
  return (
    <header className="surface-sticky">
      <div className="navbar container-page gap-1">
        <div className="navbar-start min-w-0">
          <BrandLogo className="[&_img]:h-14 [&_img]:max-w-20 sm:[&_img]:h-20 sm:[&_img]:max-w-32" brand={brand} />
        </div>


        <div className="navbar-end shrink-0">
          <div className="flex items-center gap-1 sm:gap-3">
            <Link className="btn btn-ghost hidden sm:inline-flex" to="/about-us">About Us</Link>
            <Link
              className={`${getButtonClass(navigation.login.variant)} btn-sm sm:btn-md`}
              to={navigation.login.href}
              aria-label={navigation.login.ariaLabel}
            >
              {navigation.login.label}
            </Link>
            <Link
              className={`${getButtonClass(navigation.signup.variant)} btn-sm sm:btn-md`}
              to={navigation.signup.href}
              aria-label={navigation.signup.ariaLabel}
            >
              {navigation.signup.label}
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}

export default LandingHeader
import { Link } from 'react-router-dom'
