export const pricing = {
  id: 'access',
  eyebrow: 'Pricing',
  title: 'Choose the plan that fits your nursing practice.',
  description:
    'Create as many practice tests as you need, then upgrade for more questions and more study room.',
  plans: [
    {
      key: 'free',
      name: 'Free',
      price: '₹0',
      cadence: 'Starter access',
      description: 'A limited plan for trying the PBX Nursing workspace.',
      badge: 'Starter',
      features: [
        'Create unlimited tests',
        'Access up to 70 questions',
        'Save notes and highlights',
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
      name: 'PBX Nursing Plus',
      price: 'See current price',
      cadence: 'Subscription access',
      description: 'Digital NCLEX-RN preparation with full question-bank access, performance analytics, results review, highlights, and test notebooks.',
      badge: 'Recommended',
      featured: true,
      features: [
        'Create unlimited tests with the full question bank',
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
  note: 'Current PBX Nursing Plus pricing and access duration are loaded securely from the server.',
}
