import {
  hero,
  features,
  pricing,
} from '../content/landing/index.js'
import { useQuery } from '@tanstack/react-query'
import { getContentGroup } from '../services/studyAdapter.js'
import { queryKeys } from '../services/queryKeys.js'
import AppShell from '../ui/layout/AppShell.jsx'
import CustomerJourneySection from '../ui/landing/CustomerJourneySection.jsx'
import FeatureSection from '../ui/landing/FeatureSection.jsx'
import LandingHero from '../ui/landing/LandingHero.jsx'
import PhotoCarousel from '../ui/landing/PhotoCarousel.jsx'
import PricingSection from '../ui/landing/PricingSection.jsx'

function LandingPage() {
  const contentQuery = useQuery({ queryKey: queryKeys.contentGroup('site'), queryFn: ({ signal }) => getContentGroup('site', { signal }) })
  const siteContent = contentQuery.data?.content || {}
  return (
    <AppShell>
      <main>
        <LandingHero hero={siteContent['site.hero'] || hero} />
        <CustomerJourneySection />
        <FeatureSection features={siteContent['site.features'] || features} />
        <PhotoCarousel />
        <PricingSection pricing={siteContent['site.pricing'] || pricing} />
      </main>
    </AppShell>
  )
}

export default LandingPage
