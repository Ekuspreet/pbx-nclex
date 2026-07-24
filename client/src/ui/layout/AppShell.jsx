import { brand, navigation, footer } from '../../content/landing/index.js'
import LandingFooter from '../landing/LandingFooter.jsx'
import LandingHeader from '../landing/LandingHeader.jsx'

function AppShell({ children, showFooter = true }) {
  return (
    <div className="landing-page surface-page min-h-screen overflow-x-hidden" data-theme="nord">
      <LandingHeader brand={brand} navigation={navigation} />
      {children}
      {showFooter ? <LandingFooter footer={footer} /> : null}
    </div>
  )
}

export default AppShell
