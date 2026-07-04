import { motion } from 'motion/react'
import { cardIntro, withDelay } from '../../motion/landingPresets.js'
import SectionHeading from './SectionHeading.jsx'

const journeySteps = [
  {
    title: 'Diagnose the gap',
    text: 'Start with a readiness block that shows students how exam-style items feel before test day.',
    icon: 'search',
  },
  {
    title: 'Practice deliberately',
    text: 'Move through single answer, select-all, numeric, matrix, cloze, and bowtie-style interactions.',
    icon: 'clinical_notes',
  },
  {
    title: 'Review the why',
    text: 'Rationales appear close to the question, helping learners connect clinical cues with action.',
    icon: 'psychology',
  },
  {
    title: 'Repeat with focus',
    text: 'Progress cues and resumable flows make each short study session easier to restart.',
    icon: 'trending_up',
  },
]

function CustomerJourneySection() {
  return (
    <section className="surface-muted py-section" id="workflow">
      <div className="container-page">
        <SectionHeading
          title="A guided path from uncertainty to readiness."
          description="We help you discover what to do next: start a test, answer calmly, review the reasoning, and return with a sharper focus."
          align="center"
        />

        <div className="mt-12 grid gap-4 md:grid-cols-4">
          {journeySteps.map((step, index) => (
            <motion.article
              className="card surface-raised motion-safe:transition motion-safe:hover:-translate-y-1"
              {...withDelay(cardIntro, index * 0.09)}
              whileHover={{ y: -4 }}
              key={step.title}
            >
              <div className="card-body gap-4">
                <div className="flex size-12 items-center justify-center rounded-box bg-primary text-primary-content">
                  <span className="material-symbols-outlined">{step.icon}</span>
                </div>
                <h3 className="text-xl font-black">{step.title}</h3>
                <p className="text-body text-muted">{step.text}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default CustomerJourneySection
