import {
  hero,
  features,
  pricing,
} from '../content/landing/index.js'
import AppShell from '../ui/layout/AppShell.jsx'
import CustomerJourneySection from '../ui/landing/CustomerJourneySection.jsx'
import FeatureSection from '../ui/landing/FeatureSection.jsx'
import LandingHero from '../ui/landing/LandingHero.jsx'
import PhotoCarousel from '../ui/landing/PhotoCarousel.jsx'
import PricingSection from '../ui/landing/PricingSection.jsx'

function LandingPage() {
  return (
    <AppShell>
      <main>
        <LandingHero hero={hero} />
        <CustomerJourneySection />
        <FeatureSection features={features} />
        <PhotoCarousel />
        <PricingSection pricing={pricing} />
      </main>
    </AppShell>
  )
}

export default LandingPage
