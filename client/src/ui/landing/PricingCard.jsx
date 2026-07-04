import { motion } from 'motion/react'
import { cardIntro, softHover } from '../../motion/landingPresets.js'
import { getButtonClass } from './buttonClass.js'

function PricingCard({ plan }) {
  return (
    <motion.article
      className={`card surface-raised ${plan.featured ? 'border-primary shadow-md' : ''}`}
      {...cardIntro}
      {...softHover}
    >
      <div className="card-body p-md gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-h3">{plan.name}</h3>
          {plan.badge ? (
            <span className={`badge ${plan.featured ? 'badge-primary' : 'badge-outline'}`}>
              {plan.badge}
            </span>
          ) : null}
        </div>
        <p className="text-body text-muted">{plan.description}</p>
        <div className="grid gap-1 border-y border-base-300 py-4">
          <strong className="text-h3">{plan.price}</strong>
          <span className="text-caption text-muted font-bold">{plan.cadence}</span>
        </div>
        <ul className="rule-list">
          {plan.features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
        <div className="card-actions mt-auto">
          <a
            className={getButtonClass(plan.cta.variant)}
            href={plan.cta.href}
            aria-label={plan.cta.ariaLabel}
          >
            {plan.cta.label}
          </a>
        </div>
      </div>
    </motion.article>
  )
}

export default PricingCard
