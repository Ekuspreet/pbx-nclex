import { motion } from 'motion/react'
import { cardIntro, sectionIntro, withDelay } from '../../motion/landingPresets.js'
import SectionHeading from './SectionHeading.jsx'

function FeatureSection({ features }) {
  return (
    <section className="py-section" id={features.id}>
      <div className="container-page">
        <motion.div {...sectionIntro}>
          <SectionHeading
            eyebrow={features.eyebrow}
            title={features.title}
            description={features.subheading}
            align="center"
          />
        </motion.div>
        <div className="mt-12 grid gap-12 md:gap-16">
          {features.items.map((feature, index) => (
            <motion.article
              className="border-t-subtle grid items-center gap-8 pt-8 md:grid-cols-2 md:pt-12"
              {...withDelay(cardIntro, index * 0.08)}
              key={feature.title}
            >
              <div
                className={`container-readable grid gap-3 ${
                  index % 2 === 1 ? 'md:order-2' : ''
                }`}
              >
                <h3 className="text-h3">{feature.title}</h3>
                <p className="text-body text-muted">{feature.subheading}</p>
              </div>
              <figure className="m-0 w-full" aria-label={feature.visual.ariaLabel}>
                <div className="card surface-raised">
                  <div className="card-body p-md gap-4">
                    <p className="text-kicker">{feature.visual.label}</p>
                    <h3 className="text-h3">{feature.visual.title}</h3>
                    <ul className="rule-list">
                      {feature.visual.rows.map((row) => (
                        <li key={row}>{row}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </figure>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeatureSection
