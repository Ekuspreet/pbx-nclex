import AppShell from '../ui/layout/AppShell.jsx'
import { business } from '../content/business.js'

function AboutPage() {
  return (
    <AppShell>
      <main className="surface-muted py-12 md:py-16">
        <article className="container-page max-w-4xl rounded-2xl border border-base-300 bg-base-100 p-6 shadow-sm md:p-10">
          <p className="text-kicker">About Us</p>
          <h1 className="mt-3 text-4xl font-bold">Focused NCLEX-RN preparation with PBX Nursing.</h1>
          <p className="mt-6 text-lg leading-8 text-base-content/75">PBX Nursing provides digital educational services for nursing learners preparing for the NCLEX-RN examination. Our platform combines a growing question bank, test creation, tutor and timed modes, explanations, performance reporting, highlights, and test-specific notebooks in one focused study workspace.</p>
          <h2 className="mt-9 text-2xl font-bold">Our service</h2>
          <p className="mt-3 leading-7 text-base-content/75">PBX Nursing Plus provides 60 days of access to unlimited test creation, the available NCLEX-RN question bank, results review, performance analytics, highlights, and notebooks for <strong>₹899</strong>.</p>
          <section className="mt-9 rounded-xl border border-base-300 bg-base-200 p-5">
            <h2 className="font-bold">Registered business information</h2>
            <p className="mt-2"><strong>Trade name:</strong> {business.tradeName}</p>
            <p className="mt-2"><strong>Full legal name:</strong> {business.legalName}</p>
            <p className="mt-2"><strong>Registered address:</strong> {business.registeredAddress}</p>
            <p className="mt-2"><strong>Customer support:</strong> {business.supportEmail}</p>
          </section>
        </article>
      </main>
    </AppShell>
  )
}

export default AboutPage
