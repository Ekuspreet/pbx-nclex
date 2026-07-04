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
            <a
              className={getButtonClass(navigation.login.variant)}
              href={navigation.login.href}
              aria-label={navigation.login.ariaLabel}
            >
              {navigation.login.label}
            </a>
            <a
              className={getButtonClass(navigation.signup.variant)}
              href={navigation.signup.href}
              aria-label={navigation.signup.ariaLabel}
            >
              {navigation.signup.label}
            </a>
          </div>
        </div>
      </div>
    </header>
  )
}

export default LandingHeader
