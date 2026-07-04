import { motion } from 'motion/react'
import { sectionIntro } from '../../motion/landingPresets.js'
import PricingCard from './PricingCard.jsx'
import SectionHeading from './SectionHeading.jsx'

function PricingSection({ pricing }) {
  return (
    <section className="surface-muted py-section" id={pricing.id}>
      <div className="container-page">
        <motion.div {...sectionIntro}>
          <SectionHeading
            eyebrow={pricing.eyebrow}
            title={pricing.title}
            description={pricing.description}
            align="center"
          />
        </motion.div>
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {pricing.plans.map((plan) => (
            <PricingCard plan={plan} key={plan.name} />
          ))}
        </div>
        <p className="container-readable text-body text-muted mx-auto mt-6 text-center">
          {pricing.note}
        </p>
      </div>
    </section>
  )
}

export default PricingSection
