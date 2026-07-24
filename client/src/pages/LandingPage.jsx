import {
  hero,
  features,
  pricing,
  callToAction,
} from '../content/landing/index.js'
import AppShell from '../ui/layout/AppShell.jsx'
import CustomerJourneySection from '../ui/landing/CustomerJourneySection.jsx'
import FeatureSection from '../ui/landing/FeatureSection.jsx'
import JoinCallToAction from '../ui/landing/JoinCallToAction.jsx'
import LandingHero from '../ui/landing/LandingHero.jsx'
import PricingSection from '../ui/landing/PricingSection.jsx'

function LandingPage() {
  return (
    <AppShell>
      <main>
        <LandingHero hero={hero} />
        <CustomerJourneySection />
        <FeatureSection features={features} />
        <PricingSection pricing={pricing} />
      </main>
    </AppShell>
  )
}

export default LandingPage
