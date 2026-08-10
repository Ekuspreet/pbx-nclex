import AppShell from '../ui/layout/AppShell.jsx'
import { pricing } from '../content/landing/index.js'
import { business } from '../content/business.js'
import { usePlanCatalog } from '../hooks/usePlanCatalog.js'

function AboutPage() {
  const catalog = usePlanCatalog()
  const plusPlan = (catalog || pricing).plans.find((plan) => plan.key === 'plus')
  return (
    <AppShell>
      <main className="surface-muted py-12 md:py-16">
        <article className="container-page max-w-4xl rounded-2xl border border-base-300 bg-base-100 p-6 shadow-sm md:p-10">
          <p className="text-kicker">About Us</p>
          <h1 className="mt-3 text-4xl font-bold">Focused NCLEX-RN preparation with PBX Nursing.</h1>
          <p className="mt-6 text-lg leading-8 text-base-content/75">PBX Nursing provides digital educational services for nursing learners preparing for the NCLEX-RN examination. Our platform combines a growing question bank, test creation, tutor and timed modes, explanations, performance reporting, highlights, and test-specific notebooks in one focused study workspace.</p>
          <h2 className="mt-9 text-2xl font-bold">Our service</h2>
          <p className="mt-3 leading-7 text-base-content/75">{plusPlan.name} provides {plusPlan.cadence.toLowerCase()} to the full available NCLEX-RN question bank, results review, performance analytics, expanded highlights, and notebooks for <strong>{plusPlan.price}</strong>.</p>
          <section className="mt-9 rounded-xl border border-base-300 bg-base-200 p-5">
            <h2 className="font-bold">Contact information</h2>
            <p className="mt-2"><strong>Trade name:</strong> {business.tradeName}</p>
            <p className="mt-2"><strong>Customer support:</strong> {business.supportEmail}</p>
          </section>
        </article>
      </main>
    </AppShell>
  )
}

export default AboutPage
