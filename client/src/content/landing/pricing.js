export const pricing = {
  id: 'access',
  eyebrow: 'Pricing',
  title: 'Choose the plan that fits your nursing practice.',
  description:
    'Start with a focused free plan, then upgrade when you need more tests, more questions, and more study room.',
  plans: [
    {
      key: 'free',
      name: 'Free',
      price: '$0',
      cadence: 'Starter access',
      description: 'A limited plan for trying the PBX Nursing workspace.',
      badge: 'Starter',
      features: [
        'Create 1 test',
        'Access 70 questions',
        'Save up to 10 notes',
        'Save up to 15 highlights',
      ],
      cta: {
        label: 'Start free',
        href: '/signup',
        ariaLabel: 'Sign up for the free PBX Nursing plan',
        variant: 'primary',
      },
    },
    {
      key: 'plus',
      name: 'Plus',
      price: 'Plus',
      cadence: 'Paid subscription',
      description: 'A flexible plan for learners who want a larger practice workflow.',
      badge: 'Recommended',
      featured: true,
      features: [
        'Create unlimited tests',
        'Access a growing question bank',
        'More room for notes and highlights',
        'Review results across every test',
      ],
      cta: {
        label: 'Go Plus',
        href: '/payment',
        ariaLabel: 'Upgrade to the PBX Nursing Plus plan',
        variant: 'primary',
      },
    },
  ],
  note: 'Free limits keep practice focused. Plus is built for ongoing preparation with room to grow.',
}
