import { motion } from 'motion/react'
import { sectionIntro, softHover } from '../../motion/landingPresets.js'
import { getButtonClass } from './buttonClass.js'

function JoinCallToAction({ callToAction }) {
  return (
    <section className="py-section-sm" id={callToAction.id}>
      <div className="container-page">
        <motion.div className=" text-center" {...sectionIntro}>
          <div className="card-body p-lg items-center gap-4">
            <p className="text-kicker">{callToAction.eyebrow}</p>
            <h2 className="text-h2">{callToAction.title}</h2>
            <p className="container-readable text-lead text-muted">
              {callToAction.subheading}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <motion.a
                className={getButtonClass(callToAction.signup.variant)}
                href={callToAction.signup.href}
                aria-label={callToAction.signup.ariaLabel}
                {...softHover}
              >
                {callToAction.signup.label}
              </motion.a>
              <motion.a
                className={getButtonClass(callToAction.login.variant)}
                href={callToAction.login.href}
                aria-label={callToAction.login.ariaLabel}
                id={callToAction.loginAnchorId}
                {...softHover}
              >
                {callToAction.login.label}
              </motion.a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default JoinCallToAction
