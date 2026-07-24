export const hero = {
  id: 'home',
  eyebrow: 'PBX Nursing',
  title: 'Master Nursing Questions Like a Pro',
  primaryCta: {
    label: 'Sign up',
    href: '/signup',
    ariaLabel: 'Go to signup access for PBX Nursing',
    variant: 'primary',
  },
  secondaryCta: {
    label: 'Log in',
    href: '/login',
    ariaLabel: 'Go to login access for PBX Nursing',
    variant: 'primary',
  },
  media: {
    videos: [
      { src: '/videos/stock1.mp4', type: 'video/mp4' },
      { src: '/videos/stock2.mp4', type: 'video/mp4' },
    ],
    posterSrc: '/images/hero-poster.png',
    ariaLabel: 'Background video for PBX Nursing landing page',
  },
  metrics: [
    { value: 'Realistic', label: 'nursing practice' },
    { value: 'Insightful', label: 'clear answer rationales' },
    { value: 'Progressive', label: 'readiness tracking' },
  ],

}
