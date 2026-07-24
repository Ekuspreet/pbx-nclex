import { getButtonClass } from './buttonClass.js'
import BrandLogo from './BrandLogo.jsx'

function LandingHeader({ brand, navigation }) {
  return (
    <header className="surface-sticky">
      <div className="navbar container-page">
        <div className="navbar-start">
          <BrandLogo brand={brand} />
        </div>


        <div className="navbar-end gap-3">
          <div className=" flex items-center gap-3 ">
            <Link className="btn btn-ghost" to="/about-us">About Us</Link>
            <Link
              className={getButtonClass(navigation.login.variant)}
              to={navigation.login.href}
              aria-label={navigation.login.ariaLabel}
            >
              {navigation.login.label}
            </Link>
            <Link
              className={getButtonClass(navigation.signup.variant)}
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
