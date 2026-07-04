import logoSrc from '../../assets/pbx-logo.png'

export const brand = {
  name: 'PBX - NCLEX',
  shortName: 'PBX',
  statement:
    'A focused NCLEX preparation workspace for nursing students and exam-preparation material.',
  logoSrc,
  logoAlt: 'PBX - NCLEX logo',
}

/** @type {import('./types.js').NavigationItem[]} */
export const navigationLinks = [
  { label: 'Workflow', href: '#workflow' },
  { label: 'Features', href: '#features' },
  { label: 'Formats', href: '#formats' },
  { label: 'Pricing', href: '#access' },
]

export const navigation = {
  ariaLabel: 'Primary navigation',
  mobileMenuLabel: 'Menu',
  mobileMenuAriaLabel: 'Open primary navigation',
  links: navigationLinks,
  login: {
    label: 'Log in',
    href: '/login',
    ariaLabel: 'Go to login access',
    variant: 'ghost',
  },
  signup: {
    label: 'Sign up',
    href: '/signup',
    ariaLabel: 'Go to signup access',
    variant: 'primary',
  },
}
